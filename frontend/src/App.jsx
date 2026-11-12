import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public pages
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Unauthorized from './pages/error/Unauthorized';
import NotFound from './pages/error/NotFound';

// User pages
import UserDashboard from './pages/user/UserDashboard';
import Onboarding from './pages/user/Onboarding';
import AccountDetails from './pages/user/AccountDetails';
import TransferMoney from './pages/user/TransferMoney';
import TransactionHistory from './pages/user/TransactionHistory';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import OnboardingManagement from './pages/admin/OnboardingManagement';
import AccountManagement from './pages/admin/AccountManagement';
import TransactionMonitoring from './pages/admin/TransactionMonitoring';
import LedgerVerification from './pages/admin/LedgerVerification';
import AuditLogs from './pages/admin/AuditLogs';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* User Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ACCOUNT_HOLDER', 'ADMIN']} />}>
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/accounts" element={<AccountDetails />} />
            <Route path="/transfer" element={<TransferMoney />} />
            <Route path="/transactions" element={<TransactionHistory />} />
          </Route>

          {/* Admin Exclusive Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/onboarding" element={<OnboardingManagement />} />
            <Route path="/admin/accounts" element={<AccountManagement />} />
            <Route path="/admin/transactions" element={<TransactionMonitoring />} />
            <Route path="/admin/ledger" element={<LedgerVerification />} />
            <Route path="/admin/audit-logs" element={<AuditLogs />} />
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
