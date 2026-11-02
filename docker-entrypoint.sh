#!/bin/sh
set -eu

: "${API_URL:?API_URL is required}"
: "${FIREBASE_API_KEY:?FIREBASE_API_KEY is required}"
: "${FIREBASE_AUTH_DOMAIN:?FIREBASE_AUTH_DOMAIN is required}"
: "${FIREBASE_PROJECT_ID:?FIREBASE_PROJECT_ID is required}"
: "${FIREBASE_STORAGE_BUCKET:?FIREBASE_STORAGE_BUCKET is required}"
: "${FIREBASE_MESSAGING_SENDER_ID:?FIREBASE_MESSAGING_SENDER_ID is required}"
: "${FIREBASE_APP_ID:?FIREBASE_APP_ID is required}"

export PORT="${PORT:-8080}"

envsubst '${API_URL} ${FIREBASE_API_KEY} ${FIREBASE_AUTH_DOMAIN} ${FIREBASE_PROJECT_ID} ${FIREBASE_STORAGE_BUCKET} ${FIREBASE_MESSAGING_SENDER_ID} ${FIREBASE_APP_ID}' \
    < /usr/share/nginx/html/runtime-config.js.template \
    > /usr/share/nginx/html/runtime-config.js
envsubst '${PORT}' \
    < /etc/nginx/default.conf.template \
    > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
