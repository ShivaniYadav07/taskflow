# Deployment Guide
**TaskFlow — Local Setup, Render (Backend) + Vercel (Frontend)**

---

## 1. Prerequisites

| Tool | Minimum Version | Purpose |
|---|---|---|
| Node.js | 18.x | Backend runtime |
| npm | 9.x | Package management |
| Git | Any | Version control |
| MongoDB Atlas account | — | Production database |
| Render account | — | Backend hosting |
| Vercel account | — | Frontend hosting |

---

## 2. Local Development Setup

### Clone and install

```bash
git clone <your-repo-url>
cd task-manager-api

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### Environment variables — Backend

Copy the example file:
```bash
cd server
cp .env.example .env
```

Edit `.env`:
```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/task_manager
JWT_SECRET=<generate-a-random-32+-character-string>
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

Generating a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Environment variables — Frontend

Create `client/.env.local`:
```env
API_URL=http://localhost:8000
```

This is a **server-side only** variable (no `NEXT_PUBLIC_` prefix). Next.js uses it at request-time inside `next.config.ts` rewrites to proxy `/api/*` calls to the Express backend. It is never exposed to the browser.

### Start both servers

In two separate terminals:

```bash
# Terminal 1 — Backend
cd server
npm run dev        # nodemon restarts on changes, runs on port 8000

# Terminal 2 — Frontend
cd client
npm run dev        # Next.js dev server on port 3000
```

Open `http://localhost:3000`. The frontend calls `/api/*` which Next.js proxies to `http://localhost:8000/api` (configured in `next.config.ts`).

---

## 3. MongoDB Atlas Configuration

### Create cluster

1. Log in to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a new project, then create a free M0 cluster (or M10 for production)
3. Choose a region close to your Render backend region

### Create database user

1. In the left sidebar: **Database Access → Add New Database User**
2. Authentication method: Password
3. Username: `taskflow-api`
4. Auto-generate a password — save it
5. Roles: **Atlas Admin** (for setup) or **readWrite on `task_manager` database** (recommended for production)

### Configure network access

For development:
1. **Network Access → Add IP Address → Allow Access from Anywhere** (`0.0.0.0/0`)

For production (more secure):
1. Add only Render's outbound IP addresses. Find them in Render's docs or under your service's **Settings → Outbound IPs**.

### Get connection string

1. **Database → Connect → Drivers**
2. Copy the connection string:
   ```
   mongodb+srv://taskflow-api:<password>@cluster0.xxxxx.mongodb.net/task_manager?retryWrites=true&w=majority
   ```
3. Replace `<password>` with your database user's password
4. Replace the database name segment with `task_manager`

---

## 4. Backend Deployment on Render

### Create web service

1. Log in to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repository
3. Configure:

| Setting | Value |
|---|---|
| **Name** | `taskflow-api` |
| **Region** | Same region as MongoDB Atlas |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | Free (dev) or Starter (production) |

### Environment variables on Render

Navigate to **Environment** tab and add:

```
NODE_ENV          = production
PORT              = 8000
MONGO_URI         = mongodb+srv://taskflow-api:<password>@cluster0.xxxxx.mongodb.net/task_manager?retryWrites=true&w=majority
JWT_SECRET        = <your-64-char-random-hex-secret>
JWT_EXPIRES_IN    = 7d
CLIENT_URL        = https://your-app.vercel.app
```

> **Important:** `CLIENT_URL` must be your actual Vercel deployment URL. The CORS configuration uses this value exactly. Trailing slashes will cause CORS failures.

### Verify backend is running

After deploy completes, visit:
```
https://your-api.onrender.com/api/auth/me
```
Expected response: `{ "success": false, "message": "Not authenticated. Please log in." }`

This confirms the API is reachable and the auth middleware is active.

---

## 5. Frontend Deployment on Vercel

### Deploy

1. Log in to [vercel.com](https://vercel.com) → **Add New → Project**
2. Import your GitHub repository
3. Configure:

| Setting | Value |
|---|---|
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | `client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` (auto-detected) |
| **Install Command** | `npm install` |

### Environment variables on Vercel

Navigate to **Settings → Environment Variables** and add:

```
API_URL = https://your-api.onrender.com
```

Set this for **Production**, **Preview**, and **Development** environments.

> **Important:** This is `API_URL` — **not** `NEXT_PUBLIC_API_URL`. It has no `NEXT_PUBLIC_` prefix so it is never exposed to the browser. Next.js reads it server-side inside `next.config.ts` to proxy `/api/*` requests to your Render backend.

### Trigger a redeploy

After adding env vars, go to **Deployments → Redeploy** the latest deployment to pick up the new variable.

---

## 6. CORS Configuration

The backend `app.js` reads `CLIENT_URL` for CORS:

```js
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
```

If the frontend URL changes (e.g., custom domain added), update `CLIENT_URL` in Render environment variables and restart the service.

**Common CORS errors:**

| Error | Cause | Fix |
|---|---|---|
| `CORS policy: No 'Access-Control-Allow-Origin'` | `CLIENT_URL` doesn't match request origin exactly | Remove trailing slash; ensure protocol matches (https vs http) |
| `Credentials flag is true` + wildcard | `credentials: true` requires explicit origin, not `*` | Never use `origin: '*'` with `credentials: true` |
| Preflight OPTIONS returns 404 | Route not defined | Express handles OPTIONS automatically; check middleware order |

---

## 7. Custom Domain Configuration

### Vercel custom domain

1. **Settings → Domains → Add**
2. Enter your domain (e.g., `taskflow.yourdomain.com`)
3. Add the CNAME record at your DNS provider pointing to `cname.vercel-dns.com`

### Update CORS

After adding a custom domain, update `CLIENT_URL` on Render:
```
CLIENT_URL = https://taskflow.yourdomain.com
```

Restart the Render service to apply.

---

## 8. Build Commands Reference

```bash
# Backend
npm install         # Install dependencies
node server.js      # Production start
npm run dev         # Development (nodemon)

# Frontend
npm install         # Install dependencies
npm run build       # Production build (outputs .next/)
npm start           # Start production server
npm run dev         # Development server (port 3000)
npm run lint        # ESLint check
```

---

## 9. Production Environment Variables Reference

### Backend (Render)

| Variable | Required | Example | Notes |
|---|---|---|---|
| `NODE_ENV` | Yes | `production` | Disables morgan dev logging |
| `PORT` | Yes | `8000` | Render assigns this automatically; set to match |
| `MONGO_URI` | Yes | `mongodb+srv://...` | Full Atlas connection string |
| `JWT_SECRET` | Yes | `<32+ random chars>` | Never commit; generate with `crypto.randomBytes(32)` |
| `JWT_EXPIRES_IN` | Yes | `7d` | Token lifetime; `1d` recommended for production |
| `CLIENT_URL` | Yes | `https://yourapp.vercel.app` | Exact URL, no trailing slash |

### Frontend (Vercel)

| Variable | Required | Example | Notes |
|---|---|---|---|
| `API_URL` | Yes | `https://yourapi.onrender.com` | Server-side only — used by Next.js rewrites. No `/api` suffix. Never exposed to the browser. |

---

## 10. Deployment Verification Checklist

Run through these checks after every production deployment.

### Backend health
- [ ] `GET /api/auth/me` returns `401` (not 404 or 500) — API is reachable
- [ ] `POST /api/auth/login` with valid credentials returns `200` with a token
- [ ] `POST /api/auth/login` with invalid credentials returns `401` (not 500)
- [ ] MongoDB Atlas cluster metrics show active connections

### Frontend health
- [ ] Login page loads without console errors
- [ ] Login flow completes and redirects to dashboard
- [ ] Dashboard fetches and displays tasks
- [ ] Kanban board drag-and-drop updates task status

### CORS verification
- [ ] Network tab: preflight `OPTIONS` request returns `200`
- [ ] Network tab: `Access-Control-Allow-Origin` header is present and matches frontend URL
- [ ] API calls from the frontend complete without CORS errors

### Authentication flow
- [ ] Register new account → redirected to dashboard
- [ ] Logout → redirected to login
- [ ] Refresh page while logged in → user stays authenticated (session persistence)
- [ ] Access `/dashboard` without a token → redirected to `/login`

---

## 11. Troubleshooting

### Backend not starting on Render

**Symptom:** Deploy completes but health check fails.

1. Check Render **Logs** tab for error messages
2. Verify all environment variables are set — a missing `MONGO_URI` will cause `connectDB` to fail and `process.exit(1)`
3. Verify Node.js version: `package.json` specifies `engines.node >= 18`. Check Render's Node version setting.

### MongoDB connection refused

**Symptom:** `MongoNetworkError: connect ECONNREFUSED`

1. Check that the Render server's IP is in the MongoDB Atlas **Network Access** allowlist
2. Verify the `MONGO_URI` password does not contain URL-unsafe characters (encode special chars with `encodeURIComponent`)
3. Test the connection string locally: `node -e "require('mongoose').connect(process.env.MONGO_URI).then(() => console.log('ok'))"`

### CORS errors in production

**Symptom:** API calls fail with CORS policy error.

1. Confirm `CLIENT_URL` on Render exactly matches what the browser sends as `Origin` (include `https://`, no trailing slash)
2. Trigger a Render redeploy after changing environment variables
3. Check browser network tab: the `Origin` request header must match `Access-Control-Allow-Origin` response header exactly

### Frontend shows blank after deploy

**Symptom:** White screen or hydration error.

1. Check Vercel **Function Logs** for build errors
2. Confirm `API_URL` is set in Vercel environment variables and trigger a redeploy
3. Open browser console for specific JavaScript errors

### JWT not accepted

**Symptom:** Every API call returns `401 Invalid or expired token`.

1. Confirm `JWT_SECRET` on Render matches what was used to sign existing tokens
2. If `JWT_SECRET` was changed (rotated), all existing tokens are immediately invalidated — users must log in again
3. Check `JWT_EXPIRES_IN` — tokens older than this value are rejected

---

## 12. Rollback Strategy

### Backend rollback (Render)

1. Go to **Deployments** in the Render dashboard
2. Find the last known-good deployment
3. Click **Rollback to this deploy**

> Database schema changes are not rolled back automatically. If a deploy included a breaking schema change, you may need to apply a compensating migration to the database before rollback succeeds.

### Frontend rollback (Vercel)

1. Go to **Deployments** in the Vercel dashboard
2. Find the last known-good deployment
3. Click **...** → **Promote to Production**

### Emergency: revert a breaking commit

```bash
# Find the last good commit
git log --oneline

# Revert the breaking commit (creates a new commit — safe for shared branches)
git revert <bad-commit-hash>
git push origin main
```

Render and Vercel will auto-deploy the revert commit via their GitHub integration.

### Database: no automatic rollback

MongoDB Atlas does not have point-in-time restore on the free tier. For production:
- Enable **Continuous Cloud Backup** on M10+ clusters
- Take a manual snapshot before any schema migration
- Store the snapshot ID before deploying

---

## 13. Monitoring (Recommended)

These are not implemented in the current codebase but should be added before production:

| Tool | Purpose | Integration point |
|---|---|---|
| **Sentry** | Error tracking and alerting | `server.js` (Sentry.init) + Next.js `sentry.client.config.js` |
| **MongoDB Atlas Alerts** | Connection pool exhaustion, slow queries | Atlas dashboard → Alerts |
| **Render metrics** | CPU, memory, response times | Built-in Render dashboard |
| **Uptime robot / BetterUptime** | Endpoint availability | Monitor `GET /api/auth/me` for 401 response |
