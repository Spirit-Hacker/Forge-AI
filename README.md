# Forge

Forge is an AI-powered cloud development platform inspired by tools like
Bolt.new.

It allows developers to create, edit, run, and eventually deploy full-stack
applications from a browser.

## Vision

Forge aims to provide a browser-based development environment with:

- Project management
- Cloud file storage
- Versioned files
- Project snapshots
- Monaco code editor
- Integrated terminal
- AI coding agent
- Sandboxed code execution
- Automated builds
- Containerized deployments
- Kubernetes-based infrastructure
- Observability and self-healing systems

## Architecture

```text
                         ┌──────────────────────┐
                         │      Next.js Web     │
                         │                      │
                         │ Explorer / Editor    │
                         │ AI Chat / Terminal    │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    Express API       │
                         │                      │
                         │ Auth / Projects      │
                         │ Files / Snapshots    │
                         └───────┬───────┬──────┘
                                 │       │
                    ┌────────────┘       └─────────────┐
                    ▼                                  ▼
             ┌─────────────┐                    ┌─────────────┐
             │ PostgreSQL  │                    │     S3      │
             │             │                    │             │
             │ Metadata    │                    │ File data   │
             │ Versions    │                    │ Snapshots   │
             └─────────────┘                    └─────────────┘
```

forge/
├── apps/
│ ├── web/ # Next.js frontend
│ └── api/ # Express API
│
├── packages/
│ ├── db/ # Prisma database package
│ ├── shared/ # Shared types and utilities
│ └── config/ # Shared configuration
│
├── services/
│ ├── agent-worker/ # AI coding agent
│ ├── build-worker/ # Application builds
│ └── deploy-worker/ # Application deployments
│
├── docker-compose.yml
├── package.json
├── turbo.json
└── README.md

Tech Stack
Frontend
Next.js
React
TypeScript
Tailwind CSS
Monaco Editor
Backend
Node.js
Express
TypeScript
Zod
Database
PostgreSQL
Prisma
Infrastructure
Docker
AWS S3
Redis
NATS
Kubernetes
AI
LLM-based coding agent
Tool calling
Repository context
Automated testing and fixing
