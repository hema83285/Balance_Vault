import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import { ArrowUpRight, ArrowDownLeft, FileText, ChevronRight, Scale, X } from 'lucide-react';

export default function TransactionHistory() {
  const [transfers, setTransfers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTxLedger, setSelectedTxLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const url = selectedAccountId
        ? `/transfers?accountId=${selectedAccountId}`
        : '/transfers';
      const res = await api.get(url);
      setTransfers(res.data?.transfers || []);
    } catch (err) {
      console.error('Failed to load transfers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserAccounts = async () => {
      try {
        const res = await api.get('/accounts');
        setAccounts(res.data || []);
      } catch (err) {
        console.error('Failed to load user accounts', err);
      }
    };
    fetchUserAccounts();
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [selectedAccountId]);

  const viewLedger = async (txId) => {
    try {
      setLedgerLoading(true);
      const res = await api.get(`/ledger/${txId}`);
      setSelectedTxLedger({ txId, entries: res.data });
    } catch (err) {
      console.error('Failed to load ledger entries', err);
    } finally {
      setLedgerLoading(false);
    }
  };

  const userAccountIds = accounts.map(a => a.id);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>Transaction History</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                Complete verifiable history of fund transfers and settlements.
              </p>
            </div>

            {/* Filter by Account */}
            {accounts.length > 1 && (
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                style={{ width: 'auto', minWidth: 220 }}
              >
                <option value="">All Accounts</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>Account: {a.accountNumber}</option>
                ))}
              </select>
            )}
          </div>

          {/* Table Card */}
          <div className="card">
            {transfers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                No transaction records found.
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Direction</th>
                      <th>Reference ID</th>
                      <th>Sender Account</th>
                      <th>Recipient Account</th>
                      <th>Amount (Paise / INR)</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Ledger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map((tx) => {
                      const isOutgoing = userAccountIds.includes(tx.senderAccountId);
                      const inrFormatted = (Number(tx.amount) / 100).toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR'
                      });

                      return (
                        <tr key={tx.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {isOutgoing ? (
                                <ArrowUpRight size={16} style={{ color: 'var(--danger)' }} />
                              ) : (
                                <ArrowDownLeft size={16} style={{ color: 'var(--success)' }} />
                              )}
                              <span style={{ fontWeight: 600 }}>{isOutgoing ? 'Debit' : 'Credit'}</span>
                            </div>
                          </td>
                          <td className="mono" style={{ fontSize: 12 }}>
                            {tx.id.slice(0, 8)}...
                          </td>
                          <td className="mono" style={{ fontSize: 13 }}>
                            {tx.senderAccount?.accountNumber}
                          </td>
                          <td className="mono" style={{ fontSize: 13 }}>
                            {tx.receiverAccount?.accountNumber}
                          </td>
                          <td style={{ fontWeight: 700, color: isOutgoing ? 'var(--danger)' : 'var(--success)' }}>
                            {isOutgoing ? `-${inrFormatted}` : `+${inrFormatted}`}
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
                              {tx.amount} paise
                            </div>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
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
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px' }}
                            >
                              <Scale size={14} /> Entries
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

          {/* Modal / Panel for Double-Entry Ledger Inspection */}
          {selectedTxLedger && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
              <div className="card" style={{ maxWidth: 640, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="card-header">
                  <div>
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Scale size={18} color="var(--primary)" /> Double-Entry Ledger Breakdown
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
                        <th>Entry Type</th>
                        <th>Amount (Paise)</th>
                        <th>Balance After</th>
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
                  Ledger Principle: Total Debits ({(Number(selectedTxLedger.entries[0]?.amount || 0) / 100).toFixed(2)}) &equiv; Total Credits ({(Number(selectedTxLedger.entries[1]?.amount || 0) / 100).toFixed(2)}).
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
