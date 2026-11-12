import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import { ShieldAlert, Search, Filter } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [actionFilter, setActionFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = [];
      if (actionFilter) query.push(`action=${encodeURIComponent(actionFilter)}`);
      if (outcomeFilter) query.push(`outcome=${outcomeFilter}`);
      const qs = query.length > 0 ? `?${query.join('&')}` : '';

      const res = await api.get(`/admin/audit-logs${qs}`);
      setLogs(res.data?.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, outcomeFilter]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>System Audit Trail</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                Tamper-evident, append-only record of all administrative, authentication, and transaction events.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Filter by action (e.g. USER_LOGIN)..."
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                style={{ width: 220 }}
              />

              <select
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="">All Outcomes</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILURE">FAILURE</option>
              </select>
            </div>
          </div>

          <div className="card">
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                No audit log records found matching the criteria.
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Event Action</th>
                      <th>Actor</th>
                      <th>Target Resource</th>
                      <th>Outcome</th>
                      <th>Request ID</th>
                      <th>Metadata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>
                          {log.action}
                        </td>
                        <td>
                          {log.actor ? (
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>
                                {log.actor.firstName} {log.actor.lastName}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {log.actor.email} ({log.actor.role})
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-light)' }}>SYSTEM / ANONYMOUS</span>
                          )}
                        </td>
                        <td style={{ fontSize: 13 }}>
                          <strong>{log.targetResource}</strong>
                          {log.targetResourceId && (
                            <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              ID: {log.targetResourceId.slice(0, 8)}...
                            </div>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={log.outcome} />
                        </td>
                        <td className="mono" style={{ fontSize: 11, color: 'var(--text-light)' }}>
                          {log.requestId ? log.requestId.slice(0, 8) + '...' : 'N/A'}
                        </td>
                        <td style={{ fontSize: 11, maxWidth: 220 }}>
                          {log.metadata ? (
                            <pre style={{ margin: 0, fontSize: 11, background: '#f8fafc', padding: '4px 6px', borderRadius: 4, overflowX: 'auto' }}>
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          ) : (
                            <span style={{ color: 'var(--text-light)' }}>-</span>
                          )}
                        </td>
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
