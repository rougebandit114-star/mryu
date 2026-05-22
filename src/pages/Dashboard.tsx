import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Calendar, 
  Settings2, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  HandCoins,
  History as HistoryIcon,
  AlertCircle,
  Mail,
  Loader2,
  Trash2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { format, startOfWeek, endOfWeek, isWithinInterval, subDays, eachDayOfInterval, startOfMonth } from 'date-fns';
import { Link } from 'react-router-dom';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, type Transaction, type TransactionType } from '../types';
import { useAuth } from '../components/FirebaseAuthProvider';
import { useTransactionModal } from '../components/ModalProvider';
import { 
  subscribeToTransactions, 
  subscribeToBudget, 
  getBudget, 
  addTransaction, 
  setBudget as saveBudget, 
  resetBudget,
  deleteTransaction
} from '../lib/db';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Dashboard() {
  const { user, isEmailVerified, resendVerification } = useAuth();
  const { openAddModal } = useTransactionModal();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<{ amount: number } | null>(null);
  const [isSettingBudget, setIsSettingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const isDark = document.documentElement.classList.contains('dark');
  
  const today = new Date();
  const currentMonth = format(today, 'MMMM');
  const currentYear = today.getFullYear();

  useEffect(() => {
    if (!user) return;

    const unsubTxs = subscribeToTransactions(user.id, (data) => {
      setTransactions(data as Transaction[]);
    });

    const unsubBudget = subscribeToBudget(user.id, currentMonth, currentYear, (data) => {
      setBudget(data);
    });

    return () => {
      unsubTxs();
      unsubBudget();
    };
  }, [user, currentMonth, currentYear]);

  const handleSaveBudget = async () => {
    if (!user || !budgetInput) return;
    await saveBudget(user.id, currentMonth, currentYear, parseFloat(budgetInput));
    setIsSettingBudget(false);
    setBudgetInput('');
    // Refresh
    const b = await getBudget(user.id, currentMonth, currentYear);
    setBudget(b as any);
  };

  const handleResetBudget = async () => {
    if (!user) return;
    await resetBudget(user.id, currentMonth, currentYear);
    // Refresh
    setBudget(null);
  };

  // Calculations
  const monthlyTransactions = useMemo(() => {
    const now = new Date();
    const currentM = now.getMonth();
    const currentY = now.getFullYear();

    return transactions.filter(t => {
      try {
        // Date is stored as YYYY-MM-DD
        const [year, month, day] = t.date.split('-').map(Number);
        if (!year || !month) {
          // Fallback for full ISO strings if any
          const txDate = new Date(t.date);
          return txDate.getMonth() === currentM && txDate.getFullYear() === currentY;
        }
        // month in split is 1-indexed (01-12), JS Date month is 0-indexed
        return (month - 1) === currentM && year === currentY;
      } catch (e) {
        return false;
      }
    });
  }, [transactions]);

  const totalIncome = monthlyTransactions.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc, 0);
  const totalExpense = monthlyTransactions.reduce((acc, curr) => curr.type === 'expense' ? acc + curr.amount : acc, 0);
  const budgetUsed = monthlyTransactions.reduce((acc, curr) => (curr.type === 'expense' && curr.category !== 'Loan Repayment') ? acc + curr.amount : acc, 0);
  
  const allIncome = transactions.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc, 0);
  const allExpense = transactions.reduce((acc, curr) => curr.type === 'expense' ? acc + curr.amount : acc, 0);
  const amountInHand = allIncome - allExpense;

  const loanReceived = transactions.reduce((acc, curr) => (curr.type === 'income' && curr.category === 'Loan') ? acc + curr.amount : acc, 0);
  const loanPaid = transactions.reduce((acc, curr) => (curr.type === 'expense' && curr.category === 'Loan Repayment') ? acc + curr.amount : acc, 0);
  const remainingLoan = loanReceived - loanPaid;
  const isRepaid = loanReceived > 0 && remainingLoan <= 0;
  const loanProgress = isRepaid ? 0 : Math.min(((loanPaid) / ((loanPaid) + (remainingLoan) || 1)) * 100, 100);

  const weekStart = subDays(today, 7);
  const weekEnd = today;
  const weekHistory = transactions
    .filter(t => isWithinInterval(new Date(t.date), { start: weekStart, end: weekEnd }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const chartData = useMemo(() => {
    const start = startOfMonth(today);
    const days = eachDayOfInterval({
      start,
      end: today
    });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTxs = monthlyTransactions.filter(t => t.date === dayStr);
      return {
        name: format(day, 'MMM dd'),
        income: dayTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
        expense: dayTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
      };
    });
  }, [monthlyTransactions, today]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 relative dark:text-slate-200">
      {user && !isEmailVerified && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
            <div className="bg-amber-100 dark:bg-amber-800/40 p-2 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">Verify your email address</p>
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">A verification link has been sent to {user.email}. Check your inbox to enable all features.</p>
            </div>
          </div>
          <button 
            onClick={async () => {
              setVerifying(true);
              await resendVerification();
              setTimeout(() => setVerifying(false), 2000);
            }}
            disabled={verifying}
            className="whitespace-nowrap px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-600/20 flex items-center gap-2"
          >
            {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
            {verifying ? 'Sending...' : 'Resend Email'}
          </button>
        </div>
      )}

      {/* Top Section: Global Wallet Card - GREEN */}
      <div className="bg-emerald-600 rounded-[32px] p-6 text-white shadow-2xl shadow-emerald-600/20 flex flex-col overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
          <Wallet className="w-32 h-32" />
        </div>
        
        {/* Top Info */}
        <div className="relative mb-3">
          <div className="flex items-center gap-2 mb-1 opacity-70">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em]">{format(today, 'EEEE, MMMM do yyyy').toUpperCase()}</span>
          </div>
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-50 mb-0.5">Current Assets</div>
          <div className="text-[41px] font-black tracking-tighter leading-none mb-0">Rs.{amountInHand.toLocaleString()}</div>
        </div>

        {/* Side by Side Indicators */}
        <div className="relative grid grid-cols-2 gap-1.5 mt-3">
          {/* Income Card */}
          <div className="flex items-center gap-1.5 bg-white/10 px-2 py-2 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="bg-emerald-400/20 p-1 rounded-lg shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <div className="min-w-0 flex flex-col">
              <p className="text-[6px] font-black opacity-60 uppercase tracking-[0.2em] mb-0.5 leading-none">Monthly Income</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-[14px] font-black leading-none">Rs.{totalIncome.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Expense Card */}
          <div className="flex items-center gap-1.5 bg-rose-500/10 px-2 py-2 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="bg-rose-400/20 p-1 rounded-lg shrink-0">
              <TrendingDown className="w-3.5 h-3.5 text-rose-300" />
            </div>
            <div className="min-w-0 flex flex-col">
              <p className="text-[6px] font-black opacity-60 uppercase tracking-[0.2em] mb-0.5 leading-none">Monthly Expense</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-[14px] font-black leading-none">Rs.{totalExpense.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Budget & Loan Liability */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly Budget Card */}
        <div className="bg-white dark:bg-slate-900 px-6 h-[90px] rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group transition-all hover:border-emerald-500/20 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-xl shrink-0" style={{ marginRight: '3px' }}>
              <PiggyBank className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Budget</h3>
              <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                {budget ? `Rs.${budget.amount.toLocaleString()}` : <span className="text-slate-100 dark:text-slate-800">Rs.0</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {budget ? (
              <div className="flex flex-col items-end gap-1">
                <button 
                  onClick={handleResetBudget}
                  className="text-[9px] font-bold text-slate-400 hover:text-rose-500 uppercase transition-colors"
                >
                  Reset
                </button>
                <div className="text-right">
                  <div className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Rs.{budgetUsed.toLocaleString()} Used</div>
                  <div className="w-20 sm:w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${Math.min((budgetUsed / budget.amount) * 100, 100)}%` }} 
                    />
                  </div>
                </div>
              </div>
            ) : (
              !isSettingBudget && (
                <button 
                  onClick={() => setIsSettingBudget(true)}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  Set
                </button>
              )
            )}
          </div>

          {isSettingBudget && (
            <div className="absolute inset-0 bg-white dark:bg-slate-900 z-10 flex items-center gap-2 p-4 animate-in fade-in duration-200">
              <input 
                type="number" 
                autoFocus
                placeholder="Budget Amount"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="flex-1 h-full px-4 bg-slate-50 dark:bg-slate-800 border-none focus:outline-none text-sm font-bold"
              />
              <div className="flex items-center gap-2">
                <button onClick={handleSaveBudget} className="bg-emerald-600 text-white h-10 px-4 rounded-xl font-bold text-[10px] uppercase">Save</button>
                <button onClick={() => setIsSettingBudget(false)} className="px-2 text-slate-400 text-xs">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Loan Liability Card */}
        <div className={cn("bg-white dark:bg-slate-900 px-6 h-[90px] rounded-[24px] shadow-sm border flex items-center justify-between group transition-all overflow-hidden", isRepaid ? "border-emerald-500/20 hover:border-emerald-500/40" : "border-slate-100 dark:border-slate-800 hover:border-rose-500/20")}>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-xl shrink-0 transition-colors duration-300", isRepaid ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-rose-50 dark:bg-rose-500/10")} style={{ marginRight: '3px' }}>
              <HandCoins className={cn("w-4 h-4 transition-colors", isRepaid ? "text-emerald-500" : "text-rose-500")} />
            </div>
            <div className="flex flex-col">
              <h3 className={cn("text-[10px] font-black uppercase tracking-widest mb-1 leading-none transition-colors", isRepaid ? "text-emerald-500" : "text-rose-500 dark:text-white")}>Loan</h3>
              <div className={cn("text-xl font-black tracking-tight leading-none transition-colors", isRepaid ? "text-emerald-500" : "text-rose-500")}>
                Rs.{Math.round(remainingLoan).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[9px] font-bold text-emerald-500 uppercase mb-1">Repaid: Rs.{Math.round(loanPaid).toLocaleString()}</div>
              <div className={cn("w-20 h-1.5 rounded-full overflow-hidden transition-all duration-500", isRepaid ? "bg-emerald-500/30 dark:bg-emerald-500/20" : "bg-slate-100 dark:bg-slate-800")}>
                <div 
                  className={cn("h-full rounded-full transition-all duration-1000", isRepaid ? "bg-emerald-500" : "bg-rose-500")}
                  style={{ width: `${loanProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[450px]">
        {/* Trend Chart */}
        <div className="md:col-span-12 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg tracking-tight">Income vs Expense</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{currentMonth}'s Activity</p>
            </div>
            <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span> Income
              </div>
              <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm"></span> Expense
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a',
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', 
                    fontSize: '12px' 
                  }}
                  itemStyle={{ color: '#f1f5f9' }}
                  formatter={(val: number) => `Rs.${val.toLocaleString()}`}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekly History Row */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
              <HistoryIcon className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">One Week History</h3>
          </div>
          <Link to="/history" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline uppercase tracking-widest">View All Activity</Link>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {weekHistory.map((item) => (
            <div key={item.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                  item.type === 'income' ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-900 dark:group-hover:bg-emerald-600 group-hover:text-white"
                )}>
                  {item.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.category}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{format(new Date(item.date), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className={cn(
                    "text-sm font-bold tracking-tight",
                    item.type === 'income' ? "text-emerald-600" : "text-slate-900 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white"
                  )}>
                    {item.type === 'income' ? '+' : '-'}Rs.{item.amount.toLocaleString()}
                  </span>
                  {item.description && <p className="text-[9px] text-slate-400 font-medium truncate max-w-[120px]">{item.description}</p>}
                </div>
                <button 
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this transaction?')) {
                      await deleteTransaction(item.id);
                    }
                  }}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {weekHistory.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest italic">No transactions this week</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
