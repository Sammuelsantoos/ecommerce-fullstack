# E-commerce Fullstack

[![CI](https://github.com/Sammuelsantoos/ecommerce-fullstack/actions/workflows/ci.yml/badge.svg)](https://github.com/Sammuelsantoos/ecommerce-fullstack/actions/workflows/ci.yml)
[![CD](https://github.com/Sammuelsantoos/ecommerce-fullstack/actions/workflows/cd-backend.yml/badge.svg)](https://github.com/Sammuelsantoos/ecommerce-fullstack/actions/workflows/cd-backend.yml)

Loja virtual com autenticação JWT, catálogo, carrinho, pedidos e painel admin.

| Camada | Stack |
|---|---|
| Backend | NestJS 12, Prisma 7, PostgreSQL 16, JWT, Swagger (`/api/docs`) |
| Frontend | Next.js 16, React 19, Tailwind 4, shadcn/ui, Zustand |
| Qualidade | Jest (unit + E2E), Vitest, oxlint, ESLint, GitHub Actions |
| Infra | Docker, AWS (RDS, ECR, EC2) ou Render + Neon, Vercel |

## Rodando localmente

```bash
docker compose up -d db                 # Postgres em localhost:5433
cd backend && cp .env.example .env && npm ci
npx prisma migrate deploy && npm run start:dev
cd ../frontend && npm ci && echo 'NEXT_PUBLIC_API_URL=http://localhost:3000/api' > .env.local && npm run dev
```

## Testes

```bash
cd backend  && npm test && npm run test:e2e   # unitários e E2E (precisa do .env.test)
cd frontend && npm test                       # Vitest
```

## CI/CD e deploy

Veja [docs/DEPLOY.md](docs/DEPLOY.md): pipeline, proteção de branch, deploy na AWS (OIDC + SSM) e rota gratuita (Render + Neon + Vercel).

## Fluxo de branches

`feat/*` / `chore/*` → `develop` (merge `--no-ff`) → `main` (release). Commits seguem Conventional Commits.
