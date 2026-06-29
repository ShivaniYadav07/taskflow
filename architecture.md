# Architecture Document
**TaskFlow — Jira-Style Project Management Application**

---

## 1. Project Overview

TaskFlow is a full-stack project management application modeled after Jira. It gives teams a single platform to create projects, manage tasks across a Kanban board, collaborate through comments, and enforce role-based access control at the project level.

### Core Features
- JWT-based authentication (register, login, session persistence)
- Multi-project workspace management with isolated access control
- Task CRUD with status, priority, due date, and assignment
- Kanban board with drag-and-drop and optimistic UI updates
- Task-level comment threads (create, read, delete)
- RBAC — Owner and Member roles scoped per project
- `/api/tasks/me` endpoint for cross-project personal dashboards

### Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | Next.js (App Router) | 15.1.3 |
| UI language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.4 |
| Server state | TanStack React Query | 5.x |
| Form handling | React Hook Form + Zod | 7.x / 3.x |
| HTTP client | Axios | 1.7 |
| Backend runtime | Node.js | ≥18 |
| Backend framework | Express.js | 4.19 |
| Database | MongoDB (Mongoose ODM) | 8.4 |
| Authentication | JSON Web Tokens (jsonwebtoken) | 9.x |
| Password hashing | bcryptjs | 2.4 |

---

## 2. System Architecture

TaskFlow follows a classic decoupled Client-Server architecture. The Next.js frontend is a pure client-side SPA (no SSR used for data fetching). The Express.js backend exposes a RESTful JSON API. The two communicate exclusively over HTTP/HTTPS.

```
┌─────────────────────────────────┐        ┌────────────────────────────────────┐
│   Next.js Client (Port 3000)    │        │   Express.js API (Port 5000)       │
│                                 │        │                                    │
│  AuthProvider (React Context)   │◄─────► │  Middleware Stack                  │
│  ProjectProvider (React Context)│  REST  │  ├── helmet (security headers)     │
│  TanStack React Query           │  JSON  │  ├── cors                          │
│  Axios (+ interceptors)         │        │  ├── express-mongo-sanitize        │
│  Service Layer                  │        │  ├── express.json (10kb limit)     │
│  Component Tree                 │        │  │                                 │
└─────────────────────────────────┘        │  Routes → Middleware → Controllers │
                                           │  └── Mongoose ODM                  │
                                           └──────────────┬─────────────────────┘
                                                          │ TCP
                                                          ▼
                                           ┌────────────────────────────────────┐
                                           │   MongoDB Atlas / Local            │
                                           │   Collections: users, projects,    │
                                           │   tasks, comments                  │
                                           └────────────────────────────────────┘
```

---

## 3. Folder Structure

```
task-manager-api/
├── client/                          # Next.js frontend
│   └── src/
│       ├── app/                     # Next.js App Router pages
│       │   ├── layout.tsx           # Root layout — provider tree
│       │   ├── page.tsx             # Root redirect → /dashboard
│       │   ├── login/page.tsx
│       │   ├── register/page.tsx
│       │   └── dashboard/
│       │       ├── page.tsx         # List view (filters, task list)
│       │       └── board/page.tsx   # Kanban board view
│       ├── components/
│       │   ├── ui/                  # Dumb, reusable UI atoms (Button, Modal, Badge)
│       │   ├── forms/               # Smart form components (ProjectForm, MemberForm, task-form)
│       │   ├── layout/              # Header, ProjectSelector
│       │   ├── tasks/               # Domain components (TaskDetailPanel, task-list)
│       │   └── kanban/              # KanbanBoard, KanbanColumn, KanbanCard
│       ├── hooks/                   # React Query mutation/query hooks (use-tasks, use-comments)
│       ├── providers/               # Context providers (auth-provider, project-provider, query-provider)
│       ├── services/                # Axios API call wrappers (auth, task, project, comment)
│       ├── lib/
│       │   ├── api/axios.ts         # Axios instance + interceptors
│       │   ├── utils/index.ts       # cn(), formatDate(), STATUS_CONFIG, etc.
│       │   └── validations/         # Zod schemas for forms
│       └── types/index.ts           # Shared TypeScript interfaces
│
└── server/                          # Express.js backend
    ├── server.js                    # Entry point — dotenv, connectDB, app.listen
    └── src/
        ├── app.js                   # Express app config — middleware stack, route mounting
        ├── config/db.js             # Mongoose connection
        ├── models/                  # Mongoose schemas
        │   ├── user.model.js
        │   ├── project.model.js
        │   ├── task.model.js
        │   └── comment.model.js
        ├── controllers/             # Business logic handlers
        │   ├── auth.controller.js
        │   ├── project.controller.js
        │   ├── task.controller.js
        │   └── comment.controller.js
        ├── routes/                  # Express Router definitions
        │   ├── auth.routes.js
        │   ├── project.routes.js
        │   └── task.routes.js
        ├── middleware/
        │   ├── auth.middleware.js         # JWT verification, req.user attachment
        │   ├── projectAuth.middleware.js  # RBAC — verifyProjectMember / verifyProjectOwner
        │   ├── validate.middleware.js     # express-validator error handler
        │   └── error.middleware.js        # Centralized error handler
        └── utils/
            ├── jwt.js              # signToken / verifyToken wrappers
            └── response.js         # sendSuccess / sendError helpers
```

---

## 4. Frontend Architecture

### State Management Model

The frontend separates two categories of state:

**Server state** is managed entirely by TanStack React Query. Every API response is cached under a typed query key. Mutations automatically invalidate the relevant cache keys, triggering background refetches. No Redux or Zustand is used — all remote data lives in the React Query cache.

**Global UI state** is managed by two React Context providers:
- `AuthProvider` — holds the authenticated user object and `isAuthenticated` flag. Initialized from `localStorage` on mount with background token revalidation against `/api/auth/me`.
- `ProjectProvider` — holds the list of user projects and the currently active project. The active project persists to `localStorage` so it survives page refreshes.

### Provider Tree

```
QueryProvider (TanStack)
  └── AuthProvider
        └── ProjectProvider
              └── App pages
```

### Component Hierarchy

```
ui/           Stateless atoms — no API knowledge, no business logic
  Button, Modal, Badge, Input, Textarea, ConfirmDialog, StatusPicker

forms/        Smart form components — own their validation and mutation calls
  ProjectForm, MemberForm, task-form, login-form, register-form

tasks/        Domain components — consume hooks for data
  TaskDetailPanel (slide-over with comments)
  task-list, task-card, task-stats, task-modals

kanban/       Board-specific components
  KanbanBoard (drag context, optimistic state)
  KanbanColumn (droppable zone)
  KanbanCard (draggable card)

layout/       Chrome components
  Header, ProjectSelector
```

### Data Fetching Pattern

1. Page or component calls a custom hook (e.g., `useTasks`, `useComments`).
2. The hook calls a service function (e.g., `taskService.getAll(filters)`).
3. The service function calls the pre-configured Axios instance.
4. React Query caches the result and provides `data`, `isLoading`, `isError`.
5. Mutations invalidate related query keys on success, triggering a background refetch.

### Route Protection

Currently implemented via `useEffect` redirect in each protected page. The `auth=1` cookie is set at login as a sentinel for future Next.js middleware protection.

---

## 5. Backend Architecture

### Middleware Stack (in order)

```
Request
  │
  ├── cors()                        Allow requests from CLIENT_URL only
  ├── helmet()                      Set security headers
  ├── morgan('dev')                 HTTP request logging (development only)
  ├── express.json({ limit:'10kb'}) Parse JSON body, reject oversized payloads
  ├── mongoSanitize()               Strip MongoDB operators ($, .) from inputs
  │
  ├── /api/auth     → auth.routes
  ├── /api/projects → project.routes
  ├── /api/tasks    → task.routes
  │
  ├── 404 handler
  └── errorHandler()                Centralized error normalization
```

### Request Processing Pattern

For a protected, resource-scoped route, the processing chain is:

```
router.get('/:id',
  protect,               // Verify JWT → attach req.user
  verifyProjectMember,   // Check membership → attach req.project
  controller             // Business logic — req.user and req.project guaranteed
)
```

This pattern guarantees that by the time the controller function executes, it has both `req.user` (authenticated identity) and `req.project` (the target resource) without any additional database queries.

### Error Handling

The centralized error handler in `error.middleware.js` normalizes all thrown errors:

| Mongoose error | HTTP status |
|---|---|
| Duplicate key (code 11000) | 409 Conflict |
| CastError (bad ObjectId) | 400 Bad Request |
| ValidationError | 422 Unprocessable Entity |
| Everything else | 500 Internal Server Error |

**Note:** Controllers must call `next(err)` to reach this handler. Controllers that use direct `res.status(500).json()` bypass this normalization.

---

## 6. Authentication Flow

### Registration
```
Client → POST /api/auth/register { name, email, password }
  → express-validator validates inputs
  → Check for existing email (409 if duplicate)
  → User.create() → bcrypt pre-save hook hashes password (12 rounds)
  → signToken(user._id) → JWT signed with JWT_SECRET, expires in 7d
  → Return { token, user: { id, name, email } }
```

### Login
```
Client → POST /api/auth/login { email, password }
  → express-validator validates inputs
  → User.findOne({ email }).select('+password') (re-enables the excluded field)
  → user.comparePassword(candidate) → bcrypt.compare()
  → Identical generic error if user not found OR password wrong (prevents user enumeration)
  → signToken(user._id)
  → Return { token, user: { id, name, email } }
```

### Session Initialization (client)
```
App mount → AuthProvider useEffect
  → Read token from localStorage
  → If token absent: isLoading=false, isAuthenticated=false
  → If token present + cached user in localStorage:
      → Set user immediately (no spinner)
      → Background call to GET /api/auth/me
      → On success: update stored user data
      → On failure: clear all auth state, redirect to /login
  → If token present, no cached user:
      → Block on GET /api/auth/me
      → Set user on success, clear on failure
```

### Request Authentication
```
Every protected request:
  → Axios interceptor reads localStorage.getItem('token')
  → Attaches: Authorization: Bearer <token>

Server protect middleware:
  → Parse Authorization header
  → jwt.verify(token, JWT_SECRET) → decoded.id
  → User.findById(decoded.id) → 401 if not found
  → Attach user to req.user
  → Call next()
```

---

## 7. Authorization Flow

### Middleware Composition

```
verifyProjectMember:
  → Extract projectId from params, body, or query
  → Project.findById(projectId)
  → Check: project.owner === req.user._id  OR
            project.members.includes(req.user._id)
  → Attach req.project, call next() or 403

verifyProjectOwner:
  → Reuse req.project if already attached by verifyProjectMember
  → Otherwise fetch project from DB
  → Check: project.owner === req.user._id only
  → Attach req.project, call next() or 403
```

### RBAC Matrix

| Action | Owner | Member |
|---|---|---|
| View project | ✓ | ✓ |
| Update project name/description | ✓ | ✗ |
| Delete project | ✓ | ✗ |
| Invite member | ✓ | ✗ |
| Remove member | ✓ | ✗ |
| Create task | ✓ | ✓ |
| Update any task | ✓ | ✓ |
| Delete any task | ✓ | ✓ |
| Add comment | ✓ | ✓ |
| Delete own comment | ✓ | ✓ |
| Delete others' comments | ✗ | ✗ |

---

## 8. Request Lifecycle (full example)

**PATCH /api/tasks/:id — drag-and-drop status update**

```
1. User drags Kanban card to new column
2. KanbanBoard sets optimistic local state immediately (card moves in UI)
3. useUpdateTask mutation fires: PATCH /api/tasks/:id { status: 'in-progress' }
4. Axios interceptor attaches Bearer token

Server:
5. cors() validates Origin header
6. helmet() sets response security headers
7. express.json() parses body { status: 'in-progress' }
8. mongoSanitize() strips any $ operators from body (none here)
9. router.patch('/:id', [...validators], validate, updateTask)
10. express-validator checks: id is valid MongoId, status is in enum
11. validate middleware short-circuits with 422 if any fail
12. updateTask controller:
    a. Task.findById(id).populate('projectId')
    b. isProjectMember(task.projectId, req.user._id) → 403 if not member
    c. Whitelist filter on req.body (only allowed fields pass)
    d. Object.assign(task, updates); task.save()
    e. sendSuccess(res, 200, { task })

Client:
13. React Query invalidates ['tasks'] cache
14. Background refetch updates RQ cache with server truth
15. If step 12 threw, mutation catches → optimistic update reverted → toast.error
```

---

## 9. Database Design

### Schema Relationships

```
User
  _id, name, email, password (select:false), timestamps

Project
  _id, name, key, description
  owner   → ObjectId ref User (required)
  members → [ObjectId ref User]
  timestamps

Task
  _id, title, description, status (enum), priority (enum), dueDate
  projectId  → ObjectId ref Project (required)
  assignedTo → ObjectId ref User
  createdBy  → ObjectId ref User (required)
  timestamps

Comment
  _id, body
  taskId   → ObjectId ref Task (required)
  authorId → ObjectId ref User (required)
  timestamps
```

### Referencing Strategy

All relationships use document references (not embedding). This choice supports:
- Querying tasks independent of their parent project
- Populating user details selectively without loading full documents
- Avoiding the 16MB BSON document size limit for projects with many tasks

### Indexes

| Collection | Index | Purpose |
|---|---|---|
| projects | `{ owner: 1 }` | Fast lookup of user's owned projects |
| projects | `{ members: 1 }` | Fast lookup of projects user is a member of |
| projects | `{ owner: 1, key: 1 }` unique | Enforce unique project key per owner |
| tasks | `{ projectId: 1, status: 1 }` | Efficient Kanban board queries with status filter |
| tasks | `{ assignedTo: 1 }` | Power the /tasks/me personal dashboard |
| comments | `{ taskId: 1, createdAt: 1 }` | Chronological comment threads per task |

### Cascade Behavior

| Event | Cascade |
|---|---|
| Project deleted | All tasks in project deleted |
| Member removed | Member unassigned from all project tasks |
| Task deleted | Comments are **not** automatically deleted (known gap) |

---

## 10. API Design

### Base URL
`/api`

### Endpoint Reference

**Authentication**
```
POST   /api/auth/register        Register new user
POST   /api/auth/login           Authenticate, receive JWT
GET    /api/auth/me              Get current user profile (protected)
```

**Projects**
```
GET    /api/projects             List all projects (owned + member)
POST   /api/projects             Create a new project
GET    /api/projects/:id         Get project by ID (member+)
PUT    /api/projects/:id         Update project name/description (owner only)
DELETE /api/projects/:id         Delete project + cascade tasks (owner only)
POST   /api/projects/:id/members          Add member by email (owner only)
DELETE /api/projects/:id/members/:userId  Remove member (owner only)
```

**Tasks**
```
GET    /api/tasks?projectId=...  Get tasks for a project (paginated, filtered)
GET    /api/tasks/me             Get tasks assigned to current user
GET    /api/tasks/:id            Get single task
POST   /api/tasks                Create task
PATCH  /api/tasks/:id            Update task fields
DELETE /api/tasks/:id            Delete task
```

**Comments**
```
GET    /api/tasks/:id/comments            Get comments for a task
POST   /api/tasks/:id/comments            Add a comment
DELETE /api/tasks/:taskId/comments/:id    Delete own comment
```

### Response Envelope

All responses follow this consistent structure:

```json
{
  "success": true | false,
  "message": "Human-readable description",
  "data": { ... } | null
}
```

Pagination responses include:
```json
{
  "count": 10,
  "total": 47,
  "page": 1,
  "totalPages": 5,
  "tasks": [ ... ]
}
```

---

## 11. Technology Choices — Rationale

| Decision | Why | Alternative | Tradeoff |
|---|---|---|---|
| Next.js App Router | Future-proof routing, potential for SSR if needed | Vite + React SPA | More complex than a pure SPA; pays off if SSR/SSG is later needed |
| React Query for server state | Eliminates fetch boilerplate, built-in caching and invalidation | Redux Toolkit | Redux is better for complex client-side state; overkill for this app |
| Express over NestJS | Lower overhead, full control, industry-standard | NestJS | NestJS provides more structure out-of-the-box; Express requires discipline |
| MongoDB | Schema flexibility, natural document structure for tasks/comments | PostgreSQL | MongoDB lacks row-level ACID across collections; careful schema design required |
| References over embedding | Tasks/comments grow unboundedly; embed limit is 16MB/document | Embedding tasks in project | References require separate queries but enable independent task access patterns |
| bcrypt 12 rounds | Strong hashing with acceptable login latency (~300ms) | Argon2 | Argon2 is newer and preferred; bcrypt at 12 rounds is industry-acceptable |
| express-mongo-sanitize | Defense against NoSQL operator injection | Manual sanitization | Library approach is more maintainable and battle-tested |

---

## 12. Scalability Considerations

### Current Bottlenecks

1. **Board data loading** — `GET /api/tasks?projectId=X` fetches all tasks for the board. The frontend uses `limit: 200` as a practical cap. As project task count grows, this needs real cursor-based pagination with virtual scrolling on the board.

2. **`populate()` overhead** — Every task query populates `assignedTo` and `createdBy`. For board views with 50+ tasks this causes multiple embedded lookups. If board query latency becomes measurable, consider caching `assigneeName` directly on the Task document.

3. **Auth middleware DB hit** — `protect` middleware queries the user by ID on every single request. This can be reduced by embedding non-sensitive claims in the JWT payload (`name`, `email`) and only hitting the DB when the request modifies sensitive resources.

### Scaling Path

```
Current:      Single Express instance → MongoDB Atlas M0
Phase 2:      Add Redis for rate limit state + session store
Phase 3:      Add Socket.io for real-time board sync
Phase 4:      Horizontal scaling behind load balancer (stateless JWT handles this naturally)
Phase 5:      Read replicas for heavy board queries
```

---

## 13. Security Considerations

See [security.md](./security.md) for the full security architecture document.

**Summary of implemented protections:**
- Helmet security headers
- CORS restricted to known frontend origin
- Body size limit (10kb) preventing payload DoS
- MongoDB operator sanitization
- Input validation on all routes via express-validator
- Password hashed with bcrypt (12 rounds), never returned in queries
- JWT verification on all protected routes
- Resource-level authorization via RBAC middleware
- Project isolation — users cannot access tasks from projects they do not belong to
- Consistent error messages on auth endpoints (prevents user enumeration)

**Known gaps addressed in [security.md](./security.md):**
- No rate limiting (critical, pre-production blocker)
- JWT stored in localStorage (XSS risk)
- `error.message` exposed in some API responses
- No token refresh / revocation strategy

---

## 14. Future Improvements

### Near-Term (Pre-Production)
- Rate limiting on auth endpoints (`express-rate-limit`)
- Move JWT to `httpOnly` cookies with refresh token rotation
- Fix orphaned comment cascade on task and project deletion
- Add Next.js `middleware.ts` for server-side route protection
- Structured production logging (Winston + Sentry)

### Medium-Term
- Real cursor-based pagination on task board
- Task attachments (S3/R2 presigned upload)
- Rich text descriptions (Tiptap or Lexical with DOMPurify sanitization)
- Sub-tasks with parent-child task relationships
- Email notifications (invite, assignment, comment mention)

### Long-Term
- WebSocket support (Socket.io) for real-time multi-user board sync
- Activity audit log per project
- Full-text search across tasks (MongoDB Atlas Search)
- Granular RBAC (add Viewer role, Admin role above Owner)
- End-to-end test suite (Playwright)
