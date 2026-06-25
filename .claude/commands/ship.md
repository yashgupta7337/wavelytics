---
description: Build web, commit working changes, fast-forward main, and push
argument-hint: [commit message]
---
Ship the current working changes following this repo's git rules:

1. Run `npm run build` and confirm it passes (fix or stop and report if it fails).
2. Set the commit identity: `git config user.email noreply@anthropic.com` and
   `git config user.name Claude`.
3. Stage the changed files and commit. Use **$ARGUMENTS** as the message if
   provided; otherwise write a clear message summarizing the diff. End the commit
   message with the required Co-Authored-By and Claude-Session trailers.
4. Fast-forward `main` to the current feature branch
   (`git checkout main && git merge --ff-only <branch>`), `git push origin main`,
   then switch back to the feature branch.
5. Report the new commit hash and **state the redeploy impact**: web/ changes →
   Vercel auto-redeploys; server/ changes → Render; tooling/docs only → neither.

Do not push to a different branch or create a PR unless explicitly asked.
