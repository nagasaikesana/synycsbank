import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import type { Account } from "../types";

interface CustomerSummary {
  name: string;
  accountCount: number;
  totalBalance: number;
}

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Account[]>("/api/accounts/")
      .then((res) => {
        const map = new Map<string, { count: number; total: number }>();
        for (const acc of res.data) {
          const existing = map.get(acc.holder_name) || { count: 0, total: 0 };
          existing.count += 1;
          existing.total += Number(acc.balance);
          map.set(acc.holder_name, existing);
        }
        const list: CustomerSummary[] = [];
        map.forEach((val, name) => {
          list.push({ name, accountCount: val.count, totalBalance: val.total });
        });
        list.sort((a, b) => a.name.localeCompare(b.name));
        setCustomers(list);
      })
      .catch((err) => setError(err.message || "Failed to fetch customers"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        Loading customers...
      </div>
    );
  }
  if (error) return <p className="status error">{error}</p>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <p className="page-subtitle">{customers.length} account holders</p>
      </div>

      <div className="customers-grid">
        {customers.map((c) => (
          <div
            key={c.name}
            className="customer-card"
            onClick={() => navigate(`/customers/${encodeURIComponent(c.name)}`)}
          >
            <div className="customer-avatar">
              {c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="customer-info">
              <div className="customer-name">{c.name}</div>
              <div className="customer-meta">
                {c.accountCount} account{c.accountCount !== 1 ? "s" : ""} &middot; ₹{c.totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <span className="customer-arrow">&rsaquo;</span>
          </div>
        ))}
      </div>

      {customers.length === 0 && (
        <p className="status">No customers found.</p>
      )}
    </div>
  );
}
