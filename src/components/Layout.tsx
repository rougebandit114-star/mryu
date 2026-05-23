import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, History, UserCircle, Wallet, Plus, Shield } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from './FirebaseAuthProvider';
import { useTransactionModal } from './ModalProvider';
import { AddTransactionModal } from './AddTransactionModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout() {
  const location = useLocation();
  const { user } = useAuth();
  const { openAddModal } = useTransactionModal();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'History', path: '/history', icon: History },
    { name: 'Profile', path: '/profile', icon: UserCircle },
  ];

  if (user?.email?.toLowerCase() === 'rougebandit114@gmail.com') {
    navItems.splice(2, 0, { name: 'Admin', path: '/admin', icon: Shield });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      <AddTransactionModal />
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-slate-900 dark:bg-black text-slate-300 flex-col py-6">
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="bg-emerald-600 p-2.5 rounded-xl shadow-lg shadow-emerald-600/20">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">SpendWise</span>
        </div>

        <div className="px-4 mb-6">
          <button
            onClick={openAddModal}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border border-transparent",
                location.pathname === item.path
                  ? "bg-emerald-600/10 text-emerald-400 border-emerald-500/20 font-semibold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                location.pathname === item.path ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
              )} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="px-4 mt-auto">
          {user && (
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-xs font-bold text-emerald-400">
                      {user.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-100 truncate">{user.displayName || 'User'}</p>
                  <p className="text-[10px] text-slate-500 truncate font-medium">{user.email}</p>
                </div>
              </div>
              <Link
                to="/profile"
                className="block w-full py-2 text-[10px] bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors uppercase font-bold tracking-widest text-center"
              >
                Update Details
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header - Aligned with Sleek Interface */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 shrink-0 flex items-center justify-between px-6 md:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2 md:block">
            <div className="md:hidden bg-emerald-600 p-1.5 rounded-lg mr-2">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {navItems.find(i => i.path === location.pathname)?.name || (location.pathname === '/admin' ? 'Admin' : 'Finances')}
              </h1>
              <p className="hidden md:block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                {location.pathname === '/admin' ? 'System Control & Oversight' : 'Financial Tracking Dashboard'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Nav interactions */}
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950/50">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex justify-around items-center sticky bottom-0 z-10">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center min-w-[64px] py-1 rounded-xl transition-all duration-300",
                location.pathname === item.path 
                  ? "text-emerald-600 dark:text-emerald-400" 
                  : "text-slate-400 dark:text-slate-500"
              )}
            >
              <div className={cn(
                "w-12 h-8 rounded-full flex items-center justify-center transition-all duration-300 mb-1",
                location.pathname === item.path && "bg-emerald-600/10 dark:bg-emerald-400/10"
              )}>
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-300",
                  location.pathname === item.path && "scale-110"
                )} />
              </div>
              <span className={cn(
                "text-[8px] uppercase font-black tracking-[0.1em] transition-all duration-300",
                location.pathname === item.path ? "opacity-100" : "opacity-70"
              )}>{item.name}</span>
            </Link>
          ))}
        </nav>
      </main>

      {/* Floating Action Button - Circle and Floatable (Global) */}
      <button
        onClick={openAddModal}
        className="fixed bottom-24 md:bottom-8 right-8 w-16 h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-600/40 transition-all active:scale-90 z-40 group"
      >
        <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}
