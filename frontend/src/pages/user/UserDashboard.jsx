import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { Wallet, SendHorizontal, ArrowUpRight, ArrowDownLeft, FileText, AlertCircle, CheckCircle } from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accRes, txRes, onbRes] = await Promise.all([
          api.get('/accounts'),
          api.get('/transfers?limit=5'),
          api.get('/onboarding/status')
        ]);
        setAccounts(accRes.data || []);
        setRecentTransfers(txRes.data?.transfers || []);
        setOnboarding(onbRes.data);
      } catch (err) {
        console.error('Failed to load user dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const primaryAccount = accounts[0];
  const totalBalancePaise = accounts.reduce((acc, curr) => acc + BigInt(curr.balance), 0n);
  const totalBalanceInr = (Number(totalBalancePaise) / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR'
  });

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-body">
          {/* Welcome Greeting */}
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>
                Welcome back, {user?.firstName}!
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                Manage your accounts and track financial movements in real time.
              </p>
            </div>
            {primaryAccount?.status === 'ACTIVE' && (
              <Link to="/transfer" className="btn btn-primary">
                <SendHorizontal size={16} /> Transfer Funds
              </Link>
            )}
          </div>

          {/* Onboarding Notice if Pending or Rejected */}
          {onboarding?.status === 'PENDING' && (
            <div className="alert alert-info">
              <AlertCircle size={20} />
              <div>
                <strong>KYC Application Under Review:</strong> Your identity documents are currently being evaluated by our compliance team. Once approved, your account will be activated.
              </div>
            </div>
          )}

          {onboarding?.status === 'REJECTED' && (
            <div className="alert alert-danger">
              <AlertCircle size={20} />
              <div>
                <strong>KYC Application Rejected:</strong> {onboarding.rejectionReason || 'Please resubmit your verification details.'}{' '}
                <Link to="/onboarding" style={{ textDecoration: 'underline', fontWeight: 600 }}>Update Application</Link>
              </div>
            </div>
          )}

          {(!onboarding || onboarding.status === 'NOT_SUBMITTED') && (
            <div className="alert alert-info">
              <AlertCircle size={20} />
              <div>
                <strong>KYC Required:</strong> Please complete your onboarding verification to open your BalanceVault account.{' '}
                <Link to="/onboarding" className="btn btn-sm btn-primary" style={{ marginLeft: 12 }}>Start KYC</Link>
              </div>
            </div>
          )}

          {/* KPI Stat Grid */}
          <div className="stat-grid">
            <StatCard
              label="Total Available Balance"
              value={totalBalanceInr}
              icon={Wallet}
              color="indigo"
            />
            <StatCard
              label="Primary Account Number"
              value={primaryAccount ? primaryAccount.accountNumber : 'Pending KYC'}
              icon={FileText}
              color="teal"
            />
            <StatCard
              label="Account Status"
              value={<StatusBadge status={primaryAccount ? primaryAccount.status : 'PENDING'} />}
              icon={CheckCircle}
              color="green"
            />
          </div>

          {/* Recent Transactions Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Recent Transactions</h3>
                <p className="card-subtitle">Last 5 transfer operations</p>
              </div>
              <Link to="/transactions" className="btn btn-secondary btn-sm">
                View All
              </Link>
            </div>

            {recentTransfers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                No transaction records found yet.
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Account</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransfers.map((tx) => {
                      const isOutgoing = tx.senderAccountId === primaryAccount?.id;
                      const formattedAmount = (Number(tx.amount) / 100).toLocaleString('en-IN', {
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
                          <td>{tx.description || 'Transfer'}</td>
                          <td className="mono" style={{ fontSize: 13 }}>
                            {isOutgoing ? `To: ${tx.receiverAccount?.accountNumber}` : `From: ${tx.senderAccount?.accountNumber}`}
                          </td>
                          <td style={{ fontWeight: 700, color: isOutgoing ? 'var(--danger)' : 'var(--success)' }}>
                            {isOutgoing ? `-${formattedAmount}` : `+${formattedAmount}`}
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <StatusBadge status={tx.status} />
                          </td>
                        </tr>
                      );
                    })}
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
