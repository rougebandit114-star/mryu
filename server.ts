import express from "express";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to lazily import and initialize firebase-admin correctly
  async function getFirebaseAdmin() {
    const admin = (await import("firebase-admin")).default;
    if (!admin.apps.length) {
      const fs = await import("fs");
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      let projectId = "spendwise-bf630"; // default fallback
      if (fs.existsSync(configPath)) {
        try {
          const configObj = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (configObj.projectId) {
            projectId = configObj.projectId;
          }
        } catch (e) {
          console.error("Failed to parse firebase config:", e);
        }
      }

      let credential;
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
          if (!serviceAccountJson.startsWith('{')) {
            try {
              serviceAccountJson = Buffer.from(serviceAccountJson, 'base64').toString('utf8');
            } catch (e) {}
          }
          const serviceAccount = JSON.parse(serviceAccountJson);
          credential = admin.credential.cert(serviceAccount);
          console.log("Firebase Admin SDK successfully authenticated using FIREBASE_SERVICE_ACCOUNT secret.");
        } catch (err) {
          console.error("Failed to parse credentials from FIREBASE_SERVICE_ACCOUNT environment variable. Falling back:", err);
        }
      }

      admin.initializeApp({
        credential: credential,
        projectId: projectId,
      });
    }
    return admin;
  }

  // API health and check endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Administrative password update endpoint
  app.post("/api/admin/change-password", async (req, res) => {
    try {
      const { targetUid, newPassword } = req.body;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid authorization token" });
      }
      const token = authHeader.split("Bearer ")[1];

      // Use central helper
      const admin = await getFirebaseAdmin();

      const verifiedToken = await admin.auth().verifyIdToken(token);
      
      // Strict authorization verification
      if (verifiedToken.email?.toLowerCase() !== 'rougebandit114@gmail.com') {
        return res.status(403).json({ error: "Access Denied. Unauthorized administration credentials." });
      }

      if (!targetUid || !newPassword) {
        return res.status(400).json({ error: "Bad Request. Target UID and new password are required." });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long." });
      }

      // Update password directly using administration endpoint
      await admin.auth().updateUser(targetUid, { password: newPassword });

      res.json({ success: true, message: "User password updated successfully." });
    } catch (error: any) {
      console.error("Admin Change Password Endpoint Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during password change." });
    }
  });

  // Administrative user deletion endpoint
  app.post("/api/admin/delete-user", async (req, res) => {
    try {
      const { targetUid } = req.body;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid authorization token" });
      }
      const token = authHeader.split("Bearer ")[1];

      // Use central helper
      const admin = await getFirebaseAdmin();

      const verifiedToken = await admin.auth().verifyIdToken(token);
      
      // Strict authorization verification
      if (verifiedToken.email?.toLowerCase() !== 'rougebandit114@gmail.com') {
        return res.status(403).json({ error: "Access Denied. Unauthorized administration credentials." });
      }

      if (!targetUid) {
        return res.status(400).json({ error: "Bad Request. Target UID is required." });
      }

      // Delete user directly from Firebase Authentication
      await admin.auth().deleteUser(targetUid);

      res.json({ success: true, message: "User account deleted successfully from Firebase Authentication." });
    } catch (error: any) {
      console.error("Admin Delete User Endpoint Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during user deletion." });
    }
  });

  // Public endpoint to clean up orphaned auth accounts if Firestore profile is missing
  app.post("/api/auth/clean-orphaned-auth", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required." });
      }

      // Use central helper
      const admin = await getFirebaseAdmin();

      try {
        const userRecord = await admin.auth().getUserByEmail(email);
        const uid = userRecord.uid;

        // Check if the corresponding profile exists in Firestore database
        const db = admin.firestore();
        const docRef = db.doc(`profiles/${uid}`);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
          console.log(`Orphaned authenticated user found for ${email} (UID: ${uid}). No Firestore profile exists. Cleaning up...`);
          await admin.auth().deleteUser(uid);
          return res.json({ cleaned: true, message: "Successfully cleaned up orphaned authentication record." });
        } else {
          console.log(`User ${email} is active and has a profile. Skipping cleanup.`);
          return res.json({ cleaned: false, message: "Active user profile found." });
        }
      } catch (authErr: any) {
        // If the user is not found in Auth, nothing to clean up
        if (authErr.code === "auth/user-not-found" || authErr.message?.includes("user-not-found")) {
          return res.json({ cleaned: false, message: "No authentication record exists for this email." });
        }
        throw authErr;
      }
    } catch (error: any) {
      console.error("Clean Orphaned Auth Endpoint Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during authentication cleanup." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SpendWise server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
