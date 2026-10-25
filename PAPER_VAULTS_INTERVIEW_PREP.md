# 📄 PAPER VAULTS — Interview Preparation (Code-Verified)

> **Last updated:** 2026-10-07
> **Prepared for:** Accenture Interview
> **Verification method:** Every claim below was verified by reading the actual codebase.
> ⚠️ Items marked **"NOT FOUND IN CODE"** mean the feature is NOT in the codebase — do NOT claim them.

---

## A) PROJECT INTRODUCTION

---

### 🎤 30-Second Pitch (English)

> Paper Vaults is a full-stack web platform I built where college students can find, upload, and share previous-year question papers. Students upload PDFs without any registration, and every upload goes through an admin approval workflow — only approved papers become publicly visible. I used React with Vite on the frontend, Express.js on the backend deployed as a serverless function on Netlify, MongoDB Atlas for data, and GridFS for storing large PDF files. The whole thing runs serverless with zero-cost hosting.

---

### 🎤 2-Minute Pitch (English)

> Paper Vaults started from a real problem I faced — during exams, finding previous-year question papers is a nightmare. They're scattered across WhatsApp groups, Google Drive links, and you have to chase seniors. I wanted to build one centralized, searchable library.
>
> The platform has two sides. On the public side, any student can browse papers filtered by department, semester, exam type like MST1, MST2, EST, and year. They can also search by subject name. There's an upload form where anyone can submit a PDF — no login required.
>
> On the admin side, I built a protected dashboard with JWT authentication. The admin reviews pending uploads and can Approve, Reject, or Delete them. There's also an inline edit feature where the admin can update metadata like subject name, department, semester directly in the dashboard without opening a separate page. Only approved papers show up in the public listing.
>
> For the tech stack — the frontend is React with Vite as the build tool and Tailwind CSS v4 for styling. The backend is Express.js, but instead of running a traditional server, I wrapped it with `serverless-http` and deployed it as a Netlify Function. So the entire app — frontend and API — deploys as a single unit on Netlify. I also have Vercel config files as an alternate deployment option.
>
> PDF files are stored using MongoDB GridFS, which splits large files into 255KB chunks. This bypasses MongoDB's 16MB document limit and lets me stream PDFs directly to the browser without loading the entire file into server memory. The database is MongoDB Atlas, so it's cloud-hosted with no local setup.
>
> For authentication, I used JWT — the admin logs in, gets a token stored in localStorage, and that token is attached to every protected API request via an Axios interceptor. A middleware on the backend verifies the token before allowing any admin action.
>
> One interesting challenge was handling database connections in serverless — each function invocation could potentially open a new connection. I solved this by caching the connection using a module-level `isConnected` flag that persists across warm invocations.

---

### 🎤 Hinglish Version (For Your Understanding)

> Paper Vaults ek full-stack project hai jo maine khud banaya. Problem ye thi ki exam ke time purane papers dhoondhne ke liye WhatsApp groups, seniors, aur Drive links pe depend karna padta tha — sab bikhre hote the. To maine ek centralized platform banaya jahan students papers search kar sakte hain, upload kar sakte hain, aur download kar sakte hain.
>
> Koi bhi student bina login ke paper upload kar sakta hai, lekin har upload pehle "pending" status mein jaata hai. Admin login karke dashboard mein papers ko review karta hai — approve ya reject. Sirf approved papers public listing mein dikhte hain.
>
> Frontend React + Vite + Tailwind CSS v4 se banaya. Backend Express.js hai lekin traditional server nahi chalaya — `serverless-http` se wrap karke Netlify Function ke taur pe deploy kiya. Matlab frontend aur backend dono ek hi Netlify deployment mein hain.
>
> PDFs ke liye MongoDB GridFS use kiya kyunki MongoDB ka normal document 16MB tak hi hota hai. GridFS file ko chhote 255KB ke chunks mein todta hai aur stream karke bhejta hai — server ki memory nahi bharta.
>
> Authentication JWT se ki hai — admin login karta hai, token milta hai, wo localStorage mein store hota hai. Har protected request mein Axios interceptor wo token header mein bhejta hai. Backend pe middleware token verify karta hai.
>
> Serverless mein ek challenge tha — har invocation pe naya DB connection khulta. Maine connection caching implement ki — `isConnected` flag se check karta hoon ki connection already hai to reuse karo, naya mat kholo.
>
> Search mein 4 dropdown filters hain (department, semester, exam type, year) aur ek subject name search bar. Ye sab **server-side** query hain — frontend filter parameters API ko bhejta hai, aur backend MongoDB query mein filter lagata hai. Debounce nahi lagaya — dropdown filters pe useEffect se automatic call hoti hai, aur search ke liye button click pe call hoti hai.

---

## B) ACTUAL TECH STACK (Code-Verified)

| Technology | Kyun Use Kiya | Kahan Use Hua (File) |
|---|---|---|
| **React.js v19** | Component-based UI, virtual DOM for fast re-renders, huge ecosystem | All `.jsx` files in `frontend/src/` |
| **Vite v8** | Lightning-fast dev server and build tool, HMR support, better than CRA | `frontend/vite.config.js` |
| **Tailwind CSS v4** | Utility-first CSS framework, rapid styling via `@tailwindcss/vite` plugin | `frontend/src/index.css` (`@import "tailwindcss"`), all JSX class names |
| **React Router DOM v7** | Client-side SPA routing without page reloads | `frontend/src/App.jsx` — Routes for Home, Papers, Upload, Admin Login, Dashboard |
| **Axios** | HTTP client for API calls, supports interceptors for auto-attaching JWT | `frontend/src/services/api.js` |
| **Node.js** | JavaScript runtime for backend, same language front and back | `frontend/netlify/functions/api.js` |
| **Express.js v4** | Minimal, flexible web framework for REST APIs, easy middleware pattern | `frontend/netlify/functions/api.js`, `backend/server.js` |
| **MongoDB Atlas** | Cloud-managed NoSQL database, flexible schema, free tier, no local DB setup | `MONGODB_URI` in `.env` (atlas connection string) |
| **Mongoose v8** | ODM for MongoDB, schema validation, model abstraction | `frontend/netlify/functions/api.js` (inline schema), `backend/models/Paper.js` |
| **GridFS** | MongoDB's spec for storing files >16MB, chunked binary storage + streaming | `frontend/netlify/functions/api.js` (GridFSBucket), `backend/config/db.js` |
| **Multer** | Middleware for handling multipart/form-data (file uploads) | `frontend/netlify/functions/api.js` (memoryStorage), `backend/routes/paperRoutes.js` |
| **JWT (jsonwebtoken)** | Stateless authentication, no server-side sessions needed, serverless-friendly | `frontend/netlify/functions/api.js` (sign + verify), `backend/controllers/authController.js` |
| **serverless-http** | Wraps Express app into a serverless function handler (Netlify/Vercel compatible) | `frontend/netlify/functions/api.js` (line 496-498) |
| **Netlify** | Primary deployment platform — functions + static hosting, free tier | `frontend/netlify.toml`, `frontend/netlify/functions/api.js` |
| **Vercel** | Alternate/secondary deployment platform | `vercel.json` (root), `frontend/vercel.json` |
| **CORS** | Cross-origin resource sharing middleware | `frontend/netlify/functions/api.js`, `backend/server.js` |
| **dotenv** | Load environment variables from `.env` files | `backend/server.js` |
| **Git/GitHub** | Version control | `.gitignore`, 10 commits on single `main` branch |

---

## C) [VERIFY] POINTS — ANSWERS FROM CODE

---

### 1. Search Filters — Kaun Kaun Se Hain? Client-Side Ya Server-Side? Debounce?

**✅ VERIFIED FROM CODE** — File: `frontend/src/pages/BrowsePapers.jsx` + `frontend/netlify/functions/api.js`

**Filters (5 total):**
| Filter | Type | UI Element |
|---|---|---|
| Department | Dropdown | CSE, ECE, EE, ME, CE, IT, MCA, MBA |
| Semester | Dropdown | 1–8 |
| Exam Type | Dropdown | MST1, MST2, EST |
| Year | Dropdown | 2018 to current year |
| Subject Name | Text input | Search bar with "Search" button |

**Server-side ya Client-side?**
- **SERVER-SIDE** ✅ — Frontend sends filter params as query parameters to `GET /api/papers?department=CSE&semester=3&...`, backend builds a MongoDB filter object and runs `Paper.find(filter)`.
- Backend code (`api.js` line 271-283): builds `filter` from `req.query`, uses `$regex` with `$options: 'i'` for case-insensitive subject search.

**Debounce?**
- **NO DEBOUNCE** ❌ — The 4 dropdown filters trigger `fetchPapers()` via `useEffect` dependency array (`[department, semester, examType, year]`). Each dropdown change immediately fires an API call.
- The text search does NOT auto-trigger — user must click the "Search" button (form `onSubmit`).
- **Interview answer:** "No debounce is implemented currently. Dropdown changes instantly trigger a server query. For the text search, it's manual — the user clicks a Search button. If I had to optimize, I'd add a `setTimeout`-based debounce on the text input to avoid excessive API calls."

---

### 2. File Upload Middleware — Multer Ya Kuch Aur?

**✅ CONFIRMED: Multer** — File: `frontend/netlify/functions/api.js` (lines 136-147), `backend/routes/paperRoutes.js` (lines 3, 18-29)

- Uses `multer.memoryStorage()` — files are stored in memory (as Buffer), not on disk.
- Multer config:
  - **Serverless function (`api.js`):** `fileSize: 5 * 1024 * 1024` → **5MB limit**
  - **Standalone backend (`paperRoutes.js`):** `fileSize: 10 * 1024 * 1024` → **10MB limit**
- `fileFilter` checks `file.mimetype === 'application/pdf'` — only PDFs allowed.
- Field name: `upload.single('pdfFile')` — single file upload with field name `pdfFile`.

---

### 3. JWT Client Pe Kahan Store Hota Hai — localStorage Ya Cookie?

**✅ CONFIRMED: localStorage** — File: `frontend/src/pages/AdminLogin.jsx` (line 25), `frontend/src/services/api.js` (line 9)

- On login success: `localStorage.setItem('adminToken', data.token)`
- On every request: Axios interceptor reads `localStorage.getItem('adminToken')` and sets `Authorization: Bearer <token>` header.
- Logout: `localStorage.removeItem('adminToken')` — `frontend/src/components/Navbar.jsx` (line 10)
- ProtectedRoute checks: `localStorage.getItem('adminToken')` — `frontend/src/components/ProtectedRoute.jsx` (line 4)

**Security tradeoff (interview ke liye):**
- localStorage is vulnerable to XSS attacks (any injected script can read the token).
- httpOnly cookie would be safer against XSS, but needs CSRF protection.
- **Your honest answer:** "I used localStorage for simplicity. In production, I'd switch to httpOnly secure cookies with short-lived access tokens and refresh tokens."

---

### 4. Deployment Platform — Vercel/Netlify/Other?

**✅ CONFIRMED: BOTH Netlify (Primary) and Vercel (Alternate)**

**Netlify (Primary):**
- `frontend/netlify.toml` — build config, function redirects (`/api/*` → `/.netlify/functions/api/:splat`)
- `frontend/netlify/functions/api.js` — the actual serverless function (500 lines, entire backend)
- `serverless-http` wraps Express app → `module.exports.handler = serverless(app, { binary: ['application/pdf'] })`

**Vercel (Alternate):**
- `vercel.json` (root) — routes `/api/*` to `api/index.js`, static files from `frontend/dist`
- `api/index.js` — just re-exports the Netlify function: `const app = require('../frontend/netlify/functions/api.js')`
- `frontend/vercel.json` — simpler rewrite config

**Interview answer:** "My primary deployment is on Netlify using serverless functions. I also configured Vercel as an alternate deployment — both configs exist in the repo. The backend code is the same; the only difference is how each platform routes API requests."

---

### 5. Serverless Mein DB Connection Caching Kiya Hai Ya Nahi?

**✅ YES — Connection Caching Implemented** — File: `frontend/netlify/functions/api.js` (lines 28-51)

```javascript
let isConnected = false;
let gridFSBucket = null;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1 && gridFSBucket) {
    return; // Reuse existing connection
  }
  // ... connect fresh only if needed
};
```

- Module-level variables `isConnected` and `gridFSBucket` persist across warm invocations.
- Every request runs through middleware (`app.use`) that calls `connectDB()` — but if already connected, it returns immediately.
- The `mongoose.connection.readyState === 1` check ensures the connection is actually alive (not just flagged).
- Also handles `mongoose.models.Paper || mongoose.model('Paper', paperSchema)` to prevent model recompilation in warm starts (line 110).

**Interview answer:** "Yes, I implemented connection caching. In serverless, each function invocation could open a new MongoDB connection, which is expensive. I use module-level variables that persist across warm invocations — so if the connection already exists and is alive, I reuse it. I also check `mongoose.connection.readyState` to ensure the connection is actually healthy."

---

### 6. Upload Size Limit Ka Issue Hai Ya Nahi?

**✅ YES — There IS a Size Limit Issue**

- **Netlify function response limit** is ~6MB for synchronous responses.
- The serverless function's Multer config explicitly sets `fileSize: 5 * 1024 * 1024` (5MB) — the comment in code says: *"5MB limit (Netlify function response limit is 6MB)"* (`api.js` line 139).
- The standalone backend allows 10MB (`paperRoutes.js` line 21).
- The frontend upload form shows: *"Only PDF files allowed. Max size: 10MB."* (`UploadPaper.jsx` line 197) — **this is slightly misleading** since the serverless function actually limits to 5MB.

**Interview answer:** "Yes, this is a real constraint. Netlify's serverless functions have a ~6MB payload limit on request/response bodies. So I set the Multer file size limit to 5MB in the serverless function to stay within bounds. For larger PDFs, I'd need to switch to direct-to-S3 uploads using presigned URLs, bypassing the serverless function for the file transfer."

---

### 7. Paper Model Ke Exact Fields Kya Hain?

**✅ VERIFIED** — File: `backend/models/Paper.js` + `frontend/netlify/functions/api.js` (lines 63-107)

| Field | Type | Validations | Notes |
|---|---|---|---|
| `department` | String | Required, trimmed | e.g., "CSE", "ECE" |
| `subjectName` | String | Required, trimmed | e.g., "Data Structures" |
| `semester` | Number | Required, min: 1, max: 8 | |
| `examType` | String | Required, enum: `['MST1', 'MST2', 'EST']` | |
| `year` | Number | Required | e.g., 2024 |
| `pdfFileId` | ObjectId | Required | Reference to GridFS file in `papers.files` |
| `pdfName` | String | Required | Original filename of uploaded PDF |
| `status` | String | enum: `['pending', 'approved', 'rejected']`, default: `'pending'` | Controls visibility |
| `createdAt` | Date | Auto (timestamps: true) | Mongoose auto-field |
| `updatedAt` | Date | Auto (timestamps: true) | Mongoose auto-field |

**Important notes:**
- There is NO `title` field — the document references use `subjectName` instead.
- There is NO `uploadedBy` field — uploads are anonymous (no user accounts).
- There is NO `course` field — it uses `department` instead.
- The field is `pdfFileId` (not `fileId` as mentioned in your notes).

---

### 8. Git Commit / Branch Pattern Kaisa Hai?

**✅ VERIFIED** — From `git log` and `git branch`

**Branches:** Single branch — `main` only. No feature branches.

**Commits (10 total, oldest to newest):**

| # | Commit Message | What It Did |
|---|---|---|
| 1 | `PaperVault First commit 2026-06-22` | Initial full project (frontend + backend) |
| 2 | `Update API base URL config for production deployment` | Production URL update |
| 3 | `Migrate backend to Netlify Serverless Functions - single deployment` | Major: moved backend into Netlify function |
| 4 | `Add serverless backend dependencies to frontend package.json for Netlify bundling` | Dependency fix for Netlify |
| 5 | `Fix MongoDB Atlas connection issue in Netlify Function by removing custom TLS options...` | Bug fix: TLS + env sanitization |
| 6 | `Set serverSelectionTimeoutMS to 5000 in Netlify function connectDB` | Timeout config |
| 7 | `Add Vercel deployment support with vercel.json and api/index.js entry point` | Vercel alternate deploy |
| 8 | `Add root-level Vercel configuration files...` | Vercel root deploy config |
| 9 | `Ensure GridFS bucket is initialized on cached connection hot starts` | Bug fix: connection caching |
| 10 | `Add Manage Database section to Admin Dashboard with update/delete capabilities...` | Feature: admin edit + fix PDF binary |

**Interview answer:** "I worked on a single `main` branch. My commits show a clear progression — first the full MVP, then migration to serverless, then fixing deployment issues like connection caching and TLS configuration, and finally adding features like the admin edit panel. In a team setting, I'd use feature branches and pull requests."

---

## D) DOCUMENT MEIN LIKHA PAR CODE MEIN NAHI — DANGER LIST 🚨

> **INTERVIEW MEIN YE CLAIM MAT KARNA** jab tak specifically poochha na jaaye, aur tab bhi bolo "I haven't implemented this yet, but I'd add it."

| # | Claim in Your Notes | Reality in Code |
|---|---|---|
| 1 | **"Skeleton loaders"** | **NOT FOUND IN CODE** ❌ — The code shows simple text: `"Loading papers..."` (`BrowsePapers.jsx` line 144, `AdminDashboard.jsx` line 186). No skeleton/shimmer UI. |
| 2 | **"Password compared with a hash"** (Q5 answer) | **NOT FOUND IN CODE** ❌ — Admin password is stored as PLAINTEXT in `.env` (`ADMIN_PASSWORD=Vikesh@123`). Login does direct string comparison: `password !== process.env.ADMIN_PASSWORD`. No bcrypt, no hashing. |
| 3 | **"title" field in Paper model** | **NOT IN CODE** ❌ — The model uses `subjectName`, not `title`. |
| 4 | **"course" field in Paper model** | **NOT IN CODE** ❌ — The model uses `department`, not `course`. |
| 5 | **"fileId" field name** | **NOT IN CODE** ❌ — The actual field is `pdfFileId`. |
| 6 | **"uploadedBy / uploadedAt" fields** | `uploadedBy`: **NOT IN CODE** ❌ (no user accounts). `uploadedAt`: partially — `createdAt` exists via `timestamps: true`, but there's no explicit `uploadedAt` field. |
| 7 | **"Responsive search filters: user type karte hi list update hoti hai"** (for text search) | **PARTIALLY TRUE** — Dropdown filter changes auto-trigger API calls (via useEffect). BUT text search requires clicking the "Search" button — it does NOT update as you type. |
| 8 | **"Admin credentials" as a separate model/collection** | **NOT IN CODE** ❌ — Admin credentials are hardcoded in `.env` file. There is no Admin model or admin collection in MongoDB. |
| 9 | **"inline metadata update (table mein hi edit karke save)"** described as table | **PARTIALLY TRUE** — Inline edit exists in `AdminDashboard.jsx`, but the dashboard uses CARD layout, not a table. The edit form appears inside the card. |

---

## E) INTERVIEW Q&A — 30 Questions (Code-Verified Answers)

---

### PROJECT-SPECIFIC

**Q1. Explain Paper Vaults in 30 seconds.**
> Paper Vaults is a full-stack platform where students can find, upload, and share previous-year question papers. Uploads go through an admin approval workflow so only verified papers become public. I built the frontend with React and Vite, the backend with Express.js deployed as a Netlify serverless function, MongoDB Atlas for data, and GridFS for PDF storage. The entire app deploys as a single unit with zero-cost hosting.

**Q2. Why did you build this project?**
> During exams, students depend on WhatsApp groups and seniors to get old papers, and those are scattered and hard to find. I wanted one centralized place with proper search filters and quality control through admin moderation.

**Q3. Walk me through the architecture.**
> The frontend is a React SPA that talks to a REST API. The API is an Express.js app wrapped with `serverless-http`, deployed as a Netlify Function. So the frontend (static files) and the API (serverless function) deploy together on Netlify. The API connects to MongoDB Atlas — paper metadata goes into a `papers` collection and PDF binaries go into GridFS (`papers.files` + `papers.chunks` collections). All requests from the React app go through Axios to `/api/*`, which Netlify redirects to `/.netlify/functions/api/*`.

**Q4. What are all the API routes?**
> Public routes:
> - `POST /api/papers/upload` — upload a paper (multipart/form-data)
> - `GET /api/papers` — get approved papers (with optional query filters)
> - `GET /api/papers/:id/view` — stream PDF inline in browser
> - `GET /api/papers/:id/download` — download PDF as attachment
> - `POST /api/auth/login` — admin login
> - `GET /api/health` — health check
>
> Protected routes (JWT required):
> - `GET /api/papers/pending` — list pending papers
> - `GET /api/papers/all` — list all papers (all statuses)
> - `PUT /api/papers/:id/approve` — approve a paper
> - `PUT /api/papers/:id/reject` — reject a paper
> - `PUT /api/papers/:id` — update paper metadata
> - `DELETE /api/papers/:id` — delete paper + its GridFS file

**Q5. What CRUD operations does your app support?**
> Full CRUD: **Create** (upload paper), **Read** (browse/search papers, view PDF), **Update** (admin can edit metadata inline — department, subject, semester, exam type, year), **Delete** (admin can delete paper and its associated GridFS file).

---

### GRIDFS & MONGODB

**Q6. What is GridFS and why did you use it?**
> GridFS is MongoDB's specification for storing files that exceed the 16MB BSON document limit. It splits a file into chunks of 255KB by default and stores them in two collections: `papers.files` (file metadata — filename, size, upload date) and `papers.chunks` (the actual binary data pieces). I used it because PDFs can be large, and GridFS lets me stream files to the browser without loading the entire file into server memory — this is critical in a serverless environment where memory and response time are limited.

**Q7. How do you upload a file to GridFS?**
> The user submits a form with a PDF. Multer (memory storage) receives the file as a Buffer in `req.file.buffer`. I create a Readable stream from this buffer using `Readable.from(req.file.buffer)`, open a GridFS upload stream with `bucket.openUploadStream(filename)`, and pipe the readable into the upload stream. Once the upload finishes, I save the returned `uploadStream.id` as `pdfFileId` in the Paper document so I can reference it later.

**Q8. How do you serve/download a PDF?**
> For viewing: I set `Content-Disposition: inline` so the browser renders the PDF. For downloading: I set `Content-Disposition: attachment`. In both cases, I open a GridFS download stream using `bucket.openDownloadStream(paper.pdfFileId)` and pipe it directly to the Express response (`downloadStream.pipe(res)`). The file streams from MongoDB through the server to the client — the server never loads the entire file into memory.

**Q9. Why not use Cloudinary or S3 for PDF storage?**
> That's a valid approach and usually better at scale because of CDN delivery and cheaper storage. For this project, I wanted to keep everything inside one database to keep the architecture simple and avoid managing additional services. If traffic grows, I'd move files to S3 with CloudFront CDN and store only the S3 URL in MongoDB.

**Q10. What's the GridFS bucket name in your code?**
> `papers` — so the collections are `papers.files` and `papers.chunks` in MongoDB. I set this explicitly: `new mongoose.mongo.GridFSBucket(db, { bucketName: 'papers' })`.

---

### JWT & AUTHENTICATION

**Q11. How does JWT authentication work in your project?**
> When the admin logs in with email and password, the server compares them against environment variables. If valid, it signs a JWT containing `{ email, role: 'admin' }` with a secret key and 24-hour expiry. The client stores the token in localStorage. On every subsequent request, an Axios interceptor automatically attaches the token in the `Authorization: Bearer <token>` header. On the backend, a `protect` middleware extracts the token, verifies it with `jwt.verify()`, and attaches the decoded payload to `req.admin`. If verification fails, it returns 401.

**Q12. Where do you store the JWT? Is it safe?**
> I store it in `localStorage`. This is simple but vulnerable to XSS — if any script gets injected, it can read the token. A more secure approach would be httpOnly cookies, which JavaScript can't access, but then you need CSRF protection. For a production app, I'd use httpOnly secure cookies with short-lived access tokens and a refresh token mechanism.

**Q13. How do you protect admin routes on both frontend and backend?**
> On the frontend, I have a `ProtectedRoute` component that checks `localStorage.getItem('adminToken')`. If no token, it redirects to `/admin/login`. But this is just for UX — the real security is on the backend. Every admin API route uses the `protect` middleware that verifies the JWT signature and expiry. Even if someone bypasses the frontend check, the backend will reject the request with 401.

**Q14. Is there password hashing in your login?**
> No — honestly, the admin credentials are stored as plaintext in environment variables, and the login does a direct string comparison. There's no bcrypt or hashing. This is because there's only one admin account, and it's not stored in the database — it's in the `.env` file. For a multi-user system, I'd definitely use bcrypt to hash and compare passwords stored in a database.

---

### REACT & FRONTEND

**Q15. What React features did you use?**
> - **Functional components** with hooks (useState, useEffect)
> - **React Router DOM v7** for client-side routing (BrowserRouter, Routes, Route, Link, Navigate, useNavigate)
> - **Controlled forms** for upload and login
> - **Conditional rendering** for loading/error/data states, tabs, edit mode
> - **Axios interceptors** for auto-attaching JWT tokens
> - **Component composition** — ProtectedRoute wraps AdminDashboard as a higher-order pattern

**Q16. How does your routing work? What are the routes?**
> I use React Router DOM with BrowserRouter. Routes:
> - `/` → HomePage (landing page)
> - `/papers` → BrowsePapers (search + filter + paper cards)
> - `/upload` → UploadPaper (form)
> - `/admin/login` → AdminLogin
> - `/admin/dashboard` → AdminDashboard (wrapped in ProtectedRoute)
>
> Netlify handles the SPA fallback — any route that doesn't match a static file serves `index.html`, so React Router handles it client-side.

**Q17. How does the ProtectedRoute component work?**
> It's a wrapper component. It checks `localStorage.getItem('adminToken')`. If no token exists, it returns `<Navigate to="/admin/login" replace />` which redirects the user. If a token exists, it renders `{children}` — the wrapped component (AdminDashboard). This is purely for UX; backend protection is the real security layer.

**Q18. How does the admin dashboard handle different views?**
> It uses a tab-based UI with local state `activeTab` — either `'pending'` or `'all'`. When the tab changes, `useEffect` triggers `fetchPapers()` which calls the appropriate API (`getPendingPapers()` or `getAllPapers()`). The pending tab shows approve/reject buttons. The "all" tab shows status badges and an "Update/Edit" button that toggles inline edit mode for that card.

**Q19. How did you handle the edit feature in the dashboard?**
> I use `editingPaper` state to track which paper is being edited (stores the paper's `_id`). When the admin clicks "Update/Edit", `startEdit(paper)` sets `editingPaper` to that paper's ID and populates `editForm` state with current values. The card then renders a form instead of the normal view. On save, it calls `PUT /api/papers/:id` with the updated fields. On cancel, `editingPaper` resets to null.

---

### NODE.JS, EXPRESS & SERVERLESS

**Q20. What does "serverless" mean in your project?**
> Instead of running a long-lived Express server (like `node server.js` on a VM), I wrapped my Express app with `serverless-http` which converts it into a function that handles one request at a time. Netlify spins up the function on demand and shuts it down after the request. Benefits: no server management, auto-scaling, pay-per-use (Netlify's free tier covers it). Challenges: cold starts (first request after idle is slower), DB connection management (need caching), and payload size limits.

**Q21. How did you handle DB connections in serverless?**
> Module-level variables in Node.js persist across warm invocations in the same container. I declare `let isConnected = false` and `let gridFSBucket = null` at the top of the file. Before every request, a middleware calls `connectDB()`. If `isConnected` is true AND `mongoose.connection.readyState === 1`, it returns immediately — no new connection. If it's a cold start, it connects fresh and sets the flags. I also use `mongoose.models.Paper || mongoose.model('Paper', paperSchema)` to prevent model recompilation errors during warm starts.

**Q22. Explain the middleware chain in your Express app.**
> 1. `cors()` — allows cross-origin requests
> 2. `express.json()` — parses JSON request bodies
> 3. `express.urlencoded({ extended: true })` — parses URL-encoded bodies
> 4. DB connection middleware — `app.use(async (req, res, next) => { await connectDB(); next(); })` — ensures DB is connected before any route handler
> 5. Route-specific: `multer` (on upload route only), `protect` (on admin routes only)
> 6. Error handling middleware — catches thrown errors (like Multer's "Only PDF files are allowed")

**Q23. What is `serverless-http` and what does the `binary` option do?**
> `serverless-http` is an npm package that adapts an Express/Koa/etc. app to work as a serverless function handler (AWS Lambda, Netlify Functions, etc.). The `binary: ['application/pdf']` option tells it that responses with `Content-Type: application/pdf` should be treated as binary data and base64-encoded in the Lambda response, instead of being treated as text. This prevents PDF corruption when streaming through the serverless gateway.

---

### SECURITY & SCALING

**Q24. How would you prevent malicious file uploads?**
> Currently I validate MIME type (`application/pdf`) in both Multer's fileFilter and the controller. I also enforce a file size limit (5MB serverless / 10MB standalone). Additionally, the admin approval step is a safety layer — nothing goes public without review. To harden it further, I'd check the file's magic bytes (first few bytes of the file to verify it's really a PDF, not a renamed .exe), and potentially add virus scanning via a service like ClamAV.

**Q25. How would you scale this to 1 lakh users?**
> Several changes:
> - **Pagination** — currently the API returns ALL matching papers. I'd add `skip` and `limit` to MongoDB queries.
> - **Database indexes** — add indexes on `department`, `semester`, `year`, `examType`, `status` fields for faster queries.
> - **Move PDFs to S3/Cloudinary** — serve via CDN instead of streaming through the serverless function.
> - **Caching** — cache popular query results with Redis or a CDN edge cache.
> - **Rate limiting** — prevent abuse of upload and search endpoints.
> - **Search optimization** — for text search, use MongoDB Atlas Search or Elasticsearch instead of regex.

**Q26. What security vulnerabilities does your app have?**
> I'm aware of several:
> 1. **JWT in localStorage** — vulnerable to XSS.
> 2. **No rate limiting** — someone could spam uploads or brute-force the login.
> 3. **No HTTPS enforcement** in code (Netlify handles it at the platform level).
> 4. **Admin password in plaintext** — stored in environment variables without hashing.
> 5. **No input sanitization** for text fields — potential for NoSQL injection in the regex search if someone crafts a malicious search string (though Mongoose provides some protection).
> 6. **CORS is wide open** — `app.use(cors())` with no origin restrictions.
> 7. **No pagination** — a malicious actor could hit `GET /api/papers` and fetch the entire database.

---

### DEPLOYMENT & DEVOPS

**Q27. Explain your deployment architecture.**
> The app deploys on Netlify as a single unit. The frontend (React + Vite) builds to static HTML/CSS/JS in a `dist` folder, served by Netlify's CDN. The backend is a Netlify Function at `netlify/functions/api.js` — it's an Express app wrapped with `serverless-http`. Netlify's `netlify.toml` redirects `/api/*` requests to `/.netlify/functions/api/:splat`. Environment variables (MongoDB URI, JWT secret, admin credentials) are set in the Netlify dashboard. I also have Vercel config as a backup deployment option.

**Q28. What environment variables does your app need?**
> Four:
> 1. `MONGODB_URI` — MongoDB Atlas connection string
> 2. `JWT_SECRET` — secret key for signing/verifying JWT tokens
> 3. `ADMIN_EMAIL` — admin login email
> 4. `ADMIN_PASSWORD` — admin login password

**Q29. How does the API proxy work in development?**
> In `vite.config.js`, I configured a proxy: `/api` requests are forwarded to `http://localhost:9999/.netlify/functions/api`. When running `netlify dev`, Netlify's local dev server starts both Vite and the function server, automatically handling the redirects. This means the same `/api/*` paths work in both dev and production.

---

### BEHAVIORAL / "TOUGHEST BUG" TYPE

**Q30. What was the toughest bug you faced?**
> The toughest issue was getting PDF streaming to work correctly after deploying to Netlify. In development, `downloadStream.pipe(res)` worked fine because it was a normal Express server. But on Netlify, the serverless gateway was treating the binary PDF response as text, which corrupted the file. I had to configure `serverless-http` with `binary: ['application/pdf']` to tell it to base64-encode PDF responses. That took some debugging — the symptom was garbled/blank PDFs, and I had to trace it from the browser Network tab back to the serverless response encoding.
>
> Another tricky one was MongoDB connection issues after deployment — the Netlify function was failing with TLS errors on the Atlas connection. I had to remove custom TLS options (which were needed locally on Windows but broke in the Lambda environment) and add environment variable sanitization (trimming `\r` from values that had Windows line endings). You can see these fixes in my git history.

**Q31. If I give you 2 more weeks, what would you add?**
> - **User accounts** with upload history (so students can track their contributions)
> - **Pagination** on the papers listing (right now it loads all papers at once)
> - **Bookmark/Save** feature for students
> - **Duplicate detection** (check if a paper with same subject+semester+year+examType already exists)
> - **Email notification** to admin when a new paper is uploaded
> - **Better search** with autocomplete and fuzzy matching
> - **Testing** — at least API integration tests with Jest/Supertest
> - **Move password to hashed storage** using bcrypt

**Q32. Why Express.js and not Fastify or Hapi?**
> Express is the most widely used Node.js framework with a huge ecosystem and community. For this project's scale, performance differences between Express and Fastify are negligible. Express has simpler middleware patterns and more available resources for learning and debugging. Plus, `serverless-http` has first-class support for Express.

**Q33. How does your app handle errors?**
> Multiple layers:
> - **Multer** throws an error for non-PDF files → caught by the global error handler.
> - **Each controller** has try-catch blocks that log the error and return appropriate HTTP status codes (400 for validation, 401 for auth, 404 for not found, 500 for server errors).
> - **Global error middleware** at the end of the Express chain catches anything uncaught.
> - **Frontend** catches API errors in try-catch, extracts `err.response?.data?.message`, and displays it to the user.
> - **401 handling**: The admin dashboard catches 401 responses, removes the token from localStorage, and redirects to login.

**Q34. Explain the complete upload flow end-to-end.**
> 1. Student fills the form: selects department, types subject name, picks semester/exam type/year from dropdowns, and selects a PDF file.
> 2. Frontend validates: checks all fields filled, checks file is PDF type (client-side).
> 3. Frontend creates a `FormData` object, appends all fields + the PDF file, and sends `POST /api/papers/upload` with `Content-Type: multipart/form-data`.
> 4. Netlify redirects `/api/papers/upload` → `/.netlify/functions/api/api/papers/upload`.
> 5. Express middleware: `connectDB()` ensures MongoDB is connected.
> 6. Multer middleware: receives the file into memory (Buffer), validates MIME type and size.
> 7. Controller: validates required fields again server-side, creates a GridFS upload stream, pipes the file buffer into GridFS, waits for the upload to finish.
> 8. Controller: creates a Paper document with `status: 'pending'` and the GridFS file's ObjectId as `pdfFileId`.
> 9. Response: 201 with success message.
> 10. Paper now sits in "pending" until admin approves it.

**Q35. How is your admin dashboard different from the public papers page?**
> The public `BrowsePapers` page only shows `status: approved` papers with search/filter capability, displayed in a card grid with View/Download buttons. The admin `AdminDashboard` has two tabs — "Pending Approval" (shows papers waiting for review with Approve/Reject/Delete buttons) and "Manage Database" (shows ALL papers with status badges, Edit/Delete functionality, and inline metadata editing). Admin routes are protected by JWT middleware on the backend and a ProtectedRoute component on the frontend.

---

## F) WEAK POINTS / IMPROVEMENTS (Honest Answers for Interviewer)

---

### 1. ❌ No Pagination
**Problem:** `Paper.find(filter)` returns ALL matching documents. If there are 10,000 papers, the API returns all 10,000 in one response.
**Impact:** Slow API responses, high memory usage, poor UX.
**Honest answer:** "I haven't implemented pagination yet. I'd add `skip` and `limit` to the MongoDB query, pass `page` and `limit` as query parameters, and return total count in the response for frontend pagination controls."

### 2. ❌ No Password Hashing
**Problem:** Admin password is plaintext in `.env`. Login does `password !== process.env.ADMIN_PASSWORD`.
**Impact:** If the server's environment is compromised, the password is immediately visible. No bcrypt, no salt.
**Honest answer:** "The admin credential is a single hardcoded environment variable. In a real app, I'd store admin accounts in the database with bcrypt-hashed passwords. For this MVP, I used env variables for simplicity since there's only one admin."

### 3. ❌ No Database Indexes
**Problem:** No explicit indexes on `department`, `semester`, `year`, `examType`, or `status`. MongoDB only has the default `_id` index.
**Impact:** As data grows, every query does a collection scan. Filter queries will get slower.
**Honest answer:** "I'd add compound indexes on the most-filtered fields — `{ status: 1, department: 1, semester: 1, examType: 1, year: 1 }` — and a text index on `subjectName` for faster search."

### 4. ❌ JWT in localStorage (XSS Vulnerable)
**Problem:** Any XSS vulnerability could steal the admin token.
**Honest answer:** "I know this is a security tradeoff. For a production app, I'd move to httpOnly secure cookies with SameSite attribute, use short-lived access tokens (15 minutes) with a refresh token rotation strategy."

### 5. ❌ No Rate Limiting
**Problem:** No protection against brute-force login attacks or upload spam.
**Honest answer:** "I'd add `express-rate-limit` middleware — for example, limit login attempts to 5 per minute per IP, and uploads to 10 per hour per IP."

### 6. ❌ No Automated Tests
**Problem:** Zero unit tests, integration tests, or E2E tests.
**Honest answer:** "This is something I'd add if I had more time. I'd write API integration tests with Jest and Supertest for all the routes, and frontend component tests with React Testing Library. For E2E, I'd use Cypress or Playwright."

### 7. ⚠️ Wide-Open CORS
**Problem:** `app.use(cors())` allows requests from any origin.
**Honest answer:** "In production, I'd restrict CORS to only my frontend's domain using `cors({ origin: 'https://papervault.netlify.app' })` to prevent unauthorized API access from other websites."

---

## QUICK REFERENCE CARD (Print This Page)

```
PROJECT:        Paper Vaults
ROLE:           Solo developer (personal project)
FRONTEND:       React 19 + Vite 8 + Tailwind CSS v4 + React Router v7 + Axios
BACKEND:        Express.js + serverless-http (Netlify Function)
DATABASE:       MongoDB Atlas + Mongoose + GridFS
AUTH:           JWT (24h expiry) → localStorage → Axios interceptor → protect middleware
UPLOAD:         Multer (memoryStorage) → GridFS stream → Paper document (status: pending)
DEPLOY:         Netlify (primary) / Vercel (alternate), serverless architecture
FILTERS:        5 — department, semester, examType, year (server-side via useEffect),
                search by subjectName (server-side via button click)
DEBOUNCE:       None
SKELETON:       None (just "Loading..." text)
HASHING:        None (plaintext env comparison)
PAGINATION:     None
TESTS:          None
FILE LIMIT:     5MB (serverless) / 10MB (standalone)
PAPER FIELDS:   department, subjectName, semester, examType, year, pdfFileId,
                pdfName, status, createdAt, updatedAt
GIT:            10 commits, single main branch
```

---

> **Good luck with your Accenture interview, Vikesh! 🚀**
> Remember: Be honest about limitations. Interviewers respect honesty more than fake claims.
