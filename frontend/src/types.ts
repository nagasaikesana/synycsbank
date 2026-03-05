export interface Account {
  id: number;
  holder_name: string;
  account_type: "savings" | "current";
  balance: string;
  interest_rate: string;
}

export interface Transaction {
  id: number;
  account_id: number;
  transaction_type: "credit" | "debit";
  amount: string;
  balance_after: string;
  description: string | null;
  related_account_id: number | null;
  created_at: string;
}
