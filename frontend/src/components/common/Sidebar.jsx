import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  Wallet,
  ArrowLeftRight,
  ShieldAlert,
  History,
  SendHorizontal,
  Scale
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">BV</div>
        <div className="sidebar-logo-text">BalanceVault</div>
      </div>

      <nav className="sidebar-nav">
        {isAdmin ? (
          <>
            <div style={{ padding: '8px 16px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Administration
            </div>
            <NavLink to="/admin/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              User Management
            </NavLink>
            <NavLink to="/admin/onboarding" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <FileCheck2 size={18} />
              Onboarding (KYC)
            </NavLink>
            <NavLink to="/admin/accounts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Wallet size={18} />
              Account Management
            </NavLink>
            <NavLink to="/admin/transactions" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <ArrowLeftRight size={18} />
              Transactions
            </NavLink>
            <NavLink to="/admin/ledger" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Scale size={18} />
              Ledger Verification
            </NavLink>
            <NavLink to="/admin/audit-logs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <ShieldAlert size={18} />
              Audit Logs
            </NavLink>
          </>
        ) : (
          <>
            <div style={{ padding: '8px 16px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              My Account
            </div>
            <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              Overview
            </NavLink>
            <NavLink to="/onboarding" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <FileCheck2 size={18} />
              KYC Onboarding
            </NavLink>
            <NavLink to="/accounts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Wallet size={18} />
              My Accounts
            </NavLink>
            <NavLink to="/transfer" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <SendHorizontal size={18} />
              Transfer Money
            </NavLink>
            <NavLink to="/transactions" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <History size={18} />
              Transaction History
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: 11, color: '#64748b' }}>
          BalanceVault Core v1.0<br />
          Snovasys Challenge 2026
        </div>
      </div>
    </aside>
  );
}
