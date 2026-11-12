export interface User {
  id: number;
  name: string;
  email: string;
  currency: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Transaction {
  id: number;
  user_id: number;
  name: string;
  amount: number | string;
  type: "income" | "expense";
  category: string;
  transaction_date: string;
  payment_method: string;
  notes?: string;
  created_at: string;
}

export interface TransactionListResponse {
  items: Transaction[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
  summary: {
    total_income: number | string;
    total_expense: number | string;
    net: number | string;
  };
}

export interface Budget {
  id: number;
  user_id: number;
  category: string;
  amount: number | string;
  month: number;
  year: number;
  spent: number | string;
  remaining: number | string;
  percentage: number;
}

export interface SavingsGoal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number | string;
  current_amount: number | string;
  target_date: string;
  description?: string;
  created_at: string;
  progress_percentage: number;
  remaining_amount: number | string;
}

export interface RecurringPayment {
  id: number;
  user_id: number;
  name: string;
  amount: number | string;
  frequency: "monthly" | "weekly" | "quarterly" | "yearly";
  next_payment_date: string;
  category: string;
  status: "active" | "paused";
  created_at: string;
}

export interface RecurringListResponse {
  items: RecurringPayment[];
  estimated_monthly_expenditure: number | string;
  active_count: number;
  total_count: number;
}

export interface FinancialSummary {
  total_balance: number | string;
  monthly_income: number | string;
  monthly_expenses: number | string;
  monthly_savings: number | string;
  savings_rate: number;
  income_change_pct: number | null;
  expense_change_pct: number | null;
}

export interface SpendingTrendPoint {
  date: string;
  income: number | string;
  expenses: number | string;
}

export interface FinancialInsight {
  id: string;
  text: string;
  type: "info" | "positive" | "warning";
}

export interface OverviewData {
  summary: FinancialSummary;
  trends: SpendingTrendPoint[];
  recent_transactions: Transaction[];
  budgets: Budget[];
  insights: FinancialInsight[];
  selected_period: {
    month: number;
    year: number;
  };
}

export interface CategorySpending {
  category: string;
  amount: number | string;
  percentage: number;
  transaction_count: number;
}

export interface MonthlyHistoryItem {
  month: string;
  income: number | string;
  expenses: number | string;
  savings: number | string;
}

export interface DeepAnalyticsData {
  range: string;
  start_date: string;
  end_date: string;
  total_income: number | string;
  total_expense: number | string;
  net_savings: number | string;
  savings_rate: number;
  avg_daily_expense: number | string;
  category_spending: CategorySpending[];
  monthly_history: MonthlyHistoryItem[];
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
  note?: string | null;
}

export interface PriceCheckResponse {
  platform: string;
  product_name: string;
  current_price: number | string;
  all_time_low: number | string;
  all_time_high: number | string;
  average_price: number | string;
  discount_from_high: number;
  history_points: PriceHistoryPoint[];
  timing_verdict: "BUY_NOW" | "WAIT" | "FAIR";
  timing_title: string;
  timing_advice: string;
  affordability_verdict: "SAFE" | "CAUTION" | "DANGER";
  affordability_advice: string;
  hours_of_work: number;
  work_time_formatted: string;
  hourly_rate: number | string;
  current_balance: number | string;
  upcoming_bills: number | string;
  daily_budget_after: number | string;
  days_remaining: number;
}



