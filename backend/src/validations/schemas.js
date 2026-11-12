const { z } = require('zod');
const { ACCOUNT_STATUS, ONBOARDING_STATUS } = require('../constants/statuses');

const registerSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required')
});

const onboardingSchema = z.object({
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format. Must be 5 letters, 4 numbers, 1 letter (e.g. ABCDE1234F)'),
  aadharNumber: z
    .string()
    .regex(/^[0-9]{12}$/, 'Invalid Aadhar format. Must be exactly 12 digits'),
  dateOfBirth: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid date format'
  }),
  address: z.string().min(5, 'Address must be at least 5 characters long'),
  annualIncome: z.union([z.number(), z.string().regex(/^\d+$/)]).transform(Number),
  employmentStatus: z.string().min(2, 'Employment status is required')
});

const transferSchema = z.object({
  senderAccountId: z.string().uuid('Invalid sender account ID'),
  receiverAccountNumber: z.string().min(8, 'Invalid receiver account number'),
  amountPaise: z.union([z.string().regex(/^\d+$/), z.number()]).transform(v => v.toString()),
  description: z.string().max(255).optional()
});

const accountStatusSchema = z.object({
  status: z.enum([ACCOUNT_STATUS.ACTIVE, ACCOUNT_STATUS.SUSPENDED])
});

const reviewOnboardingSchema = z.object({
  status: z.enum([ONBOARDING_STATUS.APPROVED, ONBOARDING_STATUS.REJECTED]),
  rejectionReason: z.string().optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  onboardingSchema,
  transferSchema,
  accountStatusSchema,
  reviewOnboardingSchema
};
