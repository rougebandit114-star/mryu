import React, { useState, useEffect } from 'react';
import { Shield, Users, Database, Trash2, AlertTriangle, Search, Globe, Mail, Activity, Cpu, HardDrive, ChevronDown, ChevronUp, Wallet, ArrowUpRight, ArrowDownRight, HandCoins, PiggyBank, Calendar, CreditCard, Tag } from 'lucide-react';
import { useAuth } from '../components/FirebaseAuthProvider';
import { auth } from '../lib/firebase';
import { getAllProfiles, clearAllTransactions, clearTransactionsByYear, deleteUserProfileAndData } from '../lib/db';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const performanceData = [
  { time: '00:00', latency: 45, load: 23 },
  { time: '04:00', latency: 52, load: 18 },
  { time: '08:00', latency: 120, load: 65 },
  { time: '12:00', latency: 180, load: 85 },
  { time: '16:00', latency: 140, load: 72 },
  { time: '20:00', latency: 85, load: 45 },
  { time: '23:59', latency: 60, load: 30 },
];

export function Admin() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [clearMode, setClearMode] = useState<'all' | 'year'>('year');
  const [selectedClearYear, setSelectedClearYear] = useState(new Date().getFullYear());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dbState, setDbState] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [dbError, setDbError] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  async function fetchData() {
    setLoading(true);
    setDbState('connecting');
    setDbError(null);
    try {
      const data = await getAllProfiles();
      setProfiles(data || []);
      setDbState('connected');
    } catch (error: any) {
      console.error('Failed to fetch admin data:', error);
      setDbState('error');
      let errorMessage = 'Failed to fetch admin profiles.';
      try {
        const parsed = JSON.parse(error.message);
        if (parsed && parsed.error) {
          errorMessage = parsed.error;
        }
      } catch {
        errorMessage = error instanceof Error ? error.message : String(error);
      }
      setDbError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      if (window.confirm('Are you sure you want to delete this user profile and all their transaction/budget data? This action cannot be undone.')) {
        setActionLoading(userId);
        
        console.log('Initiating delete for user:', userId);
        await deleteUserProfileAndData(userId);

        await fetchData();
        alert('SUCCESS: User profile, transactions, and budget data have been deleted from Firestore.');
      }
    } catch (error: any) {
      console.error('Admin Delete Exception:', error);
      alert('Action Failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearLogs = async () => {
    try {
      setActionLoading('clear-logs');
      if (clearMode === 'all') {
        await clearAllTransactions();
      } else {
        await clearTransactionsByYear(selectedClearYear);
      }
      setShowConfirmClear(false);
      alert(`${clearMode === 'all' ? 'All' : selectedClearYear} logs cleared successfully`);
    } catch (error) {
      console.error('Clear logs failed:', error);
      alert('Failed to clear logs: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setActionLoading(null);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const search = searchTerm.toLowerCase();
    return (
      (p.display_name?.toLowerCase().includes(search) || 
       p.displayName?.toLowerCase().includes(search) || 
       p.name?.toLowerCase().includes(search)) ||
      (p.email?.toLowerCase().includes(search))
    );
  });

  // Restricted Access
  if (user?.email?.toLowerCase() !== 'rougebandit114@gmail.com') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-3xl flex items-center justify-center mb-6 border border-rose-100 dark:border-rose-900/50">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Access Restricted</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest max-w-xs">
          Only authorized administrators can access this interface.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4 sm:px-0">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20">
              <Shield className="w-5 h-5 sm:w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Firebase Admin</h1>
          </div>
          <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] ml-11 sm:ml-14">Management & Oversight</p>
        </div>

        <button 
          onClick={() => setShowConfirmClear(true)}
          className="group relative w-full sm:w-auto px-6 py-4 sm:py-3.5 bg-white dark:bg-slate-900 text-emerald-500 rounded-3xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-3 shadow-xl sm:shadow-sm border border-emerald-500/10 dark:border-emerald-500/20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-emerald-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 -z-10" />
          <Trash2 className="w-4 h-4 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110" />
          <span className="relative z-10">Clear DB History</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Auth Users</h3>
          </div>
          <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{profiles.length}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Firestore Database</h3>
            </div>
            <div className="flex items-center gap-2">
              {dbState === 'connected' && (
                <>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Active</span>
                </>
              )}
              {dbState === 'connecting' && (
                <>
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Connecting</span>
                </>
              )}
              {dbState === 'error' && (
                <>
                  <div className="w-2 h-2 bg-rose-500 rounded-full" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 font-extrabold text-[10px]">Error</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {dbState === 'connected' ? '0.1' : '0.0'} <span className="text-xs text-slate-400">MB</span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  0.1 / 512 MB Free Tier
                </div>
              </div>
              <div className="h-3 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-100 dark:border-slate-700">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-out shadow-sm",
                    dbState === 'connected' ? "bg-linear-to-r from-emerald-400 to-emerald-600 w-[1%]" : "bg-slate-200 dark:bg-slate-700 w-0"
                  )} 
                />
              </div>
            </div>

            {dbError && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/50 text-[11px] font-bold text-rose-800 dark:text-rose-300">
                <div className="flex gap-2 items-start">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-extrabold uppercase tracking-wide text-[9px] text-rose-950 dark:text-rose-400">
                      ⚠️ FIRESTORE CONNECTION CHECKING ERROR
                    </p>
                    <p className="font-medium text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-rose-100 dark:border-rose-950/50 font-mono mt-1 select-all break-all">
                      {dbError}
                    </p>
                    <div className="pt-2 text-[10px] text-slate-600 dark:text-slate-400 font-medium space-y-1 leading-relaxed">
                      <p className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[8px] mt-1">Recommended Fixes:</p>
                      <ul className="list-disc list-inside space-y-0.5 pl-1">
                        <li>Ensure you have run the <span className="font-extrabold text-emerald-600 dark:text-emerald-400">deploy_firebase</span> tool to upload the <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">firestore.rules</code> security definitions.</li>
                        <li>Verify the rules allow read/list for administrative email account: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">rougebandit114@gmail.com</code>.</li>
                        <li>Verify that there is no network timeout or active quota limitation in your Firebase Console database instances.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
              <div>
                <div className="text-xl font-black text-slate-900 dark:text-white">{profiles.length}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Profiles</div>
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1">✓</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Firebase Cloud</div>
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1 uppercase">NoSQL Store</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Firestore</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Graph */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Firebase Telemetry</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-emerald-600/60">Real-time health from Google Cloud</p>
              </div>
            </div>
          </div>
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 px-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Query Speed</span>
              </div>
              <div className="flex items-center gap-2 px-3 border-l border-slate-200 dark:border-slate-700">
                <div className="w-2 h-2 bg-slate-400 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">CPU Load</span>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: 'none', 
                  borderRadius: '16px', 
                  padding: '12px' 
                }}
                labelStyle={{ color: '#fff', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '4px' }}
                itemStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: '700' }}
              />
              <Area 
                type="monotone" 
                dataKey="latency" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorLatency)" 
              />
              <Area 
                type="monotone" 
                dataKey="load" 
                stroke="#64748b" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorLoad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 pt-8 border-t border-slate-50 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-400 shadow-sm border border-slate-100 dark:border-slate-700">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">CPU Usage</div>
              <div className="text-xl font-black text-slate-900 dark:text-white">12% <span className="text-[9px] text-emerald-500 font-black uppercase ml-1">Normal</span></div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-400 shadow-sm border border-slate-100 dark:border-slate-700">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">RAM Load</div>
              <div className="text-xl font-black text-slate-900 dark:text-white">1.2 <span className="text-xs text-slate-400">GB</span></div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-400 shadow-sm border border-slate-100 dark:border-slate-700">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Edge Latency</div>
              <div className="text-xl font-black text-slate-900 dark:text-white">24 <span className="text-xs text-slate-400">ms</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Registered Users</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">User directory and auditing panel</p>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-bold text-xs text-slate-700 dark:text-slate-200 w-full md:w-80"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">User Details</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Net Balance</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Transactions</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Budgets Set</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Loan Status</th>
                <th className="px-8 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-28" />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24" />
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto" />
                    </td>
                  </tr>
                ))
              ) : (
                filteredProfiles.map((p) => {
                  const txs = p.transactions || [];
                  const budgets = p.budgets || [];
                  
                  const incomeTx = txs.filter((t: any) => t.type === 'income');
                  const expenseTx = txs.filter((t: any) => t.type === 'expense');
                  
                  const totalIncome = incomeTx.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
                  const totalExpense = expenseTx.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
                  const currentBalance = totalIncome - totalExpense;

                  const loanReceived = txs.reduce((sum: number, t: any) => (t.type === 'income' && t.category === 'Loan') ? sum + (Number(t.amount) || 0) : sum, 0);
                  const loanRepaid = txs.reduce((sum: number, t: any) => (t.type === 'expense' && t.category === 'Loan Repayment') ? sum + (Number(t.amount) || 0) : sum, 0);
                  const outstandingLoan = loanReceived - loanRepaid;
                  const isLoanRepaid = loanReceived > 0 && outstandingLoan <= 0;

                  const isExpanded = expandedUserId === p.id;

                  // Active monthly budget calculation helper
                  const getBudgetExpenses = (b: any) => {
                    return txs.reduce((sum: number, tx: any) => {
                      if (tx.type !== 'expense' || tx.category === 'Loan Repayment') return sum;
                      if (!tx.date) return sum;
                      const d = new Date(tx.date);
                      if (isNaN(d.getTime())) return sum;
                      const txMonthStr = format(d, 'MMMM');
                      const txYear = d.getFullYear();
                      if (txMonthStr === b.month && txYear === Number(b.year)) {
                        return sum + (Number(tx.amount) || 0);
                      }
                      return sum;
                    }, 0);
                  };

                  return (
                    <React.Fragment key={p.id}>
                      <tr className={cn(
                        "transition-all group border-l-4",
                        isExpanded ? "border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/5" : "border-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                      )}>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-linear-to-tr from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-black text-sm uppercase shadow-sm">
                              {(p.display_name || p.displayName || p.name)?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                {p.display_name || p.displayName || p.name || 'Anonymous User'}
                                {p.email?.toLowerCase() === 'rougebandit114@gmail.com' && (
                                  <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">Owner</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                                <Mail className="w-3 h-3" />
                                {p.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className={cn(
                            "text-sm font-black tracking-tight",
                            currentBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                          )}>
                            Rs.{Math.round(currentBalance).toLocaleString()}
                          </div>
                          <div className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">
                            In: Rs.{Math.round(totalIncome).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            <Activity className="w-3 h-3 text-slate-400" />
                            {txs.length} entries
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            <PiggyBank className="w-3 h-3 text-emerald-500" />
                            {budgets.length} configured
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          {loanReceived > 0 ? (
                            isLoanRepaid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600">
                                Fully Repaid
                              </span>
                            ) : (
                              <div>
                                <div className="text-xs font-black text-rose-500">
                                  Rs.{Math.round(outstandingLoan).toLocaleString()}
                                </div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                  Repaid: Rs.{Math.round(loanRepaid).toLocaleString()}
                                </div>
                              </div>
                            )
                          ) : (
                            <span className="text-slate-400 text-xs font-medium">No Liability</span>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setExpandedUserId(isExpanded ? null : p.id)}
                              className={cn(
                                "px-3 py-1.5 rounded-xl border transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1",
                                isExpanded 
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700" 
                                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                              )}
                              title="Toggle user breakdown"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3.5 h-3.5" />
                                  <span>Shrink</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3.5 h-3.5" />
                                  <span>Inspect</span>
                                </>
                              )}
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(p.id)}
                              disabled={p.email?.toLowerCase() === 'rougebandit114@gmail.com' || actionLoading === p.id}
                              className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed group/btn border border-transparent hover:border-rose-500/10"
                              title="Delete profile"
                            >
                              {actionLoading === p.id ? (
                                <Activity className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Panel */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 dark:bg-slate-950/30">
                          <td colSpan={6} className="px-8 py-6">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs grid grid-cols-1 gap-6">
                              {/* Dossier Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-2">
                                <div>
                                  <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight uppercase">User Auditing Dossier</h4>
                                  <p className="text-[10px] text-slate-400 font-bold">UID: <span className="font-mono font-medium text-slate-600 dark:text-slate-400">{p.id}</span> • Registered: {p.joined ? format(new Date(p.joined), 'MMM dd, yyyy') : 'N/A'}</p>
                                </div>
                                <div className="text-right text-[10px] text-slate-400 font-bold flex flex-col items-end">
                                  <div>
                                    <span>Last Active: </span>
                                    <span className="text-slate-700 dark:text-slate-200 font-black uppercase text-[11px]">{p.lastLogin ? format(new Date(p.lastLogin), 'MMM dd, yyyy HH:mm') : 'Recently'}</span>
                                  </div>
                                  <div className="mt-0.5 flex items-center gap-1">
                                    <Globe className="w-3 h-3 text-slate-450" />
                                    <span>Country: </span>
                                    <span className="text-slate-700 dark:text-slate-200 uppercase font-black">{p.country || 'Not Set'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Bento Aggregate Details Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 mb-2">
                                    <Wallet className="w-4 h-4 text-emerald-500" />
                                    Aggregate Liquidity
                                  </div>
                                  <div className={cn("text-lg font-black tracking-tighter", currentBalance >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                    Rs.{Math.round(currentBalance).toLocaleString()}
                                  </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 mb-2">
                                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                                    Total Income Flow
                                  </div>
                                  <div className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">
                                    Rs.{Math.round(totalIncome).toLocaleString()}
                                  </div>
                                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{incomeTx.length} items logged</p>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 mb-2">
                                    <ArrowDownRight className="w-4 h-4 text-rose-500" />
                                    Expense Drawdown
                                  </div>
                                  <div className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">
                                    Rs.{Math.round(totalExpense).toLocaleString()}
                                  </div>
                                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{expenseTx.length} items logged</p>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 mb-2">
                                    <HandCoins className="w-4 h-4 text-amber-500" />
                                    Remaining Debt
                                  </div>
                                  <div className={cn("text-lg font-black tracking-tighter", outstandingLoan > 0 ? "text-rose-500" : "text-emerald-500")}>
                                    Rs.{Math.round(outstandingLoan).toLocaleString()}
                                  </div>
                                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Borrowed: Rs.{Math.round(loanReceived).toLocaleString()}</p>
                                </div>
                              </div>

                              {/* Detailed Section Tabs/Dividers */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Budgets breakdown */}
                                <div>
                                  <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                                    <PiggyBank className="w-4 h-4 text-emerald-500" />
                                    Limits & Budgets ({budgets.length})
                                  </h5>
                                  {budgets.length === 0 ? (
                                    <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl text-center border border-dashed border-slate-100 dark:border-slate-800">
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No active monthly budgets configured</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {budgets.map((b: any) => {
                                        const spendValue = getBudgetExpenses(b);
                                        const ratio = b.amount > 0 ? (spendValue / b.amount) * 100 : 0;
                                        const isOver = spendValue > b.amount;
                                        return (
                                          <div key={b.id} className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-1.5 shadow-xs">
                                            <div className="flex justify-between items-center">
                                              <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-slate-405" />
                                                <span className="text-[11px] font-black uppercase text-slate-800 dark:text-slate-200">{b.month} {b.year}</span>
                                              </div>
                                              <div className="text-[10px] text-right font-black">
                                                <span className={isOver ? "text-rose-500" : "text-slate-700 dark:text-slate-300"}>Rs.{Math.round(spendValue).toLocaleString()}</span>
                                                <span className="text-slate-400 font-normal"> / Rs.{Math.round(b.amount).toLocaleString()}</span>
                                              </div>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                              <div 
                                                className={cn("h-full rounded-full transition-all duration-500", isOver ? "bg-rose-500" : "bg-emerald-500")}
                                                style={{ width: `${Math.min(ratio, 100)}%` }}
                                              />
                                            </div>
                                            <div className="flex justify-between items-center text-[8px] font-bold uppercase text-slate-400 mt-0.5">
                                              <span>{isOver ? "Alert: Budget Exceeded!" : "Safe Range"}</span>
                                              <span>{Math.round(ratio)}% spent</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                {/* Transactions breakdown */}
                                <div>
                                  <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                                    <CreditCard className="w-4 h-4 text-emerald-500" />
                                    Recent Ledger Entries
                                  </h5>
                                  {txs.length === 0 ? (
                                    <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl text-center border border-dashed border-slate-100 dark:border-slate-800">
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No transaction logs available</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5 max-h-[188px] overflow-y-auto pr-1">
                                      {txs.slice(0, 10).map((t: any) => (
                                        <div key={t.id} className="bg-slate-50/50 dark:bg-slate-800/15 px-3 py-2.5 rounded-xl border border-slate-100/50 dark:border-slate-800/50 flex justify-between items-center text-xs group/item">
                                          <div className="flex gap-2.5 items-center min-w-0">
                                            <div className={cn(
                                              "p-1.5 rounded-lg shrink-0",
                                              t.type === 'income' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-rose-50 text-rose-505 dark:bg-rose-500/10"
                                            )}>
                                              {t.type === 'income' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                            </div>
                                            <div className="min-w-0">
                                              <div className="font-extrabold text-slate-800 dark:text-slate-200 truncate">{t.description || t.category}</div>
                                              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                                                <Tag className="w-2.5 h-2.5 opacity-50" />
                                                <span>{t.category}</span>
                                                <span>•</span>
                                                <span>{t.date ? format(new Date(t.date), 'MMM dd, yyyy') : 'N/A'}</span>
                                              </div>
                                            </div>
                                          </div>
                                          <div className={cn(
                                            "font-black tracking-tight shrink-0 pl-2",
                                            t.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                                          )}>
                                            {t.type === 'income' ? '+' : '-'}Rs.{t.amount?.toLocaleString()}
                                          </div>
                                        </div>
                                      ))}
                                      {txs.length > 10 && (
                                        <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-wider pt-2">
                                          + {txs.length - 10} more transactions
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
          {filteredProfiles.length === 0 && !loading && (
            <div className="p-20 text-center">
              <Users className="w-12 h-12 text-slate-100 dark:text-slate-800 mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">No users found in directory</p>
            </div>
          )}
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 max-w-sm w-full rounded-[32px] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 text-center">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Clear Log History?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold leading-relaxed mb-6">
              This will permanently delete transactions. This action cannot be reversed.
            </p>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
              <button 
                onClick={() => setClearMode('year')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  clearMode === 'year' ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : "text-slate-400"
                )}
              >
                Specific Year
              </button>
              <button 
                onClick={() => setClearMode('all')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  clearMode === 'all' ? "bg-white dark:bg-slate-700 text-rose-600 shadow-sm" : "text-slate-400"
                )}
              >
                Clear All
              </button>
            </div>

            {clearMode === 'year' && (
              <div className="grid grid-cols-3 gap-2 mb-8">
                {years.map(y => (
                  <button
                    key={y}
                    onClick={() => setSelectedClearYear(y)}
                    className={cn(
                      "py-2 rounded-lg border text-[10px] font-bold transition-all",
                      selectedClearYear === y 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/30 dark:border-emerald-800" 
                        : "border-slate-100 dark:border-slate-800 text-slate-400"
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleClearLogs}
                disabled={actionLoading === 'clear-logs'}
                className={cn(
                  "w-full py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2",
                  clearMode === 'all' ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20",
                  actionLoading === 'clear-logs' && "opacity-50 cursor-not-allowed"
                )}
              >
                {actionLoading === 'clear-logs' && <Activity className="w-4 h-4 animate-spin" />}
                {clearMode === 'all' ? 'Clear All History' : `Clear ${selectedClearYear} Logs`}
              </button>
              <button 
                onClick={() => setShowConfirmClear(false)}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
