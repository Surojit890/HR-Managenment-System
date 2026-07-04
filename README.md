# HRMS – Human Resource Management System

Hackathon project. Monorepo with a **Next.js** frontend and a **NestJS** backend.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 + React 19 + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui |
| State / Forms | TanStack Query v5 + React Hook Form + Zod |
| Backend | NestJS + TypeScript |
| Auth | JWT + bcrypt + Email Verification (nodemailer) |
| Authorization | RBAC – Admin / HR / Employee |
| Database | PostgreSQL + Prisma ORM |
| Mail | Mailpit (dev SMTP catcher, web UI on port 8025) |
| Deployment | Docker Compose (PostgreSQL + Mailpit + Backend + Frontend) |

## Project Structure

```
Odoo-Hackathon/
├── docker-compose.yml            # PostgreSQL + Mailpit + backend + frontend
├── frontend/                     # Next.js App Router
│   ├── app/
│   │   ├── (auth)/               # login, signup (restricted), verify
│   │   └── (dashboard)/
│   │       ├── admin/            # dashboard, employees, attendance, leave, payroll
│   │       └── employee/         # profile, attendance, leave, payroll
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── leave/
│   │   └── payroll/
│   ├── lib/
│   │   ├── api/                  # axios client + per-module API functions
│   │   └── hooks/                # TanStack Query hooks
│   ├── types/                    # shared TypeScript types
│   └── middleware.ts             # JWT-based route protection
│
└── backend/                      # NestJS REST API
    ├── src/
    │   ├── auth/                 # register, login, verify, resend-verification
    │   ├── users/                # user CRUD, verification helpers
    │   ├── profiles/             # employee profile get/update
    │   ├── attendance/           # check-in, check-out, list
    │   ├── leave/                # create, list, approve/reject + attachment
    │   ├── payroll/              # named components (basic, hra, pf, tax, etc.)
    │   ├── mail/                 # nodemailer service (HTML email templates)
    │   ├── common/               # guards, decorators
    │   └── prisma/               # PrismaService (global)
    └── prisma/
        ├── schema.prisma         # PostgreSQL schema
        └── seed.ts               # fresh dummy data (7 users, attendance, leaves, payroll)

```

## Features

### Admin
- Dashboard with stat cards (employee count, pending/approved leaves, checked-in today), department overview with progress bars, payroll summary, recent employees, quick links, and employee directory grid with status dots
- Employee management: searchable directory table, add employee dialog (sends verification email), view employee details dialog
- Leave approvals: filter by status & employee, approve/reject with comments
- Payroll management: per-employee Earnings (basic, HRA, other allowances) and Deductions (PF, tax, other deductions) with live net salary calculation
- Attendance overview: all employees' check-in/check-out records

### Employee
- Profile: tabbed layout — Resume (editable), Private Info, Salary Info (admin/HR only), Security (bank/PAN/UAN/IFSC)
- Time Off: leave balance cards (Casual/Sick/Earned/Unpaid with progress bars), month calendar view with color-coded leave statuses, attachment file upload in request form, leave history table with attachment column
- Attendance: check-in/check-out with today's status
- Payroll: earnings/deductions breakdown cards + granular history table

### Auth & Security
- JWT-based authentication with bcrypt password hashing
- Email verification flow: admin creates user → verification email sent → user clicks link → account activated
- Login blocked for unverified users with inline "Resend verification email" link
- Self-registration disabled (admin-only user creation)
- Route protection via Next.js middleware + backend JWT guard
- Employee leave requests scoped to own data only (admin sees all)

## Getting Started

### Option A – Docker (Recommended)

```bash
# From the repo root
docker compose up --build -d
```

This starts four containers:

| Container | Port | Purpose |
|---|---|---|
| `hrms_db` | 5434 | PostgreSQL 16 |
| `hrms_mail` | 8025 (web), 1025 (SMTP) | Mailpit — dev email catcher |
| `hrms_backend` | 3001 | NestJS API |
| `hrms_frontend` | 3000 | Next.js app |

On first boot the backend automatically runs `prisma db push` and seeds the database with fresh dummy data.

- App: http://localhost:3000
- API docs: http://localhost:3001/api/docs
- Mailpit web UI: http://localhost:8025 (view emails sent by the app)

To reset all data:

```bash
docker compose down -v
docker compose up --build -d
```

### Option B – Local Development

#### Prerequisites
- Node.js 20+
- PostgreSQL running locally (or update `DATABASE_URL`)
- (Optional) Mailpit or any SMTP server on port 1025

#### Backend

```bash
cd backend
npm install
# Edit .env with your DB + SMTP credentials
npx prisma db push
npx prisma db seed
npm run start:dev
```

API docs available at http://localhost:3001/api/docs

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at http://localhost:3000

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | — | JWT signing secret |
| `JWT_EXPIRES_IN` | `15m` | Access token TTL |
| `FRONTEND_URL` | `http://localhost:3000` | Used in verification email links |
| `SMTP_HOST` | `localhost` | SMTP server hostname |
| `SMTP_PORT` | `1025` | SMTP server port |
| `SMTP_FROM` | `noreply@hrms.com` | Sender email address |
| `APP_NAME` | `HRMS` | App name shown in emails |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend API base URL |

## Seed Data

The seed script (`backend/prisma/seed.ts`) creates a clean database with:

| Data | Count | Details |
|---|---|---|
| Users | 7 | 1 admin (EMP-001) + 6 employees (EMP-002 through EMP-007) |
| Profiles | 7 | Name, phone, department, designation for each user |
| Attendance | ~35 | 7 users x 5 weekdays with random check-in/out times |
| Leave requests | 7 | Pending, approved, rejected — 3 with attachments |
| Payroll | 7 | Named components: basicSalary, HRA, otherAllowances, PF, tax, otherDeductions |
| Documents | 3 | Sample resume/offer letter references |

### Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@hrms.com` | `Password123` |
| Employee | `alice@hrms.com` | `Password123` |

All seeded users are pre-verified. New users created via the admin panel receive a verification email and must verify before logging in.

## API Reference

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/register` | POST | Admin | Create new user + send verification email |
| `/api/auth/login` | POST | Public | Login (blocked if email unverified) |
| `/api/auth/verify` | GET | Public | Verify email with token (`?token=xxx`) |
| `/api/auth/resend-verification` | POST | Public | Resend verification email |
| `/api/auth/me` | GET | JWT | Get current user + profile |
| `/api/users` | GET | JWT | List all users with profiles |
| `/api/profiles/me` | GET / PATCH | JWT | View / update own profile |
| `/api/attendance` | GET | JWT | List attendance (own for employees, all for admins) |
| `/api/attendance/check-in` | POST | JWT | Check in for today |
| `/api/attendance/check-out` | POST | JWT | Check out for today |
| `/api/leave` | GET | JWT | List leave requests (own for employees, all for admins) |
| `/api/leave` | POST | JWT | Submit leave request (with optional attachment) |
| `/api/leave/:id` | PATCH | Admin | Approve / reject leave with comments |
| `/api/payroll` | GET | Admin | List all payroll records |
| `/api/payroll/me` | GET | JWT | View own payroll |
| `/api/payroll/:employeeId` | GET / PATCH | Admin | View / update employee payroll |
