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

- Backend: NestJS, GraphQL, TypeScript.
- LLM: Ollama.
- Frontend: ReactJS, Vite, TypeScript

## 🗂️ Data Structure

Novels are stored in `apps/backend/data/`:

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
