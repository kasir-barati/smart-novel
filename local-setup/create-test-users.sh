#!/bin/sh

# Script to create test users in ZITADEL for local development
#
# Authentication strategy:
#   ZITADEL is configured (via `compose.yml` env vars) to create a machine user with a Personal Access Token (PAT) at first startup. The PAT is written to a bind-mounted directory that this container also mounts read-only at /zitadel-pat/token.

set -e

# Configuration
ZITADEL_URL="${ZITADEL_URL}"
# When reaching Zitadel through a reverse proxy (Traefik) inside Docker,
# the Host header defaults to the proxy's service name (e.g. "traefik").
# Zitadel matches incoming requests by ExternalDomain, so we must override
# the Host header to match ZITADEL_EXTERNALDOMAIN.
PAT_FILE="/zitadel-pat/token"
CLIENT_ID_FILE="/zitadel-pat/client-id"
WRITER_USER_ID_FILE="/zitadel-pat/writer-user-id"
ADMIN_PAT_FILE="/zitadel-pat/admin-pat"
WRITER_PAT_FILE="/zitadel-pat/writer-pat"

# ── helpers ──────────────────────────────────────────
# All log output goes to stderr so that function return values (captured via command substitution) stay clean on stdout.

log()  { echo "  $*" >&2; }
ok()   { echo "  ✓ $*" >&2; }
warn() { echo "  ⚠ $*" >&2; }
err()  { echo "  ✗ $*" >&2; }

# Extract a JSON string value by key (no jq in curlimages/curl).
json_value() {
    grep -o "\"$1\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | head -1 | sed "s/.*:.*\"\([^\"]*\)\"/\1/"
}

# ── wait for ZITADEL ─────────────────────────────────

wait_for_zitadel() {
    log "Waiting for ZITADEL to accept HTTP requests..."
    RETRIES=0
    MAX_RETRIES=30
    while [ "$RETRIES" -lt "$MAX_RETRIES" ]; do
        if curl -sf "${ZITADEL_URL}/debug/ready" >/dev/null 2>&1; then
            ok "ZITADEL is ready"
            return 0
        fi
        RETRIES=$((RETRIES + 1))
        sleep 2
    done
    err "ZITADEL did not become ready in time"
    exit 1
}

# ── read PAT from file ───────────────────────────────

read_pat() {
    log "Reading PAT from $PAT_FILE ..."

    RETRIES=0
    MAX_RETRIES=15
    while [ "$RETRIES" -lt "$MAX_RETRIES" ]; do
        if [ -s "$PAT_FILE" ]; then
            PAT=$(cat "$PAT_FILE" | tr -d '[:space:]')
            if [ -n "$PAT" ]; then
                ok "PAT loaded (${#PAT} chars)"
                printf '%s' "$PAT"
                return 0
            fi
        fi
        log "PAT file not ready yet, retrying ($RETRIES/$MAX_RETRIES)..."
        RETRIES=$((RETRIES + 1))
        sleep 2
    done

    err "Could not read PAT from $PAT_FILE"
    exit 1
}

# ── create a human user ──────────────────────────────

create_user() {
    _EMAIL=$1
    _FIRST_NAME=$2
    _LAST_NAME=$3
    _PASSWORD=$4
    _TOKEN=$5
    _USERNAME=$(printf '%s' "$_EMAIL" | cut -d'@' -f1)

    log "Creating user: $_EMAIL ..."

    USER_RESPONSE=$(curl -s -X POST "${ZITADEL_URL}/v2/users/human" \
        -H "Authorization: Bearer $_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"${_USERNAME}\",
            \"profile\": {
                \"givenName\": \"$_FIRST_NAME\",
                \"familyName\": \"$_LAST_NAME\",
                \"displayName\": \"$_FIRST_NAME $_LAST_NAME\"
            },
            \"email\": {
                \"email\": \"$_EMAIL\",
                \"isVerified\": true
            },
            \"password\": {
                \"password\": \"$_PASSWORD\",
                \"changeRequired\": false
            }
        }")

    USER_ID=$(printf '%s' "$USER_RESPONSE" | json_value "userId")

    if [ -z "$USER_ID" ]; then
        if printf '%s' "$USER_RESPONSE" | grep -qi "already"; then
            ok "User $_EMAIL already exists - looking up existing user..."

            # Search for existing user by login name
            SEARCH_RESPONSE=$(curl -s -X POST "${ZITADEL_URL}/v2/users" \
                -H "Authorization: Bearer $_TOKEN" \
                -H "Content-Type: application/json" \
                -d "{
                    \"queries\": [{
                        \"emailQuery\": {
                            \"emailAddress\": \"$_EMAIL\",
                            \"method\": \"TEXT_QUERY_METHOD_EQUALS\"
                        }
                    }]
                }")
            USER_ID=$(printf '%s' "$SEARCH_RESPONSE" | json_value "userId")

            if [ -n "$USER_ID" ]; then
                ok "Found existing user with ID: $USER_ID"
            else
                warn "Could not find existing user by email. Response:"
                echo "$SEARCH_RESPONSE" >&2
            fi
        else
            warn "User creation may have failed. Response:"
            echo "$USER_RESPONSE" >&2
        fi
    else
        ok "User created with ID: $USER_ID"
    fi

    printf '%s' "$USER_ID"
}

# ── create a machine user (PATs require machine type) ─

create_machine_user() {
    _USERNAME=$1
    _NAME=$2
    _TOKEN=$3

    log "Creating machine user: $_USERNAME ..."

    USER_RESPONSE=$(curl -s -X POST "${ZITADEL_URL}/management/v1/users/machine" \
        -H "Authorization: Bearer $_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"userName\": \"${_USERNAME}\",
            \"name\": \"$_NAME\",
            \"description\": \"E2E test machine user ($_USERNAME)\",
            \"accessTokenType\": \"ACCESS_TOKEN_TYPE_BEARER\"
        }")

    USER_ID=$(printf '%s' "$USER_RESPONSE" | json_value "userId")

    if [ -z "$USER_ID" ]; then
        if printf '%s' "$USER_RESPONSE" | grep -qi "already"; then
            ok "Machine user $_USERNAME already exists - looking up..."

            # Search for existing user by username
            SEARCH_RESPONSE=$(curl -s -X POST "${ZITADEL_URL}/v2/users" \
                -H "Authorization: Bearer $_TOKEN" \
                -H "Content-Type: application/json" \
                -d "{
                    \"queries\": [{
                        \"userNameQuery\": {
                            \"userName\": \"$_USERNAME\",
                            \"method\": \"TEXT_QUERY_METHOD_EQUALS\"
                        }
                    }]
                }")
            USER_ID=$(printf '%s' "$SEARCH_RESPONSE" | json_value "userId")

            if [ -n "$USER_ID" ]; then
                ok "Found existing machine user with ID: $USER_ID"
            else
                warn "Could not find existing machine user. Response:"
                echo "$SEARCH_RESPONSE" >&2
            fi
        else
            warn "Machine user creation may have failed. Response:"
            echo "$USER_RESPONSE" >&2
        fi
    else
        ok "Machine user created with ID: $USER_ID"
    fi

    printf '%s' "$USER_ID"
}

# ── create a ZITADEL project ─────────────────────────

create_project() {
    _TOKEN=$1
    _PROJECT_NAME=$2

    log "Creating project: $_PROJECT_NAME ..."

    PROJECT_RESPONSE=$(curl -s -X POST "${ZITADEL_URL}/management/v1/projects" \
        -H "Authorization: Bearer $_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$_PROJECT_NAME\",
            \"projectRoleAssertion\": true
        }")

    PROJECT_ID=$(printf '%s' "$PROJECT_RESPONSE" | json_value "id")

    if [ -z "$PROJECT_ID" ]; then
        if printf '%s' "$PROJECT_RESPONSE" | grep -qi "already"; then
            ok "Project $_PROJECT_NAME already exists"
            # Try to find existing project
            PROJECTS_RESPONSE=$(curl -s -X POST "${ZITADEL_URL}/management/v1/projects/_search" \
                -H "Authorization: Bearer $_TOKEN" \
                -H "Content-Type: application/json" \
                -d "{
                    \"queries\": [{
                        \"nameQuery\": {
                            \"name\": \"$_PROJECT_NAME\",
                            \"method\": \"TEXT_QUERY_METHOD_EQUALS\"
                        }
                    }]
                }")
            PROJECT_ID=$(printf '%s' "$PROJECTS_RESPONSE" | json_value "id")

            if [ -n "$PROJECT_ID" ]; then
                ok "Found existing project with ID: $PROJECT_ID"
            else
                warn "Could not find existing project. Response:"
                echo "$PROJECTS_RESPONSE" >&2
            fi
        else
            warn "Project creation may have failed. Response:"
            echo "$PROJECT_RESPONSE" >&2
        fi
    else
        ok "Project created with ID: $PROJECT_ID"
    fi

    printf '%s' "$PROJECT_ID"
}

# ── create project roles ─────────────────────────────

create_project_roles() {
    _TOKEN=$1
    _PROJECT_ID=$2

    log "Creating project roles..."

    # Create admin role
    ADMIN_ROLE_RESPONSE=$(curl -s -X POST "${ZITADEL_URL}/management/v1/projects/${_PROJECT_ID}/roles" \
        -H "Authorization: Bearer $_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"admin\",
            \"displayName\": \"Admin\",
            \"group\": \"smart-novel\"
        }")

    if printf '%s' "$ADMIN_ROLE_RESPONSE" | grep -qi "already\|admin"; then
        ok "Role 'admin' created or already exists"
    fi

    # Create writer role
    WRITER_ROLE_RESPONSE=$(curl -s -X POST "${ZITADEL_URL}/management/v1/projects/${_PROJECT_ID}/roles" \
        -H "Authorization: Bearer $_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"writer\",
            \"displayName\": \"Writer\",
            \"group\": \"smart-novel\"
        }")

    if printf '%s' "$WRITER_ROLE_RESPONSE" | grep -qi "already\|writer"; then
        ok "Role 'writer' created or already exists"
    fi

    # Create user role
    USER_ROLE_RESPONSE=$(curl -s -X POST "${ZITADEL_URL}/management/v1/projects/${_PROJECT_ID}/roles" \
        -H "Authorization: Bearer $_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"user\",
            \"displayName\": \"User\",
            \"group\": \"smart-novel\"
        }")

    if printf '%s' "$USER_ROLE_RESPONSE" | grep -qi "already\|user"; then
        ok "Role 'user' created or already exists"
    fi
}

# ── assign role to user ──────────────────────────────

assign_role_to_user() {
    _TOKEN=$1
    _PROJECT_ID=$2
    _USER_ID=$3
    _ROLE=$4

    if [ -z "$_USER_ID" ]; then
        warn "Cannot assign role $_ROLE - user ID is empty"
        return 1
    fi

    log "Assigning role '$_ROLE' to user $_USER_ID..."

    GRANT_RESPONSE=$(curl -s -X POST "${ZITADEL_URL}/management/v1/users/${_USER_ID}/grants" \
        -H "Authorization: Bearer $_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"projectId\": \"$_PROJECT_ID\",
            \"roleKeys\": [\"$_ROLE\"]
        }")

    if printf '%s' "$GRANT_RESPONSE" | grep -qi "already\|grantId"; then
        ok "Role '$_ROLE' assigned to user"
    else
        warn "Role assignment may have failed. Response:"
        echo "$GRANT_RESPONSE" >&2
    fi
}

# ── create a Personal Access Token for a user ────────

create_user_pat() {
    _TOKEN=$1
    _USER_ID=$2
    _LABEL=$3

    if [ -z "$_USER_ID" ]; then
        warn "Cannot create PAT for $_LABEL - user ID is empty"
        return 1
    fi

    log "Creating PAT for $_LABEL (user $_USER_ID)..."

    PAT_RESPONSE=$(curl -s -X POST "${ZITADEL_URL}/management/v1/users/${_USER_ID}/pats" \
        -H "Authorization: Bearer $_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"expirationDate\": \"9999-12-31T23:59:59Z\"
        }")

    USER_PAT=$(printf '%s' "$PAT_RESPONSE" | json_value "token")

    if [ -z "$USER_PAT" ]; then
        warn "PAT creation for $_LABEL may have failed. Response:"
        echo "$PAT_RESPONSE" >&2
    else
        ok "PAT created for $_LABEL (${#USER_PAT} chars)"
    fi

    printf '%s' "$USER_PAT"
}

# ── create an OIDC application ───────────────────────

create_oidc_app() {
    _TOKEN=$1
    _PROJECT_ID=$2
    _APP_NAME=$3

    log "Creating OIDC application: $_APP_NAME ..."

    # Application type: OIDC_APP_TYPE_NATIVE (for ROPC grant support)
    # Auth method: OIDC_AUTH_METHOD_TYPE_NONE (public client, no secret needed)
    # Grant types: OIDC_GRANT_TYPE_AUTHORIZATION_CODE + password (ROPC)
    # Response types: OIDC_RESPONSE_TYPE_CODE
    APP_RESPONSE=$(curl -s -X POST "${ZITADEL_URL}/management/v1/projects/${_PROJECT_ID}/apps/oidc" \
        -H "Authorization: Bearer $_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$_APP_NAME\",
            \"redirectUris\": [\"http://localhost:8080/auth/callback\"],
            \"postLogoutRedirectUris\": [\"http://localhost:8080\"],
            \"responseTypes\": [\"OIDC_RESPONSE_TYPE_CODE\"],
            \"grantTypes\": [\"OIDC_GRANT_TYPE_AUTHORIZATION_CODE\"],
            \"appType\": \"OIDC_APP_TYPE_NATIVE\",
            \"authMethodType\": \"OIDC_AUTH_METHOD_TYPE_NONE\",
            \"devMode\": true
        }")

    CLIENT_ID=$(printf '%s' "$APP_RESPONSE" | json_value "clientId")

    if [ -z "$CLIENT_ID" ]; then
        if printf '%s' "$APP_RESPONSE" | grep -qi "already"; then
            ok "Application $_APP_NAME already exists"
            # Try to find existing apps
            APPS_RESPONSE=$(curl -s -X GET "${ZITADEL_URL}/management/v1/projects/${_PROJECT_ID}/apps/_search" \
                -H "Authorization: Bearer $_TOKEN" \
                -H "Content-Type: application/json")
            CLIENT_ID=$(printf '%s' "$APPS_RESPONSE" | json_value "clientId")

            if [ -n "$CLIENT_ID" ]; then
                ok "Found existing app with client ID: $CLIENT_ID"
            fi
        else
            warn "Application creation may have failed. Response:"
            echo "$APP_RESPONSE" >&2
        fi
    else
        ok "Application created with client ID: $CLIENT_ID"
    fi

    printf '%s' "$CLIENT_ID"
}

# ── main ─────────────────────────────────────────────

echo "================================================" >&2
echo "Creating Test Users in ZITADEL" >&2
echo "================================================" >&2
echo "" >&2
echo "ZITADEL URL: $ZITADEL_URL" >&2
echo "" >&2

wait_for_zitadel

echo "" >&2
echo "Step 1: Loading PAT for authentication..." >&2
ACCESS_TOKEN=$(read_pat)

if [ -z "$ACCESS_TOKEN" ]; then
    err "Failed to load PAT. Exiting."
    exit 1
fi

# Verify the PAT works (with retries, as ZITADEL internal services may not be ready yet)
echo "" >&2
echo "Step 2: Verifying PAT..." >&2

RETRIES=0
MAX_RETRIES=30
VERIFY_SUCCESS=0

while [ "$RETRIES" -lt "$MAX_RETRIES" ]; do
    VERIFY_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "${ZITADEL_URL}/auth/v1/users/me")
    
    if [ "$VERIFY_CODE" = "200" ]; then
        ok "PAT is valid"
        VERIFY_SUCCESS=1
        break
    fi
    
    if [ "$RETRIES" -eq 0 ]; then
        log "PAT verification returned HTTP $VERIFY_CODE, waiting for ZITADEL services to be fully ready..."
    fi
    
    RETRIES=$((RETRIES + 1))
    sleep 2
done

if [ "$VERIFY_SUCCESS" -eq 0 ]; then
    err "PAT verification failed after $MAX_RETRIES attempts (HTTP $VERIFY_CODE)"
    curl -s -H "Authorization: Bearer $ACCESS_TOKEN" "${ZITADEL_URL}/auth/v1/users/me" >&2
    exit 1
fi

echo "" >&2
echo "================================================" >&2
echo "Creating OIDC Project & Application" >&2
echo "================================================" >&2

PROJECT_ID=$(create_project "$ACCESS_TOKEN" "smart-novel")

if [ -z "$PROJECT_ID" ]; then
    err "Failed to create or find project. Exiting."
    exit 1
fi

CLIENT_ID=$(create_oidc_app "$ACCESS_TOKEN" "$PROJECT_ID" "smart-novel-app")

if [ -n "$CLIENT_ID" ]; then
    ok "Writing client ID to $CLIENT_ID_FILE"
    printf '%s' "$CLIENT_ID" > "$CLIENT_ID_FILE"
else
    warn "Could not determine client ID - login flow will not work!"
fi

echo "" >&2
echo "================================================" >&2
echo "Creating Project Roles" >&2
echo "================================================" >&2

create_project_roles "$ACCESS_TOKEN" "$PROJECT_ID"

# Small delay for Zitadel eventual consistency after role creation
sleep 2

echo "" >&2
echo "================================================" >&2
echo "Creating Human Users (for interactive login)" >&2
echo "================================================" >&2

ADMIN_HUMAN_ID=$(create_user \
    "admin@test.com" \
    "Admin" \
    "User" \
    "Admin123!" \
    "$ACCESS_TOKEN")

if [ -n "$ADMIN_HUMAN_ID" ]; then
    assign_role_to_user "$ACCESS_TOKEN" "$PROJECT_ID" "$ADMIN_HUMAN_ID" "admin"
fi

WRITER_HUMAN_ID=$(create_user \
    "writer@test.com" \
    "Writer" \
    "User" \
    "Writer123!" \
    "$ACCESS_TOKEN")

if [ -n "$WRITER_HUMAN_ID" ]; then
    assign_role_to_user "$ACCESS_TOKEN" "$PROJECT_ID" "$WRITER_HUMAN_ID" "writer"
    ok "Writing writer user ID to $WRITER_USER_ID_FILE"
    printf '%s' "$WRITER_HUMAN_ID" > "$WRITER_USER_ID_FILE"
fi

echo "" >&2
echo "================================================" >&2
echo "Creating Machine Users for E2E (PATs require machine type)" >&2
echo "================================================" >&2

# Zitadel only allows PAT creation for machine users, not human users.
# We create separate machine users for e2e test authentication.

ADMIN_MACHINE_ID=$(create_machine_user \
    "e2e-admin" \
    "E2E Admin" \
    "$ACCESS_TOKEN")

if [ -n "$ADMIN_MACHINE_ID" ]; then
    assign_role_to_user "$ACCESS_TOKEN" "$PROJECT_ID" "$ADMIN_MACHINE_ID" "admin"

    ADMIN_PAT=$(create_user_pat "$ACCESS_TOKEN" "$ADMIN_MACHINE_ID" "admin")
    if [ -n "$ADMIN_PAT" ]; then
        ok "Writing admin PAT to $ADMIN_PAT_FILE"
        printf '%s' "$ADMIN_PAT" > "$ADMIN_PAT_FILE"
    else
        warn "Could not create admin PAT - admin e2e tests will not work!"
    fi
fi

WRITER_MACHINE_ID=$(create_machine_user \
    "e2e-writer" \
    "E2E Writer" \
    "$ACCESS_TOKEN")

if [ -n "$WRITER_MACHINE_ID" ]; then
    assign_role_to_user "$ACCESS_TOKEN" "$PROJECT_ID" "$WRITER_MACHINE_ID" "writer"

    WRITER_PAT=$(create_user_pat "$ACCESS_TOKEN" "$WRITER_MACHINE_ID" "writer")
    if [ -n "$WRITER_PAT" ]; then
        ok "Writing writer PAT to $WRITER_PAT_FILE"
        printf '%s' "$WRITER_PAT" > "$WRITER_PAT_FILE"
    else
        warn "Could not create writer PAT - writer e2e tests will not work!"
    fi
fi

echo "" >&2
echo "================================================" >&2
echo "Summary" >&2
echo "================================================" >&2
echo "" >&2
echo "Test users have been created!" >&2
echo "" >&2
echo "Admin User:" >&2
echo "  Email: admin@test.com" >&2
echo "  Password: Admin123!" >&2
echo "  PAT: $ADMIN_PAT_FILE" >&2
echo "" >&2
echo "Writer User:" >&2
echo "  Email: writer@test.com" >&2
echo "  Password: Writer123!" >&2
echo "  PAT: $WRITER_PAT_FILE" >&2
echo "" >&2
echo "Bot (machine user):" >&2
echo "  PAT: $PAT_FILE" >&2
echo "" >&2
echo "OIDC Application:" >&2
echo "  Project: smart-novel" >&2
echo "  Client ID: $CLIENT_ID" >&2
echo "" >&2
echo "Visit: $ZITADEL_URL" >&2
echo "" >&2
