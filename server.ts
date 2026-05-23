import express from "express";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const archiver = require("archiver");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API health and check endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Dynamic ZIP generation of the work environment (excluding build caches & node_modules)
  app.get("/api/download-project-zip", (req, res) => {
    // Force browser to handle as download
    res.writeHead(200, {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=spendwise-project.zip",
    });

    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression level
    });

    archive.on("warning", (err) => {
      if (err.code === "ENOENT") {
        console.warn("Archiver warning:", err);
      } else {
        throw err;
      }
    });

    archive.on("error", (err) => {
      console.error("Archiver error:", err);
      if (!res.headersSent) {
        res.status(500).send({ error: err.message });
      }
    });

    archive.pipe(res);

    // Package root project directories, explicitly omitting massive build and node module files
    archive.glob("**/*", {
      cwd: process.cwd(),
      ignore: [
        "node_modules/**",
        "dist/**",
        ".git/**",
        "*.zip",
        ".env",
        "android/.gradle/**",
        "android/app/build/**",
        "android/build/**",
        "android/**/*.apk",
      ],
      dot: true, // Include dot files like .github configuration and .gitignore
    });

    archive.finalize();
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

      // Lazy import & initialize firebase-admin to avoid startup crashes if secrets aren't loaded
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
        
        // Try initializing with Application Default Credentials
        admin.initializeApp({
          projectId: projectId,
        });
      }

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
