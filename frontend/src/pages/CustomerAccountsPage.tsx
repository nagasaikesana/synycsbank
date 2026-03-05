import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import type { Account } from "../types";

export default function CustomerAccountsPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const decodedName = decodeURIComponent(name || "");

  useEffect(() => {
    api.get<Account[]>("/api/accounts/")
      .then((res) => {
        setAccounts(res.data.filter((a) => a.holder_name === decodedName));
      })
      .catch((err) => setError(err.message || "Failed to fetch accounts"))
      .finally(() => setLoading(false));
  }, [decodedName]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        Loading accounts...
      </div>
    );
  }
  if (error) return <p className="status error">{error}</p>;

  const initials = decodedName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      <nav className="breadcrumb">
        <Link to="/customers">Customers</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{decodedName}</span>
      </nav>

      <div className="customer-page-header">
        <div className="customer-page-avatar">{initials}</div>
        <div className="customer-page-info">
          <h2>{decodedName}</h2>
          <p>{accounts.length} account{accounts.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="accounts-grid">
        {accounts.map((a) => (
          <div
            key={a.id}
            className="account-card"
            onClick={() => navigate(`/accounts/${a.id}/transactions`)}
          >
            <div className="account-card-row">
              <span className={`badge badge-${a.account_type}`}>
                {a.account_type.toUpperCase()}
              </span>
              <span className="account-card-number">#{a.id}</span>
            </div>
            <div className="account-card-balance">
              ₹{Number(a.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="account-card-footer">
              <span className="account-card-rate">{a.interest_rate}% p.a.</span>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <p className="status">No accounts found for this customer.</p>
      )}
    </div>
  );
}
