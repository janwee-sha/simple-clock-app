#!/usr/bin/env bash
set -Eeuo pipefail

readonly APP_DIR="/opt/simple-clock-app"
readonly IMAGE_PREFIX="ghcr.io/janwee-sha/simple-clock-app"

new_ref="${1:-}"

valid_ref() {
    local ref="$1"
    local digest

    [[ "$ref" == "$IMAGE_PREFIX@sha256:"* ]] || return 1
    digest="${ref#"$IMAGE_PREFIX@sha256:"}"
    [[ "$digest" =~ ^[0-9a-f]{64}$ ]]
}

if ! valid_ref "$new_ref"; then
    echo "Invalid image reference: $new_ref" >&2
    exit 2
fi

cd "$APP_DIR"

exec 9> .deploy.lock
if ! flock -n 9; then
    echo "Another deployment is already running." >&2
    exit 3
fi

previous_ref=""
if [[ -f .env ]]; then
    previous_ref="$(sed -n 's/^IMAGE_REF=//p' .env | tail -n 1)"
fi

if [[ -n "$previous_ref" ]] && ! valid_ref "$previous_ref"; then
    echo "Invalid IMAGE_REF in $APP_DIR/.env" >&2
    exit 4
fi

write_ref() {
    local ref="$1"
    local temporary

    temporary="$(mktemp "$APP_DIR/.env.XXXXXX")" || return 1
    if ! chmod 600 "$temporary" \
        || ! printf 'IMAGE_REF=%s\n' "$ref" > "$temporary" \
        || ! mv "$temporary" "$APP_DIR/.env"; then
        rm -f "$temporary"
        return 1
    fi
}

start_ref() {
    local ref="$1"

    docker pull "$ref" || return 1
    write_ref "$ref" || return 1
    docker compose config --quiet || return 1
    docker compose up --detach --wait --wait-timeout 90
}

echo "Deploying $new_ref"
if start_ref "$new_ref"; then
    echo "Deployment succeeded."
    exit 0
fi

echo "Deployment failed." >&2
docker compose logs --no-color --tail 100 app || true

if [[ -z "$previous_ref" || "$previous_ref" == "$new_ref" ]]; then
    echo "No previous image is available for rollback." >&2
    docker compose down || true
    rm -f .env
    exit 1
fi

echo "Rolling back to $previous_ref"
if start_ref "$previous_ref"; then
    echo "Rollback succeeded; the failed deployment still returns a non-zero status." >&2
else
    echo "Rollback failed; manual intervention is required." >&2
    docker compose logs --no-color --tail 100 app || true
fi

exit 1
