import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import { Scale, CheckCircle2, AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';

export default function LedgerVerification() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const runVerification = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/ledger/verify');
      setReport(res.data);
    } catch (err) {
      console.error('Failed to run ledger verification', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runVerification();
  }, []);

  const summary = report?.summary || {};
  const isHealthy = report?.status === 'HEALTHY';

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>Ledger Integrity Verification</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                Automated mathematical proof validating platform-wide conservation of funds.
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={runVerification}
              className="btn btn-primary"
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              {loading ? 'Verifying Ledger...' : 'Run Live Audit'}
            </button>
          </div>

          {/* Health Banner */}
          {report && (
            <div
              className="card"
              style={{
                marginBottom: 24,
                borderLeft: `6px solid ${isHealthy ? 'var(--success)' : 'var(--danger)'}`,
                background: isHealthy ? 'var(--success-bg)' : 'var(--danger-bg)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {isHealthy ? (
                  <CheckCircle2 size={40} style={{ color: 'var(--success)', flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={40} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                )}
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: isHealthy ? '#065f46' : '#991b1b' }}>
                    Ledger Status: {report.status}
                  </h2>
                  <p style={{ fontSize: 14, color: isHealthy ? '#047857' : '#b91c1c', marginTop: 4 }}>
                    {isHealthy
                      ? 'Every completed transaction contains mathematically balanced, tamper-evident double-entry records. Total system debits equal total system credits.'
                      : 'Mathematical discrepancies detected in the ledger history. Immediate administrative audit required.'}
                  </p>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    Verified at: {new Date(report.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mathematical Audit Assertions Grid */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Transactions Audited</span>
                <span className="stat-value">{summary.totalTransactionsAudited || 0}</span>
              </div>
              <div className="stat-icon indigo">
                <Scale size={24} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Total Platform Debits</span>
                <span className="stat-value mono">
                  ₹{(Number(summary.totalDebitsPaise || 0) / 100).toFixed(2)}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{summary.totalDebitsPaise || 0} paise</span>
              </div>
              <div className="stat-icon teal">
                <ShieldCheck size={24} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Total Platform Credits</span>
                <span className="stat-value mono">
                  ₹{(Number(summary.totalCreditsPaise || 0) / 100).toFixed(2)}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{summary.totalCreditsPaise || 0} paise</span>
              </div>
              <div className="stat-icon green">
                <ShieldCheck size={24} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Net System Variance</span>
                <span className="stat-value mono" style={{ color: summary.netDifferencePaise === '0' ? 'var(--success)' : 'var(--danger)' }}>
                  {summary.netDifferencePaise || 0} paise
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Must be exactly 0 paise</span>
              </div>
              <div className="stat-icon green">
                <CheckCircle2 size={24} />
              </div>
            </div>
          </div>

          {/* Discrepancies Table */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>Discrepancy Log</h3>
            {(!report?.discrepancies || report.discrepancies.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={32} style={{ color: 'var(--success)', margin: '0 auto 8px' }} />
                <div>Zero discrepancies detected. Financial ledger is sound and consistent.</div>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Violation Type</th>
                      <th>Transaction Reference</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.discrepancies.map((d, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{d.type}</td>
                        <td className="mono">{d.transactionId || 'SYSTEM'}</td>
                        <td>{d.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
