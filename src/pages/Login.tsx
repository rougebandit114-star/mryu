import React, { useState } from 'react';
import { Wallet, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../components/FirebaseAuthProvider';
import firebaseConfig from '../../firebase-applet-config.json';

export function Login() {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, error: authError, clearError } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const error = localError || authError;
  const isOperationNotAllowedError = error?.toLowerCase().includes('operation-not-allowed');
  const isAuthDisabledError = error?.toLowerCase().includes('email signups are disabled') || error?.toLowerCase().includes('provider is disabled') || isOperationNotAllowedError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);
    clearError();
    try {
      if (isSignUp) {
        await signupWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setLocalError(null);
    clearError();
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setLocalError(null);
    clearError();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden transition-colors dark:bg-slate-950">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-400 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="bg-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-600/30">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">SpendWise</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="text-slate-400 mt-2 font-bold text-[10px] uppercase tracking-[0.2em]">The art of financial tracking</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 md:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
          <div className="space-y-6">
            {error && (
              <div className={`p-4 rounded-2xl border flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 ${isAuthDisabledError ? 'bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-300' : 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400'}`}>
                <div className="flex items-start gap-2.5 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p>{error}</p>
                    {isOperationNotAllowedError && (
                      <div className="mt-3 p-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-amber-200/50 dark:border-amber-900/40 text-[11px] text-slate-700 dark:text-slate-300 font-medium space-y-2.5 leading-relaxed">
                        <p className="font-extrabold text-amber-900 dark:text-amber-400 uppercase tracking-wider text-[9px]">
                          ⚠️ ACTION REQUIRED: ENABLE AUTH PROVIDERS
                        </p>
                        <p>
                          This error indicates that the <strong>Email/Password</strong> or <strong>Google</strong> sign-in method is not enabled in your Firebase Project Console.
                        </p>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white">How to enable it:</p>
                          <ol className="list-decimal list-inside space-y-1 pl-1">
                            <li>Go to the <a href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline">Firebase Console Auth Providers Page</a></li>
                            <li>Click on <strong>Add new provider</strong> (or edit existing under 'Sign-in method').</li>
                            <li>Choose <strong>Email/Password</strong> and toggle it to <strong>Enable</strong>, then save.</li>
                            <li>Also ensure the <strong>Google</strong> provider is enabled if you want to use Google Login.</li>
                          </ol>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">
                          Authentication is fully sandboxed. Once enabled, you can immediately sign in or sign up!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>

            {isSignUp && (
              <div className="space-y-1.5 font-bold uppercase tracking-widest text-[10px] text-slate-400">
                <label className="ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-white font-bold transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5 font-bold uppercase tracking-widest text-[10px] text-slate-400">
              <label className="ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-white font-bold transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5 font-bold uppercase tracking-widest text-[10px] text-slate-400">
              <label className="ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-white font-bold transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-600/10 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:grayscale uppercase tracking-widest text-[11px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-4">
            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Or continue with</span>
            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full mt-6 py-4 px-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold transition-all shadow-sm flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50 group"
          >
            <div className="w-6 h-6 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center group-hover:bg-white transition-colors">
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            </div>
            <span className="text-[11px] tracking-widest uppercase">Google Account</span>
          </button>

          <div className="mt-8 text-center">
            <button
              onClick={toggleMode}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
