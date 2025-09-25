#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
DIST_DIR="$ROOT_DIR/dist"
mkdir -p "$DIST_DIR"

: "${GOCACHE:=$ROOT_DIR/.gocache}"
: "${GOMODCACHE:=$ROOT_DIR/.gomodcache}"
export GOCACHE GOMODCACHE GOPRIVATE=${GOPRIVATE:-github.com/NeuronInnovations/*}

if [[ -n "${GH_TOKEN:-}" ]]; then
  git config --global url."https://${GH_TOKEN}@github.com/".insteadOf "https://github.com/"
fi

LDFLAGS=${LDFLAGS:--s -w}
GOFLAGS=${GOFLAGS:-}

log() {
  local color="\033[1;34m"
  local reset="\033[0m"
  echo -e "${color}[$(date '+%H:%M:%S')] $*${reset}"
}

build_target() {
  local goos=$1
  local goarch=$2
  local binary_name=$3
  local ext=$4
  local archive_name=$5
  local cgoflag=${6:-0}

  local output_path="$DIST_DIR/${binary_name}${ext}"
  log "Building ${binary_name}${ext} (${goos}/${goarch})"

  env \
    CGO_ENABLED=$cgoflag \
    GOOS=$goos \
    GOARCH=$goarch \
    GOFLAGS="$GOFLAGS" \
    go build \
      -trimpath \
      -ldflags "$LDFLAGS" \
      -o "$output_path" \
      "$ROOT_DIR"

  chmod +x "$output_path"

  log "Packaging ${archive_name}.zip"
  (cd "$DIST_DIR" && zip -q "$archive_name.zip" "${binary_name}${ext}")
  shasum -a 256 "$DIST_DIR/$archive_name.zip" > "$DIST_DIR/$archive_name.zip.sha256"
}

clean_old_artifacts() {
  rm -f "$DIST_DIR"/neuron-wrapper-* "$DIST_DIR"/neuron-wrapper-*.zip "$DIST_DIR"/neuron-wrapper-*.zip.sha256 2>/dev/null || true
}

main() {
  clean_old_artifacts

  build_target darwin amd64 neuron-wrapper-darwin64 "" neuron-wrapper-darwin64
  build_target darwin arm64 neuron-wrapper-darwin-arm64 "" neuron-wrapper-darwin-arm64

  log "Artifacts produced in $DIST_DIR"
  ls -1 "$DIST_DIR"
}

main "$@"
