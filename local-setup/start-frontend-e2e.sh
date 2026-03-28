#!/bin/sh
set -e

CLIENT_ID_FILE="/zitadel-pat/client/smart-novel-client-id"

if [ -f "$CLIENT_ID_FILE" ]; then
  CLIENT_ID=$(cat "$CLIENT_ID_FILE" | tr -d '[:space:]')
  echo "✓ Injecting OIDC client ID: $CLIENT_ID"
  find /usr/share/nginx/html -name '*.js' -exec \
    sed -i "s/__OIDC_CLIENT_ID_PLACEHOLDER__/$CLIENT_ID/g" {} +
else
  echo "⚠ $CLIENT_ID_FILE not found — OIDC login will not work"
fi

exec nginx -g 'daemon off;'
