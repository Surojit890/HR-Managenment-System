# AGENTS.md — HRMS Project Context

> Reference guide for AI agents (and humans) working on this codebase.
> Read this first before making any changes.

## 1. Project Overview

**HRMS** (Human Resource Management System) is a hackathon monorepo with a Next.js
frontend and a NestJS backend. It provides role-based dashboards for Admins/HR and
Employees covering employee management, attendance, leave requests, and payroll.

| Layer       | Technology                                               |
| ----------- | ------------------------------------------------------- |
| Frontend    | Next.js 15 (App Router) + React 19 + TypeScript          |
| UI          | Tailwind CSS v4 + shadcn/ui (Radix primitives)           |
| State/Forms | TanStack Query v5 + React Hook Form + Zod               |
| Backend     | NestJS 11 + TypeScript                                  |
| Auth        | JWT (access token) + bcrypt + email verification (nodemailer) |
| Authorization | RBAC — ADMIN / HR / EMPLOYEE (HR treated as ADMIN)    |
| Database    | PostgreSQL 16 + Prisma ORM (v5)                         |
| Mail (dev)  | Mailpit — SMTP catcher on port 1025, web UI on 8025     |
| Deployment  | Docker Compose (postgres + mailpit + backend + frontend) |

## 2. Monorepo Structure

```
Odoo-Hackathon/
├── docker-compose.yml          # 4-container stack
├── README.md                   # User-facing docs
├── AGENTS.md                   # THIS FILE — agent context
│
├── backend/                    # NestJS REST API
│   ├── Dockerfile              # Multi-stage build, runs prisma db push + seed on boot
│   ├── prisma/
│   │   ├── schema.prisma       # Single source of truth for DB schema
│   │   ├── seed.ts             # Fresh dummy data (7 users + records)
│   │   └── migrations/         # Committed migration history
│   └── src/
│       ├── main.ts             # Bootstrap: CORS, global /api prefix, Swagger, static /uploads
│       ├── app.module.ts       # Root module — imports all feature modules
│       ├── prisma/             # PrismaService (global, extends PrismaClient)
│       ├── auth/               # Register, login, verify, resend-verification, me
│       ├── users/              # User CRUD, verification helpers
│       ├── profiles/           # Employee profile get/update + avatar upload
│       ├── attendance/         # Check-in, check-out, list (date range filter)
│       ├── leave/              # Create, list (filter by status/user), approve/reject
│       ├── payroll/            # Named components: basic, HRA, allowances, PF, tax, etc.
│       ├── mail/               # Nodemailer service (HTML email templates)
│       └── common/             # Shared decorators (CurrentUser)
│
└── frontend/                   # Next.js App Router
    ├── Dockerfile              # Multi-stage build, standalone output
    ├── middleware.ts           # JWT-based route protection + role-based redirect
    ├── app/
    │   ├── layout.tsx          # Root layout — wraps in <Providers> (TanStack Query)
    │   ├── page.tsx            # Root "/" → redirects to /login
    │   ├── (auth)/             # Route group: login, signup, verify
    │   └── (dashboard)/        # Route group: admin/* and employee/*
    ├── components/
    │   ├── ui/                  # shadcn/ui primitives (button, card, dialog, table, ...)
    │   ├── auth/                # login-form, signup-form
    │   ├── dashboard/           # Sidebar, StatCard, SectionCard
    │   ├── leave/               # LeaveStatusBadge
    │   └── attendance/          # AttendanceStatusBadge
    ├── lib/
    │   ├── api/                 # Axios client + per-module API functions
    │   ├── hooks/                # TanStack Query hooks (use-auth, useAdmin, useEmployee)
    │   ├── utils.ts              # cn() — Tailwind class merge helper
    │   └── format.ts             # Date/currency/avatar formatting helpers
    └── types/index.ts            # Shared TypeScript types (mirror Prisma schema)
```

## 3. Common Commands

### Docker (recommended — starts everything)

```bash
docker compose up --build -d          # Build & start all 4 containers
docker compose down -v                # Tear down + delete volumes (full data reset)
docker compose up --build -d          # Rebuild after code changes
```

### Backend (local dev — run from `backend/`)

```bash
npm install
npx prisma generate                   # Regenerate Prisma Client after schema changes
npx prisma db push                    # Push schema to DB (no migration)
npx prisma migrate dev                # Create + apply a migration
npm run seed                          # Seed dummy data (tsx prisma/seed.ts)
npm run start:dev                     # Dev server with --watch (port 3001)
npm run build                         # nest build → dist/
npm run start:prod                    # node dist/src/main.js
npm run lint                          # eslint
npm run test                          # jest unit tests
```

### Frontend (local dev — run from `frontend/`)

```bash
npm install
npm run dev                           # Dev server (port 3000)
npm run build                         # next build (standalone output)
npm run lint                          # next lint (eslint)
```

### Typecheck

There is no dedicated `typecheck` script. Use:
- Backend: `npx tsc --noEmit` (from `backend/`)
- Frontend: `npx tsc --noEmit` (from `frontend/`)

### Services & Ports

| Container       | Port | Purpose                          |
| --------------- | ---- | -------------------------------- |
| `hrms_db`       | 5434 | PostgreSQL 16                    |
| `hrms_mail`     | 8025 | Mailpit web UI (SMTP on 1025)    |
| `hrms_backend`  | 3001 | NestJS API + Swagger at /api/docs |
| `hrms_frontend` | 3000 | Next.js app                      |

- App: http://localhost:3000
- API docs (Swagger): http://localhost:3001/api/docs
- Mailpit: http://localhost:8025

## 4. Backend Architecture (NestJS)

### Module Structure

Every feature follows the standard NestJS pattern:
`module → controller → service → DTO`

- **app.module.ts** — imports `ConfigModule.forRoot({ isGlobal: true })`, `PrismaModule`,
  and all feature modules.
- **PrismaService** (`prisma/prisma.service.ts`) — extends `PrismaClient`, implements
  `OnModuleInit`/`OnModuleInit`. Connects on init, exits process on connection failure.
  Registered as a global provider via `PrismaModule`.
- **AuthModule** — registers `JwtModule.registerAsync(...)` using `JWT_SECRET` from env.
  Uses `forwardRef(() => UsersModule)` to break circular dependency with UsersModule.

### Auth & Authorization

- **JWT Guard** (`auth/guards/jwt-auth.guard.ts`) — extracts Bearer token, verifies with
  `JWT_SECRET`, attaches `request['user'] = { id, email, role }`.
- **CurrentUser decorator** (`common/decorators/current-user.decorator.ts`) — param
  decorator that reads `request['user']`.
- **RBAC is manual** — there is NO RolesGuard or `@Roles()` decorator. Authorization is
  done inline in controllers:
  ```typescript
  if (admin.role !== 'ADMIN' && admin.role !== 'HR') {
    throw new ForbiddenException('Only admins can ...');
  }
  ```
- **HR is treated identically to ADMIN** everywhere. When checking admin access, always
  use `role !== 'ADMIN' && role !== 'HR'`.
- **Employee data scoping** — employees see only their own data. Controllers check role
  and pass `userId: user.id` to the service for employees, or pass through the raw query
  for admins:
  ```typescript
  // leave.controller.ts pattern
  if (user.role !== 'ADMIN' && user.role !== 'HR') {
    return this.leaveService.findAll({ ...query, userId: user.id });
  }
  return this.leaveService.findAll(query);
  ```

### Auth Flow

1. Admin creates user via `POST /api/auth/register` (requires JWT + admin role).
2. Backend hashes password (bcrypt, 12 rounds), generates a 32-byte hex verify token
   (24h expiry), stores on the user record, sends verification email via MailService.
3. User clicks the verification link (`GET /api/auth/verify?token=xxx`).
4. Backend validates token + expiry, marks `isVerified = true`, clears token.
5. User logs in via `POST /api/auth/login`. Login is **blocked** if `isVerified` is false
   (returns UnauthorizedException with a "not verified" message).
6. Backend returns `{ access_token, user }`. Frontend stores token in a cookie
   (`access_token`, 7-day expiry, sameSite: strict).
7. All subsequent API calls include `Authorization: Bearer <token>` via axios interceptor.

**Note:** There is a `TODO` in `frontend/lib/api/client.ts` for a refresh-token
interceptor on 401. Currently no refresh token is implemented despite `JWT_REFRESH_SECRET`
existing in env. Only access tokens are used.

### Validation

- Global `ValidationPipe` with `whitelist: true, transform: true` is registered in
  `main.ts`. Strips unknown properties and transforms payloads to DTO instances.
- DTOs use `class-validator` decorators (`@IsEmail`, `@IsEnum`, `@IsISO8601`, etc.)
  and `class-transformer` for runtime validation.
- Swagger annotations (`@ApiProperty`, `@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`)
  are present on all controllers/DTOs.

### File Uploads

- **Avatar upload** — `POST /api/profiles/me/avatar` uses `@UseInterceptors(FileInterceptor)`
  with `diskStorage` to `uploads/avatars/`. 5 MB limit, image-only mimetype filter.
  Returns `{ profile }` with updated `avatarUrl` (e.g. `/uploads/avatars/<filename>`).
- **Static file serving** — `main.ts` serves `uploads/` at `/uploads/` prefix.
  Docker persists uploads via a named volume.
- **Leave attachments** — stored as a filename string in the `attachment` column
  (not actual file upload via multer on the leave endpoint; the frontend sends the
  filename string in the JSON body).

### Global Prefix & Swagger

- All routes are prefixed with `/api` (set via `app.setGlobalPrefix("api")`).
- Swagger UI at `http://localhost:3001/api/docs` with Bearer auth scheme.
- CORS enabled for `FRONTEND_URL` (default `http://localhost:3000`).

### Backend Module Dependency Graph

```
AppModule
├── ConfigModule (global)
├── PrismaModule (global)
├── AuthModule
│   ├── UsersModule (forwardRef)
│   └── MailModule
├── UsersModule
│   └── AuthModule (forwardRef)
├── ProfilesModule
├── AttendanceModule
├── LeaveModule
└── PayrollModule
```

## 5. Frontend Architecture (Next.js)

### App Router Structure

- **Route groups** (parenthesized dirs don't affect URL):
  - `(auth)/` — login, signup (restricted/admin-only UI), verify
  - `(dashboard)/` — admin/* and employee/* pages
- **Root page** (`app/page.tsx`) — redirects to `/login`.
- **Root layout** (`app/layout.tsx`) — wraps entire app in `<Providers>` (TanStack Query
  QueryClientProvider + ReactQueryDevtools). Uses Geist font.
- **Dashboard layout** (`app/(dashboard)/layout.tsx`) — renders `<Sidebar />` + main
  content area. Sidebar determines admin vs employee nav based on `usePathname()`.

### Middleware (Route Protection)

`frontend/middleware.ts` runs on every non-static route:
- **Public paths**: `/login`, `/verify` — accessible without auth. If already logged in,
  redirects to role-based dashboard.
- **Protected paths**: everything else. If no valid `access_token` cookie → redirect to
  `/login`.
- **Role-based path guard**:
  - `/admin/*` with `EMPLOYEE` role → redirect to `/employee`
  - `/employee/*` with `ADMIN`/`HR` role → redirect to `/admin`
- Token is decoded by base64-decoding the JWT payload (no verification — just reads
  `role` for routing). Backend JWT guard does the real verification.

### API Client (`lib/api/client.ts`)

- Axios instance with `baseURL = NEXT_PUBLIC_API_URL + "/api"`.
- Request interceptor attaches `Authorization: Bearer <token>` from `access_token`
  cookie (via `js-cookie`).
- Auth token stored in cookie (`access_token`, 7-day expiry, `sameSite: strict`).
- All API modules (`auth.ts`, `users.ts`, `profiles.ts`, `attendance.ts`, `leave.ts`,
  `payroll.ts`) export typed functions that return `api.get/post/patch(...).then(r => r.data)`.

### TanStack Query Hooks

- `use-auth.ts` — `useLogin`, `useRegister`, `useLogout` (mutations with router redirect).
- `useAdmin.ts` — `useAdminStats`, `useLeaveRequests`, `useApproveLeave`, `usePayrolls`,
  `useEmployeePayroll`, `useUpdatePayroll`, `useAttendanceRecords`, `useEmployees`,
  `useCreateEmployee`.
- `useEmployee.ts` — `useMyProfile`, `useUpdateProfile`, `useUploadAvatar`,
  `useMyAttendance`, `useTodayAttendance`, `useCheckIn`, `useCheckOut`, `useMyLeave`,
  `useCreateLeave`, `useMyPayroll`.
- Query keys follow the pattern `["<module>", "<scope>", ...params]`.
  Examples: `["users"]`, `["leave", "admin"]`, `["payroll", employeeId, month]`,
  `["attendance", "me", dateFrom, dateTo]`.
- Mutations invalidate relevant query keys on success.
- Default `staleTime: 60_000` (1 min) set in `Providers`.

### UI / Styling

- **shadcn/ui** — components in `components/ui/` (button, card, dialog, input, label,
  select, table, tabs, badge, avatar, skeleton). Config in `components.json`.
  Style: default, baseColor: slate, CSS variables enabled, icon library: lucide.
- **Tailwind CSS v4** — configured via `@import "tailwindcss"` in `globals.css`.
  No `tailwind.config.js` (v4 uses CSS-based config). PostCSS plugin:
  `@tailwindcss/postcss`. Color tokens defined as oklch values in `:root` / `.dark`.
- **Icons** — `lucide-react`.
- **Path alias** — `@/*` maps to project root (both frontend and backend use relative
  imports; frontend uses `@/` extensively).
- **Formatting helpers** (`lib/format.ts`):
  - `formatDate`, `formatDateTime` — via `date-fns`
  - `formatCurrency` — `Intl.NumberFormat` en-US USD
  - `initials(firstName, lastName)` — uppercase initials
  - `avatarUrl(path)` — prepends `NEXT_PUBLIC_API_URL` for non-absolute paths
- **Class merge** — `cn()` in `lib/utils.ts` uses `clsx` + `tailwind-merge`.
- **Next.js config** — `output: "standalone"` (for Docker), Cloudinary remote image
  pattern configured.

## 6. Database Schema (Prisma)

File: `backend/prisma/schema.prisma` — PostgreSQL, `prisma-client-js` generator.

### Enums

| Enum         | Values                          |
| ------------- | ------------------------------- |
| `Role`        | `ADMIN`, `HR`, `EMPLOYEE`       |
| `LeaveType`   | `CASUAL`, `SICK`, `EARNED`, `UNPAID` |
| `LeaveStatus` | `PENDING`, `APPROVED`, `REJECTED` |

### Models

| Model             | Table               | Key Fields                                                            | Relations        |
| ----------------- | ------------------- | --------------------------------------------------------------------- | ---------------- |
| `User`            | `users`             | `id` (uuid), `employeeId` (unique), `email` (unique), `password`, `role`, `isVerified`, `verifyToken`, `verifyTokenExpires` | 1:1 Profile, 1:N Attendance/Leave/Payroll/Document |
| `EmployeeProfile` | `employee_profiles` | `userId` (unique FK), `firstName`, `lastName`, `phone`, `department`, `designation`, `avatarUrl`, `dateOfBirth`, bank/PAN/UAN fields | 1:1 User (Cascade) |
| `Attendance`      | `attendance`        | `userId`, `date` (Date), `checkIn`, `checkOut` (nullable)             | N:1 User (Cascade) |
| `LeaveRequest`    | `leave_requests`    | `userId`, `type`, `from` (Date), `to` (Date), `remarks`, `attachment` (string), `status`, `comments` | N:1 User (Cascade) |
| `Payroll`         | `payroll`           | `userId`, `month` ("YYYY-MM"), `basicSalary`, `hra`, `otherAllowances`, `allowances` (computed), `pf`, `tax`, `otherDeductions`, `deductions` (computed), `netSalary` (computed). All `Decimal(12,2)`. `@@unique([userId, month])` | N:1 User (Cascade) |
| `Document`        | `documents`         | `userId`, `name`, `url`                                               | N:1 User (Cascade) |

### Payroll Computation

The `PayrollService.compute()` method auto-derives aggregates:
- `allowances = hra + otherAllowances`
- `deductions = pf + tax + otherDeductions`
- `netSalary = basicSalary + allowances - deductions`

The `update` method uses `prisma.payroll.upsert` keyed on `userId_month`.
`mapPayroll()` converts Prisma `Decimal` to JS `Number` for all monetary fields.

### Migrations

- Migration history is committed in `backend/prisma/migrations/`.
- Docker's CMD runs `npx prisma db push --accept-data-loss && npx prisma db seed` on boot.
- **Warning**: `db push --accept-data-loss` can drop columns/tables. For local dev with
  schema changes, prefer `prisma migrate dev`.

## 7. Environment Variables

### Backend (`backend/.env`)

Copy from `backend/.env.example`:

| Variable                 | Default                              | Description                        |
| ------------------------ | ------------------------------------ | ---------------------------------- |
| `DATABASE_URL`           | `postgresql://postgres:password@localhost:5435/hrms_db` | PostgreSQL connection string |
| `JWT_SECRET`             | `change_me_in_production`            | JWT signing secret (required)      |
| `JWT_REFRESH_SECRET`     | `change_me_refresh_in_production`   | Refresh secret (unused — see TODO)  |
| `JWT_EXPIRES_IN`         | `15m`                                | Access token TTL                   |
| `JWT_REFRESH_EXPIRES_IN` | `7d`                                 | Refresh token TTL (unused)         |
| `FRONTEND_URL`           | `http://localhost:3000`              | CORS origin + verification link base |
| `PORT`                   | `3001`                               | Backend listen port                |
| `SMTP_HOST`              | `localhost`                          | SMTP server hostname               |
| `SMTP_PORT`              | `1025`                               | SMTP server port                   |
| `SMTP_FROM`              | `noreply@hrms.com`                   | Sender email address               |
| `APP_NAME`               | `HRMS`                               | App name in email templates        |

### Frontend (`frontend/.env`)

Copy from `frontend/.env.example`:

| Variable             | Default                  | Description           |
| -------------------- | ------------------------ | --------------------- |
| `NEXT_PUBLIC_API_URL`| `http://localhost:3001`  | Backend API base URL  |

Docker also sets `API_URL=http://backend:3001` (internal container network) but the
frontend client uses `NEXT_PUBLIC_API_URL` (browser-side).

### Docker Compose Environment

The `docker-compose.yml` hardcodes all env values for the containers. The backend
container connects to postgres at `postgres:5432` (internal), exposes `3001` externally.
Database password is `password`, user `postgres`, db `hrms_db`, exposed on host port
`5434`.

## 8. API Reference

All routes prefixed with `/api`. Bearer auth required unless noted.

| Endpoint                          | Method | Auth          | Description                              |
| --------------------------------- | ------ | ------------- | ---------------------------------------- |
| `/api/auth/register`              | POST   | Admin/HR      | Create user + send verification email    |
| `/api/auth/login`                 | POST   | Public        | Login (blocked if unverified)           |
| `/api/auth/verify?token=xxx`      | GET    | Public        | Verify email with token                  |
| `/api/auth/resend-verification`   | POST   | Public        | Resend verification email                |
| `/api/auth/me`                    | GET    | JWT           | Get current user + profile               |
| `/api/users`                      | GET    | JWT           | List all users with profiles             |
| `/api/profiles/me`                | GET    | JWT           | View own profile                         |
| `/api/profiles/me`                | PATCH  | JWT           | Update own profile                       |
| `/api/profiles/me/avatar`         | POST   | JWT           | Upload avatar (multipart, image, 5MB)   |
| `/api/attendance`                 | GET    | JWT           | List attendance (own for employees)      |
| `/api/attendance/check-in`        | POST   | JWT           | Check in for today                       |
| `/api/attendance/check-out`       | POST   | JWT           | Check out for today                      |
| `/api/leave`                      | GET    | JWT           | List leave requests (own for employees)  |
| `/api/leave`                      | POST   | JWT           | Submit leave request                     |
| `/api/leave/:id`                  | PATCH  | Admin/HR      | Approve / reject leave with comments     |
| `/api/payroll`                    | GET    | Admin/HR      | List all payroll records                 |
| `/api/payroll/me`                 | GET    | JWT           | View own payroll                         |
| `/api/payroll/:employeeId`        | GET    | Admin/HR      | View employee payroll                    |
| `/api/payroll/:employeeId`        | PATCH  | Admin/HR      | Update employee salary structure        |

Swagger docs: http://localhost:3001/api/docs

## 9. Seed Data & Test Credentials

Run `npm run seed` (backend) or just start Docker (auto-seeds on boot).

**Note:** The seed script does a **clean wipe** first (deletes all rows in all tables),
then recreates fresh data. All seeded users are pre-verified.

### Login Credentials

| Role     | Email              | Password      |
| -------- | ------------------ | ------------- |
| Admin    | `admin@hrms.com`   | `Password123` |
| Employee | `alice@hrms.com`   | `Password123` |

All 7 seeded users share the same password: `Password123`.

### Seeded Data Summary

| Data            | Count | Details                                                        |
| --------------- | ----- | -------------------------------------------------------------- |
| Users           | 7     | 1 admin (EMP-001) + 6 employees (EMP-002…007)                   |
| Profiles        | 7     | Name, phone, department, designation                            |
| Attendance      | ~30   | 6 weekdays × 7 users, random check-in/out (some today unchecked-out) |
| Leave requests  | 7     | Pending/approved/rejected, 3 with attachments                  |
| Payroll         | 7     | Current month, named components                                |
| Documents       | 3     | Sample resume/offer letter references                          |

### Seeded Employees

| Employee ID | Email            | Name           | Department   | Designation          |
| ----------- | ---------------- | -------------- | ------------ | -------------------- |
| EMP-001     | admin@hrms.com   | Sarah Johnson  | HR           | HR Director          |
| EMP-002     | alice@hrms.com   | Alice Williams | Engineering  | Senior Developer     |
| EMP-003     | bob@hrms.com     | Bob Brown      | Engineering  | Frontend Developer   |
| EMP-004     | carol@hrms.com   | Carol Davis    | Marketing    | Marketing Manager    |
| EMP-005     | david@hrms.com   | David Miller   | Sales        | Sales Executive      |
| EMP-006     | eve@hrms.com      | Eve Wilson     | Finance      | Financial Analyst    |
| EMP-007     | frank@hrms.com   | Frank Taylor   | Engineering  | DevOps Engineer      |

## 9. Code Conventions & Patterns

### Backend (NestJS)

- **Naming**: `kebab-case` filenames (e.g. `jwt-auth.guard.ts`), `PascalCase` classes
  (e.g. `AuthService`), `camelCase` methods.
- **Quotes**: Single quotes (`'...'`) throughout the backend.
- **Imports**: Absolute from `src/` using relative paths (no path aliases configured).
- **DTOs**: One DTO per file in a `dto/` subfolder. Use `class-validator` +
  `class-transformer` + `@nestjs/swagger` decorators.
- **Services**: Inject `PrismaService` via constructor. All DB access through Prisma.
- **Error handling**: Throw NestJS exceptions (`NotFoundException`,
  `BadRequestException`, `UnauthorizedException`, `ForbiddenException`,
  `ConflictException`).
- **No comments** in source code (project convention — code is self-documenting).
- **TypeScript config**: `strictNullChecks: false`, `noImplicitAny: false` — relaxed
  strictness. Module: `commonjs`, target: `ES2017`.

### Frontend (Next.js)

- **Naming**: `kebab-case` filenames for components/pages (e.g. `login-form.tsx`),
  `PascalCase` for component exports, `camelCase` for hooks/functions.
- **Quotes**: Double quotes (`"..."`) throughout the frontend.
- **Imports**: Use `@/` path alias (maps to `./`). E.g. `import { api } from "@/lib/api/client"`.
- **Components**: shadcn/ui primitives in `components/ui/`. Feature components in
  subfolders matching the feature. `"use client"` directive on client components.
- **API layer**: `lib/api/<module>.ts` exports typed async functions. Each returns
  `api.<method>(...).then((r) => r.data)`.
- **Hooks**: `lib/hooks/use<Feature>.ts` — TanStack Query `useQuery`/`useMutation`
  wrappers with query key management and invalidation.
- **Types**: `types/index.ts` — shared interfaces mirroring Prisma models. `Role` type
  includes `HR` but note the comment: "HR is treated identically to ADMIN".
- **Forms**: React Hook Form + Zod (`@hookform/resolvers`). Validation schemas
  co-located with form components.
- **Error display**: `apiErrorMessage()` helper in `use-auth.ts` extracts message from
  Axios error response (handles string and string[] formats).
- **TypeScript config**: `strict: true`. Module: `esnext`, `moduleResolution: bundler`.

### Shared

- **No comments** in code unless absolutely necessary.
- **No tests** are currently written (jest configured in backend but no test files).
- **No commit conventions** enforced (no `.gitignore` for hooks, no commitlint).

## 10. Key Gotchas & Important Notes

1. **HR role** — treated identically to ADMIN in all RBAC checks. When adding new
   admin-only endpoints, always check `role !== 'ADMIN' && role !== 'HR'` (not just
   `role !== 'ADMIN'`).

2. **No RolesGuard** — authorization is done inline in controllers with manual
   `ForbiddenException` throws. If adding many new admin endpoints, consider creating a
   proper `RolesGuard` + `@Roles()` decorator to reduce boilerplate.

3. **No refresh token** — despite `JWT_REFRESH_SECRET` and `JWT_REFRESH_EXPIRES_IN` in
   env, only access tokens are issued. The frontend has a `TODO` for a 401 refresh
   interceptor. Access tokens expire in 15 minutes — users must re-login.

4. **Docker auto-seeds on every boot** — the backend Dockerfile CMD runs
   `prisma db push --accept-data-loss && prisma db seed` on every container start. This
   wipes and reseeds the database each time you rebuild. For development where you want
   to persist data across rebuilds, comment out the seed command or use local dev mode.

5. **`db push --accept-data-loss`** — the Docker CMD uses `--accept-data-loss` which can
   silently drop data when schema changes break existing columns. Use `prisma migrate dev`
   for controlled migrations in development.

6. **Leave attachments are filenames, not files** — the `CreateLeaveDto.attachment` field
   is a string. The frontend sends the filename in the JSON body, not an actual file
   upload. Only avatar uploads use multer `FileInterceptor`.

7. **Decimal handling** — Prisma returns `Decimal` for `Decimal(12,2)` columns.
  `PayrollService.mapPayroll()` converts to `Number`. Any new service returning payroll
   data must apply the same conversion, or the frontend will receive BigInt/objects.

8. **Middleware token decoding is not verification** — the Next.js middleware base64-
   decodes the JWT payload to read `role` for routing. It does NOT verify the signature.
   The backend JWT guard does the real verification. A token with a forged role could
   bypass the middleware redirect (but would fail at the API level).

9. **Root page redirects to /login** — `app/page.tsx` always redirects to `/login`. There
   is no public landing page.

10. **Signup page exists but is admin-gated** — `app/(auth)/signup/page.tsx` exists in the
    frontend, but self-registration is disabled. Only admins can create users via the
    API. The signup page may show a form but the backend rejects non-admin registrations.

11. **`prisma.zip`** — there's a `prisma.zip` file in `backend/` (likely a backup of the
    prisma directory). It is not referenced by any code or Dockerfile.

12. **`images/` directory** — gitignored. Contains screenshots/assets not tracked in git.

## 11. File Locations Quick Reference

| What                          | Where                                    |
| ----------------------------- | ---------------------------------------- |
| Prisma schema                 | `backend/prisma/schema.prisma`           |
| Seed script                   | `backend/prisma/seed.ts`                 |
| NestJS bootstrap              | `backend/src/main.ts`                    |
| Root module                   | `backend/src/app.module.ts`             |
| JWT guard                     | `backend/src/auth/guards/jwt-auth.guard.ts` |
| Auth service (register/login) | `backend/src/auth/auth.service.ts`       |
| RBAC check pattern            | `backend/src/auth/auth.controller.ts` (register endpoint) |
| CurrentUser decorator         | `backend/src/common/decorators/current-user.decorator.ts` |
| PrismaService                 | `backend/src/prisma/prisma.service.ts`   |
| Mail service (email templates)| `backend/src/mail/mail.service.ts`       |
| Axios API client              | `frontend/lib/api/client.ts`            |
| Auth API functions            | `frontend/lib/api/auth.ts`              |
| Auth hooks (login/register)   | `frontend/lib/hooks/use-auth.ts`        |
| Admin hooks                   | `frontend/lib/hooks/useAdmin.ts`         |
| Employee hooks                | `frontend/lib/hooks/useEmployee.ts`      |
| Route protection middleware   | `frontend/middleware.ts`                |
| Shared types                  | `frontend/types/index.ts`               |
| shadcn/ui config              | `frontend/components.json`              |
| Tailwind/global CSS           | `frontend/app/globals.css`              |
| Format helpers                | `frontend/lib/format.ts`                |
| Class merge (cn)              | `frontend/lib/utils.ts`                 |
| Sidebar nav config            | `frontend/components/dashboard/Sidebar.tsx` |
| Docker compose                | `docker-compose.yml`                     |
