const express = require('express');
const router = express.Router();
const TransferController = require('../controllers/transfer.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const { transferRateLimiter } = require('../middleware/rateLimiter.middleware');
const ROLES = require('../constants/roles');
const { transferSchema } = require('../validations/schemas');

router.post(
  '/',
  authenticate,
  authorize(ROLES.ACCOUNT_HOLDER),
  transferRateLimiter,
  validate(transferSchema),
  TransferController.transfer
);

router.get('/', authenticate, TransferController.getTransfers);
router.get('/:id', authenticate, TransferController.getTransferById);

module.exports = router;
