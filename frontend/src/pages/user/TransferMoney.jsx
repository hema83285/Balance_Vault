import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import { SendHorizontal, ShieldCheck, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function TransferMoney() {
  const [accounts, setAccounts] = useState([]);
  const [senderAccountId, setSenderAccountId] = useState('');
  const [receiverAccountNumber, setReceiverAccountNumber] = useState('');
  const [amountInr, setAmountInr] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await api.get('/accounts');
        const activeAccounts = (res.data || []).filter(a => a.status === 'ACTIVE');
        setAccounts(activeAccounts);
        if (activeAccounts.length > 0) {
          setSenderAccountId(activeAccounts[0].id);
        }
      } catch (err) {
        console.error('Failed to load accounts', err);
      }
    };
    fetchAccounts();
  }, []);

  const selectedSender = accounts.find(a => a.id === senderAccountId);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessResult(null);

    const numericAmount = parseFloat(amountInr);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid transfer amount greater than ₹0.');
      return;
    }

    const amountPaise = Math.round(numericAmount * 100).toString();

    if (selectedSender && BigInt(selectedSender.balance) < BigInt(amountPaise)) {
      setError(`Insufficient balance. Your available balance is ${(Number(selectedSender.balance) / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}.`);
      return;
    }

    if (selectedSender && selectedSender.accountNumber === receiverAccountNumber.trim()) {
      setError('Transfers to the same account are prohibited.');
      return;
    }

    setLoading(true);

    // Generate unique client idempotency key for this transfer attempt
    const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const res = await api.post(
        '/transfers',
        {
          senderAccountId,
          receiverAccountNumber: receiverAccountNumber.trim(),
          amountPaise,
          description: description.trim() || 'Electronic Fund Transfer'
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey
          }
        }
      );

      setSuccessResult(res.data);
      // Reset form
      setReceiverAccountNumber('');
      setAmountInr('');
      setDescription('');

      // Refresh accounts to reflect updated balance
      const updatedAccounts = await api.get('/accounts');
      setAccounts((updatedAccounts.data || []).filter(a => a.status === 'ACTIVE'));
    } catch (err) {
      setError(err.message || 'Transfer failed. Transaction rolled back safely.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-body">
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>Move Money Securely</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                Instant atomic settlement backed by double-entry ledger verification.
              </p>
            </div>

            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {successResult && (
              <div className="alert alert-success" style={{ display: 'block', padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <CheckCircle2 size={20} color="var(--success)" />
                  <strong style={{ fontSize: 16 }}>Transfer Completed Successfully!</strong>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                  Transaction Reference: <span className="mono" style={{ fontWeight: 600 }}>{successResult.transaction?.id}</span><br />
                  Settled to Account: <span className="mono" style={{ fontWeight: 600 }}>{successResult.receiverAccountNumber}</span><br />
                  Updated Sender Balance: <span className="mono" style={{ fontWeight: 700 }}>₹{(Number(successResult.newBalance) / 100).toFixed(2)}</span>
                </div>
              </div>
            )}

            {accounts.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
                <AlertCircle size={40} style={{ color: 'var(--warning)', margin: '0 auto 12px' }} />
                <h3>No Active Accounts Eligible for Transfers</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
                  You must have an approved KYC status and an ACTIVE bank account to send transfers.
                </p>
              </div>
            ) : (
              <div className="card" style={{ padding: 32 }}>
                <form onSubmit={handleTransfer}>
                  <div className="form-group">
                    <label className="form-label">Debit From Account</label>
                    <select
                      value={senderAccountId}
                      onChange={(e) => setSenderAccountId(e.target.value)}
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountNumber} &mdash; Available: ₹{(Number(acc.balance) / 100).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Recipient Account Number (12 Digits)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 409210010002"
                      value={receiverAccountNumber}
                      onChange={(e) => setReceiverAccountNumber(e.target.value)}
                      className="mono"
                      maxLength={12}
                    />
                    <span className="form-hint">Tip: Use demo account 409210010002 to test transfer to Sarah Chen</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Transfer Amount (INR)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: 10, fontWeight: 700, color: 'var(--text-muted)' }}>₹</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="500.00"
                        value={amountInr}
                        onChange={(e) => setAmountInr(e.target.value)}
                        style={{ paddingLeft: 32 }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Description / Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. Rent share, Consulting invoice"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div style={{ background: 'var(--surface-muted)', padding: 14, borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                    <ShieldCheck size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: -3, color: 'var(--primary)' }} />
                    This transaction executes with <strong>pessimistic row-level locks</strong> and creates matching debit and credit entries in the tamper-evident ledger.
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: 15 }}
                  >
                    {loading ? 'Executing Atomic Transfer...' : 'Authorize & Transfer Funds'} <ArrowRight size={16} />
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
