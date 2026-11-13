import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Shield, User } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)' }}>
          {user?.role === 'ADMIN' ? 'Platform Administration' : 'Secure Account Portal'}
        </h2>
      </div>

      <div className="nav-user-profile">
        <StatusBadge status={user?.role} />

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
            {user?.firstName} {user?.lastName}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</div>
        </div>

        <div className="user-avatar">
          {user?.firstName?.[0] || 'U'}
        </div>

        <button
          type="button"
          onClick={logout}
          className="btn btn-secondary btn-sm"
          aria-label="Log out"
          style={{ padding: '8px 12px' }}
        >
          <LogOut size={16} aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </header>
  );
}
