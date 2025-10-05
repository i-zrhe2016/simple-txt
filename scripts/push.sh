#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/push.sh [options]

Stages changes, commits (optional message), and pushes to a remote branch.

Options:
  -m, --message <msg>   Commit message (default: timestamped message)
  -r, --remote <name>   Git remote name (default: first configured remote)
  -b, --branch <name>   Branch to push (default: current branch)
  -f, --force           Use --force-with-lease when pushing
      --tags            Also push tags
      --no-add          Do not run 'git add -A'
      --no-commit       Do not create a commit (push only)
  -v, --verbose         Print executed commands
  -h, --help            Show this help

Examples:
  scripts/push.sh -m "feat: update homepage"
  scripts/push.sh -r origin -b main
  scripts/push.sh --no-commit            # push existing commits only
  scripts/push.sh --tags                 # also push tags
EOF
}

msg=""
remote=""
branch=""
use_force="false"
push_tags="false"
no_add="false"
no_commit="false"
verbose="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--message)
      [[ $# -ge 2 ]] || { echo "Error: missing value for $1" >&2; exit 2; }
      msg="$2"; shift 2;;
    -r|--remote)
      [[ $# -ge 2 ]] || { echo "Error: missing value for $1" >&2; exit 2; }
      remote="$2"; shift 2;;
    -b|--branch)
      [[ $# -ge 2 ]] || { echo "Error: missing value for $1" >&2; exit 2; }
      branch="$2"; shift 2;;
    -f|--force)
      use_force="true"; shift;;
    --tags)
      push_tags="true"; shift;;
    --no-add)
      no_add="true"; shift;;
    --no-commit)
      no_commit="true"; shift;;
    -v|--verbose)
      verbose="true"; shift;;
    -h|--help)
      usage; exit 0;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 2;;
  esac
done

if [[ "$verbose" == "true" ]]; then
  set -x
fi

# Ensure we're inside a Git repository
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: not inside a Git repository." >&2
  exit 1
fi

# Work from repo root
repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"

# Determine remote
if [[ -z "$remote" ]]; then
  if git remote >/dev/null 2>&1; then
    remote=$(git remote | head -n1 || true)
  fi
fi

if [[ -z "$remote" ]]; then
  echo "Error: no Git remote configured. Add one, e.g.:" >&2
  echo "  git remote add origin <url>" >&2
  exit 1
fi

# Determine branch
if [[ -z "$branch" ]]; then
  branch=$(git branch --show-current || true)
  if [[ -z "$branch" ]]; then
    # Detached HEAD fallback
    echo "Error: cannot determine current branch (detached HEAD). Use -b/--branch." >&2
    exit 1
  fi
fi

echo "Repo:   $repo_root"
echo "Remote: $remote"
echo "Branch: $branch"

# Stage changes unless skipped
if [[ "$no_add" != "true" ]]; then
  git add -A
fi

# Commit unless skipped; only if there are staged changes
if [[ "$no_commit" != "true" ]]; then
  if ! git diff --cached --quiet; then
    if [[ -z "$msg" ]]; then
      msg="chore: update $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    git commit -m "$msg"
  else
    echo "No staged changes to commit."
  fi
fi

# Build push command
push_args=(push "$remote" "$branch:$branch")
if [[ "$use_force" == "true" ]]; then
  push_args=(push --force-with-lease "$remote" "$branch:$branch")
fi

echo "Pushing to $remote $branch ..."
git "${push_args[@]}"

if [[ "$push_tags" == "true" ]]; then
  echo "Also pushing tags ..."
  git push "$remote" --tags
fi

echo "Done."

