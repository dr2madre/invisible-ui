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
  `maxDiffPixelRatio` to absorb sub-pixel anti-aliasing. Visual specs run in
  their own Playwright project (`--project=visual`), separate from the functional
  e2e gate.
- Baselines live in `e2e/visual.spec.ts-snapshots/` and are committed.

## Commands

```sh
pnpm visual          # compare against committed baselines
pnpm visual:update   # regenerate baselines (after an intended visual change)
```

(Both build the docs site first via the Playwright `webServer`.)

## Determinism — why it's opt-in in CI

Screenshots depend on the OS/image fonts and anti-aliasing, so baselines are only
comparable when generated in the **same** environment. The
`.github/workflows/visual.yml` workflow therefore runs inside the **pinned
Playwright container** (`mcr.microsoft.com/playwright:v1.61.1-jammy`) and is
`workflow_dispatch`-only, so font drift never blocks an unrelated PR.

To (re)generate the authoritative, CI-matching baselines:

1. Dispatch **Visual regression** with `update: true`.
2. Download the `visual-baselines` artifact.
3. Commit it under `e2e/visual.spec.ts-snapshots/`.

After that, dispatch with `update: false` (the default) to compare; failures
upload a `visual-report` artifact with the side-by-side diffs.

> The baselines committed from local development bootstrap `pnpm visual` on a
> developer machine; the container-generated ones are authoritative for CI.
