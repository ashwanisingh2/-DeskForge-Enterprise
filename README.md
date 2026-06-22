# DeskForge Enterprise

Enterprise IT helpdesk and ITSM platform delivered in two forms:

- `deskforge.html` — standalone browser demo using embedded CSS/JavaScript and localStorage.
- `deskforge-pro/` — database-backed Next.js, TypeScript, Prisma and PostgreSQL application with Docker and Railway deployment support.

## Standalone demo

Open `deskforge.html` directly in a modern browser. Demo accounts include `admin / admin123`, `agent1 / agent123`, and `user1 / user123`.

## Fullstack application

See [`deskforge-pro/README.md`](deskforge-pro/README.md) for local setup, database migration, seeding, Docker Compose and Railway deployment instructions.

## Security

Never commit `.env` files or production credentials. Review the fullstack security model and Enterprise 2.0 delivery gates before production deployment.
