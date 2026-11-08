#!/usr/bin/env bash
# One-time setup for a new toyonix site created from the web-starter template:
#
#   npm ci && npm run setup
#
# 1. checks the repo name works as a URL slug (repo name = URL = app id)
# 2. enables GitHub Pages with "GitHub Actions" as the source
# 3. adds the toyonix-site topic, so the root site's nav and web-kit's sync-sites find it
# 4. sets the repo homepage and names the site in package.json
#
# Safe to re-run. Needs the GitHub CLI (gh), logged in with access to this repo.
set -euo pipefail

die() {
  echo "error: $*" >&2
  exit 1
}

command -v gh >/dev/null || die "install the GitHub CLI (gh) and run 'gh auth login' first."
[ -d node_modules/@toyonix/web-kit ] || die "run 'npm ci' first."

repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
owner=${repo%%/*}
name=${repo#*/}

[ "$(gh repo view --json isTemplate --jq .isTemplate)" = "false" ] ||
  die "this is the web-starter template itself. Create a new repo from it, then run setup there."

owner_lower=$(printf '%s' "$owner" | tr '[:upper:]' '[:lower:]')
if [ "$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]')" = "$owner_lower.github.io" ]; then
  url="https://$owner_lower.github.io/"
  title="Home"
else
  # Use the kit's own slug rules, so this script and the registry build always agree.
  problem=$(SLUG="$name" node --input-type=module -e '
    import { isReservedSlug, isValidSlug } from "@toyonix/web-kit";
    const slug = process.env.SLUG;
    if (!isValidSlug(slug)) console.log(`"${slug}" must be lowercase kebab-case (it becomes the URL /${slug}/)`);
    else if (isReservedSlug(slug)) console.log(`"${slug}" is reserved by the root site`);
  ')
  [ -z "$problem" ] || die "$problem. Rename the repo and try again."
  url="https://$owner_lower.github.io/$name/"
  title=$(SLUG="$name" node -e 'console.log(process.env.SLUG.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "))')
fi

echo "→ GitHub Pages (source: GitHub Actions)"
if gh api "repos/$repo/pages" --silent 2>/dev/null; then
  gh api -X PUT "repos/$repo/pages" -f build_type=workflow --silent
else
  gh api -X POST "repos/$repo/pages" -f build_type=workflow --silent
fi

echo "→ topic toyonix-site, homepage $url"
gh repo edit "$repo" --add-topic toyonix-site --homepage "$url" >/dev/null

echo "→ package.json: name \"$name\", title \"$title\""
NAME="$name" TITLE="$title" node --input-type=module -e '
  import { readFileSync, writeFileSync } from "node:fs";
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  pkg.name = process.env.NAME;
  if (pkg.toyonix.title === "Web Starter") pkg.toyonix.title = process.env.TITLE;
  writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
'

cat <<EOF

Done. Next:
  1. Edit "toyonix" in package.json: title, description, status (live | beta | archived).
  2. Fill in the "This app" section of AGENTS.md.
  3. Commit and push to main. The site deploys to $url
  4. It joins the shared nav the next time the root site deploys (or run sync-sites in web-kit).
EOF
