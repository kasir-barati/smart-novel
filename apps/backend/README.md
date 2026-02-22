# TODOs

- Libs:
  ```
  @nanostores/react@1.0.0
  nanostores@1.1.0
  react-markdown@10.1.0
  sonner@2.0.7
  ```
- Making it look better.
- Unit testing.

# Smart Novel Backend

A NestJS GraphQL API for managing and reading novels stored as markdown files with integrated LLM capabilities for word explanation.

## Features

- 📚 **Novel Management**: Read novels stored as markdown files with metadata in JSON
- 🔍 **GraphQL API**: Code-first GraphQL schema with Apollo Server
- 📄 **Cursor-based Pagination**: Efficient pagination for large novel collections
- 🏷️ **Category Filtering**: Filter novels by category with `in` and `nin` operators
- 🤖 **LLM Integration**: Word explanation using Ollama (llama3.2:1b model)
- 🏗️ **Modular Architecture**: Repository pattern for easy database migration
- ✅ **Validation**: Global validation with class-validator and class-transformer
- 🔧 **Type Safety**: Full TypeScript support with nodenext module resolution

## Prerequisites

- **Node.js**: v24.13 or higher
- **Docker**: For running the application and Ollama
- **npm**: Package manager

## Installation

```bash
# Install dependencies (from project root)
npm install
```

## Environment Variables

Create a `.env` file in the project root (use `.env.example` as template):

```env
# Backend Configuration
PORT=3000
NODE_ENV=development

# Ollama Configuration
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2:1b
```

## Data Directory Structure

Novels are stored in the `apps/backend/data` directory:

```
data/
└── novel-id/
    ├── details.json       # Novel metadata
    ├── chapter1.md        # Chapter markdown files
    └── chapter2.md
```

### details.json Format

```json
{
  "id": "novel-id",
  "name": "Novel Title",
  "author": "Author Name",
  "category": ["fantasy", "adventure"],
  "state": "ONGOING"
}
```

### Chapter Markdown Format

```markdown
---
title: 'Chapter Title'
---

# Chapter content goes here

Markdown content...
```

## Running the Application

### Development (Docker Compose - Recommended)

```bash
# Start all services (backend + Ollama)
docker compose up

# Start in detached mode
docker compose up -d

# View logs
docker compose logs -f backend

# Stop services
docker compose down
```

The application will be available at:

- **GraphQL Playground**: http://localhost:3000/graphql
- **Health Check**: http://localhost:3000/graphql?query={health}

### Local Development (without Docker)

```bash
# Build the backend
npx nx build backend

# Serve the backend
npx nx serve backend

# Run tests
npx nx test backend

# Lint
npx nx lint backend
```

**Note**: For local development, you'll need to run Ollama separately or update the `OLLAMA_BASE_URL` environment variable.

## GraphQL API

### Queries

#### Get Single Novel

```graphql
query {
  novel(id: "example-novel") {
    id
    name
    author
    category
    chapters
    state
    chapter(id: "chapter1.md") {
      id
      title
      content
      createdAt
      updatedAt
    }
  }
}
```

#### Get All Novels with Pagination

```graphql
query {
  novels(
    first: 10
    after: "cursor"
    filters: { category: { in: ["fantasy"] } }
  ) {
    edges {
      node {
        id
        name
        author
        category
        state
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
```

#### Filter Novels by Category

```graphql
query {
  novels(
    first: 5
    filters: {
      category: {
        in: ["fantasy", "adventure"] # Include these categories
        nin: ["horror"] # Exclude this category
      }
    }
  ) {
    edges {
      node {
        id
        name
        category
      }
    }
  }
}
```

### Mutations

#### Explain Word

```graphql
mutation {
  explain(
    word: "scrutinized"
    context: "She scrutinized the men's faces carefully, trying to work out who was lying."
  ) {
    meaning
    synonyms
    antonyms
    simplifiedExplanation
  }
}
```

## Project Structure

```
apps/backend/
├── src/
│   ├── app/                    # Root application module
│   │   ├── app.module.ts
│   │   ├── app.resolver.ts     # Health check
│   │   └── index.ts
│   ├── modules/                # Feature modules
│   │   ├── novel/              # Novel management
│   │   │   ├── dto/            # Input types
│   │   │   ├── types/          # GraphQL types
│   │   │   ├── repositories/   # Data access layer
│   │   │   ├── novel.service.ts
│   │   │   ├── novel.resolver.ts
│   │   │   ├── novel.module.ts
│   │   │   └── index.ts
│   │   ├── llm/                # LLM integration
│   │   │   ├── types/
│   │   │   ├── llm.service.ts
│   │   │   ├── llm.resolver.ts
│   │   │   ├── llm.module.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── main.ts                 # Application entry point
├── data/                       # Novel data files
│   └── example-novel/
│       ├── details.json
│       ├── chapter1.md
│       └── chapter2.md
├── Dockerfile
└── README.md
```

## Architecture

### Modular Design

The application uses a modular architecture with clear separation of concerns:

- **Repository Pattern**: `INovelRepository` interface allows easy swapping of data sources
- **Service Layer**: Business logic isolated in services
- **Resolver Layer**: GraphQL resolvers handle API requests
- **DTOs**: Input validation with class-validator

### Future Database Migration

To switch from file-based storage to a database:

1. Create a new repository implementation (e.g., `DatabaseNovelRepository`)
2. Implement the `INovelRepository` interface
3. Update the provider in `novel.module.ts`:

```typescript
{
  provide: NOVEL_REPOSITORY,
  useClass: DatabaseNovelRepository, // Change this
}
```

## Docker

### Development with Hot-Reload

The `compose.yml` mounts source and data directories for hot-reload:

```yaml
volumes:
  - ./apps/backend/src:/app/apps/backend/src:delegated
  - ./apps/backend/data:/app/data:delegated
```

### Production Build

```bash
# Build production image
docker build -f apps/backend/Dockerfile -t smart-novel-backend .

# Run production container
docker run -p 3000:3000 -e OLLAMA_BASE_URL=http://ollama:11434 smart-novel-backend
```

## Health Check

The application includes a health check endpoint:

```graphql
query {
  health
}
```

Response: `"OK"`

Used by Docker Compose to ensure the service is ready.

## Troubleshooting

### Ollama Connection Issues

If the backend cannot connect to Ollama:

1. Ensure Ollama service is healthy: `docker compose ps`
2. Check Ollama logs: `docker compose logs ollama`
3. Verify the model is pulled: `docker exec ollama ollama list`

### Data Not Loading

1. Check data directory structure matches the expected format
2. Ensure `details.json` has correct JSON format
3. Verify markdown files have valid frontmatter
4. Check file permissions

### GraphQL Schema Not Generating

1. Ensure all decorators are correctly applied
2. Check for circular dependencies
3. Restart the application

## Contributing

- Follow the ESLint rules (configured with perfectionist)
- Ensure all commits pass pre-commit hooks (lint-staged)
- All pushes must pass pre-push hooks (full lint)
- Use barrel exports (`index.ts`) for clean imports

## License

MIT
