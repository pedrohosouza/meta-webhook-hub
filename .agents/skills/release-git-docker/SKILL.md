---
name: release-git-docker
description: Prepare and publish a Meta Webhook Hub release with a semantic Git tag, GitHub Release, and matching Docker image tags. Use when the user asks to version, tag, push, or publish the project and its Docker image; do not use for ordinary commits without a release.
---

# Release Git + Docker

Prepare a reproducible Meta Webhook Hub release and publish it only after the user has authorized the external mutations.

## Establish the release contract

- Read the repository instructions and the local commit skill.
- Inspect the worktree, current branch, remotes, existing tags and releases, Dockerfile, Compose files, image name, and documented release automation.
- Derive the next SemVer version from existing tags and changes. If compatibility impact is ambiguous, ask before choosing the version.
- Use an annotated Git tag named `vX.Y.Z` and a GitHub Release with the same name. Tag the Docker image as `X.Y.Z`; update `latest` only for a stable release from `main`.
- Use `pedrohosouza/meta-webhook-hub` as the Docker Hub image unless the repository configuration has deliberately changed.
- Never expose registry tokens, Docker credentials, SSH keys, or environment secrets.

## Prepare and verify

1. Review staged and unstaged diffs for temporary artifacts, debug logs, secrets, and unrelated changes.
2. Run `npm run typecheck` and `npm run build`. Run any additional relevant tests introduced by the repository. Do not publish a failing build.
3. If tracked changes are pending, commit them using Conventional Commits. Do not create an empty release commit merely to attach a tag.
4. Build the Docker image from the exact commit that will be tagged. Prefer `docker buildx build` and preserve the platform policy established by the repository.
5. Smoke-test the image when a safe local check is available.

## Publish

Immediately before external mutation, summarize the exact commit, Git tag, remote/branch, GitHub Release, registry image, Docker tags, and whether `latest` will move. Obtain authorization if it was not already explicit for those targets.

Publish in this order:

1. Push the release commit on `main` to `origin`.
2. Create and push the annotated Git tag.
3. Create the GitHub Release from that tag, using concise notes based on the commits included since the prior release.
4. Push the immutable Docker version tag.
5. Push `latest` only after the immutable image succeeds.

Do not overwrite an existing Git or Docker version tag. If a partial publish occurs, stop, report exactly what succeeded, and propose a safe recovery. Never delete or force-move published tags without explicit authorization.

## Handoff

Report the released commit SHA, Git tag, GitHub Release URL, Docker image references, verification performed, and registry digest. Confirm the worktree state at the end.
