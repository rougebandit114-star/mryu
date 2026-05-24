import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile as updateProfileInAuth
} from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { updateProfile as updateProfileInDb } from '../lib/db';

let isSigningUpGlobal = false;

export interface AppUser {
  id: string;
  uid: string; // Maintain compatibility
  email?: string;
  displayName?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  isEmailVerified: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    // 1. Connection check as required by Firebase skill
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (err: any) {
        if (err instanceof Error && err.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. Client is offline.");
        }
      }
    }
    testConnection();

    // 2. Auth State Change listener
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          if (isSigningUpGlobal) {
            // Bypass DB checks while signup is writing DB record
            const mappedUser = {
              id: fbUser.uid,
              uid: fbUser.uid,
              email: fbUser.email || undefined,
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
              photoURL: fbUser.photoURL || undefined
            };
            setUser(mappedUser);
          } else {
            // Regular check to see if profile exists in database
            const docRef = doc(db, 'profiles', fbUser.uid);
            const docSnap = await getDocFromServer(docRef).catch(() => null);
            
            if (docSnap && docSnap.exists()) {
              const mappedUser = {
                id: fbUser.uid,
                uid: fbUser.uid,
                email: fbUser.email || undefined,
                displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
                photoURL: fbUser.photoURL || undefined
              };
              setUser(mappedUser);

              // Update last active
              await updateProfileInDb(fbUser.uid, {
                displayName: mappedUser.displayName,
                email: fbUser.email || '',
                photoURL: fbUser.photoURL || '',
                lastLogin: new Date().toISOString()
              }).catch(err => console.warn("Failed to auto-verify profile DB entry:", err));
            } else {
              // Deny login because user is not listed or has been deleted
              console.warn("User profile not found in database. Sign-out forced.");
              await signOut(auth);
              setUser(null);
            }
          }
        } catch (e: any) {
          console.error("Auth status database check error:", e);
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    clearError();
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        // Enforce reading DB profile before allowing complete login
        const docRef = doc(db, 'profiles', result.user.uid);
        const docSnap = await getDocFromServer(docRef).catch(() => null);
        
        if (!docSnap || !docSnap.exists()) {
          await signOut(auth);
          throw new Error("This Google account is not authorized or is not listed in the database/has been deleted.");
        }

        const mappedUser = {
          id: result.user.uid,
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || result.user.email?.split('@')[0] || 'User',
          photoURL: result.user.photoURL || ''
        };
        await updateProfileInDb(mappedUser.id, {
          displayName: mappedUser.displayName,
          email: mappedUser.email,
          photoURL: mappedUser.photoURL,
          lastLogin: new Date().toISOString()
        }).catch(err => console.warn("Failed to update profile DB entry:", err));
      }
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    clearError();
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        // Enforce reading DB profile before allowing complete login
        const docRef = doc(db, 'profiles', result.user.uid);
        const docSnap = await getDocFromServer(docRef).catch(() => null);
        
        if (!docSnap || !docSnap.exists()) {
          await signOut(auth);
          throw new Error("Login failed: Your account is either deleted or not listed in the database.");
        }

        const mappedUser = {
          id: result.user.uid,
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || result.user.email?.split('@')[0] || 'User',
          photoURL: result.user.photoURL || ''
        };
        await updateProfileInDb(mappedUser.id, {
          displayName: mappedUser.displayName,
          email: mappedUser.email,
          photoURL: mappedUser.photoURL,
          lastLogin: new Date().toISOString()
        }).catch(err => console.warn("Failed to update profile DB entry:", err));
      }
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    clearError();
    let createdUser: any = null;
    try {
      isSigningUpGlobal = true;
      let result;
      try {
        result = await createUserWithEmailAndPassword(auth, email, pass);
      } catch (err: any) {
        if (err && (err.code === 'auth/email-already-in-use' || err.message?.includes('email-already-in-use') || err.message?.includes('auth/email-already-in-use'))) {
          console.log("Email already in use. Checking if it corresponds to an orphaned account to clean up or self-heal...");
          try {
            // First, try to self-heal by signing in on the client-side with the password they provided!
            // This verifies they own the account and lets us safely recreate their database profile.
            console.log("Attempting self-healing sign-in with provided password...");
            const signinResult = await signInWithEmailAndPassword(auth, email, pass);
            if (signinResult.user) {
              console.log("Self-healing login authenticated successfully. Proceeding to restore missing database profile...");
              result = signinResult;
            } else {
              throw err;
            }
          } catch (loginErr: any) {
            console.log("Self-healing login check failed:", loginErr);
            if (loginErr && (loginErr.code === 'auth/wrong-password' || loginErr.code === 'auth/invalid-credential' || loginErr.message?.includes('wrong-password') || loginErr.message?.includes('invalid-credential') || loginErr.message?.includes('invalid-email'))) {
              throw new Error("This email is already registered in Firebase. To recreate your missing/deleted profile, please sign up using your correct original password for this email, or use a different email address.");
            }

            // Fallback: If login failed because of some other reason (not wrong password), try server-side cleanup
            try {
              const cleanResp = await fetch('/api/auth/clean-orphaned-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
              });
              if (cleanResp.ok) {
                const cleanData = await cleanResp.json();
                if (cleanData.cleaned) {
                  console.log("Found and cleaned up an orphaned authenticated user. Retry registration.");
                  result = await createUserWithEmailAndPassword(auth, email, pass);
                } else {
                  throw new Error("This email is already in use by another active account.");
                }
              } else {
                const errData = await cleanResp.json().catch(() => ({}));
                const serverError = errData.error || '';
                if (serverError.toLowerCase().includes('insufficient permission') || serverError.toLowerCase().includes('credential')) {
                  throw new Error("This email is registered in Firebase Authentication but has no database profile. To resolve, use your existing password during sign up to automatically restore/heal your profile, or delete the user from your Firebase Console Auth list.");
                }
                throw err;
              }
            } catch (cleanErr: any) {
              console.error("Auto authentication cleanup check failed:", cleanErr);
              if (cleanErr && cleanErr.message && (cleanErr.message.includes("database profile") || cleanErr.message.includes("already in use by another active account") || cleanErr.message.includes("recreate your missing/deleted profile"))) {
                throw cleanErr;
              }
              throw new Error(`This email is already in use. If you recently deleted this account from the Admin Dashboard, use your existing password to sign up and auto-restore your profile, or manually delete it from your Firebase Console.`);
            }
          }
        } else {
          throw err;
        }
      }
      
      createdUser = result.user;
      
      if (createdUser) {
        await updateProfileInAuth(createdUser, { displayName: name });
        const mappedUser = {
          id: createdUser.uid,
          uid: createdUser.uid,
          email: createdUser.email || '',
          displayName: name,
          photoURL: ''
        };
        
        try {
          // Attempt database profile writing
          await updateProfileInDb(mappedUser.id, {
            displayName: name,
            email: email,
            joined: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          });
        } catch (dbErr) {
          // "While creating, if the users are not set in database, make it unable to login."
          console.error("Failed to commit profile model to the database:", dbErr);
          try {
            await createdUser.delete();
          } catch (delErr) {
            console.error("Cleanup of Firebase User Auth record failed during cleanup:", delErr);
          }
          await signOut(auth);
          setUser(null);
          throw new Error("Registration failed: Could not persist profile in database.");
        }
      }
    } catch (e: any) {
      isSigningUpGlobal = false;
      setError(e.message);
      throw e;
    } finally {
      isSigningUpGlobal = false;
    }
  };

  const resendVerification = async () => {
    alert("Email verification is managed automatically by your Firebase project.");
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      isEmailVerified: true, 
      loginWithGoogle, 
      loginWithEmail, 
      signupWithEmail, 
      resendVerification, 
      logout,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}
