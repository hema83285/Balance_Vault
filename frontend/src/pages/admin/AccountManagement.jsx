import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import { Wallet, ShieldAlert, ShieldCheck, Search } from 'lucide-react';

export default function AccountManagement() {
  const [accounts, setAccounts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      let query = [];
      if (statusFilter) query.push(`status=${statusFilter}`);
      if (search) query.push(`search=${encodeURIComponent(search)}`);
      const qs = query.length > 0 ? `?${query.join('&')}` : '';

      const res = await api.get(`/accounts${qs}`);
      setAccounts(res.data?.accounts || []);
    } catch (err) {
      console.error('Failed to load accounts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [statusFilter, search]);

  const toggleStatus = async (accountId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirm = window.confirm(`Are you sure you want to change account status to ${nextStatus}?`);
    if (!confirm) return;

    try {
      setActionLoadingId(accountId);
      await api.patch(`/admin/accounts/${accountId}/status`, { status: nextStatus });
      await fetchAccounts();
    } catch (err) {
      alert(err.message || 'Failed to update account status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>Account Management</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                Supervise all provisioned bank accounts and manage operational states.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="PENDING">PENDING</option>
              </select>

              <input
                type="text"
                placeholder="Search account or user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 220 }}
              />
            </div>
          </div>

          <div className="card">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Account Number</th>
                    <th>Account Holder</th>
                    <th>Balance (INR)</th>
                    <th>Exact Balance (Paise)</th>
                    <th>Status</th>
                    <th>Opened</th>
                    <th>Administrative Action</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                        No accounts match the criteria.
                      </td>
                    </tr>
                  ) : (
                    accounts.map((acc) => {
                      const inrFormatted = (Number(acc.balance) / 100).toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR'
                      });

                      return (
                        <tr key={acc.id}>
                          <td className="mono" style={{ fontWeight: 700, fontSize: 14 }}>
                            {acc.accountNumber}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>
                              {acc.user?.firstName} {acc.user?.lastName}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {acc.user?.email}
                            </div>
                          </td>
                          <td style={{ fontWeight: 800, fontSize: 15 }}>
                            {inrFormatted}
                          </td>
                          <td className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {acc.balance}
                          </td>
                          <td>
                            <StatusBadge status={acc.status} />
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {new Date(acc.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <button
                              type="button"
                              disabled={actionLoadingId === acc.id}
                              onClick={() => toggleStatus(acc.id, acc.status)}
                              className={`btn btn-sm ${acc.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}`}
                            >
                              {acc.status === 'ACTIVE' ? (
                                <>
                                  <ShieldAlert size={14} /> Suspend Account
                                </>
                              ) : (
                                <>
                                  <ShieldCheck size={14} /> Activate Account
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
