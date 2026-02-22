# Test Structure

```
src/
├── e2e/              # Test files
│   ├── home.cy.ts
│   ├── novel.cy.ts
│   └── search.cy.ts
├── support/          # Support files
│   ├── commands.ts   # Custom Cypress commands
│   ├── e2e.ts        # Setup file
│   ├── global-setup.ts
│   └── global-teardown.ts
└── fixtures/         # Test data (if needed)
```

## Data Test IDs

Tests rely on `data-testid` attributes in the frontend components:

- `novel-card` - Novel card component
- `chapter-list` - Chapter list container
- `chapter-item` - Individual chapter
- `chapter-content` - Chapter content area
- `breadcrumbs` - Breadcrumb navigation
- `pagination` - Pagination controls
- `search-input` - Search input field
- `category-filter` - Category filter container
- `search-results` - Search results container
- `theme-toggle` - Theme toggle button

**Note**: You'll need to add these `data-testid` attributes to your frontend components for the tests to work properly.

## Configuration

- **Base URL**: `http://localhost:4200`
- **Viewport**: 1280x720
- **Timeout**: 10 seconds
- **Video**: Enabled (only for failed tests)
- **Screenshots**: Enabled on failure

## Troubleshooting

### Tests fail to start

- Ensure Docker is running
- Check if ports 3000, 4200, 9000 are available
- Verify `.env` file exists with required variables

### Tests timeout

- Increase timeout values in `cypress.config.ts`
- Check Docker container logs: `docker compose --profile frontend-e2e logs`

### Frontend not accessible

- Verify nginx configuration in `apps/frontend/nginx.conf`
- Check frontend build: `docker compose --profile frontend-e2e logs frontend-e2e`
