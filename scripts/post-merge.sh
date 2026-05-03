#!/bin/bash
set -e
pnpm install --frozen-lockfile

# Use --force flag to run non-interactively (stdin is closed in post-merge)
pnpm --filter db run push-force

# Push to GitHub — Replit is the single source of truth; GitHub is a mirror.
# GIT_ASKPASS is used so the token is never placed in process argv or .git/config;
# the helper script reads GITHUB_TOKEN from the environment at invocation time.
if [ -z "$GITHUB_TOKEN" ]; then
  echo "ERROR: GITHUB_TOKEN is not set — cannot sync to GitHub" >&2
  exit 1
fi

git config user.email "github@nullcove.com"
git config user.name "Link Haven"

# Create a short-lived GIT_ASKPASS helper that reads from env, not argv
ASKPASS=$(mktemp /tmp/git-askpass-XXXXXX)
# Always clean up the temp file on exit, regardless of success or failure
trap 'rm -f "$ASKPASS"' EXIT
chmod 700 "$ASKPASS"
# Use single quotes in heredoc so $GITHUB_TOKEN is NOT expanded now;
# it will be read from the environment when git invokes the helper.
cat > "$ASKPASS" << 'EOF'
#!/bin/bash
case "$1" in
  *Username*) echo "x-token" ;;
  *Password*) echo "$GITHUB_TOKEN" ;;
esac
EOF

GIT_ASKPASS="$ASKPASS" git push https://github.com/nullcove/link-haven.git HEAD:main --force
