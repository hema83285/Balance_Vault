import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import { ShieldCheck, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function Onboarding() {
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    panNumber: '',
    aadharNumber: '',
    dateOfBirth: '',
    address: '',
    annualIncome: '',
    employmentStatus: 'Salaried Professional'
  });

  const fetchStatus = async () => {
    try {
      const res = await api.get('/onboarding/status');
      setOnboarding(res.data);
      if (res.data && res.data.panNumber) {
        setFormData({
          panNumber: res.data.panNumber || '',
          aadharNumber: res.data.aadharNumber || '',
          dateOfBirth: res.data.dateOfBirth ? res.data.dateOfBirth.split('T')[0] : '',
          address: res.data.address || '',
          annualIncome: res.data.annualIncome ? res.data.annualIncome.toString() : '',
          employmentStatus: res.data.employmentStatus || 'Salaried Professional'
        });
      }
    } catch (err) {
      console.error('Failed to fetch onboarding status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await api.post('/onboarding', formData);
      setSuccess('Your KYC onboarding application has been submitted successfully and is under review.');
      await fetchStatus();
    } catch (err) {
      setError(err.message || 'Failed to submit onboarding details.');
    } finally {
      setSubmitting(false);
    }
  };

  const isApproved = onboarding?.status === 'APPROVED';
  const isPending = onboarding?.status === 'PENDING';

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-body">
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800 }}>Identity Verification (KYC)</h1>
                {onboarding?.status && <StatusBadge status={onboarding.status} />}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                BalanceVault requires regulatory identity verification prior to activating financial accounts.
              </p>
            </div>

            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <CheckCircle2 size={18} />
                <span>{success}</span>
              </div>
            )}

            {isApproved && (
              <div className="card" style={{ textAlign: 'center', padding: '40px 24px', marginBottom: 24 }}>
                <CheckCircle2 size={48} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>
                  Identity Verified & Approved
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 440, margin: '0 auto 20px' }}>
                  Your KYC verification has been reviewed and approved by compliance administrators. Your financial account is fully active.
                </p>
                <div style={{ display: 'inline-block', background: 'var(--surface-muted)', padding: '12px 24px', borderRadius: 8, textAlign: 'left' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Verified PAN: <span className="mono" style={{ fontWeight: 600, color: 'var(--text-main)' }}>{formData.panNumber}</span></div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Reviewed on: {onboarding.reviewedAt ? new Date(onboarding.reviewedAt).toLocaleDateString() : 'N/A'}</div>
                </div>
              </div>
            )}

            {isPending && (
              <div className="card" style={{ textAlign: 'center', padding: '40px 24px', marginBottom: 24 }}>
                <Clock size={48} style={{ color: 'var(--warning)', margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>
                  Application Under Review
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 460, margin: '0 auto' }}>
                  Your application submitted on {new Date(onboarding.createdAt).toLocaleDateString()} is in the compliance review queue. Admins can approve or request changes via the administrative portal.
                </p>
              </div>
            )}

            {!isApproved && !isPending && (
              <div className="card">
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">PAN Card Number</label>
                      <input
                        type="text"
                        name="panNumber"
                        required
                        placeholder="ABCDE1234F"
                        value={formData.panNumber}
                        onChange={handleChange}
                        className="mono"
                        maxLength={10}
                      />
                      <span className="form-hint">Format: 5 letters, 4 digits, 1 letter</span>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Aadhar Number</label>
                      <input
                        type="text"
                        name="aadharNumber"
                        required
                        placeholder="12-digit number"
                        value={formData.aadharNumber}
                        onChange={handleChange}
                        className="mono"
                        maxLength={12}
                      />
                      <span className="form-hint">Format: 12 numeric digits</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        required
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Annual Income (INR)</label>
                      <input
                        type="number"
                        name="annualIncome"
                        required
                        placeholder="e.g. 1000000"
                        value={formData.annualIncome}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Employment Status</label>
                    <select
                      name="employmentStatus"
                      value={formData.employmentStatus}
                      onChange={handleChange}
                    >
                      <option value="Salaried Professional">Salaried Professional</option>
                      <option value="Self Employed / Business">Self Employed / Business</option>
                      <option value="Software Engineer">Software Engineer</option>
                      <option value="Consultant">Consultant</option>
                      <option value="Student">Student</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Residential Address</label>
                    <textarea
                      name="address"
                      rows={3}
                      required
                      placeholder="Flat/House number, Building name, Street, City, State, PIN"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px' }}
                  >
                    {submitting ? 'Submitting Application...' : 'Submit Verification Details'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
