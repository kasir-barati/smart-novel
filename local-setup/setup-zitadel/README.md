# ZITADEL Initialization Script

This Node.js ESM application initializes ZITADEL with test users, projects, and OIDC applications for local development.

> [!TIP]
>
> If you change something related to how ZITADEL generates access tokens/JWT tokens you might wanna first cleanup your UI's local storage so it is using hte new token generated with the latest changes. I grappled with this exact issue when I changed my app to generate JWT tokens instead of opaque access tokens.

## Architecture

The script is modular and organized into services, data modules, and utilities:

### Services

Services encapsulate interactions with different ZITADEL API versions:

- **`ZitadelUsersV2Service`** - Users V2 API endpoints (`/v2/users`)
  - Create human users
  - Create machine users (service accounts)
  - Add JSON keys to machine users
  - Find users by email or username

- **`ZitadelManagementV1Service`** - Management V1 API endpoints (`/management/v1`)
  - Create and find projects
  - Create project roles
  - Assign roles to users
  - Create OIDC applications (public and confidential)
  - Grant users project access (for token exchange)
  - Create Personal Access Tokens (PAT) for users
  - List user grants

- **`ZitadelAdminV1Service`** - Admin V1 API endpoints (`/admin/v1`)
  - Enable impersonation in security policy
  - Add instance members with IAM roles (`IAM_OWNER`, `IAM_END_USER_IMPERSONATOR`, etc.)

- **`ZitadelAuthV1Service`** - Auth V1 API endpoints (`/auth/v1`)
  - Get current authenticated user (user ID and organization ID)

- **`config`** - Configuration service
  - Reads and validates environment variables
  - Defines file output paths
  - Creates necessary output directories

### Data Modules

Static data definitions used by the initialization script:

- **`users.data.js`** - Test user definitions (email, name, password, role, output file path)
- **`roles.data.js`** - Project role definitions (roleKey, displayName)

### Utilities

- **`Logger`** - Consistent logging with formatted output (section headers, info, success, error)
- **`FileUtil`** - File operations: read PAT with retries, write files
- **`sleep`** - Promise-based delay for eventual consistency waits
- **`isEmpty`** / **`isNotEmpty`** - Null/undefined/empty-string guards

## Usage

The script is automatically run in a Docker container as part of the compose setup:

```bash
npm start
```

## Environment Variables

| Variable           | Description                                                         | Required |
| ------------------ | ------------------------------------------------------------------- | -------- |
| `ZITADEL_URL`      | Base URL for the ZITADEL instance                                   | Yes      |
| `ZITADEL_APP_NAME` | Application name (used for naming projects, apps, and output files) | Yes      |

## File Outputs

All files are written under the `/zitadel-pat` bind-mounted directory:

| File Path                                            | Description                                         |
| ---------------------------------------------------- | --------------------------------------------------- |
| `/zitadel-pat/token`                                 | PAT for the initial machine user (input, read-only) |
| `/zitadel-pat/project-id`                            | Project ID                                          |
| `/zitadel-pat/client/<app-name>-client-id`           | OIDC client ID for the frontend app                 |
| `/zitadel-pat/integration-test/<app-name>-client-id` | OIDC client ID for integration tests                |
| `/zitadel-pat/integration-test/<app-name>-secret`    | OIDC client secret for integration tests            |
| `/zitadel-pat/integration-test/bot-token`            | PAT for the integration test impersonation bot      |
| `/zitadel-pat/integration-test/bot-key.json`         | JSON key for the integration test bot               |
| `/zitadel-pat/user-ids/admin`                        | User ID for admin test user                         |
| `/zitadel-pat/user-ids/writer`                       | User ID for writer test user                        |
| `/zitadel-pat/user-ids/user`                         | User ID for regular test user                       |

> `<app-name>` is the value of the `ZITADEL_APP_NAME` environment variable.

## Created Test Users

| Email           | Password   | Role   | Notes                         |
| --------------- | ---------- | ------ | ----------------------------- |
| admin@test.com  | Admin123!  | admin  | Also granted `IAM_OWNER` role |
| writer@test.com | Writer123! | writer |                               |
| user@test.com   | User123!   | user   |                               |

## Project Structure

```
src/
├── data/
│   ├── index.js                             # Barrel export for data modules
│   ├── roles.data.js                        # Project role definitions
│   └── users.data.js                        # Test user definitions
├── services/
│   ├── index.js                             # Barrel export for services
│   ├── config.service.js                    # Configuration and env var validation
│   ├── zitadel-admin-v1.service.js          # Admin V1 API endpoints
│   ├── zitadel-auth-v1.service.js           # Auth V1 API endpoints
│   ├── zitadel-management-v1.service.js     # Management V1 API endpoints
│   └── zitadel-users-v2.service.js          # Users V2 API endpoints
├── utils/
│   ├── index.js                             # Barrel export for utilities
│   ├── file.util.js                         # File operations (read PAT, write files)
│   ├── is-empty.util.js                     # isEmpty guard
│   ├── is-not-empty.util.js                 # isNotEmpty guard
│   ├── logger.util.js                       # Logging utility
│   └── sleep.util.js                        # Promise-based delay
└── main.js                                  # Main entry point
```

## Authentication Strategy

ZITADEL is configured via `compose.yml` environment variables to create a machine user with a Personal Access Token (PAT) at first startup. The PAT is written to a bind-mounted directory (`/zitadel-pat/token`) that this container mounts read-only.

The script:

1. Reads the PAT from the mounted file (with retries until ZITADEL is ready)
2. Uses the PAT to authenticate all API requests
3. Creates a project, roles, and OIDC applications (public for frontend, confidential for integration tests)
4. Creates human test users and assigns them project roles
5. Grants the admin user `IAM_OWNER` access for full ZITADEL Console access
6. Enables impersonation in the security policy
7. Creates a machine user (`integration-test-impersonator-bot`) with a JSON key and PAT for integration test token exchange
8. Assigns `IAM_END_USER_IMPERSONATOR` role to both the initial bot user and the integration test bot
9. Grants the integration test bot project access and verifies the grant
