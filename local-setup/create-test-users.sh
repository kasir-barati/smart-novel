#!/bin/sh

# Script to create test users in ZITADEL for local development
#
# Authentication strategy:
#   ZITADEL is configured (via `compose.yml` env vars) to create a machine user with a Personal Access Token (PAT) at first startup. The PAT is written to a bind-mounted directory that this container also mounts read-only at /zitadel-pat/token.

set -e

# Configuration
ZITADEL_URL="${ZITADEL_URL}"
PAT_FILE="/zitadel-pat/token"
CLIENT_ID_FILE="/zitadel-pat/client-id"

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
            ok "User $_EMAIL already exists - skipping"
        else
            warn "User creation may have failed. Response:"
            echo "$USER_RESPONSE" >&2
        fi
    else
        ok "User created with ID: $USER_ID"
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
            \"redirectUris\": [\"http://localhost:4200/callback\"],
            \"postLogoutRedirectUris\": [\"http://localhost:4200\"],
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
echo "Creating Admin User" >&2
echo "================================================" >&2

ADMIN_USER_ID=$(create_user \
    "admin@test.com" \
    "Admin" \
    "User" \
    "Admin123!" \
    "$ACCESS_TOKEN")

echo "" >&2
echo "================================================" >&2
echo "Creating Writer User" >&2
echo "================================================" >&2

WRITER_USER_ID=$(create_user \
    "writer@test.com" \
    "Writer" \
    "User" \
    "Writer123!" \
    "$ACCESS_TOKEN")

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
echo "" >&2
echo "Writer User:" >&2
echo "  Email: writer@test.com" >&2
echo "  Password: Writer123!" >&2
echo "" >&2
echo "OIDC Application:" >&2
echo "  Project: smart-novel" >&2
echo "  Client ID: $CLIENT_ID" >&2
echo "" >&2
echo "Visit: $ZITADEL_URL" >&2
echo "" >&2
