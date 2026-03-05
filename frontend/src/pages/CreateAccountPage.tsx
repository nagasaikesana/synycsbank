import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function CreateAccountPage() {
  const navigate = useNavigate();
  const [holderName, setHolderName] = useState("");
  const [accountType, setAccountType] = useState<"savings" | "current">("savings");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/accounts/", {
        holder_name: holderName,
        account_type: accountType,
      });
      navigate("/accounts");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">New Account</h1>
        <p className="page-subtitle">Open a savings or current account</p>
      </div>
      <div className="form-card">
        <form onSubmit={handleSubmit} className="form">
          {error && <div className="form-error">{error}</div>}
          <div className="form-field">
            <label>Account Holder Name</label>
            <input
              type="text"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              required
              maxLength={255}
              placeholder="Enter full name"
            />
          </div>
          <div className="form-field">
            <label>Account Type</label>
            <div className="radio-group">
              <label className={`radio-option ${accountType === "savings" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="accountType"
                  value="savings"
                  checked={accountType === "savings"}
                  onChange={() => setAccountType("savings")}
                />
                <div>
                  <strong>Savings Account</strong>
                  <span className="radio-desc">Interest rate: 6% - 8%</span>
                </div>
              </label>
              <label className={`radio-option ${accountType === "current" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="accountType"
                  value="current"
                  checked={accountType === "current"}
                  onChange={() => setAccountType("current")}
                />
                <div>
                  <strong>Current Account</strong>
                  <span className="radio-desc">Interest rate: 2% - 4%</span>
                </div>
              </label>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !holderName.trim()}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
