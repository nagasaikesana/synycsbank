import { Routes, Route, Navigate, NavLink } from "react-router-dom";
import AccountListPage from "./pages/AccountListPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerAccountsPage from "./pages/CustomerAccountsPage";
import CreateAccountPage from "./pages/CreateAccountPage";
import DepositPage from "./pages/DepositPage";
import WithdrawPage from "./pages/WithdrawPage";
import TransferPage from "./pages/TransferPage";
import TransactionsPage from "./pages/TransactionsPage";

function App() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>
            <img src="/synycs-symbol.png" alt="SYNYCS" className="brand-logo" />
            <span className="brand-text">
              <span className="brand-name">SYNYCS</span>
              <span className="brand-sub">BANK</span>
            </span>
          </h1>
        </div>
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Overview</span>
          <NavLink to="/accounts" end className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
            <span className="sidebar-link-icon">&#9638;</span>
            Accounts
          </NavLink>
          <NavLink to="/customers" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
            <span className="sidebar-link-icon">&#9775;</span>
            Customers
          </NavLink>

          <span className="sidebar-section-label">Operations</span>
          <NavLink to="/create-account" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
            <span className="sidebar-link-icon">&#10010;</span>
            New Account
          </NavLink>
          <NavLink to="/deposit" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
            <span className="sidebar-link-icon">&#8600;</span>
            Deposit
          </NavLink>
          <NavLink to="/withdraw" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
            <span className="sidebar-link-icon">&#8599;</span>
            Withdraw
          </NavLink>
          <NavLink to="/transfer" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
            <span className="sidebar-link-icon">&#8644;</span>
            Transfer
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-address">
            <strong>SYNYCS Group</strong>
            <span>71-75 Shelton Street, London</span>
            <span>Greater London, WC2H 9JQ, UK</span>
            <span>hello@synycs.com</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/accounts" replace />} />
          <Route path="/accounts" element={<AccountListPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:name" element={<CustomerAccountsPage />} />
          <Route path="/create-account" element={<CreateAccountPage />} />
          <Route path="/deposit" element={<DepositPage />} />
          <Route path="/withdraw" element={<WithdrawPage />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/accounts/:id/transactions" element={<TransactionsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
