# Publishing cookie-pot (Trusted Publisher via GitHub OIDC)

Options for publishing

Option A: just push

-   Edit the version in other-projects/cookie-pot/package.json (or use npm to bump without tagging).
-   Commit and push to main/master. The workflow checks local package.json version vs npm’s current version, and only publishes when they differ.

Example:

```sh
npm --no-git-tag-version version patch
git commit -am "cookie-pot: bump version"
git push
```

Option B: One-command tag-based release (intentional publish)

Ensure all changes are committed, then run:

```sh
npm version patch -m "Release %s"
git push --follow-tags
```

This bumps the version, creates the tag, and a single push sends both the commit and tag. The workflow will publish via OIDC.

Option C: Manual tag-based release (intentional publish)

Edit other-projects/cookie-pot/package.json version manually:

```sh
git commit -am "cookie-pot: bump to x.y.z"
git tag -a vX.Y.Z -m "Release X.Y.Z"
git push origin vX.Y.Z
```

Notes

-   npm CLI is updated to latest (>= 11.5.1) during CI and uses OIDC automatically; no NODE_AUTH_TOKEN is needed for publish.
-   If cookie-pot adds private npm dependencies later, installs still require a read-only token (for npm ci) but publish continues to use OIDC.
-   You already configured the package’s Trusted Publisher on npmjs.com. It must point to this repo and workflow filename: publish.yml (the workflow that contains this job).
