# Visual regression testing

Functional tests (vitest + vitest-axe) prove a component _behaves_ and is
_accessible_; they can't see that it still _looks_ right. Visual-regression tests
close that gap: they screenshot each styled component's live demo and compare it
pixel-by-pixel against a committed baseline, so an accidental CSS change — a
shifted slider thumb, a dropped border, a wrong tint — fails CI with a visible
diff.

## How it works

- Spec: `e2e/visual.spec.ts` screenshots the `.ds-preview` frame of a curated set
  of **static** component demos (no overlays, no date-dependent surfaces, no
  looping animation), via Playwright `toHaveScreenshot()`.
- Config: `playwright.config.ts` disables animations and allows a small
  `maxDiffPixelRatio` (0.4%) to absorb sub-pixel anti-aliasing. Keep it well
  under the share of an image a single component state occupies: at the earlier
  2% a restored selected-page style, 1.95% of the pagination shot, compared as
  no change. Visual specs run in their own Playwright project
  (`--project=visual`), separate from the functional e2e gate.
- Baselines live in `e2e/visual.spec.ts-snapshots/` and are committed.

## Commands

```sh
pnpm visual          # compare against committed baselines
pnpm visual:update   # rewrite every baseline (after an intended visual change)
```

(Neither builds anything: the Playwright `webServer` serves the docs `dist`
that is already there. Build first with `pnpm build`.)

Before the first test, `e2e/global-setup.ts` reads `.build-id.json` from each
server it reaches. The docs build and the Vue example build write that file
with a fingerprint of the checkout (a hash of its real path, never the path),
the commit, and a hash of everything the site is built from (`SITE_INPUTS` in
`scripts/build-id.mjs`: the site's own files, and for each workspace package
it bundles the sources, the built output and the build configuration, plus
the lockfile). A server that serves another checkout, the other site, or a
build from other sources is refused with the reason, so a preview left
running by another worktree can never pass this one's tests.

Content decides, not time or commit: a checkout or a stash that rewrites
identical files changes nothing, and a build Turbo restores from an older
commit is accepted when the site's inputs are unchanged, because it is the
same build. When a source did change, the message names both commits and the
way out of a cached build (`pnpm exec turbo run build --force`).
`DS_E2E_ALLOW_STALE=1` skips the sources rule only, never the checkout or the
site, and the run says when it was used. The rules have their own tests in
`scripts/build-id.test.mjs`.

## Determinism — why it's opt-in in CI

Screenshots depend on the OS/image fonts and anti-aliasing, so baselines are only
comparable when generated in the **same** environment. The
`.github/workflows/visual.yml` workflow therefore runs inside the **pinned
Playwright container** (`mcr.microsoft.com/playwright:v1.61.1-jammy`) and is
`workflow_dispatch`-only, so font drift never blocks an unrelated PR.

To (re)generate the authoritative, CI-matching baselines:

1. Dispatch **Visual regression** with `update: true`.
2. The workflow pushes the refreshed snapshots to the
   `test/visual-baselines` branch (it pushes nothing when the images are
   unchanged).
3. Open a pull request from that branch, review the image diff, and merge.

After that, dispatch with `update: false` (the default) to compare; failures
upload a `visual-report` artifact with the side-by-side diffs.

> The baselines committed from local development bootstrap `pnpm visual` on a
> developer machine; the container-generated ones are authoritative for CI.
