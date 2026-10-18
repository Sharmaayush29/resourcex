# ReSourceX / Waste2Raw Deployment Guide

This guide details how to securely deploy the ReSourceX B2B circular byproduct platform to cloud environments.

---

## 🔒 Security Architecture Highlights

1. **Defense-in-Depth HTTP Headers**: Automated OWASP security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`).
2. **Credential & Secret Isolation**: Zero `.env`, database files (`*.db`), or private keys are tracked by Git.
3. **Authentication Protection**:
   - In-memory sliding-window rate limiting on registration and login.
   - Automatic brute-force account lockout protection.
   - Enforced password complexity verification.
4. **Secure File Uploads**:
   - Magic byte file signature validation (MIME spoofing defense).
   - Strict extension whitelist (`.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`).
   - 10 MB maximum file size enforcement.
   - UUID-randomized filenames to prevent path traversal.

---

## 🚀 Option 1: Render (1-Click Blueprint)

The repository includes `render.yaml` for automatic provisioning.

1. Push this repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** -> **Blueprint**.
3. Select your repository.
4. Render will automatically build:
   - `resourcex-backend` (FastAPI Web Service with auto-generated `SECRET_KEY`)
   - `resourcex-frontend` (React Static Site with SPA rewrites)
5. In `resourcex-frontend`, set the environment variable:
   ```env
   VITE_API_URL=https://<your-backend-render-subdomain>.onrender.com/api
   ```
6. In `resourcex-backend`, set `CORS_ORIGINS` to include your frontend URL:
   ```env
   CORS_ORIGINS=https://<your-frontend-render-subdomain>.onrender.com
   ```

---

## 🌐 Option 2: Vercel (Frontend) + Railway / Render (Backend)

### Frontend on Vercel
1. Import repository in [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite`.
4. Add Environment Variable:
   ```env
   VITE_API_URL=https://your-backend-api-url.com/api
   ```
5. Deploy. `frontend/vercel.json` will automatically configure SPA client-side routing.

### Backend on Render / Railway
1. Create a new Web Service pointing to `backend`.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables:
   - `ENVIRONMENT=production`
   - `SECRET_KEY=<generate a 64-character random string>`
   - `CORS_ORIGINS=https://your-vercel-domain.vercel.app`
   - `ADMIN_EMAIL=admin@waste2raw.com`
   - `ADMIN_PASSWORD=<secure-strong-password>`

---

## 🐳 Option 3: Docker Deployment

To run containerized in any cloud VM (AWS EC2, DigitalOcean Droplet, GCP Compute Engine):

```bash
cd backend
docker build -t resourcex-backend .
docker run -d -p 8000:8000 \
  -e SECRET_KEY="your-production-secret-key" \
  -e CORS_ORIGINS="https://yourfrontend.com" \
  resourcex-backend
```

---

## 📋 Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Required | Default | Description |
|---|---|---|---|
| `ENVIRONMENT` | Yes | `development` | `development` or `production` |
| `SECRET_KEY` | Yes | *None in prod* | Secret key for JWT signature hashing |
| `ALGORITHM` | No | `HS256` | JWT encoding algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `1440` (24h) | JWT validity window |
| `DATABASE_URL` | No | SQLite | Supports PostgreSQL (`postgresql://...`) and SQLite |
| `UPLOAD_DIR` | No | `./uploads` | Directory for uploaded certificates and images |
| `ADMIN_EMAIL` | No | `admin@waste2raw.com` | Initial super admin email |
| `ADMIN_PASSWORD` | No | `admin123` | Initial super admin password |
| `CORS_ORIGINS` | No | `localhost` origins | Comma-separated list of allowed frontend URLs |

### Frontend (`frontend/.env`)
| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `/api` | Base API URL pointing to the FastAPI backend |
