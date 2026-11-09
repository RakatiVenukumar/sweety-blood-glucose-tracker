# Sweety – Project Context

## 1. Project Overview

Sweety is a blood glucose tracking application for diabetes patients.

Users can record up to four glucose readings per day and view daily and monthly reports.

The application will provide secure authentication, personal glucose reading management, data validation, and reporting.

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
- Follow the existing project architecture.
- Validate all backend inputs.
- Never expose secrets, credentials, database passwords, or private keys.
- Test every completed feature.
- Handle relevant edge cases and security concerns.
- Maintain clean, readable, and maintainable code.
- Update this PROJECT_CONTEXT.md at the end of every completed phase, after resolving issues and before committing and pushing.
- Make regular Git commits with meaningful messages.
- Preserve existing architectural decisions unless a change is necessary and discussed.

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
- Created initial PROJECT_CONTEXT.md.
- Created Supabase project and obtained the required connection information.

### Phase 2: Database Architecture
Status: Completed – Initial schema and security configuration

**Tables created:**

1. `public.users`
2. `public.glucose_readings`

**Users table:**
- `id`: UUID primary key.
- `name`: VARCHAR(100), NOT NULL.
- `email`: VARCHAR(255), NOT NULL.
- `password_hash`: TEXT, NOT NULL.
- `created_at`: TIMESTAMPTZ.
- `updated_at`: TIMESTAMPTZ.
- Non-empty checks for name, email, and password hash.
- Case-insensitive email uniqueness index.

**Glucose readings table:**
- `id`: UUID primary key.
- `user_id`: UUID foreign key referencing `users.id`.
- `reading_date`: DATE.
- `time_slot`: VARCHAR(30).
- `glucose_value`: INTEGER.
- `created_at`: TIMESTAMPTZ.
- `updated_at`: TIMESTAMPTZ.

**Database constraints:**
- Glucose values must be between 40 and 600.
- Only four permitted time slots.
- Unique combination of user, reading date, and time slot.
- Foreign key with `ON DELETE CASCADE`.
- Maximum of four readings per user per day is enforced by the four allowed slots and unique constraint.
- Future reading dates will be validated by the backend.

**Relationships:**
- One user can have multiple glucose readings.
- Every glucose reading belongs to one user.

**Indexes:**
- Primary key indexes on both tables.
- Unique index on `(user_id, reading_date, time_slot)`.
- Case-insensitive unique index on user email.
- Redundant case-sensitive email uniqueness constraint targeted for removal.

**Security configuration:**
- Custom JWT authentication will be handled by Express.
- Supabase Auth is not being used.
- A restricted PostgreSQL role named `sweety_app` exists.
- Verified role flags:
  - Superuser: false.
  - Create role: false.
  - Create database: false.
  - Login: true.
  - Bypass RLS: false.
- Granted SELECT, INSERT, UPDATE, and DELETE permissions to `sweety_app` on both tables.
- Enabled Row Level Security (RLS) on both tables.
- Created a backend-management policy for the users table.
- Created a user-specific policy for glucose readings using `app.current_user_id`.
- Removed direct table permissions from `anon`, `authenticated`, and `PUBLIC`.
- Verified that `sweety_app` retains the required table permissions.

**Important implementation detail:**

The Express backend must:
1. Verify the user's JWT.
2. Obtain the authenticated user ID from the verified token.
3. Start a database transaction.
4. Set `app.current_user_id` within that transaction.
5. Execute user-scoped database queries within the same transaction.
6. Commit or roll back the transaction appropriately.

RLS must be tested through the actual backend connection before considering user isolation fully verified.

## 7. Development Decisions

1. Use Supabase-managed PostgreSQL instead of MongoDB.
2. Use custom Express authentication with bcrypt and JWT instead of Supabase Auth.
3. Keep database credentials exclusively on the backend.
4. Use UUID identifiers for users and glucose readings.
5. Store glucose readings in a separate table linked to users.
6. Allow only four predefined daily reading slots.
7. Enforce one reading per user per date per time slot.
8. Generate reports dynamically from glucose readings rather than storing separate report records.
9. Use database constraints for data integrity and backend validation for application-specific rules.
10. Use RLS to restrict glucose reading access to the authenticated application user.
11. Use the restricted `sweety_app` database role for application access.
12. Keep the frontend separate from the backend.

## 8. Known Issues and Pending Verification

- Confirm/configure the `sweety_app` login password and verify its database connection.
- Verify that the backend uses the restricted database role rather than the database owner.
- Implement transaction-scoped `app.current_user_id` handling in Express.
- Test RLS through the actual backend connection.
- Test cross-user data isolation.
- Implement automatic `updated_at` timestamp updates.
- Test database CRUD operations.
- Test duplicate readings, invalid glucose values, invalid time slots, and future dates.
- Verify all database permissions and policies after backend integration.

No actual sample users or glucose readings have been inserted yet. Test data will be introduced through the seed script after backend implementation.

## 9. Next Development Phase

### Phase 3: Backend Foundation

Planned work:
- Initialize the Node.js backend.
- Configure Express.
- Set up environment variables.
- Configure PostgreSQL connectivity.
- Connect using the restricted database role.
- Establish reusable database transaction handling.
- Configure middleware and centralized error handling.
- Verify the backend-to-database connection.

Continue following the agreed 17-phase development roadmap without changing its build order.