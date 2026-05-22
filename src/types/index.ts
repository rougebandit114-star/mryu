export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  description?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  amount: number;
  month: string;
  year: number;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  country?: string;
  updatedAt: string;
}

export const INCOME_CATEGORIES = ['Salary', 'From Bank', 'Personal Use', 'Loan'];
export const EXPENSE_CATEGORIES = ['Food', 'Groceries', 'Personal Use', 'Travel', 'Loan Repayment'];
