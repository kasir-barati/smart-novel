# Smart Novel Frontend

A modern React application for reading and discovering novels, built with React, TypeScript, TailwindCSS, and Nanostores.

## Features

### 1. **Home Page** (`/`)

- Displays the first 20 novels with pagination
- Novel cards showing cover image, title, author, categories, and description
- Click on categories to navigate to search page with pre-selected filter
- Responsive pagination component
- Mobile-first design with desktop layout support

### 2. **Novel Reading Page** (`/novel/:id`)

- Novel details: name, author, cover image, description, and categories
- "Read First Chapter" and "Read Latest Chapter" buttons
- Chapter list with creation dates
- Read chapters are displayed in gray text
- Chapter content viewer with markdown support
- Previous/Next chapter navigation buttons at top and bottom
- Breadcrumbs navigation
- No header/footer (dedicated reading experience)

### 3. **Search Page** (`/search`)

- Filter novels by categories
- Include/Exclude category filters
- Green buttons for included categories
- Red buttons for excluded categories
- Displays filtered results

## Technical Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **React Router v7** - Navigation and routing
- **Nanostores** - State management
- **Axios** - HTTP client for GraphQL API
- **TailwindCSS v4** - Styling with dark mode support
- **Sonner** - Toast notifications
- **React Markdown** - Markdown rendering

## Project Structure

```
apps/frontend/src/
├── app/
│   ├── layout/          # Layout components (Header, Footer)
│   └── app.tsx          # Main App with routing
├── components/          # Shared components
│   ├── ThemeToggle.tsx
│   ├── NovelCard.tsx
│   ├── Pagination.tsx
│   └── MarkdownRenderer.tsx
├── pages/
│   ├── home/           # Home page with novels store
│   ├── novel/          # Novel page with chapter stores
│   └── search/         # Search page with search store
├── stores/             # Global stores
│   └── theme.store.ts
├── hooks/              # Custom hooks
│   ├── useApi.ts
│   └── useReadChapters.ts
├── types/              # TypeScript types
│   └── graphql.types.ts
└── utils/              # Utility functions
    └── notification.ts
```

## Key Features

### State Management with Nanostores

- Co-located stores with pages (novels.store, novel.store, chapter.store, search.store)
- Global theme store with localStorage persistence
- Type-safe actions and atoms

### Dark Mode Support

- System preference detection
- Manual toggle with localStorage persistence
- Tailwind dark mode classes

### Read Chapter Tracking

- Tracks which chapters have been read using localStorage
- Visual indication (gray text) for read chapters
- Persists across sessions

### Error Handling

- Automatic error notifications using Sonner
- Axios interceptor in useApi hook
- User-friendly error messages

### Responsive Design

- Mobile-first approach
- Adapts to desktop layouts automatically
- Responsive navigation, cards, and pagination

## Running the Application

1. **Start the backend** (GraphQL API should be running on port 3000):

   ```bash
   nx run backend:serve
   ```

2. **Start the frontend**:

   ```bash
   nx run frontend:serve
   ```

3. Open http://localhost:4200 in your browser

## Environment Variables

Create a `.env` file in the root:

```env
VITE_SERVICE_URL=http://localhost:3000
```

## GraphQL Integration

The app queries the following GraphQL endpoints:

- `novels(first: Int, after: String, filters: NovelFiltersInput)` - List novels with pagination
- `novel(id: ID!)` - Get novel details
- `novel(id: ID!).chapter(id: ID!)` - Get chapter content

## Component Highlights

### NovelCard

- Displays novel information
- Clickable categories that navigate to search
- Truncates long descriptions
- Shows cover image or placeholder

### Pagination

- Handles cursor-based pagination
- Shows page numbers with ellipsis
- Mobile-friendly design

### ChapterList

- Displays all chapters with creation dates
- Highlights current chapter
- Shows read status

### ChapterContent

- Renders markdown content
- Navigation buttons for previous/next chapters
- Chapter metadata (title, update date)

## License

MIT
