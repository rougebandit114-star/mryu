import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ArrowUpRight, ArrowDownRight, History as HistoryIcon, BarChart3, List, Trash2, Download } from 'lucide-react';
import { format, startOfYear, endOfYear, eachMonthOfInterval, isSameMonth } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ReferenceLine } from 'recharts';
import { type Transaction } from '../types';
import { useAuth } from '../components/FirebaseAuthProvider';
import { subscribeToTransactions, deleteTransaction } from '../lib/db';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function History() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'records' | 'analytics'>('records');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToTransactions(user.id, (data) => {
      setTransactions(data as Transaction[]);
    });
    return () => unsub();
  }, [user]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    transactions.forEach(t => {
      years.add(new Date(t.date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (t.description?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFilter = filterType === 'all' || t.type === filterType;
      
      let matchesDate = true;
      const itemDateStr = t.date.substring(0, 10); // Standardize to YYYY-MM-DD
      if (startDate) {
        matchesDate = matchesDate && itemDateStr >= startDate;
      }
      if (endDate) {
        matchesDate = matchesDate && itemDateStr <= endDate;
      }
      
      return matchesSearch && matchesFilter && matchesDate;
    });
  }, [transactions, searchTerm, filterType, startDate, endDate]);

  const handleDownloadCSV = () => {
    const headers = ['ID', 'Date', 'Category', 'Type', 'Amount (Rs)', 'Description'];
    const rows = filtered.map(t => [
      t.id,
      format(new Date(t.date), 'yyyy-MM-dd HH:mm:ss'),
      t.category,
      t.type,
      t.amount,
      t.description || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const filename = `spendwise_history_${startDate || 'all'}_to_${endDate || 'all'}.csv`;
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const yearlyData = useMemo(() => {
    const start = startOfYear(new Date(selectedYear, 0, 1));
    const end = endOfYear(new Date(selectedYear, 11, 31));
    const months = eachMonthOfInterval({ start, end });

    return months.map(month => {
      const monthTransactions = transactions.filter(t => isSameMonth(new Date(t.date), month));
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        name: format(month, 'MMM'),
        income,
        expense,
      };
    });
  }, [transactions]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Finances & Analytics</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manage and visualize your budget</p>
        </div>

        <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl border border-white dark:border-slate-800 shadow-sm self-start">
          <button
            onClick={() => setActiveTab('records')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'records' 
                ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600/50" 
                : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            <List className="w-3.5 h-3.5" />
            Records
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'analytics' 
                ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600/50" 
                : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics
          </button>
        </div>
      </div>

      {activeTab === 'records' ? (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-2 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search description..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-bold text-xs text-slate-700 dark:text-slate-200"
                />
              </div>
              <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
                {(['all', 'income', 'expense'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={cn(
                      "px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                      filterType === type 
                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                        : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Filters & Download Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">From</span>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                    id="date-filter-start"
                  />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">To</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                    id="date-filter-end"
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    Clear Dates
                  </button>
                )}
              </div>

              <button
                onClick={handleDownloadCSV}
                disabled={filtered.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
                id="download-history-btn"
                title="Download history as CSV matching current filters"
              >
                <Download className="w-4 h-4" />
                <span>Export ({filtered.length})</span>
              </button>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {filtered.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                      item.type === 'income' ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-emerald-900 dark:group-hover:bg-emerald-600 group-hover:text-white"
                    )}>
                      {item.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.category}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                        <span>{format(new Date(item.date), 'MMM dd, yyyy')}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <span>{item.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={cn(
                        "font-bold text-base tracking-tight",
                        item.type === 'income' ? "text-emerald-600" : "text-slate-900 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white"
                      )}>
                        {item.type === 'income' ? '+' : '-'}Rs.{item.amount.toLocaleString()}
                      </div>
                      {item.description && <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{item.description}</p>}
                    </div>
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this transaction?')) {
                          await deleteTransaction(item.id);
                        }
                      }}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="py-24 flex flex-col items-center justify-center text-slate-300">
                  <HistoryIcon className="w-16 h-16 mb-4 opacity-10" />
                  <p className="text-[10px] font-bold uppercase tracking-widest italic">No matching entries found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Yearly Overview {selectedYear}</h2>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Income vs Expenses Analysis</p>
              </div>
              <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-100 dark:border-slate-700 overflow-x-auto no-scrollbar">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      selectedYear === year 
                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600/50" 
                        : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F033" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    interval={0}
                    tick={{ fontSize: 9, fontWeight: 800, fill: '#94A3B8' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 800, fill: '#94A3B8' }} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(16, 185, 129, 0.05)', radius: 8 }}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'white',
                      padding: '10px'
                    }}
                    labelStyle={{ fontWeight: 800, fontSize: '9px', textTransform: 'uppercase', color: '#64748B', marginBottom: '4px' }}
                    itemStyle={{ fontWeight: 700, fontSize: '11px', padding: '1px 0' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle"
                    formatter={(value) => <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mr-2">{value}</span>}
                    wrapperStyle={{ paddingTop: '0', paddingBottom: '20px' }}
                  />
                  <Bar 
                    dataKey="income" 
                    name="Income" 
                    fill="#10B981" 
                    radius={[4, 4, 0, 0]} 
                    barSize={12}
                  />
                  <Bar 
                    dataKey="expense" 
                    name="Expense" 
                    fill="#F43F5E" 
                    radius={[4, 4, 0, 0]} 
                    barSize={12}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-6 rounded-[24px] border border-emerald-100 dark:border-emerald-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <h3 className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Income ({selectedYear})</h3>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                Rs.{yearlyData.reduce((sum, d) => sum + d.income, 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-rose-500/5 dark:bg-rose-500/10 p-6 rounded-[24px] border border-rose-100 dark:border-rose-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <h3 className="text-[9px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Expenses ({selectedYear})</h3>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                Rs.{yearlyData.reduce((sum, d) => sum + d.expense, 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
