import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from './FirebaseAuthProvider';
import { useTransactionModal } from './ModalProvider';
import { addTransaction } from '../lib/db';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, type TransactionType } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function AddTransactionModal() {
  const { user } = useAuth();
  const { isAddModalOpen, closeAddModal } = useTransactionModal();
  
  const [newTx, setNewTx] = useState({
    type: 'expense' as TransactionType,
    category: EXPENSE_CATEGORIES[0],
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: ''
  });

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await addTransaction({
      userId: user.id,
      type: newTx.type,
      category: newTx.category,
      amount: parseFloat(newTx.amount),
      date: newTx.date,
      description: newTx.description
    });

    closeAddModal();
    setNewTx({
      type: 'expense',
      category: EXPENSE_CATEGORIES[0],
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: ''
    });
  };

  if (!isAddModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm backdrop-filter" onClick={closeAddModal} />
      <div className="relative bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Add Transaction</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">New financial entry</p>
          </div>
          <button onClick={closeAddModal} className="text-slate-300 hover:text-slate-900 transition-colors p-2 bg-slate-50 rounded-full">
            <Plus className="w-5 h-5 rotate-45" />
          </button>
        </div>

        <form onSubmit={handleAddTransaction} className="space-y-6">
          <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100">
            {(['income', 'expense'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setNewTx({ ...newTx, type, category: type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0] });
                }}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                  newTx.type === type 
                    ? "bg-white text-emerald-600 shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
              <select 
                value={newTx.category}
                onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 font-bold text-xs text-slate-800"
              >
                {(newTx.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Amount (Rs.)</label>
              <input 
                type="number"
                required
                value={newTx.amount}
                onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 font-extrabold text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date</label>
            <input 
              type="date"
              required
              value={newTx.date}
              onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 font-bold text-xs text-slate-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Description (Optional)</label>
            <textarea 
              value={newTx.description}
              onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
              placeholder="Record details..."
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 font-medium text-xs text-slate-800 resize-none"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-100 active:scale-[0.98] uppercase tracking-widest text-[11px]"
          >
            Confirm Transaction
          </button>
        </form>
      </div>
    </div>
  );
}
