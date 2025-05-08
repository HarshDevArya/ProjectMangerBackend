# Project Manager – Full-Stack App 🛠️🎨

Lightweight project-portfolio platform built with

* **Backend** · Node 18+, Express 5, MongoDB 6, JWT  
* **Frontend** · React (Vite), plain Bootstrap 5, React-Router v6.22  
* **Dev Tooling** · ESLint + Prettier, Husky, Jest, Nodemon

---

## 📐 Architecture

workspace/
├── ProjectMangerBackend/ # REST API
└── ProjectMangerFrontEnd/ # React SPA


---

## ✨ Features

| Domain    | Highlights (✓ = done)                               |
|-----------|-----------------------------------------------------|
| Auth      | ✓ Signup / Login (argon2, JWT access + refresh)     |
| Projects  | ✓ CRUD, soft-delete, pagination (limit = 5)         |
| Search    | ✓ Single box for projects **and** users             |
| Comments  | ✓ Text feedback on projects                         |
| RBAC      | ✓ Owner-only edit / delete, token route-guards      |
| UX        | ✓ Loader spinner, Toasts, Bootstrap 5 (no RB)       |
| Optional  | 🗄️ Vercel Blob Storage for cover-image uploads       |

---

## 🚀 Quick Start

### 0 · Prerequisites

| Tool      | Version | Site |
|-----------|---------|------|
| **Node**  | ≥ 18    | <https://nodejs.org> |
| **npm**   | ≥ 8     | (pnpm / yarn work too) |
| **Mongo** | ≥ 6     | <https://mongodb.com/try/download/community> |

### 1 · Clone & Install

```bash```
git clone https://github.com/HarshDevArya/ProjectMangerBackend.git
git clone https://github.com/HarshDevArya/ProjectMangerFrontEnd.git

cd ProjectMangerBackend && npm install
cd ../ProjectMangerFrontEnd && npm install

###2 · Create .env Files
Keep secrets in backend env only.
Vite exposes variables prefixed with VITE_ at build time; everything else is browser-invisible.

# ─── Backend ───────────────────────────────────────
PORT=5000
MONGO_URI=mongodb+srv://projectManger:8vjz5y9Lw81cp8oC@cluster0.ea7w8pi.mongodb.net/projectManger?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=lIvqxl7ijUCw5m8cAAgMYkeHYMNUeZXXDOiUVsaNZq8qTwf1Tb6BicKYuG7JjFOvzTjaOLz8000OWCrbgdrlFOTIUAAtC5lZmpP7ogiEqMbNr0v0jQkm55hpkIbP7Kqi2cfGMTxU08woOjT2mlVI9j7DBTiQWfKeAdAuEaRNjUZqYXhP7mlwCjnnLxHwjC9z
JWT_EXPIRES=7d
COOKIE_DOMAIN=localhost

# (Optional) Vercel Blob Storage – enable file uploads
#   1. Create a token in your Vercel project Settings ▸ Storage ▸ “Generate token”
#   2. Paste it below; leave blank or remove the key to disable uploads
VERCEL_BLOB_RW_TOKEN=vercel_blob_rw_XXXXXXXXXXXXXXXXXXXXXXXX

# ─── Frontend ──────────────────────────────────────
VITE_API_BASE_URL=http://localhost:5000


# API
cd ProjectMangerBackend
npm run dev          # nodemon ⇒ http://localhost:5000

# SPA
cd ProjectMangerFrontEnd
npm run dev          # Vite ⇒ http://localhost:5173


🗂 Folder Layout

ProjectMangerBackend/
└─ src/
   ├── config/       # DB + env helpers
   ├── controllers/  # Route handlers
   ├── middleware/   # Auth, validation, error handler
   ├── models/       # Mongoose schemas
   ├── routes/       # /api/* routers
   └── index.js      # Server entry

ProjectMangerFrontEnd/
└─ src/
   ├── components/   # Navbar, ProjectCard, Pagination, …
   ├── pages/        # Dashboard, Login, Signup, UserProfile
   ├── context/      # AuthContext (JWT + user info)
   ├── hooks/        # useFetch (token-aware wrapper)
   └── main.jsx      # Vite entry
