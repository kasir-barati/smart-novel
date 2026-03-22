# ZITADEL Initialization Script

This Node.js ESM application initializes ZITADEL with test users, projects, and OIDC applications for local development.

## Architecture

The script is modular and organized into services and utilities:

### Services

Services encapsulate interactions with different ZITADEL API versions:

- **`ZitadelV2Service`** - V2 API endpoints
  - Create human users
  - Find users by email
  - Enable impersonation features

- **`ZitadelManagementV1Service`** - Management V1 API endpoints
  - Create and manage projects
  - Create project roles
  - Assign roles to users
  - Create OIDC applications (public and confidential)
  - Create Personal Access Tokens

- **`ZitadelAdminV1Service`** - Admin V1 API endpoints
  - Enable impersonation in security policy
  - Assign IAM_END_USER_IMPERSONATOR role

- **`ZitadelAuthV1Service`** - Auth V1 API endpoints
  - Get current authenticated user
  - Verify access tokens

### Utilities

- **`Logger`** - Consistent logging with formatted output (info, success, warning, error)
- **`FileUtil`** - File operations with retry logic for reading PAT tokens
- **`WaitUtil`** - Waiting and retry utilities for ZITADEL readiness checks

## Usage

The script is automatically run in a Docker container as part of the compose setup:

```bash
npm start
```

## Environment Variables

- `ZITADEL_URL` - Base URL for ZITADEL instance (default: `http://localhost:8080`)

## File Outputs

The script writes the following files:

- `/zitadel-pat/client/smart-novel-app-id` - OIDC client ID for frontend
- `/zitadel-pat/client/e2e-smart-novel-app-id` - OIDC client ID for E2E tests
- `/zitadel-pat/client/e2e-smart-novel-app-secret` - OIDC client secret for E2E tests
- `/zitadel-pat/user-user-id` - User ID for regular test user
- `/zitadel-pat/admin-user-id` - User ID for admin test user
- `/zitadel-pat/writer-user-id` - User ID for writer test user

## Created Test Users

| Email           | Password   | Role   |
| --------------- | ---------- | ------ |
| admin@test.com  | Admin123!  | admin  |
| writer@test.com | Writer123! | writer |
| user@test.com   | User123!   | user   |

## Project Structure

```
src/
├── services/
│   ├── zitadel-v2.service.js           # V2 API endpoints
│   ├── zitadel-management-v1.service.js # Management V1 API endpoints
│   ├── zitadel-admin-v1.service.js      # Admin V1 API endpoints
│   └── zitadel-auth-v1.service.js       # Auth V1 API endpoints
├── utils/
│   ├── logger.util.js                   # Logging utility
│   ├── file.util.js                     # File operations utility
│   └── wait.util.js                     # Wait/retry utility
└── main.js                              # Main entry point
```

## Authentication Strategy

ZITADEL is configured via `compose.yml` environment variables to create a machine user with a Personal Access Token (PAT) at first startup. The PAT is written to a bind-mounted directory (`/zitadel-pat/token`) that this container mounts read-only.

The script:

1. Waits for ZITADEL to be ready
2. Reads the PAT from the mounted file
3. Uses the PAT to authenticate API requests
4. Creates projects, roles, applications, and human users
