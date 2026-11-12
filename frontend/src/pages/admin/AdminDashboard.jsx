import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { Users, Wallet, FileCheck2, ArrowLeftRight, ShieldCheck, Scale, AlertTriangle, ArrowUpRight } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load admin dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const kpis = data?.kpis || {};
  const volumeInr = kpis.totalVolumePaise
    ? (Number(kpis.totalVolumePaise) / 100).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR'
      })
    : '₹0.00';

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-body">
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>Platform Administration</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                Real-time operational telemetry, compliance queues, and ledger health.
              </p>
            </div>
            <Link to="/admin/ledger" className="btn btn-primary btn-sm">
              <Scale size={16} /> Run Ledger Verification
            </Link>
          </div>

          {/* KPI Stat Grid */}
          <div className="stat-grid">
            <StatCard
              label="Registered Users"
              value={kpis.totalUsers || 0}
              icon={Users}
              color="indigo"
            />
            <StatCard
              label="Active Accounts"
              value={kpis.activeAccounts || 0}
              icon={Wallet}
              color="teal"
            />
            <StatCard
              label="Pending KYC Requests"
              value={kpis.pendingOnboardings || 0}
              icon={FileCheck2}
              color={kpis.pendingOnboardings > 0 ? 'warning' : 'green'}
            />
            <StatCard
              label="Total Transfer Volume"
              value={volumeInr}
              icon={ArrowLeftRight}
              color="green"
            />
          </div>

          {/* Operational Sections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            {/* Recent Transactions */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Recent Money Movements</h3>
                  <p className="card-subtitle">Latest platform transfers</p>
                </div>
                <Link to="/admin/transactions" className="btn btn-secondary btn-sm">
                  View All
                </Link>
              </div>

              {(!data?.recentTransactions || data.recentTransactions.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                  No transactions recorded.
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Sender</th>
                        <th>Receiver</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="mono" style={{ fontSize: 12 }}>
                            {tx.senderAccount?.accountNumber}
                          </td>
                          <td className="mono" style={{ fontSize: 12 }}>
                            {tx.receiverAccount?.accountNumber}
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            ₹{(Number(tx.amount) / 100).toFixed(2)}
                          </td>
                          <td>
                            <StatusBadge status={tx.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Audit Events */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Security & Audit Stream</h3>
                  <p className="card-subtitle">Immutable event log</p>
                </div>
                <Link to="/admin/audit-logs" className="btn btn-secondary btn-sm">
                  Full Audit Log
                </Link>
              </div>

              {(!data?.recentAuditLogs || data.recentAuditLogs.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                  No audit records found.
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Actor</th>
                        <th>Outcome</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentAuditLogs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontWeight: 600, fontSize: 13 }}>
                            {log.action}
                          </td>
                          <td style={{ fontSize: 12 }}>
                            {log.actor?.email || 'SYSTEM'}
                          </td>
                          <td>
                            <StatusBadge status={log.outcome} />
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
