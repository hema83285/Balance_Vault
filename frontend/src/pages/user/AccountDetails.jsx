import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import { Wallet, ShieldCheck, Copy, Check, Info } from 'lucide-react';

export default function AccountDetails() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await api.get('/accounts');
        setAccounts(res.data || []);
      } catch (err) {
        console.error('Failed to load accounts', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-body">
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Account Portfolio</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
              Detailed ledger profile and balance breakdown for your active accounts.
            </p>
          </div>

          {accounts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Wallet size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
              <h3>No Bank Accounts Available</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
                Complete your identity onboarding verification to receive an active account.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
              {accounts.map((acc) => {
                const balanceInr = (Number(acc.balance) / 100).toLocaleString('en-IN', {
                  style: 'currency',
                  currency: 'INR'
                });

                return (
                  <div key={acc.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Primary Savings & Settlement
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                          <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>
                            {acc.accountNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(acc.accountNumber, acc.id)}
                            style={{ background: 'transparent', padding: 4, color: 'var(--text-muted)' }}
                            title="Copy Account Number"
                          >
                            {copiedId === acc.id ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                      <StatusBadge status={acc.status} />
                    </div>

                    <div style={{ background: 'var(--surface-muted)', padding: 18, borderRadius: 12, marginBottom: 20 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>AVAILABLE BALANCE</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
                        {balanceInr}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        Exact: <span className="mono">{acc.balance} paise</span> &bull; Currency: {acc.currency}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Account Holder ID:</span>
                        <span className="mono">{acc.userId.slice(0, 8)}...</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Opened On:</span>
                        <span>{new Date(acc.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Double-Entry Protection:</span>
                        <span style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ShieldCheck size={14} /> Active
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
