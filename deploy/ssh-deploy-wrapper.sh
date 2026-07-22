#!/usr/bin/env bash
set -Eeuo pipefail

readonly ORIGINAL_COMMAND="${SSH_ORIGINAL_COMMAND:-}"

if [[ "$ORIGINAL_COMMAND" =~ ^deploy[[:space:]]+(ghcr\.io/janwee-sha/simple-clock-app@sha256:[0-9a-f]{64})$ ]]; then
    exec /opt/simple-clock-app/deploy.sh "${BASH_REMATCH[1]}"
fi

echo "Rejected SSH command." >&2
exit 126
