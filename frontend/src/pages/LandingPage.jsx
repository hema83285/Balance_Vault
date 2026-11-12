import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Scale, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b132b', color: '#f8fafc' }}>
      {/* Navigation */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #06b6d4, #4338ca)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
            BV
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>BalanceVault</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/login" className="btn btn-secondary" style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
            Sign In
          </Link>
          <Link to="/register" className="btn btn-primary">
            Open Account <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: 1100, margin: '80px auto 60px', textAlign: 'center', padding: '0 24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(6,182,212,0.1)', color: '#38bdf8', padding: '6px 14px', borderRadius: 9999, fontSize: 13, fontWeight: 600, marginBottom: 24, border: '1px solid rgba(6,182,212,0.2)' }}>
          <Shield size={14} /> Snovasys Fresher Hiring Challenge 2026 Reference Implementation
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.15, marginBottom: 24, background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Secure Account Management & Auditable Money Movement
        </h1>
        <p style={{ fontSize: 20, color: '#94a3b8', maxWidth: 780, margin: '0 auto 40px', lineHeight: 1.6 }}>
          An institutional-grade financial core platform featuring atomic double-entry ledger settlement, mathematical consistency proofs, strict role-based access control, and complete audit logging.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <Link to="/login" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>
            Launch Platform Portal
          </Link>
          <Link to="/register" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: 16, background: '#1c2541', color: '#fff', borderColor: 'rgba(255,255,255,0.1)' }}>
            Register as Account Holder
          </Link>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section style={{ maxWidth: 1200, margin: '60px auto 100px', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          <div style={{ background: '#1c2541', padding: 32, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(79, 70, 229, 0.2)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Lock size={24} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>RBAC & Least Privilege</h3>
            <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>
              Backend-enforced permission checking. Strict separation between Administrator oversight and Account Holder operations with zero client-trust assumption.
            </p>
          </div>

          <div style={{ background: '#1c2541', padding: 32, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(13, 148, 136, 0.2)', color: '#2dd4bf', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Scale size={24} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Verifiable Double-Entry Ledger</h3>
            <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>
              Zero floating-point arithmetic. Stored in 64-bit integer paise with row-level locks and automated mathematical proof verification: &sum; Debits &equiv; &sum; Credits.
            </p>
          </div>

          <div style={{ background: '#1c2541', padding: 32, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Zap size={24} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Idempotent Transfers</h3>
            <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>
              Every transfer requires a unique idempotency key. Concurrent duplicates are gracefully intercepted and cached, preventing double debits under network retries.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '32px 48px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
        BalanceVault Platform &bull; Built with React, Node.js Express, PostgreSQL, Prisma, and Redis &bull; Snovasys 2026
      </footer>
    </div>
  );
}
