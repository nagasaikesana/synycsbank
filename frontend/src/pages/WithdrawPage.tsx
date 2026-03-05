import { useState, useEffect } from "react";
import api from "../services/api";
import type { Account } from "../types";

export default function WithdrawPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    api.get<Account[]>("/api/accounts/").then((res) => setAccounts(res.data));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post(`/api/accounts/${accountId}/withdraw`, {
        amount: parseFloat(amount),
        description: description || undefined,
      });
      setSuccess(
        `Withdrew ₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}. New balance: ₹${Number(res.data.balance_after).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      );
      setAmount("");
      setDescription("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Withdraw Money</h1>
        <p className="page-subtitle">Debit funds from an account</p>
      </div>
      <div className="form-card">
        <form onSubmit={handleSubmit} className="form">
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}
          <div className="form-field">
            <label>Select Account</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
              <option value="">-- Choose account --</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  #{a.id} - {a.holder_name} ({a.account_type}) - ₹{Number(a.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0.01"
              step="0.01"
              placeholder="Enter amount"
            />
          </div>
          <div className="form-field">
            <label>Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. ATM withdrawal"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !accountId || !amount}>
            {loading ? "Processing..." : "Withdraw"}
          </button>
        </form>
      </div>
    </div>
  );
}
