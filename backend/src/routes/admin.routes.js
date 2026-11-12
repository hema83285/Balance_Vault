const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const OnboardingController = require('../controllers/onboarding.controller');
const AccountController = require('../controllers/account.controller');
const TransferController = require('../controllers/transfer.controller');
const LedgerController = require('../controllers/ledger.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const ROLES = require('../constants/roles');
const { accountStatusSchema, reviewOnboardingSchema } = require('../validations/schemas');

// Protect all admin routes with authentication and ADMIN role check
router.use(authenticate, authorize(ROLES.ADMIN));

// Admin Dashboard Telemetry
router.get('/dashboard', AdminController.getDashboard);

// User Management
router.get('/users', AdminController.getUsers);

// Onboarding Review Workflow
router.get('/onboarding', OnboardingController.listAdminOnboardings);
router.patch('/onboarding/:id', validate(reviewOnboardingSchema), OnboardingController.reviewAdminOnboarding);

// Account Status Management
router.patch('/accounts/:id/status', validate(accountStatusSchema), AccountController.updateAccountStatus);

// Transaction Monitoring
router.get('/transactions', TransferController.getTransfers);

// Ledger Integrity Verification
router.get('/ledger/verify', LedgerController.verifyLedger);

// Immutable Audit Logs
router.get('/audit-logs', AdminController.getAuditLogs);

module.exports = router;
