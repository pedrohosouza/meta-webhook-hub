---
name: release-git-docker
description: Prepare and publish Meta Webhook Hub releases using Conventional Commits, SemVer, annotated Git tags, GitHub Releases, and Docker Hub image aliases. Use when the user asks to commit and publish a version, create a release, or update the project's Docker image; do not use for commit-only requests.
---

# Release Git + Docker

Publish a verified release from the exact commit intended by the user. External publication remains limited to the targets the user authorized.

## Establish the release

- Read the repository instructions and `.agents/skills/commit/SKILL.md` before preparing the commit.
- Inspect the complete worktree diff, current branch, remotes, local and remote tags, existing GitHub Releases, Dockerfile, Compose files, published Docker tags, and established image platforms.
- Preserve unrelated user changes. Exclude secrets, debug artifacts, generated output, and temporary files from the commit.
- Derive the next version from the highest compatibility impact since the previous release:
  - `MAJOR` for incompatible API, configuration, environment-variable, data, or deployment changes.
  - `MINOR` for backward-compatible functionality.
  - `PATCH` for backward-compatible fixes and maintenance.
- Ask the user before choosing when compatibility impact is genuinely ambiguous. Never reuse, overwrite, delete, or force-move an existing version without explicit authorization.
- Use `vX.Y.Z` for the annotated Git tag and GitHub Release. Use `X.Y.Z`, `X.Y`, and `X` for Docker Hub; move `latest` only for a stable release from `main`.
- Use `pedrohosouza/meta-webhook-hub` unless tracked project configuration deliberately names another image.

## Prepare the exact artifact

1. Run the repository's relevant validation, including `npm run typecheck`, `npm run build`, Prisma validation when its configuration changed, and `docker compose config --quiet` when Compose changed. Do not publish a failing revision.
2. Create a Conventional Commit only when tracked changes are pending. Do not create an empty release commit.
3. Confirm that `HEAD` contains only the intended changes and that the worktree is clean.
4. Build the Docker image from that exact `HEAD` with Buildx. Preserve the platform policy of the previous image unless the user requested a change.
5. Smoke-test the image when a safe local check can exercise startup without inventing unavailable infrastructure.

## Publish

Immediately before publishing, state the commit, branch and remote, Git tag, GitHub Release, Docker repository and tags, and whether `latest` will move. If the user has not already authorized these mutations, obtain authorization first.

Publish in this order:

1. Push the release commit from `main` to `origin`.
2. Create and push the annotated `vX.Y.Z` tag pointing to that commit.
3. Create the non-draft GitHub Release from the tag. Base concise notes on commits since the previous release and include an explicit migration section for configuration, schema, or deployment changes.
4. Push the immutable Docker tag `X.Y.Z` first.
5. After it succeeds, create or push the rolling aliases `X.Y`, `X`, and `latest` from the immutable remote image so all tags resolve to the same digest.

Prefer the installed GitHub CLI. If it is unavailable, use an authenticated GitHub API client or a checksum-verified temporary official CLI. For GitHub or Docker Hub authentication, prefer official device authorization and never ask the user to paste passwords, tokens, SSH keys, or registry credentials into chat.

## Verify and stop safely

- Verify independently that remote `main` and the dereferenced Git tag match the released commit.
- Verify the GitHub Release is published, not a draft or prerelease unless requested, and record its URL.
- Query Docker Hub after publication and confirm `X.Y.Z`, `X.Y`, `X`, and `latest` share the expected digest.
- Confirm the final worktree state and report the commit SHA, release URL, image references, digest, validations, and relevant non-blocking build warnings.
- If any stage partially publishes, stop after safe read-only verification. Report exactly what succeeded and what remains; do not delete tags, rewrite history, or move published versions as recovery without new explicit authorization.
