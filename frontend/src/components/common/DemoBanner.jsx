import React from 'react';
import { ShieldCheck, UserCheck, Key } from 'lucide-react';

export default function DemoBanner({ onSelectCredentials }) {
  const adminCreds = {
    email: 'admin@balancevault.internal',
    password: 'AdminSecure#2026'
  };

  const userCreds = {
    email: 'alex.morgan@balancevault.demo',
    password: 'UserSecure#2026'
  };

  return (
    <div className="demo-banner">
      <div className="demo-banner-title">
        <Key size={16} /> Evaluation Demo Credentials
      </div>
      <div className="demo-credential-box">
        <div className="demo-role-card">
          <div>
            <div className="demo-role-header">
              <ShieldCheck size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
              Admin Access
            </div>
            <div className="demo-role-detail">
              Email: {adminCreds.email}<br />
              Pass: {adminCreds.password}
            </div>
          </div>
          <button
            type="button"
            className="btn-fill-demo"
            onClick={() => onSelectCredentials(adminCreds.email, adminCreds.password)}
          >
            Auto-fill Admin
          </button>
        </div>

        <div className="demo-role-card">
          <div>
            <div className="demo-role-header">
              <UserCheck size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
              Account Holder
            </div>
            <div className="demo-role-detail">
              Email: {userCreds.email}<br />
              Pass: {userCreds.password}
            </div>
          </div>
          <button
            type="button"
            className="btn-fill-demo"
            onClick={() => onSelectCredentials(userCreds.email, userCreds.password)}
          >
            Auto-fill User
          </button>
        </div>
      </div>
    </div>
  );
}
