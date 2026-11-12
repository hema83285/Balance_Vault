const express = require('express');
const router = express.Router();
const LedgerController = require('../controllers/ledger.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const ROLES = require('../constants/roles');

router.get('/:transactionId', authenticate, LedgerController.getEntriesByTransaction);

module.exports = router;
