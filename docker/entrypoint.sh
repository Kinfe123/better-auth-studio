#!/bin/sh
set -eu

log() {
  printf '%s\n' "[better-auth-studio-docker] $*"
}

install_project_dependencies() {
  if [ "${AUTO_INSTALL:-true}" != "true" ]; then
    log "Skipping project dependency installation"
    return
  fi

  if [ -d node_modules ] && [ -n "$(find node_modules -mindepth 1 -maxdepth 1 2>/dev/null | head -n 1)" ]; then
    log "Using existing project dependencies"
    return
  fi

  if [ -n "${PROJECT_INSTALL_CMD:-}" ]; then
    log "Installing project dependencies with PROJECT_INSTALL_CMD"
    sh -lc "$PROJECT_INSTALL_CMD"
    return
  fi

  if [ -f pnpm-lock.yaml ]; then
    log "Installing project dependencies with pnpm"
    pnpm install --frozen-lockfile || pnpm install
    return
  fi

  if [ -f yarn.lock ]; then
    log "Installing project dependencies with yarn"
    yarn install --frozen-lockfile || yarn install
    return
  fi

  if [ -f package-lock.json ]; then
    log "Installing project dependencies with npm ci"
    npm ci || npm install
    return
  fi

  if [ -f bun.lockb ] || [ -f bun.lock ]; then
    log "Bun lockfile detected. Set PROJECT_INSTALL_CMD to install dependencies inside the container."
    exit 1
  fi

  log "Installing project dependencies with npm install"
  npm install
}

main() {
  PROJECT_DIR="${STUDIO_PROJECT_DIR:-/workspace}"

  if [ ! -d "$PROJECT_DIR" ]; then
    log "Project directory not found: $PROJECT_DIR"
    exit 1
  fi

  cd "$PROJECT_DIR"

  if [ ! -f package.json ]; then
    log "No package.json found in $PROJECT_DIR"
    log "Mount your Better Auth project into the container and set STUDIO_PROJECT_DIR if needed."
    exit 1
  fi

  install_project_dependencies

  if [ "$#" -gt 0 ]; then
    exec better-auth-studio "$@"
  fi

  set -- start --host "${HOST:-0.0.0.0}" --port "${PORT:-3002}" --no-open

  if [ -n "${CONFIG_PATH:-}" ]; then
    set -- "$@" --config "${CONFIG_PATH}"
  fi

  if [ -n "${GEO_DB_PATH:-}" ]; then
    set -- "$@" --geo-db "${GEO_DB_PATH}"
  fi

  if [ "${WATCH:-false}" = "true" ]; then
    set -- "$@" --watch
  fi

  exec better-auth-studio "$@"
}

main "$@"
