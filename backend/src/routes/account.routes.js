const express = require('express');
const router = express.Router();
const AccountController = require('../controllers/account.controller');
const authenticate = require('../middleware/auth.middleware');

router.get('/', authenticate, AccountController.getAccounts);
router.get('/:id', authenticate, AccountController.getAccountById);

module.exports = router;
