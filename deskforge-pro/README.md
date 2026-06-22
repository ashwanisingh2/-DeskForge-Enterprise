# DeskForge Pro

Production-oriented Next.js 16 IT helpdesk with React 19, PostgreSQL, Prisma, credential authentication, Resend hooks, tenant-scoped APIs, SLA automation, analytics, and responsive Tailwind UI.

The Enterprise 2.0 architecture and security delivery gates are documented in [`docs/ENTERPRISE-2.0-ROADMAP.md`](docs/ENTERPRISE-2.0-ROADMAP.md) and [`docs/SECURITY.md`](docs/SECURITY.md).

## Local setup

1. Run `npm install`.
2. Copy `.env.example` to `.env` and configure PostgreSQL plus `NEXTAUTH_SECRET`.
3. Run `npx prisma migrate dev --name init`.
4. Run `npx prisma db seed`.
5. Run `npm run dev`, then open `http://localhost:3000`.

Alternatively, run `docker compose up --build` to start PostgreSQL, Redis, MinIO, and the application together.

Demo credentials: `admin / admin123`, `agent1 / agent123`, `agent2 / agent456`, `user1 / user123`, `user2 / user456`.

## Railway

Create a Railway project, add PostgreSQL, import this directory from GitHub, set the environment variables, and deploy. `railway.json` applies migrations before starting. Set `NEXTAUTH_URL` to the generated HTTPS domain and use a cryptographically random `NEXTAUTH_SECRET`.
