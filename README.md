# Smart Novel

A modern monorepo project for managing and reading novels with AI-powered word explanations. Built with Nx, NestJS, GraphQL, and React.

## 🌟 Features

- **📚 Novel Management**: Create, read, and manage novels with chapters stored in PostgreSQL via Prisma
- **🔍 GraphQL API**: Powerful query, mutation, and subscription capabilities (Apollo Server)
- **🏷️ Advanced Filtering**: Filter and search novels by categories with inclusion/exclusion
- **🤖 AI-Powered Explanations**: Word definitions with context using Ollama LLM, with client-side rate limiting (token bucket)
- **🔊 Text-to-Speech Narration**: Chapter narration via Piper TTS with real-time status updates through GraphQL subscriptions
- **🔐 Authentication & Authorization**: OIDC-based auth via Zitadel with RBAC (role-based access control)
- **🌗 Theme Support**: Light/dark mode toggle with persistent theme preferences
- **📄 Pagination**: Cursor-based novel listing with pagination support

## 📋 Prerequisites

- **Node.js**: v24.13 or higher.
- **Docker**: For running services.
- **npm**: Package manager.

## 🚀 Quick Start

```bash
git clone git@github.com:kasir-barati/smart-novel.git
cd smart-novel

npm ci

cp .env.example .env

npm run start:dev
```

Then open:

- Frontend: http://localhost:8080
- ZITADEL console: http://localhost:8080/ui/console/
- GraphQL API: http://localhost:8080/graphql
- Open WebUI: http://localhost:8080/
- RedisInsight: http://localhost:5540/

## Running Tests

```bash
# Run all e2e tests
nx e2e frontend-e2e

# Run all e2e tests
nx e2e backend-e2e
```

## 📁 Project Structure

```
smart-novel/
├── apps/
│   ├── backend/                  # NestJS GraphQL API
│   │   ├── data/                 # Novel seed data (markdown + JSON)
│   │   ├── prisma/               # Prisma schema, migrations & seeders
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/         # Zitadel OIDC auth & RBAC guards
│   │       │   ├── llm/          # Ollama LLM word explanation
│   │       │   ├── novel/        # Novel & chapter CRUD, narration (TTS)
│   │       │   ├── object-storage/ # MinIO S3 file uploads
│   │       │   ├── prisma/       # Prisma service
│   │       │   └── redis/        # Redis caching service
│   │       └── utils/
│   ├── backend-e2e/              # Backend E2E tests (Vitest)
│   ├── frontend/                 # React SPA
│   │   └── src/
│   │       ├── components/       # Shared components (MarkdownRenderer, etc.)
│   │       ├── hooks/            # Custom hooks (useAuth, useWordExplain, etc.)
│   │       ├── pages/            # Route pages (home, novel, search, auth)
│   │       ├── stores/           # Nanostores state management
│   │       └── utils/            # Utilities (token-bucket, notifications)
│   └── frontend-e2e/             # Frontend E2E tests (Cypress)
├── local-setup/                  # Docker & local dev utilities
│   ├── ollama/                   # Ollama Dockerfile & healthcheck
│   └── setup-zitadel/            # Zitadel provisioning scripts
├── compose.yml                   # Docker Compose configuration
├── .env.example                  # Environment variables template
├── nx.json                       # Nx configuration
└── tsconfig.base.json            # TypeScript base configuration
```

## 🛠️ Technology Stack

- **Backend**: NestJS, GraphQL (Apollo Server), TypeScript, Prisma ORM, Webpack
- **Frontend**: React, Vite, TypeScript, TailwindCSS, Nanostores, React Router
- **Database**: PostgreSQL
- **Cache**: Redis (ioredis)
- **Auth**: Zitadel (OIDC/OAuth2), RBAC
- **LLM**: Ollama (llama3.2:1b), Open WebUI
- **TTS**: Piper TTS REST API
- **Object Storage**: MinIO (S3-compatible)
- **Reverse Proxy**: Traefik
- **Testing**: Vitest (unit/integration), Cypress (E2E)
- **Monorepo**: Nx
- **CI/CD**: Docker, Docker Compose

## 🗂️ Data Structure

<details><summary>Novels are stored in <code>apps/backend/data/</code>:</summary>

```
data/
└── novel-name/
    ├── details.json # Metadata
    ├── chapter1.md  # Content
```

**details.json:**

```json
{
  "id": "novel-name",
  "author": "Author Name",
  "name": "Name of The Novel",
  "description": "Some short description.",
  "coverUrl": "http://localhost:9000/smart-novel/covers/71a3fcd8-937d-4e3d-94de-a643ff515f82.png",
  "category": ["fantasy", "adventure"],
  "state": "ONGOING"
}
```

**chapter.md:**

```markdown
---
title: 'Chapter Title'
---

# Chapter content...
```

</details>

### Prisma Migration Guide

#### Development

To run migrations in development:

```bash
npx prisma migrate dev
```

#### Production

How migrations should be applied in a professional, production‑safe workflow? Since the Prisma CLI is a dev dependency and not available in the production container. Thus we need to apply migrations in our CI/CD Pipeline:

```bash
npx prisma migrate deploy --schema=./apps/backend/prisma/schema.prisma
```
