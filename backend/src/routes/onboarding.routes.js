const express = require('express');
const router = express.Router();
const OnboardingController = require('../controllers/onboarding.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const ROLES = require('../constants/roles');
const { onboardingSchema, reviewOnboardingSchema } = require('../validations/schemas');

// User routes
router.post(
  '/',
  authenticate,
  authorize(ROLES.ACCOUNT_HOLDER),
  validate(onboardingSchema),
  OnboardingController.submit
);

router.get(
  '/status',
  authenticate,
  authorize(ROLES.ACCOUNT_HOLDER),
  OnboardingController.getStatus
);

module.exports = router;
