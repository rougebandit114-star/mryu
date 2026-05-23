import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  Camera, 
  Check, 
  AlertCircle, 
  LogOut, 
  Lock, 
  Moon, 
  Sun,
  Eye,
  EyeOff,
  Settings as SettingsIcon,
  ArrowLeft,
  UserCog,
  Download,
  FolderArchive
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../components/FirebaseAuthProvider';
import { getProfile, updateProfile as updateProfileInDb } from '../lib/db';
import { updatePassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Profile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    country: '',
    joined: 'May 2026'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'changing' | 'changed'>('idle');

  // Theme state
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark') || 
           localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    if (!user) return;
    const fetchProfileData = async () => {
      const data = await getProfile(user.id);
      if (data) {
        setProfile({
          name: data.display_name || user.displayName || '',
          email: data.email || user.email || '',
          country: data.country || '',
          joined: data.joined || 'May 2026'
        });
      }
    };
    fetchProfileData();
  }, [user]);

  // Update handleSave
  const handleSave = async () => {
    if (!user) return;
    setSaveStatus('saving');
    setError(null);
    try {
      // Update DB
      await updateProfileInDb(user.id, {
        displayName: profile.name,
        email: profile.email,
        country: profile.country
      });
      
      setSaveStatus('saved');
      setIsEditing(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update profile');
      setSaveStatus('idle');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPassword) return;
    setPasswordStatus('changing');
    setError(null);
    try {
      if (!auth.currentUser) throw new Error('No user is currently signed in.');
      await updatePassword(auth.currentUser, newPassword);
      
      setPasswordStatus('changed');
      setNewPassword('');
      setTimeout(() => setPasswordStatus('idle'), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update password.');
      setPasswordStatus('idle');
    }
  };

  const handleDownloadZip = () => {
    window.location.href = '/api/download-project-zip';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 dark:text-slate-200">
      <div className="relative">
        <div className="h-40 bg-slate-900 dark:bg-slate-950 rounded-[32px] overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent" />
          <div className="absolute bottom-6 right-8 text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1">Financial Profile</p>
            <h2 className="text-white text-2xl font-black uppercase tracking-tight">{profile.country || 'GLOBAL'}</h2>
          </div>
        </div>
        <div className="absolute -bottom-12 left-10 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-[28px]">
          <div className="w-28 h-28 bg-white dark:bg-slate-800 rounded-[22px] shadow-xl shadow-emerald-600/10 flex items-center justify-center relative group overflow-hidden border border-slate-100 dark:border-slate-700">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-14 h-14 text-slate-200 dark:text-slate-600" />
            )}
            <button className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-[22px]">
              <Camera className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 pt-20 border border-slate-200 dark:border-slate-800 shadow-sm space-y-10 min-h-[500px] transition-all">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white truncate tracking-tight">
              {showSettings ? 'Settings' : profile.name}
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {showSettings ? 'Manage your account preferences' : `Verified Member since ${profile.joined}`}
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {!showSettings ? (
              <>
                <button 
                  onClick={() => logout()}
                  className="px-6 py-3 bg-rose-500/10 text-rose-500 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
                <button 
                  onClick={() => setShowSettings(true)}
                  className="flex-1 md:flex-none px-8 py-3 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-emerald-700 transition-all shadow-lg shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Settings
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setShowSettings(false);
                    setIsEditing(false);
                  }}
                  className="flex-1 md:flex-none px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-bold text-[10px] uppercase tracking-widest">{error}</span>
          </div>
        )}

        {!showSettings ? (
          /* Profile View Mode */
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Official Name</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                    <User className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-xl font-black text-slate-800 dark:text-slate-100">{profile.name}</p>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Email Address</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                    <Mail className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{profile.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-600 rounded-[32px] p-8 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
                <Shield className="w-32 h-32" />
              </div>
              <div className="relative">
                <h3 className="text-lg font-black uppercase tracking-tight mb-2">Account Protected</h3>
                <p className="text-xs text-emerald-100 leading-relaxed font-medium">
                  Your account is secured with Enterprise-grade Authentication and encrypted Firestore cloud storage. All financial data is private to you.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Settings View Mode */
          <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
            {/* Edit Name Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Personal Information</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Manage your identity</p>
                </div>
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <UserCog className="w-3.5 h-3.5" />
                    Edit Details
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-700"
                    >
                      {saveStatus === 'saving' ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {saveStatus === 'saved' && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 p-4 rounded-2xl flex items-center gap-3">
                  <Check className="w-4 h-4" />
                  <span className="font-bold text-[10px] uppercase tracking-widest">Profile Saved</span>
                </div>
              )}

              {isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border bg-white dark:bg-slate-800 border-emerald-600/30 ring-2 ring-emerald-600/5 transition-all">
                      <User className="w-4 h-4 text-slate-300" />
                      <input 
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className="w-full bg-transparent font-bold text-sm text-slate-800 dark:text-slate-200 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Country</label>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border bg-white dark:bg-slate-800 border-emerald-600/30 ring-2 ring-emerald-600/5 transition-all">
                      <Shield className="w-4 h-4 text-slate-300" />
                      <input 
                        type="text"
                        value={profile.country}
                        onChange={(e) => setProfile({...profile, country: e.target.value})}
                        className="w-full bg-transparent font-bold text-sm text-slate-800 dark:text-slate-200 outline-none"
                        placeholder="e.g. Nepal"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Account Settings Section */}
            <div className="pt-10 border-t border-slate-100 dark:border-slate-800 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Theme Toggle */}
                <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-slate-700/50 rounded-xl shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-600">
                      {isDark ? <Moon className="w-5 h-5 text-emerald-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-tight">Appearance</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">System theme</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsDark(!isDark)}
                    className={cn(
                      "px-4 py-2 rounded-xl font-black text-[8px] uppercase tracking-[0.15em] transition-all active:scale-95 flex items-center gap-1.5 shadow-sm border",
                      isDark 
                        ? "bg-emerald-600 text-white border-emerald-500/30 shadow-emerald-600/20" 
                        : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                    {isDark ? 'Dark' : 'Light'}
                  </button>
                </div>

                {/* Password Change Interface */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-600">
                      <Lock className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">Security Key</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Update password</p>
                    </div>
                  </div>
                  
                  {!showPasswordInput ? (
                    <button 
                      onClick={() => setShowPasswordInput(true)}
                      className="w-full py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
                    >
                      Change Password
                    </button>
                  ) : (
                    <form onSubmit={handleChangePassword} className="space-y-4 animate-in zoom-in-95 duration-200">
                      <div className="relative">
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New Secure Password"
                          className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500/30"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => setShowPasswordInput(false)}
                          className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={!newPassword || passwordStatus === 'changing'}
                          className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                          {passwordStatus === 'changing' ? 'Updating...' : passwordStatus === 'changed' ? 'Updated!' : 'Confirm'}
                          {passwordStatus === 'changed' && <Check className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Developer & Offline Build Tool */}
              <div className="bg-slate-50 dark:bg-slate-800/20 p-8 rounded-[24px] border border-slate-100 dark:border-white/5 flex flex-col md:flex-row gap-6 justify-between items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex gap-4 items-center flex-1">
                  <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                    <FolderArchive className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider">Android Studio Source Exporter</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1 leading-relaxed">
                      Download the full workspace as a ZIP package. Import directly into Android Studio, compile native APKs, or configure plugins.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadZip}
                  className="w-full md:w-auto px-6 py-4 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-950/10 cursor-pointer active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download Project ZIP
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Footer */}
        <div className="pt-10 border-t border-slate-50 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[32px] p-8 flex flex-col md:flex-row gap-6 items-center">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
              <Shield className="w-7 h-7 text-emerald-500" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Cloud Infrastructure Security</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed max-w-lg font-medium italic">
                Your profile and transaction data are synchronized with high-availability Firestore Database. Advanced security ensures only you have access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
