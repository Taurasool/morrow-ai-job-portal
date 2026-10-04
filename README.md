# Morrow AI Job Portal

A beginner-friendly full-stack job portal with separate Candidate and Recruiter workflows, job applications, and a Gemini-powered resume analyzer. The React frontend communicates with a Node.js/Express REST API backed by MongoDB.

## Implemented Features

### Candidate

- Register and sign in with a Candidate account.
- Browse active job listings; search by keyword and filter by category and location.
- View role details and apply once per job.
- View submitted applications and their current status.
- Upload one PDF resume (maximum 5 MB) and analyze it against an active job or a pasted job description.
- View the resume score, matched and missing skills, professional summary, improvement suggestions, and interview questions returned by Gemini.
- View saved resume-analysis history. The PDF and extracted resume text are not stored in the database.

Resume analysis requires a valid Gemini API key configured on the backend. The score is calculated by the backend from required-skill overlap; if target skills cannot be identified, the score is unavailable rather than fabricated. Scanned/image-only PDFs are not OCR-processed and may not contain extractable text.

### Recruiter

- Register and sign in with a Recruiter account.
- Create, edit, and remove owned job listings.
- Review applicants for owned listings and update application status.
- Removing a listing closes it from public search while preserving its existing applications.

## Tech Stack

- **Frontend:** React, TypeScript, HTML, CSS, Bootstrap, Vite
- **Backend:** Node.js, Express, REST APIs
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT, bcryptjs, Candidate/Recruiter role checks
- **Resume processing and AI:** Multer in-memory PDF upload, `pdf-parse` text extraction, official Google `@google/genai` SDK
- **Tools:** npm, Git, Postman

The Gemini API key is read by the backend only. It is not included in frontend code.

## Project Structure

```text
frontend/
  src/
    components/
      common/SiteHeader.tsx
      resume/ResumeUploadForm.tsx
      resume/ResumeAnalysisResults.tsx
      resume/ResumeAnalysisHistory.tsx
    context/AuthContext.tsx
    pages/
      AuthPage.tsx
      HomePage.tsx
      JobBoardPage.tsx
      RecruiterDashboardPage.tsx
      ResumeAnalyzerPage.tsx
    services/
      apiClient.ts
      authService.ts
      jobService.ts
      resumeService.ts
    types/
      auth.ts
      jobs.ts
      resume.ts
    App.tsx
    main.tsx
    styles.css
	package.json
backend/
  config/database.js
  controllers/
    authController.js
    applicationController.js
    jobController.js
  middleware/
    authMiddleware.js
    resumeUpload.js
  models/
    User.js
    Job.js
    Application.js
    ResumeAnalysis.js
  routes/
    authRoutes.js
    jobRoutes.js
    applicationRoutes.js
    resumeRoutes.js
  services/resumeAnalyzerService.js
  server.js
  .env.example
  package.json
README.md
```

## Requirements

- Node.js `20.19+` or `22.12+`
- npm
- MongoDB running locally or a MongoDB connection string
- A Gemini API key for resume analysis

## Installation and Setup

Run these commands from the project root:

```powershell
cd frontend
npm install
cd ..\backend
npm install
cd ..
```

Create `backend/.env` by copying `backend/.env.example`:

```powershell
Copy-Item backend/.env.example backend/.env
```

Edit `backend/.env` locally and set the values below. Do not commit `.env` or paste secrets into chat.

```dotenv
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ai-job-portal
JWT_SECRET=replace-with-a-long-random-secret
GEMINI_API_KEY=replace-with-your-gemini-api-key
GEMINI_MODEL=
```

- `PORT` is optional; the backend defaults to `5000`.
- `MONGODB_URI` must point to a running MongoDB instance.
- `JWT_SECRET` must be replaced with a long, private random value.
- `GEMINI_API_KEY` is required for AI resume analysis and must remain server-side.
- `GEMINI_MODEL` is optional; when blank, the backend uses `gemini-flash-latest`.
- `FRONTEND_URL` is an optional backend CORS override. By default, the backend allows `http://localhost:5173`.

The actual `.env` file is ignored by Git. Only placeholder values belong in `.env.example` or this README.

## Run Locally

Open two terminals at the project root.

Frontend terminal:

```powershell
cd frontend
npm run dev
```

Vite prints the local URL; the configured default port is `5173`.

Backend terminal:

```powershell
cd backend
npm run dev
```

The API listens on `http://localhost:5000`. Check `http://localhost:5000/api/health`; a connected database is reported as `"database":"connected"`.

## API Endpoints

All routes are prefixed with `http://localhost:5000/api`. Protected endpoints require `Authorization: Bearer <token>`.

### Authentication

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Register Candidate or Recruiter and receive a JWT |
| `POST` | `/auth/login` | Public | Sign in and receive a JWT |
| `GET` | `/auth/me` | Authenticated | Return the signed-in user |

### Jobs and Applications

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/jobs` | Public | List active jobs; optional `search`, `category`, and `location` filters |
| `GET` | `/jobs/:jobId` | Public | Get one active job |
| `GET` | `/jobs/mine` | Recruiter | List the recruiter's own postings |
| `POST` | `/jobs` | Recruiter | Create a job posting |
| `PUT` | `/jobs/:jobId` | Owning Recruiter | Update a posting |
| `DELETE` | `/jobs/:jobId` | Owning Recruiter | Close a posting while retaining applications |
| `GET` | `/jobs/:jobId/applicants` | Owning Recruiter | List applicants for a posting |
| `POST` | `/jobs/:jobId/apply` | Candidate | Apply to an active job; duplicate applications are rejected |
| `GET` | `/applications/me` | Candidate | List the candidate's applications |
| `PATCH` | `/applications/:applicationId/status` | Owning Recruiter | Change an application to Under review, Interview, or Rejected |

### Resume Analyzer

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/resumes/analyze` | Candidate | Multipart PDF field `resume` plus exactly one of `jobId` or `jobDescription`; returns a saved analysis |
| `GET` | `/resumes/analyses` | Candidate | List the signed-in candidate's analysis history |
| `GET` | `/resumes/analyses/:analysisId` | Owning Candidate | Get one analysis; other candidates cannot access it |

The upload middleware accepts one PDF up to 5 MB in memory, validates the PDF signature, and rejects files without extractable text. The API stores analysis results, not the uploaded file or raw resume text.

## Build

Run the frontend TypeScript check and production build from the project root:

```powershell
npm run build --prefix frontend
```

## Planned Improvements

These are ideas for future work and are **not implemented**:

- OCR support for scanned/image-only resumes.
- Candidate profile editing and profile-based resume management.
- Pagination and richer search for jobs and analysis history.
- Automated end-to-end tests and production deployment configuration.