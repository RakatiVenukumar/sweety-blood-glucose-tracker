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

## Phase 4 – Authentication

**Status:** Implementation and initial verification completed.

### Authentication features
- User registration API implemented.
- User login API implemented.
- Passwords securely hashed and verified using bcrypt.
- JWT access tokens generated using `jsonwebtoken`.
- Token expiration configured through environment variables.
- JWT authentication middleware implemented.
- Protected route access verified using Bearer tokens.
- Authenticated user ID extracted from the verified JWT.
- PostgreSQL transaction-local RLS user context integrated using `withTransaction()`.

### API endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`

### Security measures
- Password hashes excluded from API responses.
- Duplicate email registration prevented.
- Email addresses normalized to lowercase.
- Invalid credentials return generic authentication errors.
- Missing, invalid and expired tokens rejected.
- User identity derived from verified JWT claims rather than request parameters.
- Authentication secrets stored in backend environment variables.

### Verification
- Registration and duplicate-email tests.
- Login success and invalid-credential tests.
- JWT verification tests.
- Protected-route access tests.
- PostgreSQL transaction-local user-context test.

### Remaining security verification
- Test actual RLS data isolation with two separate users.
- Review authentication rate limiting and security edge cases.
- Perform broader API security testing.

# Phase 5 – Glucose Reading CRUD APIs (Completed)

**Status:** Completed

**Objective:** Build authenticated REST APIs to create, retrieve, update, and delete glucose readings using Express and Supabase PostgreSQL.

## 1. Routes and API Endpoints

All routes are mounted under `/api/readings` and protected by JWT authentication using the `protect` middleware.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/readings` | Create a glucose reading |
| GET | `/api/readings` | Retrieve all readings belonging to the authenticated user |
| GET | `/api/readings/:id` | Retrieve a specific reading |
| PUT | `/api/readings/:id` | Update an existing reading |
| DELETE | `/api/readings/:id` | Delete a reading |

## 2. Create Reading API

- Accepts `reading_date`, `time_slot`, and `glucose_value`.
- Validates required fields and date format.
- Rejects invalid calendar dates and future dates.
- Allows only four time slots:
  - `morning`
  - `after_breakfast`
  - `after_lunch`
  - `after_dinner`
- Accepts integer glucose values between 40 and 600.
- Gets the user ID from the verified JWT (`req.user.id`).
- Uses parameterized SQL queries.
- Returns HTTP 201 on successful creation.
- Handles duplicate date/time-slot combinations with HTTP 409.

## 3. Get All Readings API

- Retrieves all readings belonging to the authenticated user.
- Orders readings by `reading_date DESC` and `created_at DESC`.
- Returns the total count and reading records.
- Returns HTTP 200, including an empty array when no readings exist.

## 4. Get Reading by ID API

- Retrieves a specific reading using its UUID.
- Validates the reading ID format.
- Returns HTTP 200 when found.
- Returns HTTP 400 for an invalid UUID.
- Returns HTTP 404 when the reading does not exist or is not accessible to the authenticated user.

## 5. Update Reading API

- Uses the PUT method to update an existing reading.
- Updates `reading_date`, `time_slot`, and `glucose_value`.
- Validates the reading ID and input fields.
- Does not allow modification of `user_id`.
- Returns HTTP 200 on successful update.
- Returns HTTP 400 for invalid input.
- Returns HTTP 404 when the reading is not found or accessible.
- Returns HTTP 409 when the updated date/time-slot combination conflicts with another reading.
- Database `updated_at` trigger automatically updates the modification timestamp.

## 6. Delete Reading API

- Deletes a reading using its UUID.
- Validates the reading ID.
- Uses `DELETE ... RETURNING id`.
- Returns HTTP 200 with the deleted reading ID.
- Returns HTTP 400 for invalid UUIDs.
- Returns HTTP 404 when the reading does not exist or is not accessible.

## 7. Security and Database Integration

- All reading routes require JWT authentication.
- User identity is obtained exclusively from the verified JWT (`req.user.id`).
- All user-specific database operations use `withTransaction(callback, req.user.id)`.
- The transaction sets the transaction-local PostgreSQL variable `app.current_user_id`.
- PostgreSQL Row-Level Security (RLS) restricts reading access to the authenticated user.
- All SQL queries use parameterized values to prevent SQL injection.
- Passwords and database credentials are never exposed through reading APIs.
- Reading ownership is never accepted from the request body or URL.

## 8. Testing Completed

Tested using Thunder Client:

- Successful reading creation – HTTP 201.
- Successful retrieval of all readings – HTTP 200.
- Successful retrieval by reading ID – HTTP 200.
- Invalid reading ID – HTTP 400.
- Successful reading update – HTTP 200.
- Updated glucose value and `updated_at` timestamp verified.
- Successful reading deletion – HTTP 200.
- Authentication protection verified for reading routes.

## 9. Pending Improvements

The following items remain for later phases:

- Two-user RLS isolation testing and additional security verification.
- Automated API testing.

## Phase 6 – Validation and Backend Improvements (Completed)

### Implementation

- Added reusable validators in `server/src/utils/validators.js` for request
  bodies, names, emails, passwords, UUIDs, dates, time slots, glucose values,
  and IANA timezones.
- Updated authentication controllers to reject malformed request bodies,
  validate input types consistently, and apply the default timezone only when
  no timezone is supplied.
- Updated reading CRUD controllers to reuse validation logic and retrieve the
  authenticated user's saved timezone inside the RLS transaction.
- Future reading dates are now checked against the user's local calendar date.
- Strengthened JWT validation by requiring a valid UUID in the `sub` claim.
- Configured the PostgreSQL driver to preserve `DATE` values as `YYYY-MM-DD`
  strings instead of serializing them as UTC timestamps.

### Manual testing status

Code-level validation is complete. Thunder Client verification remains
pending for malformed bodies, invalid input types, timezone-aware future dates,
JWT claim validation, and date-only API responses.

### Known limitations

- Two-user RLS isolation testing and automated API tests remain pending.

### Phase 6 – Validation and Backend Improvements: Testing Results

#### Tests executed

- JavaScript syntax checks for all modified backend files.
- Module import and dependency resolution checks.
- Backend startup using `node Server/server.js`.
- 50 live API cases covering registration, login, reading validation, CRUD,
  date serialization, malformed JSON, oversized bodies, and JWT handling.
- Database verification for the dedicated Phase 6 test account.

#### Passed

- Registration and login success/error status handling.
- Duplicate registration and duplicate reading handling.
- Name, email, password, timezone, body-shape, date, time-slot, and glucose
  value validation.
- Timezone-aware today/future-date validation for `Asia/Kolkata`.
- Reading CRUD responses preserve `YYYY-MM-DD` dates.
- Missing, malformed, expired, wrong-scheme, and extra-token authentication
  requests return `401`.
- Password hash format, normalized email, and saved timezone were verified
  for the test account.
- Initial full run: 49/50 cases passed. After fixing invalid JWT subject
  handling, the failed regression case passed.

#### Bug discovered and fixed

- A JWT with an invalid UUID `sub` claim incorrectly returned `400` because
  the shared client-input UUID validator error propagated through the auth
  middleware. Authentication middleware now maps that case to `401`.

#### Blocked or skipped

- Two-user RLS isolation testing remains scheduled for Phase 13.
- A second timezone boundary test was not run because it requires a controlled
  date-boundary setup.
- Production-mode 500-response verification was not run.
- Direct database reading-count verification without the transaction-local RLS
  context was blocked by the expected RLS policy; no production data was
  modified.

#### Final verification status

Phase 6 implementation and targeted verification pass. No unresolved Phase 6
functional failures remain.

## Phase 7 – Reports APIs

### Implementation

Added authenticated report endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/reports/daily` | Current local day statistics and reading details |
| GET | `/api/reports/monthly` | Current local month statistics, daily summaries, and slot counts |
| GET | `/api/reports/previous-month` | Previous local month statistics, daily summaries, and slot counts |

Report responses contain a `report` object with:

- Daily: `date`, `total_readings`, `average_glucose`, `minimum_glucose`,
  `maximum_glucose`, and `readings`.
- Monthly periods: `month`, `year`, aggregate statistics,
  `daily_summaries`, and `time_slot_counts`.
- Empty periods return zero counts, null aggregate values, and empty arrays.

### Architecture and timezone handling

- Report routes use the existing JWT `protect` middleware.
- Ownership comes only from `req.user.id`.
- Every report query runs through `withTransaction(callback, req.user.id)`.
- The user's saved timezone is retrieved inside the transaction.
- Current and previous calendar boundaries are calculated from that timezone
  and passed to parameterized PostgreSQL `DATE` predicates.
- Aggregation is performed in PostgreSQL using `COUNT`, `AVG`, `MIN`, `MAX`,
  and grouped JSON summaries. No report tables or schema changes were added.

### Files

- Created `server/src/controllers/reportController.js`.
- Created `server/src/routes/reportRoutes.js`.
- Modified `server/server.js` to mount `/api/reports`.

### Testing results

- Backend startup, syntax, and module import checks passed.
- Health endpoint passed.
- All three report endpoints rejected missing and invalid JWT authentication
  with HTTP 401.
- Empty daily, monthly, and previous-month reports returned HTTP 200 with
  zero counts and empty collections.
- Populated reports passed daily aggregates, monthly aggregates, previous-month
  aggregates, local date/month labels, first/last previous-month boundaries,
  and date/timezone checks.
- Monthly slot grouping regression passed with three populated slots returning
  three slot groups.
- Test readings were created through the API and deleted afterward.
- The first live run was blocked by launching the server from the repository
  root, which loaded the wrong environment; it was rerun successfully from
  `server/`.
- One test assertion initially expected four slot groups although the fixture
  populated three; the corrected regression passed. This was a test-harness
  expectation issue, not an API defect.

### Known limitations

- Complete two-user RLS isolation testing remains scheduled for Phase 13.
- Reports currently expose only the current and previous calendar periods
  required by the assignment; arbitrary date-range filters are not included.

## Phase 8 – Premium Frontend Foundation and Visual Design System

### Implementation

The previously empty `Client/` directory now contains a Vite + React
foundation for the premium Sweety health-tech interface. This phase is visual
only; authentication, dashboard functionality, readings, and report data
integration remain deferred to later phases.

Created:

- `client/package.json`
- `client/vite.config.js`
- `client/.env.example`
- `client/index.html`
- `client/src/main.jsx`
- `client/src/App.jsx`
- `client/src/services/apiClient.js`
- `client/src/layouts/AppShell.jsx`
- `client/src/pages/FoundationPreview.jsx`
- `client/src/pages/PlaceholderPage.jsx`
- `client/src/styles/tokens.css`
- `client/src/styles/global.css`

### Design system

- Warm ivory and paper surfaces.
- Deep forest green primary brand color.
- Muted sage supporting surfaces.
- Charcoal typography with restrained coral accents.
- DM Sans and Playfair Display type pairing.
- Reusable spacing, color, radius, shadow, transition, and focus tokens.
- Semantic navigation, buttons, cards, chart foundations, and preview states.
- No purple AI gradients, neon colors, or unnecessary glassmorphism.

### Visual foundation

- Responsive application shell with sidebar navigation and mobile navigation
  adaptation.
- Premium brand/header area and route placeholders for dashboard, readings,
  and reports.
- Illustrative glucose rhythm card with SVG trend visualization.
- Weekly chart preview, insight card, progress treatment, and health-oriented
  empty state.
- Subtle 3D perspective, layered depth, hover elevation, entrance animation,
  and `prefers-reduced-motion` support.
- Explicit demo-data disclaimer; no real health data or tracking behavior is
  implemented in this phase.

### API and routing foundation

- Central API client reads `VITE_API_URL`.
- `.env.example` contains only the local backend URL placeholder.
- React Router routes are prepared for `/`, `/dashboard`, `/readings`, and
  `/reports`.
- No authentication state, token storage, API calls, or backend changes were
  added.

### Verification

- `npm install` completed with zero reported vulnerabilities.
- `npm run build` passed successfully.
- Vite development server started successfully.
- Browser smoke test passed for the rendered shell, semantic navigation, and
  `/reports` placeholder route.
- Mobile viewport test at 390px confirmed no horizontal overflow.
- Desktop browser rendering was inspected through the integrated browser.

### Known limitations

- Authentication UI and functionality are intentionally deferred to Phase 9.
- Demo chart and insight values are illustrative only.
- Full browser matrix testing across physical devices is not available in this
  environment.

## Phase 9 – Premium Authentication UI and Backend Integration

### Implementation

Added complete frontend authentication experiences without changing the
backend or database architecture:

- Created premium Login and Registration pages.
- Added accessible form fields, validation, inline field errors, backend error
  messages, loading states, password visibility toggles, and mobile layouts.
- Registration sends `name`, normalized `email`, and `password` to
  `POST /api/auth/register`.
- Login sends normalized `email` and `password` to `POST /api/auth/login`.
- Successful responses store only the returned JWT and safe user object; user
  passwords are never persisted.
- Added a small auth context for session state, sign-in, and sign-out.
- Added `ProtectedRoute` and `PublicOnlyRoute`.
- Protected `/dashboard`, `/readings`, and `/reports` while keeping the Phase 8
  visual preview public.
- Preserved the originally requested protected route through login redirect
  state.
- Added authenticated-shell sign-out behavior.
- Central API client now attaches tokens from either local or session storage,
  handles network failures, and clears stored auth state after HTTP 401.

### Persistence strategy

- “Keep me signed in” stores the auth session in `localStorage`.
- If unchecked, the session uses `sessionStorage`.
- Only the token and safe backend user response are stored.
- No refresh-token functionality was introduced because the backend does not
  provide it.

### Files created

- `client/src/context/AuthContext.jsx`
- `client/src/components/ProtectedRoute.jsx`
- `client/src/components/PublicOnlyRoute.jsx`
- `client/src/components/AuthBrandPanel.jsx`
- `client/src/components/PasswordField.jsx`
- `client/src/pages/LoginPage.jsx`
- `client/src/pages/RegisterPage.jsx`

### Files modified

- `client/src/App.jsx`
- `client/src/services/apiClient.js`
- `client/src/layouts/AppShell.jsx`
- `client/src/styles/global.css`

### Testing and verification

- `npm run build` passed after the Phase 9 implementation.
- Browser login page smoke test passed.
- Browser registration validation passed for required fields and password
  confirmation.
- Password show/hide behavior passed.
- Real registration against the existing backend passed and redirected to the
  protected dashboard placeholder.
- Real login against the existing backend passed and restored the session.
- Invalid credentials displayed the backend’s generic `Invalid email or
  password` message.
- Sign-out cleared stored auth state.
- Unauthenticated access to `/dashboard` redirected to `/login`.
- Authenticated access to the placeholder route succeeded.
- Login and registration navigation passed.
- Mobile viewport testing at 390px showed no horizontal overflow.
- Backend remained unchanged.

### Known limitations

- The browser test created one dedicated Phase 9 test account; no production
  data or readings were modified.
- A browser network panel may show the expected HTTP 401 entry when invalid
  credentials are intentionally tested; the application displays the safe
  backend message and does not log secrets.
- Full physical-device testing is not available in this environment.
- Dashboard, readings, and reports functionality remain deferred to later
  phases.

## Phase 10 – Premium Health-Tech Dashboard

### Implementation

Added the first real authenticated dashboard experience without changing the
backend or database architecture:

- Added `DashboardPage` with personalized greeting, current date, add-reading
  action, daily metrics, monthly overview, recent readings, and time-slot
  distribution.
- Connected the dashboard to the existing daily report, monthly report, and
  readings APIs through the centralized authenticated API client.
- Added loading skeletons, API error handling, empty states, and null-safe
  metric rendering so missing data is not displayed as misleading zeroes.
- Added `MetricCard` and `DashboardChart` reusable components.
- Added an inline SVG glucose trend visualization with responsive sizing,
  hover point emphasis, and browser-native data tooltips.
- Used actual readings where available and monthly report summaries as a
  fallback; the dashboard does not fabricate health data.
- Preserved protected routing and the existing authenticated application shell.

### Files created

- `Client/src/components/DashboardChart.jsx`
- `Client/src/components/MetricCard.jsx`
- `Client/src/pages/DashboardPage.jsx`

### Files modified

- `Client/src/App.jsx`
- `Client/src/layouts/AppShell.jsx`
- `Client/src/styles/global.css`

### Testing and verification

- `npm run build` passed from `Client` after the Phase 10 implementation.
- Authenticated browser smoke test passed at `/dashboard`.
- Daily, monthly, and readings API requests completed successfully in the
  browser for the dedicated test account.
- Dashboard rendered all four metric cards and four content panels.
- Empty-state behavior passed for an account with no readings.
- No unexpected browser console errors were observed during the dashboard test.
- Responsive viewport checks passed at 1440px, 1024px, 768px, 390px, and
  320px with no horizontal overflow.
- Dashboard navigation, add-reading links, report links, and sign-out controls
  were present and routed through the existing application shell.
- This environment had no populated readings for the test account, so
  populated chart points, chart hover tooltips, and populated reading rows were
  not browser-verified in this phase.

### Known limitations

- Physical-device testing is not available in this environment.
- A populated-data browser test remains useful for validating chart points and
  reading-row presentation once test data is intentionally available.
- Reading entry, reading management, and reports UI remain future phases.

## Phase 11 – Premium Glucose Reading Management UI

### Implementation

Added the complete authenticated reading-management experience without changing
backend APIs, database schema, RLS policies, or authentication behavior:

- Replaced the protected readings placeholder with `ReadingsPage`.
- Added a premium reading summary with displayed count, latest value/date, and
  cadence state based only on actual API data.
- Added create and edit forms using the existing `POST /api/readings` and
  `PUT /api/readings/:id` contracts.
- Added exact backend-compatible validation for integer glucose values from
  40–600, `YYYY-MM-DD` dates, timezone-aware future-date prevention, and the
  four supported time slots.
- Added loading, empty, success, network, validation, and backend error states,
  including graceful duplicate-conflict messages.
- Added responsive reading history with newest-first/oldest-first sorting,
  date filtering, clear-filter behavior, human-readable slot labels, and
  mobile reading cards.
- Added accessible edit actions and an alert-dialog confirmation flow for
  `DELETE /api/readings/:id`.
- Added a readings-changed event so dashboard data refreshes after create,
  update, or delete without a full-page reload.
- Added lightweight modal entrance, hover, skeleton, and reduced-motion styles
  consistent with the existing Sweety visual system.

### Files created

- `Client/src/pages/ReadingsPage.jsx`

### Files modified

- `Client/src/App.jsx`
- `Client/src/pages/DashboardPage.jsx`
- `Client/src/styles/global.css`
- `docs/PROJECT_CONTEXT.md`

### Testing and verification

- `npm run build` passed from `Client` after the Phase 11 implementation.
- `git diff --check` passed.
- Authenticated browser reading-history load passed against the real backend.
- Valid create flow passed with a real reading and success feedback.
- Valid edit flow passed and the updated glucose value appeared immediately.
- Delete confirmation appeared as an accessible alert dialog.
- Canceling deletion preserved the reading.
- Confirmed deletion removed the reading and displayed success feedback.
- Empty-history state passed after cleanup.
- Responsive viewport checks passed at 1440px, 1024px, 768px, 390px, and
  320px with no horizontal overflow.
- Network failure state was verified when the backend was unavailable, then the
  flow was rerun successfully after starting the backend from `Server`.
- No unexpected browser console errors were observed during the successful
  authenticated CRUD flow.
- No backend files, APIs, schema, RLS policies, or dependencies were changed.

### Known limitations

- Physical-device testing is not available in this environment.
- Date filtering is applied to the authenticated result set in the client
  because the existing GET readings endpoint does not accept filter
  parameters; no unsupported query parameters are sent.
- A dedicated duplicate-conflict browser case and populated multi-reading
  sorting case remain optional follow-up checks; backend conflict messages are
  surfaced directly by the form.

## Phase 12 – Premium Reports and Analytics UI

### Implementation

Added the authenticated Reports experience using only the existing report
endpoints and response fields:

- Replaced the protected reports placeholder with `ReportsPage`.
- Integrated daily, current-month, and previous-month report requests through
  the centralized authenticated API client.
- Added period-aware overview metrics for total readings, average, minimum, and
  maximum glucose with null-safe rendering and consistent mg/dL units.
- Added a reusable inline SVG `ReportTrendChart` for monthly and previous-month
  daily average trends with interactive SVG title tooltips.
- Added monthly daily summaries, actual time-slot distribution counts, and a
  distinct current-day report section.
- Added a previous-month section using backend-provided aggregate values rather
  than recalculating from daily averages.
- Added loading skeletons, network/server error handling, empty chart states,
  empty daily states, and zero-count slot displays.
- Preserved timezone-aware period labels returned by the backend and did not
  add arbitrary date-range controls or unsupported API parameters.
- Added responsive report layouts, lightweight chart transitions, hover depth,
  and reduced-motion behavior using the existing design tokens.

### Files created

- `Client/src/components/ReportTrendChart.jsx`
- `Client/src/pages/ReportsPage.jsx`

### Files modified

- `Client/src/App.jsx`
- `Client/src/styles/global.css`
- `docs/PROJECT_CONTEXT.md`

### Testing and verification

- `npm run build` passed from `Client` after the Phase 12 implementation.
- `git diff --check` passed.
- Authenticated browser loading passed for daily, monthly, and previous-month
  report APIs.
- Empty current-day, current-month, and previous-month report states passed.
- Populated browser verification passed with real readings:
  monthly totals, averages, minimums, maximums, daily summaries, and slot
  counts matched the backend responses.
- Monthly and previous-month SVG charts rendered actual data points and browser
  tooltip titles.
- Reporting periods displayed correctly for November 2026 and October 2026.
- Responsive viewport checks passed at 1440px, 1024px, 768px, 390px, and
  320px with no horizontal overflow.
- No unexpected browser console errors were observed during successful report
  rendering.
- Temporary browser test readings were deleted after verification.
- No backend files, APIs, database schema, RLS policies, or dependencies were
  changed.

### Known limitations

- Physical-device testing is not available in this environment.
- Reports expose only the current daily report, current calendar month, and
  previous calendar month because those are the only supported backend periods.
- Chart rendering uses inline SVG rather than a chart dependency to keep the
  frontend lightweight and consistent with the existing dashboard chart.

## Phase 13 – Complete Testing, Security Audit, and Two-User RLS Isolation

### Verification scope

Phase 13 performed verification only. No product features, backend APIs,
database schema, RLS policies, authentication architecture, or frontend
designs were changed.

### Backend and security results

- Dedicated two-user API and database run: **44/44 checks passed**.
- Middleware and JWT regression run: **10/10 checks passed**.
- Security review: **no concrete vulnerabilities identified**.
- Registration and login checks passed for valid users, duplicate email,
  invalid email, weak password, wrong password, and response safety.
- Protected routes rejected missing, invalid, wrong-scheme, and malformed
  bearer authentication with HTTP 401.
- Reading validation passed for invalid UUIDs, impossible dates, decimal
  glucose values, duplicate slots, and malformed JSON.
- Helmet headers, allowed/disallowed CORS behavior, and the 10 KB JSON body
  limit were verified.
- Unknown routes returned HTTP 404 without exposing sensitive data.

### Two-user RLS isolation results

| Test | User A | User B |
|---|---|---|
| Read own records | Passed | Passed |
| Read other user's records | Denied with 404 | Denied with 404 |
| Update own records | Passed | Passed |
| Update other user's records | Denied with 404 | Denied with 404 |
| Delete own records | Passed during cleanup verification | Passed during cleanup verification |
| Delete other user's records | Denied with 404 | Denied with 404 |
| Own reports contain only own data | Passed | Passed |

Database-level checks also passed:

- `sweety_app` is neither superuser nor `BYPASSRLS`.
- RLS is enabled on `public.users` and `public.glucose_readings`.
- The active glucose-reading policy uses `app.current_user_id`.
- Separate transaction-local contexts exposed exactly two rows to each
  dedicated test user and did not cross-leak records.
- Test-created readings were deleted through the authenticated API after
  verification. Dedicated test users were retained because no safe user-delete
  endpoint exists.

### Frontend and regression results

- Existing frontend production build passed.
- Unauthenticated navigation to `/reports` redirected to `/login`.
- Authenticated report rendering had already passed for empty and populated
  daily, monthly, and previous-month data.
- Existing dashboard and reading-management browser flows remained intact
  during the Phase 13 API verification.
- Responsive checks previously passed at 1440px, 1024px, 768px, 390px, and
  320px with no horizontal overflow.

### Test status and limitations

- **Passed:** 54 targeted backend/security/database checks, plus frontend
  build and protected-route verification.
- **Failed:** None.
- **Not performed:** A production-mode forced HTTP 500 response was not
  induced because the application has no safe test-only failure endpoint.
- **Not performed:** Physical-device and browser matrix testing beyond the
  available automated browser viewports.
- No dependencies were added and no files were changed to fix bugs because
  the verification runs found no genuine defects.

## Phase 14 – UI Polish and Responsiveness

### Implementation

Completed a focused visual and usability refinement pass without changing
backend contracts or product behavior:

- Finalized shared typography, spacing, focus, color, and interaction tokens.
- Added stronger keyboard focus indicators and touch-friendly button sizing.
- Improved the authenticated shell with route-aware breadcrumb labels instead
  of the previous static `Preview` label.
- Added a reusable accessible toast notification system with success/error
  tones, dismiss actions, automatic dismissal, and reduced-motion support.
- Connected reading create and delete success feedback to the toast system
  while preserving the existing inline context feedback.
- Refined loading skeleton motion, card hover depth, form controls, modal
  controls, error surfaces, and mobile toast placement.
- Preserved intentional responsive layouts for dashboard, readings, reports,
  authentication, charts, forms, and history rows.

### Files created

- `Client/src/context/ToastContext.jsx`

### Files modified

- `Client/src/App.jsx`
- `Client/src/layouts/AppShell.jsx`
- `Client/src/pages/ReadingsPage.jsx`
- `Client/src/styles/tokens.css`
- `Client/src/styles/global.css`
- `Docs/PROJECT_CONTEXT.md`

### Testing and verification

- `npm run build` passed from `Client`.
- `git diff --check` passed.
- Authenticated browser shell rendered successfully with route-aware
  `Workspace / Overview` and `Workspace / Readings` breadcrumbs.
- Reading success and delete toasts rendered with accessible status roles and
  dismiss buttons.
- Temporary browser test reading was deleted after verification.
- No unexpected browser console errors were observed.
- Responsive viewport checks passed at 1440px, 1024px, 768px, 390px, and
  320px with no horizontal overflow.
- Existing backend APIs, authentication, database, RLS, and architecture were
  not changed.

### Known limitations

- Physical-device testing is not available in this environment.
- Visual review was performed through the available browser automation and
  viewport checks; native mobile browser rendering remains unverified.

## Phase 15 – Seed Data and Submission Documentation

### Implementation

Prepared the repository for external evaluation:

- Added an idempotent `Server/scripts/seedDemo.js` utility.
- Added `npm run seed:demo` to the backend package scripts.
- The seed creates or updates the dedicated `demo@sweety.local` account and
  inserts 12 sample readings across the current and previous reporting
  periods.
- Seeded readings use the existing database constraints and transaction-local
  `app.current_user_id` setting.
- Added root `.env.example` covering backend, frontend, and optional demo-seed
  variables.
- Added a complete root `README.md` covering installation, database setup,
  RLS requirements, seed usage, execution, routes, testing, evaluation demo
  flow, assumptions, security notes, and future improvements.

### Files created

- `.env.example`
- `README.md`
- `Server/scripts/seedDemo.js`

### Files modified

- `Server/package.json`
- `Docs/PROJECT_CONTEXT.md`

### Verification

- Backend seed script syntax checked with Node.
- `npm run seed:demo` executed successfully against the configured database;
  the demo account was created/updated and 12 readings were verified inside
  its transaction-local RLS context.
- Frontend production build passed.
- Backend syntax checks passed for the server and core controllers.
- `git diff --check` passed.
- The demo seed was designed to be rerunnable without duplicate readings.
- No real secrets were added to environment examples or documentation.

### Notes

- The repository did not contain a versioned SQL migration/bootstrap file, so
  the README documents the existing Supabase schema and RLS prerequisites
  without inventing an unverified migration.
- The user will record and attach the requested 2–3 minute application demo.
