import { useState, useEffect } from "react";
import api from "../services/api";
import type { Account } from "../types";

export default function TransferPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
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
    if (fromAccountId === toAccountId) {
      setError("Cannot transfer to the same account");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/api/accounts/${fromAccountId}/transfer`, {
        to_account_id: parseInt(toAccountId),
        amount: parseFloat(amount),
        description: description || undefined,
      });
      setSuccess(
        `Transferred ₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })} from account #${fromAccountId} to account #${toAccountId}`
      );
      setAmount("");
      setDescription("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Transfer failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Transfer Money</h1>
        <p className="page-subtitle">Move funds between accounts</p>
      </div>
      <div className="form-card">
        <form onSubmit={handleSubmit} className="form">
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}
          <div className="form-field">
            <label>From Account</label>
            <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} required>
              <option value="">-- Choose source account --</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  #{a.id} - {a.holder_name} ({a.account_type}) - ₹{Number(a.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>To Account</label>
            <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} required>
              <option value="">-- Choose destination account --</option>
              {accounts.filter((a) => String(a.id) !== fromAccountId).map((a) => (
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
              placeholder="e.g. Rent payment"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !fromAccountId || !toAccountId || !amount}>
            {loading ? "Processing..." : "Transfer"}
          </button>
        </form>
      </div>
    </div>
  );
}
