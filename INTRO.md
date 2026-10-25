# PaperVaults — Project Introduction

**PaperVaults** is a full-stack, serverless academic platform where college students can find, browse, and download previous year question papers — organized by department, semester, exam type, and year.
Students can upload papers without any registration, and every submission goes through an admin approval workflow before becoming publicly visible.
The admin dashboard, secured with JWT authentication, provides full CRUD operations including Approve, Reject, Delete, and inline metadata editing.
PDFs are stored using MongoDB GridFS, which chunks large binaries to bypass MongoDB's 16MB document limit and enables efficient streaming.
The frontend is built with **React.js (Vite)** and **Tailwind CSS v4**, while the backend uses **Express.js**, **MongoDB Atlas**, and **Mongoose** — all wrapped into a **Serverless Function** architecture.
The entire app deploys as a single unit on **Vercel/Netlify** with zero-cost hosting and automatic scaling.

---

## 🛠️ Tech Stack

| Layer          | Technology                                                              |
|----------------|-------------------------------------------------------------------------|
| **Frontend**   | React.js (Vite), Tailwind CSS v4, React Router DOM, Axios              |
| **Backend**    | Node.js, Express.js, Multer (file uploads), serverless-http            |
| **Database**   | MongoDB Atlas, Mongoose ODM, GridFS (binary PDF storage)               |
| **Auth**       | JSON Web Tokens (JWT), custom middleware, localStorage-based sessions   |
| **Deployment** | Vercel (primary), Netlify (alternate), Serverless Functions architecture|
| **Tooling**    | Vite (build tool), dotenv (env config), Git, npm workspaces            |
