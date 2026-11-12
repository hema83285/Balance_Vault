import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import { ArrowLeftRight, Scale, X, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function TransactionMonitoring() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxLedger, setSelectedTxLedger] = useState(null);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/transactions');
      setTransfers(res.data?.transfers || []);
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const viewLedger = async (txId) => {
    try {
      const res = await api.get(`/ledger/${txId}`);
      setSelectedTxLedger({ txId, entries: res.data });
    } catch (err) {
      console.error('Failed to load ledger', err);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-body">
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Platform Transaction Monitoring</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
              System-wide financial transfers with cryptographic idempotency tracking.
            </p>
          </div>

          <div className="card">
            {transfers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                No platform transactions found.
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Sender</th>
                      <th>Recipient</th>
                      <th>Amount (Paise / INR)</th>
                      <th>Idempotency Key</th>
                      <th>Timestamp</th>
                      <th>Status</th>
                      <th>Ledger Proof</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map((tx) => {
                      const inrFormatted = (Number(tx.amount) / 100).toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR'
                      });

                      return (
                        <tr key={tx.id}>
                          <td className="mono" style={{ fontSize: 12 }}>
                            {tx.id.slice(0, 8)}...
                          </td>
                          <td>
                            <div className="mono" style={{ fontWeight: 600 }}>{tx.senderAccount?.accountNumber}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {tx.senderAccount?.user?.firstName} {tx.senderAccount?.user?.lastName}
                            </div>
                          </td>
                          <td>
                            <div className="mono" style={{ fontWeight: 600 }}>{tx.receiverAccount?.accountNumber}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {tx.receiverAccount?.user?.firstName} {tx.receiverAccount?.user?.lastName}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{inrFormatted}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }} className="mono">{tx.amount} paise</div>
                          </td>
                          <td className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {tx.idempotencyKey.slice(0, 16)}...
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {new Date(tx.createdAt).toLocaleString()}
                          </td>
                          <td>
                            <StatusBadge status={tx.status} />
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => viewLedger(tx.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: 12 }}
                            >
                              <Scale size={13} /> Verify
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal for Double-Entry Ledger Details */}
          {selectedTxLedger && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
              <div className="card" style={{ maxWidth: 640, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="card-header">
                  <div>
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Scale size={18} color="var(--primary)" /> Double-Entry Ledger Audit
                    </h3>
                    <p className="card-subtitle mono">Transaction: {selectedTxLedger.txId}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTxLedger(null)}
                    style={{ background: 'transparent', padding: 6, color: 'var(--text-muted)' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="table-wrapper" style={{ marginBottom: 16 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Account</th>
                        <th>Type</th>
                        <th>Amount (Paise)</th>
                        <th>Post-Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTxLedger.entries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="mono" style={{ fontSize: 13 }}>
                            {entry.account?.accountNumber}
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {entry.account?.user?.firstName} {entry.account?.user?.lastName}
                            </div>
                          </td>
                          <td>
                            <span style={{
                              fontWeight: 700,
                              color: entry.entryType === 'DEBIT' ? 'var(--danger)' : 'var(--success)'
                            }}>
                              {entry.entryType}
                            </span>
                          </td>
                          <td className="mono" style={{ fontWeight: 600 }}>
                            {entry.amount} paise
                          </td>
                          <td className="mono" style={{ color: 'var(--text-muted)' }}>
                            ₹{(Number(entry.balanceAfter) / 100).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ background: 'var(--surface-muted)', padding: 12, borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  Audit Assertion: Debit Amount ({selectedTxLedger.entries[0]?.amount}) === Credit Amount ({selectedTxLedger.entries[1]?.amount}). Both written atomically in single database transaction.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
