import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import { CheckCircle2, XCircle, AlertCircle, FileCheck2 } from 'lucide-react';

export default function OnboardingManagement() {
  const [onboardings, setOnboardings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState('');

  const fetchOnboardings = async () => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `/admin/onboarding?status=${statusFilter}`
        : '/admin/onboarding';
      const res = await api.get(url);
      setOnboardings(res.data?.onboardings || []);
    } catch (err) {
      console.error('Failed to load onboardings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboardings();
  }, [statusFilter]);

  const handleReview = async (id, newStatus) => {
    let rejectionReason = null;
    if (newStatus === 'REJECTED') {
      rejectionReason = window.prompt('Please enter the reason for rejecting this application:');
      if (!rejectionReason) return;
    }

    try {
      setActionLoadingId(id);
      await api.patch(`/admin/onboarding/${id}`, {
        status: newStatus,
        rejectionReason: rejectionReason || undefined
      });
      setMessage(`Application ${newStatus === 'APPROVED' ? 'approved and bank account provisioned' : 'rejected'}.`);
      await fetchOnboardings();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update review status.');
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
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>Onboarding & Compliance Queue</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                Review and approve KYC identity applications for new account holders.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {['PENDING', 'APPROVED', 'REJECTED', ''].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === '' ? 'All Applications' : s}
                </button>
              ))}
            </div>
          </div>

          {message && (
            <div className="alert alert-success">
              <CheckCircle2 size={18} />
              <span>{message}</span>
            </div>
          )}

          <div className="card">
            {onboardings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                <FileCheck2 size={40} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
                <h3>No Applications in this Queue</h3>
                <p style={{ fontSize: 13, marginTop: 4 }}>Try changing the status filter above.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>PAN & Aadhar</th>
                      <th>DOB & Income</th>
                      <th>Address</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {onboardings.map((app) => (
                      <tr key={app.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>
                            {app.user?.firstName} {app.user?.lastName}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.user?.email}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
                            Applied: {new Date(app.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="mono" style={{ fontSize: 13 }}>
                          <div>PAN: <strong>{app.panNumber}</strong></div>
                          <div>Aadhar: {app.aadharNumber}</div>
                        </td>
                        <td style={{ fontSize: 13 }}>
                          <div>DOB: {new Date(app.dateOfBirth).toLocaleDateString()}</div>
                          <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                            ₹{Number(app.annualIncome).toLocaleString('en-IN')}/yr
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{app.employmentStatus}</div>
                        </td>
                        <td style={{ fontSize: 12, maxWidth: 200, color: 'var(--text-muted)' }}>
                          {app.address}
                        </td>
                        <td>
                          <StatusBadge status={app.status} />
                          {app.rejectionReason && (
                            <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>
                              Reason: {app.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td>
                          {app.status === 'PENDING' ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                disabled={actionLoadingId === app.id}
                                className="btn btn-success btn-sm"
                                onClick={() => handleReview(app.id, 'APPROVED')}
                                title="Approve & Provision Account"
                              >
                                <CheckCircle2 size={14} /> Approve
                              </button>
                              <button
                                type="button"
                                disabled={actionLoadingId === app.id}
                                className="btn btn-danger btn-sm"
                                onClick={() => handleReview(app.id, 'REJECTED')}
                                title="Reject Application"
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              Reviewed
                            </span>
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
