# Sweety – Project Context

## 1. Project Overview

Sweety is a blood glucose tracking application for diabetes patients.

Users can record up to four glucose readings per day and view daily and monthly reports.

The application aims to provide secure authentication, personal glucose reading management, data validation, reporting, and a responsive user experience.

## 2. Technology Stack

- Frontend: React.js + Vite
- Backend: Node.js + Express.js
- Database: PostgreSQL
- Database Provider: Supabase
- Authentication: Custom JWT + bcrypt
- Version Control: Git + GitHub
- Development Environment: VS Code / Antigravity

## 3. Project Structure

- `client/`: React frontend
- `server/`: Express backend
- `docs/`: Project documentation and context

## 4. Development Rules

- Build incrementally, following the agreed project roadmap.
- Do not rewrite existing working functionality unnecessarily.
- Follow the established project architecture.
- Validate all backend inputs.
- Never expose secrets, credentials, database passwords, or private keys.
- Test every completed feature.
- Handle relevant edge cases and security concerns.
- Maintain clean, readable, and maintainable code.
- Update this PROJECT_CONTEXT.md at the end of every completed phase, after resolving issues and before committing and pushing.
- Make regular Git commits with meaningful messages.
- Preserve existing architectural decisions unless a change is necessary and discussed.
- Do not introduce unnecessary complexity or dependencies.

## 5. Assignment Requirements

- User registration and login.
- Secure password hashing using bcrypt.
- JWT-based authentication.
- Glucose reading CRUD operations.
- Four daily reading time slots:
  - Morning
  - After breakfast
  - After lunch
  - After dinner
- Input validation and error handling.
- Daily report.
- Month-to-date report.
- Previous-month report.
- README documentation.
- `.env.example` file.
- Database seed script.
- Screenshots or demo video.
- Public GitHub repository for submission.

## 6. Current Progress

### Phase 1: Project Setup and Environment
Status: Completed

- Created project root and folder structure.
- Installed and verified Node.js, npm, and Git.
- Configured Git identity.
- Created GitHub repository.
- Initialized Git and configured remote.
- Created `.gitignore`.
- Created Supabase project.
- Obtained database connection information and API credentials.
- Created initial PROJECT_CONTEXT.md.

### Phase 2: Database Architecture
Status: Completed – Initial database configuration and hardening

#### 2.1 Database design

Created two PostgreSQL tables:

1. `public.users`
2. `public.glucose_readings`

#### 2.2 Users table

Columns:
- `id`: UUID primary key with automatic generation.
- `name`: VARCHAR(100), NOT NULL.
- `email`: VARCHAR(255), NOT NULL.
- `password_hash`: TEXT, NOT NULL.
- `timezone`: VARCHAR(64), NOT NULL, default `Asia/Kolkata`.
- `created_at`: TIMESTAMPTZ, default NOW().
- `updated_at`: TIMESTAMPTZ, default NOW().

Constraints:
- Name cannot be empty.
- Email cannot be empty.
- Password hash cannot be empty.
- Email uniqueness is enforced case-insensitively.

#### 2.3 Glucose readings table

Columns:
- `id`: UUID primary key with automatic generation.
- `user_id`: UUID foreign key.
- `reading_date`: DATE, NOT NULL.
- `time_slot`: VARCHAR(30), NOT NULL.
- `glucose_value`: INTEGER, NOT NULL.
- `created_at`: TIMESTAMPTZ, default NOW().
- `updated_at`: TIMESTAMPTZ, default NOW().

Constraints:
- Glucose values must be between 40 and 600.
- Only four predefined time slots are permitted:
  - `morning`
  - `after_breakfast`
  - `after_lunch`
  - `after_dinner`
- Unique combination of user ID, reading date, and time slot.
- Foreign key references `users.id`.
- `ON DELETE CASCADE` is configured.
- Maximum of four readings per user per day is enforced by the allowed slots and unique constraint.
- Future dates will be rejected through backend validation.

#### 2.4 Relationships

- One user can have multiple glucose readings.
- Each glucose reading belongs to one user.
- Verified the foreign key and cascading deletion configuration.

#### 2.5 Data integrity and indexing

- Primary key indexes on both tables.
- Unique index on `(user_id, reading_date, time_slot)`.
- Case-insensitive unique email index using `LOWER(email)`.
- Removed the redundant case-sensitive email uniqueness constraint.
- Database constraints enforce valid glucose values and time slots.

#### 2.6 Automatic timestamps

Created a reusable PostgreSQL function:

`public.set_updated_at()`

Created triggers:
- `trigger_users_updated_at`
- `trigger_glucose_readings_updated_at`

Both tables automatically update `updated_at` whenever an existing record is modified.

#### 2.7 Date and timezone strategy

- Reading dates use PostgreSQL `DATE`.
- Creation and modification timestamps use `TIMESTAMPTZ`.
- Added a `timezone` column to the users table.
- Default timezone: `Asia/Kolkata`.
- Backend will validate IANA timezone names.
- Report date boundaries will be calculated using each user's timezone.

#### 2.8 Database security and RLS

- Custom Express JWT authentication will be used instead of Supabase Auth.
- Identified the restricted PostgreSQL role `sweety_app`.
- Verified its security flags:
  - Superuser: false.
  - Create roles: false.
  - Create databases: false.
  - Login enabled: true.
  - Bypass RLS: false.
- Granted SELECT, INSERT, UPDATE, DELETE permissions to `sweety_app` on both tables.
- Enabled RLS on both tables.
- Created the `users` table backend-management policy.
- Created the `glucose_readings` user-specific policy using `app.current_user_id`.
- Removed direct table permissions from `anon`, `authenticated`, and `PUBLIC`.
- Verified the expected RLS policies and backend permissions.

**Required backend implementation:**

1. Verify the JWT.
2. Obtain the authenticated user ID from the verified token.
3. Start a database transaction.
4. Set `app.current_user_id` within that transaction.
5. Execute user-scoped queries within the same transaction.
6. Commit or roll back the transaction appropriately.

#### 2.9 Backup and recovery

- Reviewed Supabase Free plan backup limitations.
- Established a manual database backup strategy.
- Database schema changes will be maintained through SQL scripts/migrations and Git.
- A complete backup and restore test remains pending before production deployment.

#### 2.10 Database verification

Completed initial database audits covering:
- Table columns and data types.
- Nullability and default values.
- Database constraints and indexes.
- Timestamp triggers.
- User timezone column.
- RLS configuration.
- Backend database permissions.
- Application database role security flags.

No actual sample users or glucose readings have been inserted yet.

### Phase 2 Overall Status

**Completed:** Initial database schema, relationships, constraints, indexes, timestamp triggers, timezone support, RLS configuration, permissions review, and backup strategy.

**Not yet tested through the actual backend:**
- Restricted database role login and connectivity.
- Real database CRUD operations.
- Transaction-scoped RLS behavior.
- Cross-user data isolation.
- Registration and login database operations.
- Automatic timestamp behavior with actual updates.

## 7. Development Decisions

1. Use Supabase-managed PostgreSQL instead of MongoDB.
2. Use custom Express authentication with bcrypt and JWT instead of Supabase Auth.
3. Keep database credentials exclusively on the backend.
4. Use UUID identifiers for users and glucose readings.
5. Store glucose readings in a separate table linked to users.
6. Allow only four predefined daily reading slots.
7. Enforce one reading per user per date per time slot.
8. Generate reports dynamically rather than storing separate report records.
9. Use database constraints for data integrity and backend validation for application-specific rules.
10. Use RLS to restrict glucose reading access to the authenticated application user.
11. Use the restricted `sweety_app` database role for application access.
12. Use transaction-scoped database user context for RLS.
13. Use automatic database triggers for `updated_at`.
14. Store each user's preferred IANA timezone.
15. Keep the frontend separate from the backend.
16. Avoid unnecessary indexes and redundant database constraints.

## 8. Known Issues and Pending Verification

- Verify/configure the `sweety_app` database password and actual login connection.
- Confirm the role has no unexpected privileged memberships.
- Configure Express to use the restricted database role.
- Implement transaction-scoped `app.current_user_id` handling.
- Test RLS using actual backend requests.
- Test cross-user data isolation.
- Verify automatic `updated_at` triggers through actual updates.
- Test all database CRUD operations.
- Test duplicate readings and invalid glucose values.
- Test invalid time slots and future dates.
- Test timezone handling and report date boundaries.
- Perform a manual database backup and restore test before production deployment.

## Phase 3 – Backend Foundation

**Status: Completed**

### Technology and dependencies
- Node.js and Express 5
- PostgreSQL using the `pg` package
- Supabase Transaction Pooler
- dotenv, CORS, Helmet and Nodemon

### Database connectivity
- Connected Express to Supabase PostgreSQL.
- Configured the restricted `sweety_app` database role.
- Configured SSL certificate verification.
- Created a reusable PostgreSQL connection pool.
- Implemented transaction management using `withTransaction()`.
- Implemented transaction-local user context for RLS.

### Backend architecture
- Created the `src/` folder structure.
- Separated configuration, controllers, middleware, routes, services and utilities.
- Implemented custom application errors.
- Implemented asynchronous error handling.
- Implemented centralized 404 and error-handling middleware.
- Configured JSON parsing, CORS and Helmet.
- Created the `/api/health` endpoint.

### Verification
- PostgreSQL connection tested successfully.
- Database transaction tested successfully.
- Application role verified as `sweety_app`.
- RLS transaction context tested successfully.
- Health-check endpoint tested successfully.
- Nonexistent route correctly returned HTTP 404.

### Important configuration
- Database credentials remain in `server/.env`.
- `.env.example` contains placeholders only.
- Supabase root certificate is stored in `server/certs/`.
- Temporary database testing endpoints were removed after verification.

### Pending phases
Authentication, reading APIs, validation, reports, frontend integration and deployment remain future phases.