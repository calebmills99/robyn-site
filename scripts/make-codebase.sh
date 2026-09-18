#!/usr/bin/env bash
# make-codebase.sh  ·  robyn-site
# Flattens the repo into one CODEBASE.md: tree first, then every source file
# fenced with its path. Raw shell, no config file, no JSON.
#
#   ./scripts/make-codebase.sh            -> writes ./CODEBASE.md
#   ./scripts/make-codebase.sh out.md     -> writes wherever you say
#
# Skips: node_modules, dist, .git, .astro, .wrangler, handoff, .superdesign,
#        .codex, .vscode, .env*, lockfiles, fonts/images/video/binaries,
#        the ingested src/content/{pages,blog} (regenerated every build).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-$ROOT/CODEBASE.md}"
cd "$ROOT"

# ---- what gets excluded -------------------------------------------------
PRUNE_DIRS=(
  ./node_modules ./dist ./.git ./.astro ./.wrangler
  ./handoff ./.superdesign ./.codex ./.vscode
  ./public/fonts ./public/images ./public/videos ./public/press
  ./public/blog ./public/special-dispatch
  ./src/assets ./src/content/pages ./src/content/blog
)
SKIP_NAMES=(
  'package-lock.json' '.env' '.env.*' '*.lnk' '.DS_Store'
  '_tmp_*' 'CODEBASE.md' 'redirects.json'
)
SKIP_EXT='png|jpg|jpeg|gif|webp|avif|svg|ico|mp4|mov|webm|mp3|wav|woff|woff2|ttf|otf|pdf|zip|7z|txt'

# build find(1) args
PRUNE_ARGS=()
for d in "${PRUNE_DIRS[@]}"; do PRUNE_ARGS+=( -path "$d" -o ); done
NAME_ARGS=()
for n in "${SKIP_NAMES[@]}"; do NAME_ARGS+=( ! -name "$n" ); done

# ---- collect file list --------------------------------------------------
mapfile -t FILES < <(
  find . \( "${PRUNE_ARGS[@]}" -false \) -prune -o \
       -type f "${NAME_ARGS[@]}" -print \
  | grep -Ev "\.(${SKIP_EXT})$" \
  | sed 's#^\./##' \
  | LC_ALL=C sort
)

# ---- language hint for the fence ---------------------------------------
lang_for() {
  case "${1##*.}" in
    astro) echo astro ;;
    ts|mts|cts) echo ts ;;
    js|mjs|cjs) echo js ;;
    json) echo json ;;
    md) echo md ;;
    css) echo css ;;
    toml) echo toml ;;
    yml|yaml) echo yaml ;;
    html) echo html ;;
    sh) echo bash ;;
    *) echo text ;;
  esac
}

# ---- write --------------------------------------------------------------
{
  echo "# CODEBASE · $(basename "$ROOT")"
  echo
  echo "Generated $(date -u +%Y-%m-%dT%H:%M:%SZ) · commit $(git rev-parse --short HEAD 2>/dev/null || echo n/a) · ${#FILES[@]} files"
  echo
  echo "## Tree"
  echo
  echo '```'
  printf '%s\n' "${FILES[@]}" | awk -F/ '
    {
      path=""
      for (i=1;i<NF;i++) {
        path = path $i "/"
        if (!(path in seen)) { seen[path]=1; printf "%s%s/\n", substr("                    ",1,(i-1)*2), $i }
      }
      printf "%s%s\n", substr("                    ",1,(NF-1)*2), $NF
    }'
  echo '```'
  echo
  echo "## Files"
  echo
  for f in "${FILES[@]}"; do
    echo "### \`$f\`"
    echo
    echo "\`\`\`$(lang_for "$f")"
    cat -- "$f"
    # guarantee a trailing newline before closing the fence
    [ -n "$(tail -c1 -- "$f")" ] && echo
    echo '```'
    echo
  done
} > "$OUT"

echo "wrote $OUT  ($(wc -c < "$OUT" | tr -d ' ') bytes, ${#FILES[@]} files)"
