# TaskFlow

A full-stack project management application built with a Jira-inspired Kanban board, role-based access control, and a secure httpOnly cookie authentication system.

**Live:** [taskflow.vercel.app](https://taskflow.vercel.app) · **API:** [taskflow-api-dfcp.onrender.com](https://taskflow-api-dfcp.onrender.com)

---

## Features

- **Kanban Board** — Drag-and-drop cards across To Do, In Progress, and Done columns with optimistic UI updates
- **List View** — Filterable task list with status tabs, priority filter, and per-task status picker
- **Project Management** — Create projects with unique keys, invite members, and switch context via the header
- **Role-Based Access Control** — Project owners and members have distinct permissions enforced at the API layer
- **Secure Authentication** — JWT stored in httpOnly cookies (never in localStorage), with server-side route protection via Next.js middleware
- **Task Detail Panel** — Slide-over panel with inline editing, comments, assignee management, and due dates
- **Task Statistics** — Per-project completion stats shown on the dashboard

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (HS256) in httpOnly cookies |
| Validation | express-validator |
| Rate Limiting | express-rate-limit |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | React Query (TanStack) |
| Forms | React Hook Form + Zod |
| Drag & Drop | @hello-pangea/dnd |

---

## Project Structure

```
task-manager-api/
├── server/                     # Express API
│   ├── src/
│   │   ├── config/             # MongoDB connection
│   │   ├── controllers/        # Route handlers (auth, projects, tasks, comments)
│   │   ├── middleware/         # Auth guard, project membership, error handler
│   │   ├── models/             # Mongoose schemas (User, Project, Task, Comment)
│   │   ├── routes/             # Express routers
│   │   └── utils/              # JWT sign/verify helpers
│   └── server.js               # Entry point — startup validation, listen
│
└── client/                     # Next.js application
    └── src/
        ├── app/                # App Router pages
        │   ├── dashboard/      # List view (page.tsx)
        │   └── dashboard/board # Kanban view (page.tsx)
        ├── components/         # UI components (kanban, tasks, forms, layout)
        ├── hooks/              # React Query hooks (use-tasks, use-projects, use-auth)
        ├── providers/          # Auth and project context providers
        ├── services/           # Axios service layer (auth, tasks, projects)
        └── middleware.ts       # Next.js edge middleware (route protection)
```

---

## Architecture

```
Browser
  │
  ├── GET /dashboard  ──►  Next.js Edge Middleware
  │                           └── No cookie → redirect /login
  │
  ├── POST /api/auth/login ──►  Next.js Server (next.config.ts rewrite)
  │                               └── Express /api/auth/login
  │                                     └── Sets httpOnly cookie
  │
  └── GET /api/tasks  ──►  Next.js Server (proxy)
                              └── Express /api/tasks
                                    └── Reads cookie → verifies JWT → returns data
```

The frontend never directly contacts the Express server. All `/api/*` requests are proxied through the Next.js server, which keeps the backend URL private and allows httpOnly cookies to work without cross-origin restrictions.

---

## Local Development

### Prerequisites

- Node.js 18+
- A [MongoDB Atlas](https://cloud.mongodb.com) cluster (or local MongoDB)

### 1. Clone and install

```bash
git clone https://github.com/ShivaniYadav07/task-manager-api.git
cd task-manager-api

cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

**Backend** — `server/.env`:
```env
PORT=8000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/task_manager
JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

**Frontend** — `client/.env.local`:
```env
API_URL=http://localhost:8000
```

> `API_URL` has no `NEXT_PUBLIC_` prefix — it is server-side only and never sent to the browser.

### 3. Start servers

```bash
# Terminal 1 — API
cd server && npm run dev      # http://localhost:8000

# Terminal 2 — Frontend
cd client && npm run dev      # http://localhost:3000
```

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, sets httpOnly cookie |
| POST | `/api/auth/logout` | Cookie | Clear session cookie |
| GET | `/api/auth/me` | Cookie | Get current user |

### Projects

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/projects` | Cookie | List user's projects |
| POST | `/api/projects` | Cookie | Create project |
| GET | `/api/projects/:id` | Member | Get project details |
| PUT | `/api/projects/:id` | Owner | Update project |
| DELETE | `/api/projects/:id` | Owner | Delete project + cascade |
| POST | `/api/projects/:id/members` | Owner | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Owner | Remove member |

### Tasks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks` | Cookie | List tasks (filterable by project, status, priority) |
| POST | `/api/tasks` | Member | Create task |
| GET | `/api/tasks/:id` | Member | Get task |
| PUT | `/api/tasks/:id` | Member | Update task |
| DELETE | `/api/tasks/:id` | Member | Delete task + cascade comments |
| GET | `/api/tasks/me` | Cookie | Tasks assigned to current user |

### Comments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks/:taskId/comments` | Member | List comments on a task |
| POST | `/api/tasks/:taskId/comments` | Member | Add comment |
| PUT | `/api/tasks/:taskId/comments/:id` | Author | Edit comment |
| DELETE | `/api/tasks/:taskId/comments/:id` | Author/Owner | Delete comment |

---

## Security

| Measure | Implementation |
|---|---|
| Token storage | httpOnly cookie — inaccessible to JavaScript |
| CSRF protection | SameSite=Lax (dev) / SameSite=None + Secure (prod) |
| JWT algorithm | Explicit `algorithms: ['HS256']` in `jwt.verify` |
| Rate limiting | 20 req/15 min on auth routes, 200 req/15 min globally |
| RBAC | Owner/Member roles enforced per-route in middleware |
| Cascade deletes | Deleting a project removes its tasks and all comments |
| Config validation | Server exits on startup if JWT_SECRET < 32 chars or MONGO_URI missing |
| Error handling | Centralized error handler — stack traces never reach the client |

Full details in [security.md](./security.md).

---

## Deployment

Deployed on **Render** (backend) + **Vercel** (frontend).

See [deployment.md](./deployment.md) for the complete step-by-step guide covering:
- MongoDB Atlas setup
- Render web service configuration
- Vercel project configuration
- CORS and environment variable reference
- Rollback procedures

---

## RBAC Matrix

| Action | Owner | Member | Non-member |
|---|---|---|---|
| View project | ✓ | ✓ | ✗ |
| Create task | ✓ | ✓ | ✗ |
| Edit any task | ✓ | ✓ | ✗ |
| Delete task | ✓ | ✓ | ✗ |
| Add comment | ✓ | ✓ | ✗ |
| Edit own comment | ✓ | ✓ | ✗ |
| Delete any comment | ✓ | ✗ | ✗ |
| Add member | ✓ | ✗ | ✗ |
| Remove member | ✓ | ✗ | ✗ |
| Delete project | ✓ | ✗ | ✗ |

---

## License

MIT
