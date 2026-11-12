# BalanceVault: Secure Account Management & Auditable Money Movement Platform

[![Snovasys Hiring Challenge 2026](https://img.shields.io/badge/Challenge-Snovasys%202026-blue)](https://snovasys.com)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Prisma-indigo)](https://neon.tech)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-teal)](https://vitejs.dev)
[![Ledger](https://img.shields.io/badge/Ledger-Double--Entry%20Verified-emerald)](https://github.com)

**BalanceVault** is an institutional-grade, highly secure financial account management and auditable money movement platform engineered for the **Snovasys Fresher Hiring Challenge 2026**.

The system implements zero-trust role-based access control (RBAC), a verifiable double-entry ledger with integer paise accuracy, atomic transfer settlement protected by pessimistic row-level locking, cryptographic idempotency, and an append-only audit trail.

---

## ⚡ Quick Demo & Evaluation Credentials

For immediate evaluation, the **Sign-In page (`/login`)** features an interactive **1-Click Demo Credentials Card** to auto-populate either profile:

| Persona | Role | Email | Password | Pre-seeded State |
| :--- | :--- | :--- | :--- | :--- |
| **Platform Administrator** | `ADMIN` | `admin@balancevault.internal` | `AdminSecure#2026` | Full system access, audit logs & telemetry |
| **Verified Account Holder** | `ACCOUNT_HOLDER` | `alex.morgan@balancevault.demo` | `UserSecure#2026` | Active Account: `409210010001` (₹50,000 balance) |
| **Secondary Account Holder** | `ACCOUNT_HOLDER` | `sarah.chen@balancevault.demo` | `UserSecure#2026` | Active Account: `409210010002` (₹30,000 balance) |
| **Pending KYC Applicant** | `ACCOUNT_HOLDER` | `david.kim@balancevault.demo` | `UserSecure#2026` | Pending verification for admin approval review |

---

## 🏗️ System Architecture

```text
[ Client (React + Vite) ]
          │ (HTTPS / JSON / JWT)
          ▼
[ Security Perimeter (Helmet, CORS, UUID Request-ID) ]
          │
          ▼
[ Rate Limiter (Redis Sliding-Window / In-Memory Fallback) ]
          │
          ▼
[ JWT Auth & RBAC Authorization Guard ]
          │
          ▼
[ Validation Layer (Zod Schemas) ]
          │
     ┌────┴──────────────────────────────┐
     ▼                                   ▼
[ Transfer & Idempotency Engine ]  [ Onboarding & Account Service ]
     │ (SELECT ... FOR UPDATE)           │
     ▼                                   ▼
[ Double-Entry Ledger Engine ]     [ Append-Only Audit Logger ]
     │                                   │
     └─────────────────┬─────────────────┘
                       ▼
         [ PostgreSQL Database (Neon) ]
```

---

## 🛡️ Core Financial & Security Guarantees

1. **Zero Floating-Point Representation**:
   - Financial balances, transfer amounts, and ledger entries are strictly stored as **64-bit integer paise** ($1\text{ INR} = 100\text{ paise}$).
2. **Pessimistic Row-Level Locking**:
   - Transfers lock sender and receiver accounts using `SELECT ... FOR UPDATE` in deterministic ID order, eliminating race-condition overdrafts and database deadlocks.
3. **Double-Entry Ledger Integrity**:
   - For every transfer of amount $A$, matching entries are atomically created:
     $$\Delta \text{Assets}_{\text{Sender}} = -A \quad (\text{DEBIT})$$
     $$\Delta \text{Assets}_{\text{Receiver}} = +A \quad (\text{CREDIT})$$
   - Automated mathematical verification endpoint: `GET /api/admin/ledger/verify` confirms $\sum \text{Debits} \equiv \sum \text{Credits}$ across the platform.
4. **Network Idempotency**:
   - Every transfer requires an `Idempotency-Key` header. Duplicate or retried requests return the cached result without double-debiting.
5. **Tamper-Evident Audit Logging**:
   - Sensitive operations (login attempts, KYC reviews, account status changes, transfers) write immutable audit logs with request tracing IDs.
   - Passwords, tokens, and PII are redacted before log persistence.

---

## 🚀 Setup & Execution Guide

Follow these exact steps to run the complete platform locally:

### 1. Prerequisites
- **Node.js** v18.0.0 or higher
- **PostgreSQL** (Local instance or free cloud database from [Neon.tech](https://neon.tech))
- **Redis** *(Optional — system automatically activates resilient in-memory fallback if Redis is unavailable)*

---

### 2. Installation Commands

Clone the repository and install dependencies for both backend and frontend:

```bash
# Clone the repository
git clone <your-repository-url>
cd BalanceVault

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to project root
cd ..
```

---

### 3. Environment Configuration

Copy the example configuration files and configure your PostgreSQL database connection:

```bash
# In the backend directory:
cd backend
cp .env.example .env
```

Edit `backend/.env` with your PostgreSQL connection string:
```ini
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Managed PostgreSQL (e.g. Neon.tech connection URL)
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-1.aws.neon.tech/balancevault?sslmode=require"

# Redis Cache (Optional - leave blank for in-memory fallback)
REDIS_URL=""

# JWT Secrets
JWT_SECRET="balancevault_super_secure_jwt_secret_key_2026_snovasys"
JWT_EXPIRES_IN="24h"

# Seed Admin Credentials
SEED_ADMIN_EMAIL="admin@balancevault.internal"
SEED_ADMIN_PASSWORD="AdminSecure#2026"
```

Configure frontend environment:
```bash
cd ../frontend
cp .env.example .env
```

---

### 4. Database Setup & Migrations

Generate the Prisma client and push the relational schema to PostgreSQL:

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Push schema directly to database
npx prisma db push
```

---

### 5. Seed Initial Admin & Demo Accounts

Run the controlled bootstrap seed script to initialize the first Administrator and verified demo account holders:

```bash
# From backend directory:
npm run seed
```

Output confirmation:
```text
✅ Admin seeded: admin@balancevault.internal (Role: ADMIN)
✅ Demo User 1 seeded: Alex Morgan (Account: 409210010001, Balance: ₹50,000)
✅ Demo User 2 seeded: Sarah Chen (Account: 409210010002, Balance: ₹30,000)
✅ Demo User 3 seeded: David Kim (Pending KYC application)
✅ Sample transfer and double-entry ledger created
🎉 BalanceVault Seed Completed Successfully!
```

---

### 6. Starting Backend and Frontend

You can run both concurrently from the root directory or in separate terminals:

#### Option A: Run Both Concurrently (From Root)
```bash
npm run dev
```

#### Option B: Run in Separate Terminals

**Terminal 1 (Backend API Server):**
```bash
cd backend
npm run dev
# Server runs at http://localhost:5000
```

**Terminal 2 (Frontend React Application):**
```bash
cd frontend
npm run dev
# Frontend runs at http://localhost:5173
```

Open your browser at **`http://localhost:5173`**.

---

### 7. Running Automated Test Suite

Execute the comprehensive automated test suite (Authentication, RBAC, Row-Locking Transfers, Double-Entry Ledger, Audit Trail):

```bash
cd backend
npm test
```

---

## 📋 Complete REST API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Level |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new Account Holder | Public (Rate-limited) |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT | Public (Rate-limited) |
| `POST` | `/api/auth/logout` | Terminate session | Authenticated |
| `GET` | `/api/auth/me` | Fetch active user profile & accounts | Authenticated |

### KYC Onboarding (`/api/onboarding`)
| Method | Endpoint | Description | Auth Level |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/onboarding` | Submit identity verification details | `ACCOUNT_HOLDER` |
| `GET` | `/api/onboarding/status` | Check application verification status | `ACCOUNT_HOLDER` |
| `GET` | `/api/admin/onboarding` | List onboarding applications queue | `ADMIN` |
| `PATCH`| `/api/admin/onboarding/:id` | Approve or Reject KYC application | `ADMIN` |

### Account Operations (`/api/accounts`)
| Method | Endpoint | Description | Auth Level |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/accounts` | List accounts (User: own / Admin: all) | Authenticated |
| `GET` | `/api/accounts/:id` | Get account details by ID | Owner or `ADMIN` |
| `PATCH`| `/api/admin/accounts/:id/status` | Suspend or Activate bank account | `ADMIN` |

### Money Movement & Ledger (`/api/transfers`, `/api/ledger`)
| Method | Endpoint | Description | Auth Level |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/transfers` | Execute row-locked atomic transfer | `ACCOUNT_HOLDER` (Active) |
| `GET` | `/api/transfers` | List transaction history | Authenticated |
| `GET` | `/api/transfers/:id` | Get transfer details & ledger proof | Participant or `ADMIN` |
| `GET` | `/api/ledger/:txId` | View double-entry ledger entries | Participant or `ADMIN` |
| `GET` | `/api/admin/ledger/verify`| Run mathematical ledger verification | `ADMIN` |

### Operations & Diagnostics
| Method | Endpoint | Description | Auth Level |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Administrative telemetry & KPIs | `ADMIN` |
| `GET` | `/api/admin/users` | List registered platform users | `ADMIN` |
| `GET` | `/api/admin/audit-logs` | Query append-only audit trail | `ADMIN` |
| `GET` | `/health` | Container liveness probe | Public |
| `GET` | `/ready` | Database & Redis readiness probe | Public |

---

## 🌐 Production Deployment Guide

### Frontend Deployment (Vercel)
1. Link the repository to [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Configure Build Command: `npm run build` and Output Directory: `dist`.
4. Add Environment Variable:
   - `VITE_API_URL`: URL of your deployed Render backend (e.g. `https://balancevault-backend.onrender.com/api`).

### Backend Deployment (Render)
1. Create a new **Web Service** on [Render](https://render.com).
2. Set Root Directory to `backend`.
3. Build Command: `npm install && npx prisma generate`
4. Start Command: `node server.js`
5. Configure Environment Variables in Render:
   - `DATABASE_URL`: Connection string to your managed Neon PostgreSQL instance.
   - `JWT_SECRET`: High-entropy 64-character secret.
   - `FRONTEND_URL`: URL of your deployed Vercel frontend.
   - `NODE_ENV`: `production`

---

## 👨‍💻 Project Submission Details

- **Project**: BalanceVault &mdash; Secure Account Management & Auditable Money Movement Platform
- **Challenge**: Snovasys Fresher Hiring Challenge 2026
- **Architecture**: Modular Monorepo (Node.js Express + React 18 + PostgreSQL + Prisma)
- **Security Features**: Role-Based Access Control, Double-Entry Ledger Invariance, Idempotency, Append-Only Audit Trail.
