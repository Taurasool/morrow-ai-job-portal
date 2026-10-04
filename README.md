# AI Job Portal & Resume Analyzer

A beginner-friendly full-stack project built with React, TypeScript, Express, and MongoDB.

## Architecture

- `frontend/` contains the React single-page application. Pages are composed from reusable components, and API calls are kept in `services/`.
- `backend/` contains the Express REST API. Routes connect HTTP requests to controllers; controllers use models and services for database and business logic.
- MongoDB is accessed through Mongoose models. Authentication hashes passwords with bcryptjs and uses JWTs with role information for authorization.
- Resume parsing and OpenAI requests will run only on the backend. Secrets belong in backend environment variables, never in frontend code.

The frontend and backend are separate applications so their responsibilities and setup remain easy to understand. Feature-specific folders will be added as each module is built.

## Current Setup

The landing page, candidate/recruiter authentication, job browsing/applications, and recruiter job management are implemented. Resume analysis and AI features are not implemented yet.

### Requirements

- Node.js 20 or newer
- npm
- MongoDB for database-backed features (local installation or a hosted MongoDB connection string)

### Install dependencies

Run these commands from the project root:

```bash
cd frontend
npm install
cd ../backend
npm install
```

### Configure the backend

Copy `backend/.env.example` to `backend/.env`, then configure:

- `MONGODB_URI` with a connection string for a running MongoDB instance.
- `JWT_SECRET` with a long, random private value. Replace the example placeholder; never commit the real value.

Registration and login return `503` until MongoDB and `JWT_SECRET` are available. The API defaults to port `5000`; set `VITE_API_URL` in the frontend environment if the API is hosted elsewhere (for example, `https://api.example.com/api`).

### Run the applications

Open two terminals from the project root.

Frontend:

```bash
cd frontend
npm run dev
```

Backend:

```bash
cd backend
npm run dev
```

The Vite development server prints the frontend URL. The backend listens on `http://localhost:5000`; check `http://localhost:5000/api/health` to confirm it is running.

### Authentication endpoints

- `POST /api/auth/register` creates a Candidate or Recruiter account and returns a JWT.
- `POST /api/auth/login` verifies credentials and returns a JWT.
- `GET /api/auth/me` returns the signed-in user and requires `Authorization: Bearer <token>`.

The browser stores the token in local storage for this learning project. Logout removes it from the browser; since JWTs are stateless, a token remains valid until its one-day expiration if copied elsewhere.

### Jobs and applications endpoints

- `GET /api/jobs` lists active roles. Optional `search`, `category`, and `location` query parameters filter the results.
- `GET /api/jobs/:jobId` returns one active job.
- `GET /api/jobs/mine` lists the signed-in recruiter's postings.
- `POST /api/jobs` creates a listing; `PUT /api/jobs/:jobId` updates one. Both require a Recruiter JWT and only the owner can update a listing.
- `DELETE /api/jobs/:jobId` removes an owned listing from public search while preserving its existing applications.
- `GET /api/jobs/:jobId/applicants` lists applicants for an owned job.
- `PATCH /api/applications/:applicationId/status` lets the owner of the associated job set an applicant to Under review, Interview, or Rejected.
- `POST /api/jobs/:jobId/apply` submits an application and requires a Candidate JWT. Duplicate applications are rejected.
- `GET /api/applications/me` returns the signed-in candidate's applications and requires a Candidate JWT.

The job board does not include sample postings. It will show an empty state until recruiters can publish real jobs in the recruiter job management module. Job search also requires the MongoDB connection described above.

Run `npm run build --prefix frontend` from the project root to type-check and build the frontend.

## Build Sequence

We will build one module at a time: shared UI and navigation, authentication, candidate job browsing and applications, recruiter job management, then resume analysis and AI features. Each module will be tested before moving on.