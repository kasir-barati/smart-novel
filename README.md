# Smart Novel

A modern monorepo project for managing and reading novels with AI-powered word explanations. Built with Nx, NestJS, GraphQL, and React.

## 🌟 Features

- **📚 Novel Management**: Markdown-based novel storage with JSON metadata
- **🔍 GraphQL API**: Powerful query and mutation capabilities
- **🏷️ Advanced Filtering**: Filter novels by categories with inclusion/exclusion
- **🤖 AI-Powered Explanations**: Word definitions with context using Ollama LLM
- **🔧 Type-Safe**: Full TypeScript support across the stack

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

docker compose --profile dev up
```

Then open:

- Frontend: http://localhost:4200
- GraphQL API: http://localhost:3000/graphql
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
│   ├── backend/              # NestJS GraphQL API
│   │   ├── data/             # Novel markdown files
│   └── frontend/             # React UI
├── compose.yml               # Docker Compose configuration
├── .env.example              # Environment variables template
├── .husky/                   # Git hooks
├── eslint.config.mjs         # ESLint configuration
├── tsconfig.base.json        # TypeScript configuration
└── nx.json                   # Nx configuration
```

## 🛠️ Technology Stack

- **Backend**: NestJS, GraphQL, TypeScript, Cache (Redis), PostgreSQL.
- **LLM**: Ollama (llama3.2:1b).
- **Frontend**: ReactJS, Vite, TypeScript.
- **Storage**: MinIO.

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
