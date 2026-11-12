import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import { Search, UserCheck, Mail, Phone, Calendar } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const url = search ? `/admin/users?search=${encodeURIComponent(search)}` : '/admin/users';
      const res = await api.get(url);
      setUsers(res.data?.users || []);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>User Management</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                Review registered platform accounts and role assignments.
              </p>
            </div>

            <div style={{ position: 'relative', width: 280 }}>
              <input
                type="text"
                placeholder="Search user name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 38 }}
              />
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="card">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User Details</th>
                    <th>Role</th>
                    <th>KYC Onboarding</th>
                    <th>Accounts & Balance</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                        No users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const totalUserPaise = (u.accounts || []).reduce(
                        (acc, curr) => acc + BigInt(curr.balance),
                        0n
                      );
                      const inrFormatted = (Number(totalUserPaise) / 100).toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR'
                      });

                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ fontWeight: 700 }}>
                              {u.firstName} {u.lastName}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                            {u.phone && <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{u.phone}</div>}
                          </td>
                          <td>
                            <StatusBadge status={u.role} />
                          </td>
                          <td>
                            <StatusBadge status={u.onboarding?.status || 'NOT_SUBMITTED'} />
                          </td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{inrFormatted}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {u.accounts?.length || 0} Account(s)
                              {u.accounts?.[0] && ` (${u.accounts[0].accountNumber})`}
                            </div>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {new Date(u.createdAt).toLocaleDateString()}
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
