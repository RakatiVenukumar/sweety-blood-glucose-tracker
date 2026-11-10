# Sweety – Blood Glucose Tracker

Sweety is a premium health-tech web application for recording blood glucose
readings, viewing personal trends, and reviewing daily and monthly reports.
It is built as a full-stack React and Express application with PostgreSQL
managed through Supabase.

## Submission

- **Repository:** https://github.com/RakatiVenukumar/sweety-blood-glucose-tracker
- **Demo video:** Add the 2–3 minute screen recording link here before
  submission.
- **Screenshots:** Add optional screenshot links here if required by the
  evaluator.

## Features

- Registration and login with bcrypt password hashing and JWT authentication.
- Protected dashboard, readings, and reports routes.
- Glucose reading create, list, update, and delete operations.
- Four supported reading slots: morning, after breakfast, after lunch, and
  after dinner.
- Duplicate date/time-slot prevention.
- Timezone-aware future-date validation.
- Selected-date daily reports, month-to-date reports, and previous-month
  reports.
- Interactive inline SVG glucose trend charts.
- Responsive premium UI for desktop, tablet, and mobile.
- Loading, empty, validation, error, and toast feedback states.
- PostgreSQL row-level security (RLS) with authenticated user isolation.

## Technology

- **Frontend:** React 19, Vite, React Router
- **Backend:** Node.js, Express 5
- **Database:** PostgreSQL on Supabase
- **Authentication:** Custom Express authentication, bcrypt, JWT
- **Security:** Helmet, CORS allowlist, request-size limits, PostgreSQL RLS
- **Charts:** Lightweight inline SVG; no chart dependency is required

## Requirements

- Node.js 20+ recommended
- npm 10+ recommended
- A Supabase PostgreSQL database
- Git

## Project structure

```text
Sweety/
├── Client/                 # React/Vite frontend
│   ├── src/
│   ├── .env.example
│   └── package.json
├── Server/                 # Express API
│   ├── src/
│   ├── scripts/seedDemo.js
│   ├── certs/
│   ├── .env.example
│   └── package.json
├── docs/PROJECT_CONTEXT.md # Phase-by-phase project record
├── .env.example            # Root environment reference
└── README.md
```

## Installation

Clone the repository and install dependencies in both applications:

```powershell
git clone https://github.com/RakatiVenukumar/sweety-blood-glucose-tracker.git
cd sweety-blood-glucose-tracker

cd Server
npm install

cd ..\Client
npm install
```

## Environment configuration

The repository contains:

- `.env.example` at the repository root as a complete reference.
- `Server/.env.example` for backend variables.
- `Client/.env.example` for the Vite frontend variable.

Create the actual files locally:

```powershell
Copy-Item Server\.env.example Server\.env
Copy-Item Client\.env.example Client\.env
```

Edit `Server/.env`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=your_supabase_postgresql_connection_string
JWT_SECRET=use_a_long_random_secret
JWT_EXPIRES_IN=1d
BCRYPT_SALT_ROUNDS=12
```

Edit `Client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Optional demo-seed overrides can be placed in `Server/.env`:

```env
DEMO_USER_EMAIL=demo@sweety.local
DEMO_USER_PASSWORD=SweetyDemo123!
DEMO_USER_NAME=Sweety Demo
DEMO_USER_TIMEZONE=Asia/Kolkata
```

Never commit `.env` files, database URLs, JWT secrets, Supabase keys, or
passwords. The example files contain placeholders only.

## Database setup

1. Create a Supabase PostgreSQL project.
2. Obtain a PostgreSQL connection string for the backend.
3. Ensure the connection uses the supplied certificate:
   `Server/certs/prod-supabase.cer`.
4. Create the application schema described below in the Supabase SQL editor.
5. Create the restricted application role and grants.
6. Enable and verify RLS before running the API or seed script.

### Required tables

The backend expects these tables in the `public` schema:

#### `public.users`

- `id UUID PRIMARY KEY`
- `name VARCHAR(100) NOT NULL`
- `email VARCHAR(255) NOT NULL`
- `password_hash TEXT NOT NULL`
- `timezone VARCHAR(64) NOT NULL`
- `created_at TIMESTAMPTZ`
- `updated_at TIMESTAMPTZ`

Email uniqueness is case-insensitive. The default application timezone is
`Asia/Kolkata`.

#### `public.glucose_readings`

- `id UUID PRIMARY KEY`
- `user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE`
- `reading_date DATE NOT NULL`
- `time_slot VARCHAR(30) NOT NULL`
- `glucose_value INTEGER NOT NULL`
- `created_at TIMESTAMPTZ`
- `updated_at TIMESTAMPTZ`

The database must enforce:

- `glucose_value` between 40 and 600.
- `time_slot` in `morning`, `after_breakfast`, `after_lunch`, or
  `after_dinner`.
- Unique `(user_id, reading_date, time_slot)`.
- Case-insensitive unique user email.

The project also uses timestamp triggers for `updated_at`.

### RLS and application role

The backend uses the restricted PostgreSQL role `sweety_app`. It must not be a
superuser and must not have `BYPASSRLS`.

Enable RLS on `public.users` and `public.glucose_readings`. The readings policy
must restrict rows using the transaction-local setting set by the backend:

```sql
(
  user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
)
```

The backend sets `app.current_user_id` inside each transaction through
`withTransaction(callback, req.user.id)`. Do not disable RLS or use a
privileged role to validate user isolation.

## Seed demo data

The idempotent demo seed creates or updates one clearly identified demo user
and inserts 12 sample readings across the current and previous reporting
periods. Existing demo readings with the same date and time slot are updated,
so rerunning the command does not create duplicates.

Run it from the `Server` directory:

```powershell
cd Server
npm run seed:demo
```

Default demo credentials:

```text
Email:    demo@sweety.local
Password: SweetyDemo123!
```

Change these values through the `DEMO_USER_*` environment variables before
seeding if the default demo account already exists in your database. The seed
script is intended for a development/evaluation database, not production.

## Running the application

Start the backend from `Server` so its `.env` file is loaded:

```powershell
cd Server
npm run dev
```

The API runs at `http://localhost:5000`.

In a second terminal, start the frontend:

```powershell
cd Client
npm run dev
```

The frontend runs at the Vite URL shown in the terminal, normally
`http://localhost:5173`.

For a production frontend build:

```powershell
cd Client
npm run build
npm run preview
```

## Main routes

### Frontend routes

- `/` – public visual foundation preview
- `/login` – login
- `/register` – registration
- `/dashboard` – protected overview
- `/readings` – protected reading management
- `/reports` – protected reports and analytics

### API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/readings`
- `GET /api/readings`
- `GET /api/readings/:id`
- `PUT /api/readings/:id`
- `DELETE /api/readings/:id`
- `GET /api/reports/daily`
- `GET /api/reports/daily?date=YYYY-MM-DD`
- `GET /api/reports/monthly`
- `GET /api/reports/monthly?date=YYYY-MM-DD`
- `GET /api/reports/previous-month`
- `GET /api/health`

Protected endpoints require:

```text
Authorization: Bearer <jwt>
```

The optional `date` query parameter is validated as `YYYY-MM-DD` in the
authenticated user's timezone. It selects the daily report date and changes
the monthly report to month-to-date through that date. Without it, reports use
the current date in the user's saved timezone. The previous-month endpoint
always covers the complete previous calendar month.

## Testing and verification commands

There is no separate automated test runner configured in the current
repository. Use these commands for the available verification layers:

### Frontend build and formatting checks

```powershell
cd Client
npm run build

cd ..
git diff --check
```

### Backend syntax checks

```powershell
cd Server
node --check server.js
node --check src/controllers/authController.js
node --check src/controllers/readingController.js
node --check src/controllers/reportController.js
node --check src/middleware/authMiddleware.js
```

### Manual/API verification

Run the backend from `Server`, then verify:

- Health endpoint.
- Registration and login.
- Protected-route redirect.
- Reading create, edit, duplicate conflict, and delete confirmation.
- Daily, monthly, and previous-month reports.
- Selected-date daily and month-to-date report ranges.
- Empty states and network-error states.
- Responsive layouts at desktop, tablet, and mobile widths.

Phase 13 also verified 54 targeted backend, security, database, and RLS checks,
including two-user cross-access denial and direct database-level isolation.
The detailed record is in `docs/PROJECT_CONTEXT.md`.

## Evaluation demo flow

For the 2–3 minute recording:

1. Start the server and client.
2. Log in with the demo account.
3. Show the dashboard and its empty or populated metrics.
4. Open Readings and add a reading.
5. Edit the reading and show the success feedback.
6. Show the confirmation dialog, then delete the test reading.
7. Open Reports and show daily, monthly, previous-month metrics, charts, and
   empty/populated states.
8. Resize or show the mobile layout briefly.
9. Mention that readings are user-scoped through JWT authentication and RLS.

Do not show `.env` files, database URLs, JWT secrets, or private credentials in
the recording.

## Notes, assumptions, and future improvements

### Assumptions

- Supabase PostgreSQL is the source of truth for users and readings.
- The backend is started from `Server` and the frontend from `Client`.
- Reading dates are calendar dates interpreted using each user's saved IANA
  timezone.
- Reports use the selected date for daily results and month-to-date results,
  while the previous-month report covers the complete previous calendar month.
- The demo seed is for evaluation/development data and must not be used as a
  production data migration.
- Sweety provides tracking tools and is not medical advice.

### Future improvements

- Add versioned SQL migrations and a dedicated schema bootstrap command.
- Add an automated test runner with API integration, frontend component, and
  accessibility tests.
- Add refresh-token rotation and stronger production session management.
- Add password reset, email verification, and account settings.
- Add configurable historical report periods beyond the selected date.
- Add exportable PDF/CSV reports and clinician-sharing controls.
- Add monitoring, structured production logging, and CI/CD checks.
- Add native-device testing and broader visual regression coverage.

## Security notes

- Passwords are hashed with bcrypt and are never returned by the API.
- JWTs contain the authenticated user identity in the `sub` claim.
- The frontend never submits a user ID for ownership decisions.
- Database reads and writes use transaction-scoped RLS context.
- CORS, Helmet, JSON body limits, validation, and centralized error handling
  are enabled by the backend.
- Do not use real patient data in a demo or commit secrets to the repository.

## License

This project is currently intended as an educational and hiring-assignment
demonstration. Add a project-specific license before public distribution if
required.
