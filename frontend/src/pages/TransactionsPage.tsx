import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import type { Account, Transaction } from "../types";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

type FilterType = "all" | "credit" | "debit";

export default function TransactionsPage() {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");

  useEffect(() => {
    Promise.all([
      api.get<Account>(`/api/accounts/${id}`),
      api.get<Transaction[]>(`/api/accounts/${id}/transactions`),
    ])
      .then(([accRes, txnRes]) => {
        setAccount(accRes.data);
        setTransactions(txnRes.data);
      })
      .catch((err) => setError(err.message || "Failed to fetch data"))
      .finally(() => setLoading(false));
  }, [id]);

  const filtered = useMemo(() => {
    let list = transactions;
    if (fromDate) {
      const from = new Date(fromDate);
      list = list.filter((t) => new Date(t.created_at) >= from);
    }
    if (toDate) {
      const to = new Date(toDate + "T23:59:59");
      list = list.filter((t) => new Date(t.created_at) <= to);
    }
    if (filterType !== "all") {
      list = list.filter((t) => t.transaction_type === filterType);
    }
    return list;
  }, [transactions, fromDate, toDate, filterType]);

  // Group by date
  const grouped: Record<string, Transaction[]> = {};
  for (const txn of filtered) {
    const dateKey = new Date(txn.created_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(txn);
  }

  function handleClear() {
    setFromDate("");
    setToDate("");
    setFilterType("all");
  }

  if (loading && !account) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        Loading transactions...
      </div>
    );
  }
  if (error && !account) return <p className="status error">{error}</p>;

  const today = todayStr();

  return (
    <div>
      <nav className="breadcrumb">
        <Link to="/accounts">Accounts</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Account #{account?.id}</span>
      </nav>

      {/* Account Summary Card */}
      <div className="txn-account-header">
        <div className="txn-header-top">
          <h2>Account #{account?.id} &middot; {account?.holder_name}</h2>
          <span className="txn-header-badge">
            {account?.account_type?.toUpperCase()}
          </span>
        </div>
        <div className="txn-header-balance">
          ₹{Number(account?.balance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </div>
        <div className="txn-header-meta">
          Interest Rate: {account?.interest_rate}% p.a.
        </div>
      </div>

      {/* Filter Panel */}
      <div className="filter-panel">
        <div className="filter-panel-title">Filter Transactions</div>
        <div className="filter-grid">
          <div className="filter-field">
            <label>From</label>
            <input
              type="date"
              value={fromDate}
              max={today}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="filter-field">
            <label>To</label>
            <input
              type="date"
              value={toDate}
              max={today}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="filter-field">
            <label>Type</label>
            <div className="type-toggle">
              {(["all", "credit", "debit"] as FilterType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`type-toggle-btn${filterType === t ? " active" : ""}`}
                  onClick={() => setFilterType(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-actions">
            <button className="btn btn-secondary" onClick={handleClear}>Clear</button>
          </div>
        </div>
      </div>

      {error && <p className="status error">{error}</p>}

      {/* Transaction List grouped by day */}
      {Object.entries(grouped).map(([dateLabel, txns]) => (
        <div key={dateLabel} className="txn-day-group">
          <h3 className="txn-day-label">{dateLabel}</h3>
          <div className="txn-list">
            {txns.map((txn) => (
              <div key={txn.id} className="txn-item">
                <div className="txn-left">
                  <span className={`txn-badge ${txn.transaction_type}`}>
                    {txn.transaction_type === "credit" ? "CR" : "DR"}
                  </span>
                  <div className="txn-details">
                    <span className="txn-description">{txn.description || "Transaction"}</span>
                    <span className="txn-meta">
                      {new Date(txn.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {txn.related_account_id && ` · Acc #${txn.related_account_id}`}
                    </span>
                  </div>
                </div>
                <div className="txn-right">
                  <span className={`txn-amount ${txn.transaction_type}`}>
                    {txn.transaction_type === "credit" ? "+" : "-"}₹
                    {Number(txn.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="txn-balance">
                    Bal: ₹{Number(txn.balance_after).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && !loading && (
        <div className="txn-empty">No transactions found.</div>
      )}
    </div>
  );
}
