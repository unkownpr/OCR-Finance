export type InvoiceType = 'income' | 'expense';

export interface Invoice {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: InvoiceType;
  category: string;
  date: string;
  image_url: string | null;
  ocr_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
}

export interface CategoryStat {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

