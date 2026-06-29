# Security Architecture Document
**TaskFlow — Authentication, Authorization, and API Security**

---

## 1. Overview

This document describes the security architecture of TaskFlow, the reasoning behind each security decision, the current known gaps, and the recommended path to production-grade security. Every section explains not just *what* is implemented but *why* — so these decisions can be defended in an engineering review.

---

## 2. Authentication Architecture

### How it works

TaskFlow uses **stateless JWT authentication**. There is no server-side session store. The server issues a signed token on login; the client stores it and sends it with every subsequent request.

```
Client                                  Server
  │                                       │
  │── POST /api/auth/login ──────────────►│
  │                                       │ 1. Find user by email
  │                                       │ 2. bcrypt.compare(input, storedHash)
  │                                       │ 3. If match: jwt.sign({ id }, secret, { expiresIn })
  │◄─ { token, user } ───────────────────│
  │                                       │
  │── GET /api/projects ────────────────►│
  │   Authorization: Bearer <token>       │ 4. jwt.verify(token, secret)
  │                                       │ 5. User.findById(decoded.id)
  │                                       │ 6. Attach req.user, continue
  │◄─ { projects } ─────────────────────│
```

### Why stateless JWT

Stateless tokens allow the API to scale horizontally without a shared session store — any server instance can verify any token using the shared secret. This is the appropriate choice for a REST API serving a decoupled frontend.

**The tradeoff:** Stateless tokens cannot be revoked before they expire. See Section 7 (Token Revocation) for the gap and mitigation.

---

## 3. Password Security

### Implementation

```js
// user.model.js
password: {
  type: String,
  required: true,
  minlength: 6,
  select: false,     // never included in query results by default
}

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};
```

### Why bcrypt

bcrypt is a purpose-built password hashing algorithm with a cost factor (work factor) that controls how computationally expensive each hash operation is. This makes offline brute-force attacks impractical.

**Cost factor of 12:** At this setting, each hash takes roughly 250-400ms on a single CPU core. This is negligible for a user logging in but makes brute-force infeasible (thousands of guesses per second → effectively zero).

**Why not MD5/SHA-256:** These are general-purpose hashing algorithms optimized to be fast. A GPU can compute billions of SHA-256 hashes per second, making password cracking trivial. bcrypt was designed to be slow by construction.

**Why `select: false`:** The password field is excluded from all Mongoose queries by default. It must be explicitly requested with `.select('+password')`. This prevents accidentally leaking the hash in a `User.find()` result anywhere in the codebase.

**Why the pre-save hook:** Hashing is tied to the model, not the controller. If password is ever changed via a different code path, hashing still runs automatically. The `isModified` guard prevents re-hashing an already-hashed password (e.g., when updating the user's name).

### Minimum password length

Currently 6 characters — a weak minimum. Industry recommendation for new applications is 8-12 characters with complexity requirements, or passphrase-style with a higher minimum length.

---

## 4. JWT Lifecycle

### Token structure

```
Header: { alg: "HS256", typ: "JWT" }
Payload: { id: "<mongodb_user_id>", iat: <issued-at>, exp: <expires-at> }
Signature: HMACSHA256(base64(header) + "." + base64(payload), JWT_SECRET)
```

### Signing and verification

```js
// utils/jwt.js
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);
```

### Why only `id` in the payload

The JWT payload is base64-encoded, not encrypted — anyone who obtains the token can decode and read the payload. Putting only the user's MongoDB `_id` (not email, name, or role) in the payload limits what is exposed. Sensitive data should never be in a JWT payload.

### Current JWT expiry: 7 days

**Risk:** A stolen token is valid for 7 days with no server-side recourse.

**Recommended:** 15 minutes for access tokens, paired with a 7-day refresh token. See Section 7.

### Algorithm enforcement gap

`jwt.verify` is currently called without specifying the allowed algorithm:
```js
jwt.verify(token, process.env.JWT_SECRET)  // accepts any algorithm
```

The `none` algorithm attack (where the signature is omitted entirely) was patched in jsonwebtoken@8.5.0. However, best practice is explicit enforcement:
```js
jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
```

This prevents algorithm confusion attacks and makes the security intention explicit.

---

## 5. Token Storage Strategy

### Current: localStorage

The frontend stores the JWT in `localStorage` and reads it via the Axios request interceptor:

```ts
// axios.ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Why this is a risk

`localStorage` is readable by any JavaScript running on the page. This includes:
- Injected ads or third-party analytics scripts
- NPM supply chain compromises (a package you depend on that has been hijacked)
- Any XSS vulnerability — even a minor reflected XSS in a future feature
- Browser extensions with broad site permissions

If an attacker reads the token from `localStorage`, they can make any authenticated API call from any device until the token expires (up to 7 days).

### The production-grade alternative: httpOnly cookies

When the server sets the token as an `httpOnly` cookie, JavaScript on the page cannot read it at all — not even `document.cookie` sees it. The browser attaches it automatically to requests, but it is opaque to the page's JavaScript.

```
Server: Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/
```

This eliminates the XSS → token theft attack vector entirely, because there is nothing to steal from JavaScript's perspective.

**The tradeoff:** Cookies require CSRF protection (see Section 8). The current Bearer-token approach does not, because custom `Authorization` headers cannot be sent in CSRF attacks.

### Current state: Partial cookie implementation

The app already sets an `auth=1` cookie at login as a Next.js middleware sentinel. The architecture for cookie-based auth is partially present — the missing step is moving the actual JWT into the cookie rather than into `localStorage`.

---

## 6. Route Protection

### Backend: protect middleware

```js
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ... });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ ... });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ ... });
  }
};
```

**Why a DB query on every request:** `User.findById` is called on every protected request to catch the "user deleted after token issued" case. Without this, a deleted user's token would still be accepted until expiry. The cost is one indexed MongoDB query per request.

**Why the same 401 message for both "missing token" and "user not found":** Returning different messages would reveal whether a token corresponds to a real (but deleted) user vs. an entirely fabricated token. Uniform 401 responses prevent information leakage.

### Frontend: useEffect redirect

Currently, protected pages use:
```ts
useEffect(() => {
  if (!authLoading && !isAuthenticated) router.replace('/login');
}, [authLoading, isAuthenticated, router]);
```

**Limitation:** The page renders for one render cycle before the redirect fires. A user briefly sees the page shell. The production approach is a Next.js `middleware.ts` file that intercepts the request on the server before any rendering occurs, reading the `auth` cookie to redirect unauthenticated users.

---

## 7. Token Revocation (Gap)

### Current state

There is no token revocation. When a user calls logout, the client removes the token from storage — but the server has no record of the logout. The JWT remains cryptographically valid until its expiry timestamp.

### Why this matters

If a token is compromised (stolen device, session hijacking, phishing), the legitimate user has no way to invalidate it. Changing the password does not invalidate existing tokens.

### Recommended approach: Refresh token + short-lived access tokens

```
Phase 1: Reduce access token lifetime to 15 minutes
  → Limits the damage window of a stolen token to 15 minutes

Phase 2: Issue refresh tokens
  → On login: server issues access_token (15m) + refresh_token (7d)
  → refresh_token stored in httpOnly cookie
  → access_token stored in memory (never localStorage)
  → POST /api/auth/refresh: validate refresh_token → issue new access_token

Phase 3: Revocation list (Redis)
  → On logout: add refresh_token to Redis blocklist with TTL = remaining lifetime
  → The /refresh endpoint checks the blocklist before issuing new tokens
  → A "log out all devices" feature deletes all refresh tokens for the user
```

---

## 8. API Security

### CORS

```js
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
```

**Why explicit origin:** `credentials: true` (needed for cookie-based auth) requires an explicit `origin` — not a wildcard. If `origin: '*'` were combined with `credentials: true`, browsers would reject the response.

**Why `CLIENT_URL` from environment:** The allowed origin must be configurable per environment (localhost in dev, the Vercel URL in production) without code changes.

**Gap:** If `CLIENT_URL` is not set in production, the app silently falls back to `localhost:3000`. This means cross-origin requests from the real frontend will be blocked by CORS. The fix is to validate `CLIENT_URL` is set on startup when `NODE_ENV === 'production'`.

### Rate Limiting (Gap — Critical)

There is currently no rate limiting on any endpoint. This means:

- `/api/auth/login` can receive thousands of password guesses per minute from a single IP
- `/api/auth/register` can be used to enumerate valid email addresses or spam account creation
- Any endpoint can be targeted with a request flood

**Implementation plan:**
```js
// npm install express-rate-limit
const rateLimit = require('express-rate-limit');

// Strict limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                     // 10 attempts per IP per window
  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' },
  standardHeaders: true,
});

// General API limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
});

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);
```

For horizontally scaled deployments, replace the in-memory store with `rate-limit-redis`.

### Helmet (Security Headers)

```js
app.use(helmet());
```

Helmet sets the following headers by default:

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME type sniffing |
| `X-Frame-Options` | `SAMEORIGIN` | Block clickjacking (iframe embedding) |
| `X-XSS-Protection` | `0` | Disabled (modern browsers use CSP instead) |
| `Strict-Transport-Security` | `max-age=15552000` | Force HTTPS for 180 days |
| `Referrer-Policy` | `no-referrer` | Don't leak URL info in Referer header |
| `Content-Security-Policy` | Helmet default | Restricts script and resource loading |

**Gap:** The frontend (Next.js) does not configure its own CSP headers. This should be added in `next.config.js` for production.

### Body Size Limit

```js
app.use(express.json({ limit: '10kb' }));
```

**Why:** Without a size limit, an attacker can send a multi-megabyte JSON payload, causing the Node.js process to spend time parsing it and potentially running out of memory. 10kb is sufficient for all legitimate request bodies in this application.

---

## 9. Input Validation

### Backend: express-validator

Applied to every mutating route and parameter. Validation errors return `422` before the request reaches the controller.

```js
body('status').optional().isIn(['todo', 'in-progress', 'done'])
body('assignedTo').optional({ checkFalsy: true }).isMongoId()
query('projectId').isMongoId()
param('id').isMongoId()
```

**Why validate ObjectIds explicitly:** Without `isMongoId()` validation, a non-ObjectId string passed as `:id` would reach Mongoose and cause a CastError (caught by the centralized error handler). Validating at the route level rejects these before any DB interaction and returns a cleaner 422 rather than a 400.

**Why validate enums:** Passing an arbitrary string as `status` would silently fail the Mongoose enum validation, causing a 422 from the DB layer. Route-level validation catches this earlier and returns a more descriptive error message.

### Frontend: Zod

Forms validate with Zod schemas before submission:

```ts
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
```

**Why both frontend and backend validation:** Frontend validation provides immediate feedback with no network round-trip. Backend validation is the security boundary — frontend validation can be bypassed entirely with a direct API call (curl, Postman, malicious script). Both layers are required.

---

## 10. MongoDB Injection Prevention

### Implementation

```js
// app.js — applied before all routes
app.use(mongoSanitize());
```

`express-mongo-sanitize` strips any keys that start with `$` or contain `.` from request bodies, query strings, and params. This prevents an attacker from injecting MongoDB query operators.

**Example attack without sanitization:**
```json
POST /api/auth/login
{
  "email": { "$gt": "" },
  "password": { "$gt": "" }
}
```
This would match any user document, bypassing password validation entirely.

**Why Mongoose alone isn't sufficient:** Mongoose does cast query values to schema types, which provides some protection. However, operator injection can still occur in certain query patterns (`$where`, `$regex`, nested documents). Defense-in-depth means both Mongoose typing and sanitization.

---

## 11. Error Handling and Information Disclosure

### What the centralized handler does correctly

```js
// error.middleware.js
if (err.code === 11000) → 409 (duplicate key — tells client what failed)
if (err.name === 'CastError') → 400 (invalid ID — safe message)
if (err.name === 'ValidationError') → 422 (validation details — safe to share)
default → 500 "Internal server error" (no internal details)
```

### Current gap: controllers that bypass the handler

`project.controller.js` and `comment.controller.js` use:
```js
res.status(500).json({ success: false, message: 'Server error', error: error.message });
```

The `error.message` field leaks internal Mongoose messages like:
- `"Cast to ObjectId failed for value 'foo' at path '_id' for model 'Project'"`
- `"E11000 duplicate key error collection: task_manager.projects index: owner_1_key_1 dup key: { owner: ObjectId('...'), key: 'PROJ' }"`

These reveal database schema details, collection names, and index structures.

**Fix:** Replace with `next(error)` in all controllers. The centralized handler will normalize the response.

### Production error logging

The current `console.error(err)` in the error handler logs the full error object to stdout. This is acceptable in development but insufficient for production. Production requirements:
- Structured JSON logging (Winston)
- Error tracking with stack traces and context (Sentry)
- Alert on 5xx error rate spikes

---

## 12. RBAC — Resource Authorization

### How project isolation works

Every request to a project-scoped resource goes through `verifyProjectMember` or `verifyProjectOwner`. These middleware functions:

1. Extract `projectId` from the request (params, body, or query — whichever is present)
2. Load the project from MongoDB
3. Check that `req.user._id` matches `project.owner` or exists in `project.members`
4. Attach `req.project` to the request (cached reference, prevents duplicate DB query in controller)

### Why middleware rather than controller-level checks

Placing authorization in middleware makes it impossible to forget. If a new route is added and the developer forgets to check membership in the controller, the middleware layer still enforces it — because authorization is opt-in at the route definition level, not inside the controller.

Compare:
```js
// Unsafe pattern (authorization buried in controller, easy to forget)
router.get('/:id', protect, controller);

// Safe pattern (authorization is explicit and enforced before controller runs)
router.get('/:id', protect, verifyProjectMember, controller);
```

### Task authorization

Task endpoints use a different pattern: `verifyProjectMember` is applied to `GET /api/tasks` and `POST /api/tasks` (where `projectId` is in the query/body). For `GET /api/tasks/:id`, `PATCH`, and `DELETE`, authorization is performed inside the controller by populating `task.projectId` and calling `isProjectMember()`.

This is a valid approach but creates two authorization code paths. A future improvement is to create a `verifyTaskAccess` middleware that fetches the task and checks project membership, then attaches `req.task`.

---

## 13. Secrets Management

### What constitutes a secret in this application

| Secret | Location | Risk if exposed |
|---|---|---|
| `JWT_SECRET` | `.env` → Render env var | Attacker can forge valid JWT tokens for any user |
| `MONGO_URI` | `.env` → Render env var | Full database read/write access |

### Current practices

- `.env` files contain secrets and must be in `.gitignore`
- `.env.example` is committed with placeholder values — this is correct
- Secrets are injected as environment variables at runtime — never hardcoded

### What to verify

```bash
# Confirm .env is gitignored
git check-ignore -v server/.env
git check-ignore -v client/.env.local

# Scan git history for accidental secret commits
git log --all --full-history -- server/.env
```

### Production secret strength

`JWT_SECRET` should be a minimum of 32 cryptographically random bytes (256 bits). The placeholder `your_super_secret_jwt_key_change_this` is not acceptable in any environment beyond local development.

Generate:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 14. Production Recommendations Summary

### Must do before any public exposure

| # | Action | Why |
|---|---|---|
| 1 | Add `express-rate-limit` to auth routes | Auth endpoints are currently open to brute force |
| 2 | Remove `error: error.message` from all controller responses | Leaks internal database and schema details |
| 3 | Replace direct `res.status(500)` in controllers with `next(error)` | Bypasses the centralized error handler |
| 4 | Verify `JWT_SECRET` is at least 32 random bytes in production | Weak secret → forged tokens |
| 5 | Verify `.env` is not tracked in git | Secret exposure in repository history |

### Should do before production traffic

| # | Action | Why |
|---|---|---|
| 6 | Migrate JWT from `localStorage` to `httpOnly` cookies | Eliminates XSS → token theft attack surface |
| 7 | Reduce JWT lifetime from 7d to 1d (or 15min + refresh tokens) | Limits blast radius of a stolen token |
| 8 | Add `CLIENT_URL` startup validation | Silent CORS misconfiguration in production |
| 9 | Add structured logging (Winston) and error tracking (Sentry) | No visibility into production errors |
| 10 | Add Next.js `middleware.ts` for server-side route protection | Eliminates flash of unauthenticated content |
| 11 | Enforce `{ algorithms: ['HS256'] }` in `jwt.verify` | Explicit algorithm enforcement is a security best practice |

### Improve when scaling

| # | Action | Why |
|---|---|---|
| 12 | Implement refresh token rotation with Redis revocation store | Token revocation capability for compromised sessions |
| 13 | Add CSP headers via `next.config.js` | Defense-in-depth against XSS |
| 14 | Switch to `rate-limit-redis` store | In-memory rate limit state doesn't work across horizontal scaling |
| 15 | Add CSRF protection after cookie migration | Required when auth tokens are in cookies |
| 16 | Implement account lockout after N failed login attempts | Defense in depth beyond rate limiting |
