import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import type { Account } from "../types";

export default function AccountListPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Account[]>("/api/accounts/")
      .then((res) => setAccounts(res.data))
      .catch((err) => setError(err.message || "Failed to fetch accounts"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        Loading accounts...
      </div>
    );
  }
  if (error) return <p className="status error">{error}</p>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Accounts Overview</h1>
        <p className="page-subtitle">{accounts.length} accounts across all customers</p>
      </div>

      <div className="table-card">
        <table className="accounts-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Holder Name</th>
              <th>Account Type</th>
              <th>Balance</th>
              <th>Interest Rate</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} onClick={() => navigate(`/accounts/${a.id}/transactions`)}>
                <td><span className="table-id">#{a.id}</span></td>
                <td><span className="table-holder-name">{a.holder_name}</span></td>
                <td>
                  <span className={`badge badge-${a.account_type}`}>
                    {a.account_type.toUpperCase()}
                  </span>
                </td>
                <td>
                  <span className="table-balance">
                    ₹{Number(a.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td><span className="table-rate">{a.interest_rate}% p.a.</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {accounts.length === 0 && (
        <p className="status">No accounts yet. Create one to get started.</p>
      )}
    </div>
  );
}
