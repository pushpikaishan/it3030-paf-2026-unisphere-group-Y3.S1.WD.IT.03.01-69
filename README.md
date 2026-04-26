# Smart Campus (UniSphere)

Full-stack Smart Campus management system with:
- Backend: Spring Boot 3 (Java, JPA, Spring Security, OAuth2, JWT)
- Frontend: React + Vite
- Database: MySQL 8

## Project Structure

- backend: Spring Boot REST API and authentication
- frontend: React web application

## Tech Stack

- Java 17+ (project property is Java 17)
- Maven Wrapper (included in backend)
- Spring Boot 3.5.x
- MySQL 8.x
- Node.js 20+ (LTS recommended)
- npm 10+
- React 19 + Vite 8

## Prerequisites

Install the following on your machine:

1. Git
2. Java JDK 17 or newer
3. MySQL Server 8.x (running locally)
4. Node.js LTS (includes npm)

## Default Local Ports

- Backend API: http://localhost:8085
- Frontend App: http://localhost:5173

## Backend Setup (Spring Boot)

1. Go to backend folder:

```bash
cd backend
```

2. Update database credentials in application properties:

File: src/main/resources/application.properties

Important keys:
- spring.datasource.url
- spring.datasource.username
- spring.datasource.password

Default URL creates DB automatically if user has permission:
- jdbc:mysql://localhost:3306/unisphere_db?createDatabaseIfNotExist=true...

3. (Recommended) Configure OAuth2 Google credentials for your own app:
- spring.security.oauth2.client.registration.google.client-id
- spring.security.oauth2.client.registration.google.client-secret

4. Run backend:

Windows:

```bash
mvnw.cmd spring-boot:run
```

macOS/Linux:

```bash
./mvnw spring-boot:run
```

Backend should start on port 8085.

## Database Schema Changes (Team Safe)

This project now uses Flyway migrations to keep every developer's database schema in sync automatically.

How it works:
- Migration files live in backend/src/main/resources/db/migration
- Files are versioned like: V1__init_schema.sql, V2__add_booking_table.sql, V3__add_index_to_users.sql
- On backend startup, Flyway runs any new migration files in order
- Each migration runs once per database and is tracked in flyway_schema_history

Team workflow:
1. Never change production/local schema manually in MySQL Workbench for shared changes.
2. Create a new migration SQL file for each schema change.
3. Commit that migration file with your code.
4. Other developers just pull and run backend; schema updates happen automatically.

Notes:
- Existing databases are baselined automatically (baseline-on-migrate=true), so old local DBs can adopt Flyway without reset.
- spring.jpa.hibernate.ddl-auto is set to none to avoid uncontrolled schema drift.

## Frontend Setup (React + Vite)

1. Open a second terminal and go to frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Run dev server:

```bash
npm run dev
```

Frontend should start on http://localhost:5173.

## Run Full Project (Local Development)

Start services in this order:

1. Ensure MySQL is running.
2. Start backend (port 8085).
3. Start frontend (port 5173).
4. Open http://localhost:5173 in browser.

Notes:
- Frontend proxies /api and /uploads to backend via Vite config.
- CORS is configured to allow http://localhost:5173.

## Useful Commands

Backend:

```bash
cd backend
mvnw.cmd test
mvnw.cmd clean package
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
npm run preview
```

## Quick Health Checks

After startup:

1. Backend:
- Open http://localhost:8085/api/me
- Expected: JSON response (authenticated false if not logged in)

2. Frontend:
- Open http://localhost:5173
- Expected: login/landing UI loads

## Common Issues and Fixes

1. Backend fails to connect to MySQL
- Check MySQL service is running.
- Confirm username/password in backend/src/main/resources/application.properties.
- Confirm port 3306 is open and accessible.

2. Frontend cannot call API
- Confirm backend is running on http://localhost:8085.
- Confirm frontend started with npm run dev from frontend folder.
- Confirm Vite proxy config exists in frontend/vite.config.js.

3. OAuth login redirect mismatch
- Ensure Google OAuth app redirect URI matches backend callback:
  - http://localhost:8085/login/oauth2/code/google
- Ensure app.oauth2.redirect-uri points to frontend callback:
  - http://localhost:5173/oauth/callback

4. Port already in use
- Change server.port in backend application properties.
- Or stop process using 8085/5173 and restart.

## Security Notes

- Do not commit real production secrets in source control.
- Move database password and OAuth secrets to environment variables before production deployment.

## Current Status Verified

On this machine, both commands start successfully:
- backend: mvnw.cmd -DskipTests spring-boot:run
- frontend: npm run dev

## Team Onboarding Checklist

1. Install Java, MySQL, Node.js.
2. Clone repository.
3. Configure backend application properties.
4. Start backend.
5. Install frontend packages and start frontend.
6. Verify API and UI are reachable.
