# Smart Novel

A modern monorepo project for managing and reading novels with AI-powered word explanations. Built with Nx, NestJS, GraphQL, and React.

## 🌟 Features

- **📚 Novel Management**: Markdown-based novel storage with JSON metadata
- **🔍 GraphQL API**: Powerful query and mutation capabilities
- **📄 Cursor Pagination**: Efficient data fetching for large collections
- **🏷️ Advanced Filtering**: Filter novels by categories with inclusion/exclusion
- **🤖 AI-Powered Explanations**: Word definitions with context using Ollama LLM
- **🏗️ Modular Architecture**: Clean separation with repository pattern
- **🔧 Type-Safe**: Full TypeScript support across the stack
- **🎨 Modern Stack**: NestJS, Apollo GraphQL, React, Docker

## 📋 Prerequisites

- **Node.js**: v24.13 or higher
- **Docker**: For running services
- **npm**: Package manager

## 🚀 Quick Start

```bash
git clone git@github.com:kasir-barati/smart-novel.git
cd smart-novel

npm ci

cp .env.example .env

docker compose up
```

Then open:

- Frontend: http://localhost:4200
- GraphQL API: http://localhost:3000/graphql

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

## 🐛 Troubleshooting

### Ollama Connection Issues

```bash
# Check Ollama status
docker compose ps ollama

# View Ollama logs
docker compose logs ollama

# Verify model
docker exec ollama ollama list
```

**Built with ❤️ using modern web technologies**
