# Forge

> **An AI-powered cloud development platform for building, running, and deploying full-stack applications from the browser.**

Forge is a browser-based development platform inspired by tools such as Bolt.new. It aims to provide developers with a complete cloud development environment where they can create projects using natural language, edit source code, run applications in isolated environments, and eventually deploy production-ready applications.

The long-term goal of Forge is to combine an **AI coding agent**, **browser-based IDE**, **sandboxed execution**, **containerized builds**, and **cloud-native deployment infrastructure** into a single platform.

---

## 🚀 Vision

Forge is being built around a simple idea:

> **Describe what you want to build, and Forge helps you build, run, test, and deploy it.**

A typical workflow will eventually look like:

```text
                    User
                     │
                     ▼
              ┌──────────────┐
              │   AI Chat    │
              │   Prompt     │
              └──────┬───────┘
                     │
                     ▼
            ┌──────────────────┐
            │   AI Coding      │
            │     Agent        │
            └────────┬─────────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
     Read Files   Edit Files   Run Tests
          │          │          │
          └──────────┼──────────┘
                     ▼
             ┌──────────────┐
             │   Project    │
             │   Workspace  │
             └──────┬───────┘
                    │
                    ▼
             ┌──────────────┐
             │    Build     │
             │   Sandbox    │
             └──────┬───────┘
                    │
                    ▼
             ┌──────────────┐
             │   Deploy     │
             │     🚀       │
             └──────────────┘
```

---

# ✨ Features

## Project Management

Users can:

- Create projects
- View projects
- Update project information
- Delete projects
- Open projects in the development workspace

---

## 🔐 Authentication

Forge uses a token-based authentication architecture.

### Access tokens

- Short-lived JWT
- Used for API authentication
- Sent through the `Authorization` header
- Automatically refreshed when expired

### Refresh tokens

- Cryptographically random opaque tokens
- Stored in an `HttpOnly` cookie
- Only a SHA-256 hash is stored in PostgreSQL
- Sessions can be revoked
- Fixed session expiration

This architecture avoids storing long-lived authentication credentials in browser-accessible JavaScript.

---

# 📁 Project File System

Forge maintains project files separately from their actual contents.

The database stores metadata such as:

```text
Project
   │
   ├── ProjectFile
   │      ├── path
   │      ├── size
   │      ├── contentType
   │      ├── sha256
   │      └── currentVersionId
   │
   └── ProjectSnapshot
```

Actual file contents are stored in object storage.

For example:

```text
projects/
└── <project-id>/
    └── files/
        └── <file-id>/
            └── versions/
                ├── 1
                ├── 2
                └── 3
```

This allows Forge to keep the database focused on metadata and relationships while object storage handles file contents.

---

# 🕐 File Versioning

Every modification to a file creates an immutable version.

For example:

```text
Button.tsx

Version 1
    ↓
Version 2
    ↓
Version 3
    ↓
Version 4
```

The current version is referenced by:

```text
ProjectFile.currentVersionId
```

Older versions remain available.

This provides the foundation for:

- Version history
- File restoration
- AI change tracking
- Undo/rollback
- Project snapshots
- Auditing

---

# 📸 Project Snapshots

A snapshot represents the state of an entire project at a specific point in time.

Instead of copying file contents, snapshots reference existing file versions.

```text
Project Snapshot
       │
       ├── package.json → Version 3
       ├── src/app.ts   → Version 8
       ├── src/api.ts   → Version 4
       └── README.md    → Version 2
```

This makes snapshots significantly more efficient than duplicating all project files.

Snapshots will eventually be used for:

- AI agent checkpoints
- Deployment versions
- Rollbacks
- Experimentation
- Recovery

---

# 💻 Browser-Based Workspace

Forge provides a browser-based development environment.

The planned workspace:

```text
┌──────────────────────────────────────────────────────────────┐
│ Forge                                  Save     Deploy       │
├──────────────┬─────────────────────────────┬─────────────────┤
│              │                             │                 │
│ File         │                             │    AI Chat      │
│ Explorer     │       Monaco Editor         │                 │
│              │                             │                 │
│ 📁 src       │                             │    Agent        │
│  ├─ app.ts   │                             │    messages     │
│  └─ api.ts   │                             │                 │
│              │                             │                 │
├──────────────┴─────────────────────────────┴─────────────────┤
│ Terminal                                                     │
│ $ npm install                                                │
│ $ npm run dev                                                │
└──────────────────────────────────────────────────────────────┘
```

The workspace will eventually include:

- File explorer
- Recursive file tree
- Monaco code editor
- File tabs
- Save functionality
- Version history
- Integrated terminal
- AI coding assistant
- Live application preview
- Build status
- Deployment controls

---

# 🤖 AI Coding Agent

One of the core components of Forge is its AI coding agent.

The agent will not simply generate code and return a text response.

Instead, it will operate on the actual project workspace.

The planned agent loop is:

```text
User Request
     │
     ▼
Understand Task
     │
     ▼
Inspect Repository
     │
     ▼
Create Plan
     │
     ▼
Modify Files
     │
     ▼
Run Tests / Build
     │
     ▼
Inspect Errors
     │
     ▼
Fix Problems
     │
     ▼
Verify Result
     │
     ▼
Report Changes
```

---

## Agent Tools

The agent will have access to tools such as:

```text
list_files
read_file
write_file
edit_file
delete_file
search_code
run_command
run_tests
run_linter
git_diff
```

For example:

```text
User:

"Add authentication to my application."

        ↓

AI Agent

1. Inspect project
2. Identify framework
3. Inspect existing routes
4. Inspect database
5. Create authentication files
6. Modify existing files
7. Install dependencies
8. Run tests
9. Run build
10. Fix errors
11. Show summary
```

The goal is to make the agent operate more like a software engineer working inside a repository rather than a chatbot producing isolated code snippets.

---

# 🔒 Sandboxed Execution

Running arbitrary generated code is one of the major engineering challenges in Forge.

Applications will eventually execute inside isolated environments.

The planned execution architecture:

```text
                    API
                     │
                     ▼
                  Job Queue
                     │
                     ▼
               Build Worker
                     │
                     ▼
              ┌─────────────┐
              │   Sandbox   │
              │             │
              │   Docker    │
              │             │
              │ CPU Limits  │
              │ Memory      │
              │ Network     │
              │ Filesystem  │
              └──────┬──────┘
                     │
                     ▼
                Build Result
```

Security controls will eventually include:

- CPU limits
- Memory limits
- Execution timeouts
- Filesystem isolation
- Network restrictions
- Process limits
- Container isolation
- Resource quotas

---

# 🐳 Containerized Builds

Generated applications will eventually be built inside isolated containers.

The build pipeline will look approximately like:

```text
Project
   │
   ▼
Snapshot
   │
   ▼
Build Worker
   │
   ▼
Docker Build
   │
   ▼
OCI Image
   │
   ▼
Container Registry
```

This provides reproducible application builds and creates a foundation for deployment.

---

# ☸️ Deployment Infrastructure

The long-term deployment architecture is designed around container orchestration.

Planned architecture:

```text
                       Forge API
                          │
                          ▼
                    Deploy Worker
                          │
                          ▼
                     Kubernetes
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
           App Pod     App Pod     App Pod
              │           │           │
              └───────────┼───────────┘
                          ▼
                     Ingress
                          │
                          ▼
                     User Domain
```

Future deployment functionality may include:

- Automatic builds
- Container images
- Kubernetes deployments
- Health checks
- Rolling deployments
- Rollbacks
- Resource limits
- Custom domains
- TLS
- Deployment logs
- Deployment history

---

# 📊 Observability

Production infrastructure needs visibility into what is happening.

Forge will eventually integrate:

```text
OpenTelemetry
      │
      ├── Traces
      │
      ├── Metrics
      │
      └── Logs
```

Planned observability stack:

- OpenTelemetry
- Prometheus
- Grafana
- Loki
- Tempo

This will allow tracking:

- API latency
- Worker execution time
- Build duration
- Deployment failures
- Queue latency
- Container health
- AI agent execution
- Error rates

---

# 🏗️ Architecture

Current high-level architecture:

```text
                           ┌───────────────────┐
                           │      Browser      │
                           └─────────┬─────────┘
                                     │
                                     ▼
                           ┌───────────────────┐
                           │     Next.js       │
                           │      Web App      │
                           └─────────┬─────────┘
                                     │
                                     ▼
                           ┌───────────────────┐
                           │    Express API    │
                           └───────┬─────┬─────┘
                                   │     │
                     ┌─────────────┘     └──────────────┐
                     ▼                                  ▼
             ┌───────────────┐                  ┌───────────────┐
             │  PostgreSQL   │                  │      S3       │
             │               │                  │               │
             │ Users         │                  │ File Contents │
             │ Projects      │                  │ Versions      │
             │ Sessions      │                  │               │
             │ Files         │                  │               │
             │ Versions      │                  │               │
             │ Snapshots     │                  │               │
             └───────────────┘                  └───────────────┘
```

Future architecture:

```text
                         ┌───────────────┐
                         │    Browser    │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │    Next.js    │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │   API Gateway │
                         └───────┬───────┘
                                 │
             ┌───────────────────┼────────────────────┐
             │                   │                    │
             ▼                   ▼                    ▼
       ┌───────────┐       ┌───────────┐       ┌───────────┐
       │ Auth      │       │ Projects  │       │ AI Agent  │
       │ Service   │       │ Service   │       │ Service   │
       └───────────┘       └───────────┘       └─────┬─────┘
                                                     │
                                                     ▼
                                               ┌───────────┐
                                               │   Queue   │
                                               └─────┬─────┘
                                                     │
                              ┌──────────────────────┼──────────────────┐
                              │                      │                  │
                              ▼                      ▼                  ▼
                        ┌───────────┐          ┌───────────┐      ┌───────────┐
                        │   Build   │          │  Deploy   │      │  Sandbox  │
                        │  Worker   │          │  Worker   │      │  Worker   │
                        └─────┬─────┘          └─────┬─────┘      └───────────┘
                              │                      │
                              ▼                      ▼
                        ┌───────────┐          ┌───────────┐
                        │ Container │          │ Kubernetes│
                        │ Registry  │          │           │
                        └───────────┘          └───────────┘
```

---

# 📂 Repository Structure

```text
forge/
│
├── apps/
│   │
│   ├── web/
│   │   └── # Next.js frontend
│   │
│   └── api/
│       └── # Express backend
│
├── packages/
│   │
│   ├── db/
│   │   └── # Prisma database package
│   │
│   ├── shared/
│   │   └── # Shared types and utilities
│   │
│   └── config/
│       └── # Shared configuration
│
├── services/
│   │
│   ├── agent-worker/
│   │   └── # AI coding agent
│   │
│   ├── build-worker/
│   │   └── # Application build worker
│   │
│   └── deploy-worker/
│       └── # Deployment worker
│
├── docker-compose.yml
├── package.json
├── turbo.json
├── .gitignore
└── README.md
```

---

# 🛠️ Tech Stack

## Frontend

| Technology    | Purpose         |
| ------------- | --------------- |
| Next.js       | Web application |
| React         | UI              |
| TypeScript    | Type safety     |
| Tailwind CSS  | Styling         |
| Monaco Editor | Code editing    |

## Backend

| Technology | Purpose               |
| ---------- | --------------------- |
| Node.js    | Runtime               |
| Express    | HTTP API              |
| TypeScript | Type safety           |
| Zod        | Request validation    |
| JWT        | Access authentication |
| bcrypt     | Password hashing      |

## Database

| Technology | Purpose             |
| ---------- | ------------------- |
| PostgreSQL | Relational database |
| Prisma     | ORM                 |
| S3         | Object/file storage |

## Infrastructure

| Technology    | Purpose                 |
| ------------- | ----------------------- |
| Docker        | Containerization        |
| Redis         | Caching / coordination  |
| NATS          | Messaging               |
| Kubernetes    | Container orchestration |
| OpenTelemetry | Observability           |
| Prometheus    | Metrics                 |
| Grafana       | Visualization           |

## AI

| Technology         | Purpose                   |
| ------------------ | ------------------------- |
| LLM APIs           | Code generation/reasoning |
| Tool Calling       | Agent actions             |
| Repository Context | Codebase understanding    |
| Automated Testing  | Verification              |

---

# 🧩 Monorepo

Forge is structured as a monorepo.

```text
forge
│
├── apps
│   ├── web
│   └── api
│
├── packages
│   ├── db
│   ├── shared
│   └── config
│
└── services
    ├── agent-worker
    ├── build-worker
    └── deploy-worker
```

Turborepo is used to coordinate applications and packages.

The project currently uses **npm workspaces**.

---

# 🚀 Getting Started

## Prerequisites

Make sure the following are installed:

- Node.js
- npm
- Docker
- Docker Compose
- Git

---

## Clone

```bash
git clone https://github.com/YOUR_USERNAME/Forge-AI.git

cd forge
```

---

## Install dependencies

```bash
npm install
```

---

## Environment Variables

Create the required `.env` files based on the provided examples.

For example:

```bash
cp apps/api/.env.example apps/api/.env
```

Configure your local PostgreSQL and storage credentials.

Never commit real secrets.

---

# 🐘 Start PostgreSQL

Forge uses PostgreSQL during development.

Example:

```bash
docker compose up -d postgres
```

Verify:

```bash
docker ps
```

---

# 🗄️ Database Setup

Generate the Prisma client:

```bash
npm run generate --workspace @forge/db
```

Run migrations:

```bash
npm run migrate --workspace @forge/db
```

---

# ▶️ Start Development

Run the entire monorepo:

```bash
npm run dev
```

The web application will be available at:

```text
http://localhost:3000
```

The API will run on the configured backend port.

---

# 🧪 Development Philosophy

Forge is being developed with an emphasis on production-oriented engineering rather than simply building a prototype.

Important principles include:

### Separation of concerns

Business logic should not be tightly coupled to HTTP handlers.

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Repository / Database
```

### Storage abstraction

Application code should not depend directly on S3.

```text
Application
     ↓
StorageService
     ↓
S3 / Local Storage / Future Provider
```

### Immutable versions

File versions are immutable.

New content creates a new version rather than mutating historical data.

### Explicit boundaries

The system is designed to separate:

- API
- Database
- Storage
- AI agent
- Build system
- Deployment system
- Runtime environments

---

# 🔐 Security

Security is a major concern because Forge will eventually execute AI-generated and user-provided code.

Planned security measures include:

- HttpOnly refresh cookies
- Short-lived access tokens
- Password hashing
- Input validation
- Path traversal protection
- Project ownership checks
- Rate limiting
- Container isolation
- Resource limits
- Network restrictions
- Secret isolation
- Sandboxed command execution
- Audit logging

Never commit:

```text
.env
AWS credentials
JWT secrets
database passwords
API keys
private certificates
```

---

# 📈 Roadmap

## Phase 1 — Core Platform

- [x] Monorepo
- [x] Next.js application
- [x] Express API
- [x] PostgreSQL
- [x] Prisma
- [x] Authentication
- [x] Project CRUD
- [x] Project dashboard
- [x] S3 storage abstraction
- [x] Project files
- [x] File versioning
- [x] Project snapshots

---

## Phase 2 — Browser IDE

- [x] Workspace shell
- [x] File explorer
- [x] Recursive file tree
- [x] File creation
- [x] Monaco integration
- [x] Load file contents
- [ ] File editing
- [ ] File saving
- [ ] File version history
- [ ] Rename files
- [ ] Delete files
- [ ] Create folders
- [ ] File tabs
- [ ] Unsaved changes detection
- [ ] Keyboard shortcuts

---

## Phase 3 — Runtime

- [ ] Integrated terminal
- [ ] WebSocket communication
- [ ] Command execution
- [ ] Process management
- [ ] Sandboxed execution
- [ ] CPU limits
- [ ] Memory limits
- [ ] Execution timeouts
- [ ] Live preview
- [ ] Preview URLs

---

## Phase 4 — AI Coding Agent

- [ ] Agent architecture
- [ ] Tool calling
- [ ] Repository context
- [ ] File search
- [ ] Code editing
- [ ] Command execution
- [ ] Test execution
- [ ] Build verification
- [ ] Automatic error fixing
- [ ] Agent checkpoints
- [ ] Agent history
- [ ] AI-generated project creation

---

## Phase 5 — Build System

- [ ] Build jobs
- [ ] Job queue
- [ ] Build workers
- [ ] Docker builds
- [ ] Build caching
- [ ] OCI images
- [ ] Container registry
- [ ] Build logs
- [ ] Build retries
- [ ] Failed build recovery

---

## Phase 6 — Deployment

- [ ] Deployment API
- [ ] Deployment worker
- [ ] Kubernetes integration
- [ ] Application deployments
- [ ] Health checks
- [ ] Rolling deployments
- [ ] Rollbacks
- [ ] Custom domains
- [ ] TLS
- [ ] Deployment logs
- [ ] Resource management

---

## Phase 7 — Distributed Infrastructure

- [ ] Redis
- [ ] NATS
- [ ] Distributed job processing
- [ ] Idempotency
- [ ] Retry policies
- [ ] Dead-letter queues
- [ ] Distributed locks
- [ ] Worker autoscaling
- [ ] Queue monitoring

---

## Phase 8 — Observability

- [ ] OpenTelemetry
- [ ] Distributed tracing
- [ ] Prometheus metrics
- [ ] Grafana dashboards
- [ ] Centralized logging
- [ ] Loki
- [ ] Tempo
- [ ] Error tracking
- [ ] SLOs
- [ ] Alerting

---

# 🗺️ Long-Term Goal

The ultimate architecture is intended to support a workflow like:

```text
                 ┌──────────────────────┐
                 │       User           │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │      Forge Web       │
                 │                      │
                 │ Editor / AI /        │
                 │ Terminal / Preview   │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │      Forge API       │
                 └──────────┬───────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
     PostgreSQL            S3             Job Queue
          │                                   │
          │                    ┌──────────────┼──────────────┐
          │                    │              │              │
          │                    ▼              ▼              ▼
          │                AI Agent        Builder        Deployer
          │                    │              │              │
          │                    └──────┬───────┘              │
          │                           │                      │
          │                           ▼                      ▼
          │                      Sandbox                 Kubernetes
          │                           │                      │
          │                           ▼                      ▼
          │                     Test / Build             Production
          │                                                  │
          └──────────────────────────────────────────────────┘
```

The objective is to evolve Forge from a browser-based code editor into a complete **AI-native application development and deployment platform**.

---

# 🤝 Contributing

Forge is currently primarily developed as an independent engineering project.

As the architecture stabilizes, contribution guidelines, development standards, and issue templates will be added.

Before submitting changes:

```bash
npm run lint
npm run build
```

Keep commits focused and descriptive.

Examples:

```text
feat: add project snapshots
fix: prevent unauthorized project access
refactor: extract storage abstraction
docs: update deployment architecture
chore: update dependencies
```

---

# 📄 License

License information will be added as the project approaches its first public release.

---

# ⭐ Project Status

Forge is currently under active development.

The current focus is building the **core browser-based development environment**, followed by the AI coding agent and isolated execution infrastructure.

```text
Core Platform        █████████░  In Progress
Browser IDE          ████░░░░░░  In Progress
AI Agent             ██░░░░░░░░  Planned
Sandbox              █░░░░░░░░░  Planned
Build System         █░░░░░░░░░  Planned
Deployment           ░░░░░░░░░░  Planned
Observability        ░░░░░░░░░░  Planned
```

**Forge — Build. Run. Deploy.**
