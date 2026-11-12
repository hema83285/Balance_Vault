const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const ENV = require('../src/config/env');

// Allow BigInt serialization
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting BalanceVault database bootstrap & seed process...');

  const passwordHashAdmin = await bcrypt.hash(ENV.SEED_ADMIN_PASSWORD, 12);
  const passwordHashUser = await bcrypt.hash('UserSecure#2026', 12);

  // 1. Seed or Upsert Admin User
  const admin = await prisma.user.upsert({
    where: { email: ENV.SEED_ADMIN_EMAIL.toLowerCase() },
    update: {
      role: 'ADMIN',
      passwordHash: passwordHashAdmin
    },
    create: {
      email: ENV.SEED_ADMIN_EMAIL.toLowerCase(),
      passwordHash: passwordHashAdmin,
      role: 'ADMIN',
      firstName: ENV.SEED_ADMIN_FIRSTNAME,
      lastName: ENV.SEED_ADMIN_LASTNAME,
      phone: '+91 9876543210'
    }
  });
  console.log(`✅ Admin seeded: ${admin.email} (Role: ${admin.role})`);

  // 2. Seed Demo User 1: Alex Morgan (Active with Bank Account)
  const userAlex = await prisma.user.upsert({
    where: { email: 'alex.morgan@balancevault.demo' },
    update: {},
    create: {
      email: 'alex.morgan@balancevault.demo',
      passwordHash: passwordHashUser,
      role: 'ACCOUNT_HOLDER',
      firstName: 'Alex',
      lastName: 'Morgan',
      phone: '+91 9811223344'
    }
  });

  // Approved Onboarding for Alex
  await prisma.onboarding.upsert({
    where: { userId: userAlex.id },
    update: {},
    create: {
      userId: userAlex.id,
      panNumber: 'ABCDE1234F',
      aadharNumber: '112233445566',
      dateOfBirth: new Date('1994-05-15'),
      address: '742 Evergreen Terrace, Sector 4, Bangalore',
      annualIncome: 1200000,
      employmentStatus: 'Salaried Professional',
      status: 'APPROVED',
      reviewedBy: admin.id,
      reviewedAt: new Date()
    }
  });

  // Account for Alex (₹50,000 = 5,000,000 paise)
  const alexAccount = await prisma.account.upsert({
    where: { accountNumber: '409210010001' },
    update: {},
    create: {
      userId: userAlex.id,
      accountNumber: '409210010001',
      balance: 5000000n,
      status: 'ACTIVE',
      currency: 'INR'
    }
  });
  console.log(`✅ Demo User 1 seeded: Alex Morgan (Account: ${alexAccount.accountNumber}, Balance: ₹50,000)`);

  // 3. Seed Demo User 2: Sarah Chen (Active with Bank Account)
  const userSarah = await prisma.user.upsert({
    where: { email: 'sarah.chen@balancevault.demo' },
    update: {},
    create: {
      email: 'sarah.chen@balancevault.demo',
      passwordHash: passwordHashUser,
      role: 'ACCOUNT_HOLDER',
      firstName: 'Sarah',
      lastName: 'Chen',
      phone: '+91 9822334455'
    }
  });

  // Approved Onboarding for Sarah
  await prisma.onboarding.upsert({
    where: { userId: userSarah.id },
    update: {},
    create: {
      userId: userSarah.id,
      panNumber: 'FGHIJ5678K',
      aadharNumber: '223344556677',
      dateOfBirth: new Date('1996-08-22'),
      address: '108 Cyber Gateway, Hitech City, Hyderabad',
      annualIncome: 1500000,
      employmentStatus: 'Software Engineer',
      status: 'APPROVED',
      reviewedBy: admin.id,
      reviewedAt: new Date()
    }
  });

  // Account for Sarah (₹30,000 = 3,000,000 paise)
  const sarahAccount = await prisma.account.upsert({
    where: { accountNumber: '409210010002' },
    update: {},
    create: {
      userId: userSarah.id,
      accountNumber: '409210010002',
      balance: 3000000n,
      status: 'ACTIVE',
      currency: 'INR'
    }
  });
  console.log(`✅ Demo User 2 seeded: Sarah Chen (Account: ${sarahAccount.accountNumber}, Balance: ₹30,000)`);

  // 4. Seed Demo User 3: David Kim (Pending KYC Onboarding for Admin Review demo)
  const userDavid = await prisma.user.upsert({
    where: { email: 'david.kim@balancevault.demo' },
    update: {},
    create: {
      email: 'david.kim@balancevault.demo',
      passwordHash: passwordHashUser,
      role: 'ACCOUNT_HOLDER',
      firstName: 'David',
      lastName: 'Kim',
      phone: '+91 9833445566'
    }
  });

  await prisma.onboarding.upsert({
    where: { userId: userDavid.id },
    update: {},
    create: {
      userId: userDavid.id,
      panNumber: 'KLMNO9012P',
      aadharNumber: '334455667788',
      dateOfBirth: new Date('1998-11-03'),
      address: '42 Marine Drive, Nariman Point, Mumbai',
      annualIncome: 950000,
      employmentStatus: 'Consultant',
      status: 'PENDING'
    }
  });
  console.log(`✅ Demo User 3 seeded: David Kim (Pending KYC application for admin testing)`);

  // 5. Seed a Sample Completed Transfer with Matching Double-Entry Ledger
  const sampleTransferKey = 'seed-sample-transfer-0001';
  let sampleTx = await prisma.transaction.findUnique({
    where: { idempotencyKey: sampleTransferKey }
  });

  if (!sampleTx) {
    const transferAmountPaise = 500000n; // ₹5,000
    sampleTx = await prisma.transaction.create({
      data: {
        idempotencyKey: sampleTransferKey,
        senderAccountId: alexAccount.id,
        receiverAccountId: sarahAccount.id,
        amount: transferAmountPaise,
        status: 'COMPLETED',
        description: 'Monthly office rent share'
      }
    });

    // Debit entry for Alex
    await prisma.ledgerEntry.create({
      data: {
        transactionId: sampleTx.id,
        accountId: alexAccount.id,
        entryType: 'DEBIT',
        amount: transferAmountPaise,
        balanceAfter: 5000000n
      }
    });

    // Credit entry for Sarah
    await prisma.ledgerEntry.create({
      data: {
        transactionId: sampleTx.id,
        accountId: sarahAccount.id,
        entryType: 'CREDIT',
        amount: transferAmountPaise,
        balanceAfter: 3000000n
      }
    });

    console.log(`✅ Sample transfer and double-entry ledger created (₹5,000 from Alex to Sarah)`);
  }

  // 6. Seed Initial Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: admin.id,
        action: 'SYSTEM_BOOTSTRAP',
        targetResource: 'System',
        outcome: 'SUCCESS',
        metadata: { version: '1.0.0', env: 'development' }
      },
      {
        actorId: userAlex.id,
        action: 'USER_REGISTER',
        targetResource: 'User',
        targetResourceId: userAlex.id,
        outcome: 'SUCCESS'
      },
      {
        actorId: admin.id,
        action: 'ONBOARDING_APPROVE',
        targetResource: 'Onboarding',
        outcome: 'SUCCESS',
        metadata: { approvedFor: userAlex.email }
      }
    ]
  });

  console.log(`✅ Audit records initialized.`);
  console.log('========================================================');
  console.log('🎉 BalanceVault Seed Completed Successfully!');
  console.log('🔑 ADMIN DEMO CREDENTIALS:');
  console.log(`   Email:    ${ENV.SEED_ADMIN_EMAIL}`);
  console.log(`   Password: ${ENV.SEED_ADMIN_PASSWORD}`);
  console.log('👤 USER DEMO CREDENTIALS:');
  console.log(`   Email:    alex.morgan@balancevault.demo`);
  console.log(`   Password: UserSecure#2026`);
  console.log('========================================================');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
