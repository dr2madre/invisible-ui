# Visual regression testing

Functional tests (vitest + vitest-axe) prove a component _behaves_ and is
_accessible_; they can't see that it still _looks_ right. Visual-regression tests
close that gap: they screenshot each styled component's live demo and compare it
pixel-by-pixel against a committed baseline, so an accidental CSS change — a
shifted slider thumb, a dropped border, a wrong tint — fails CI with a visible
diff.

## How it works

- Svelte: `e2e/visual.spec.ts` screenshots the `.ds-preview` frame of a curated
  set of **static** component demos on the docs site (no overlays, no
  date-dependent surfaces, no looping animation), via Playwright
  `toHaveScreenshot()`.
- Elements, Vue and React: `e2e/visual-elements.spec.ts`,
  `e2e/visual-vue.spec.ts` and `e2e/visual-react.spec.ts` shoot the same set
  on one visual page per adapter, served by the Vue example
  (`examples/vue/visual-elements.html`, `visual-vue.html`, `visual-react.html`,
  scenes in `examples/vue/src/visual/`). Each scene repeats its Svelte demo's
  data, inside a frame that copies `.ds-preview`, and each test shoots one
  `[data-visual]` frame. The theme comes from the address (`?theme=dark`) and
  is set before the first render.
- The shared parts live in `e2e/visual-shared.ts`: the component list, the
  components also shot in dark, the guard that fails a test on any request
  that leaves the machine, and the comparison itself.
- Config: `playwright.config.ts` disables animations and allows a small
  `maxDiffPixelRatio` (0.4%) to absorb sub-pixel anti-aliasing, the same for
  every adapter. Keep it well under the share of an image a single component
  state occupies: at the earlier 2% a restored selected-page style, 1.95% of
  the pagination shot, compared as no change. Visual specs run in their own
  Playwright project (`--project=visual`), separate from the functional e2e
  gate.
- Baselines live in one folder per spec, `e2e/visual.spec.ts-snapshots/`,
  `e2e/visual-elements.spec.ts-snapshots/` and so on, so the same snapshot name
  in two adapters never collides.

### Coverage per adapter

| Adapter | Components | Where |
| --- | --- | --- |
| Svelte | the 21 below, `meter` in light and dark | docs site demos |
| Elements | the same 21, `meter` in light and dark | `visual-elements.html` |
| Vue | the same 21, `meter` in light and dark | `visual-vue.html` |
| React | `button`, `checkbox`, `switch`, `text-field`, `select`: the part of the set the adapter has | `visual-react.html` |

The set: button, empty state, error state, tag, card, inline notification,
checkbox, checkbox group, switch, radio group, segmented control, slider, range
slider, rating group, progress, meter, text field, select, pagination, avatar,
label.

Where an adapter cannot express a demo, its scene says so and leaves that part
out: `<ds-text-field>` has no icon region, so the Elements text-field scene
has no leading-icon field.

A new visual scene in one adapter goes in the others that have the component,
with the same data, and in `VISUAL_COMPONENTS` when it joins the shared set.

## Commands

```sh
pnpm visual          # compare against committed baselines
pnpm visual:update   # rewrite every baseline (after an intended visual change)
```

(Neither builds anything: the Playwright `webServer` serves the docs and Vue
example `dist` folders that are already there. Build first with `pnpm build`.)

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
2. The workflow rewrites every baseline of every adapter and pushes the
   snapshot folders (`e2e/visual*.spec.ts-snapshots/`) to the
   `test/visual-baselines` branch (it pushes nothing when the images are
   unchanged).
3. Open a pull request from that branch, review the image diff, and merge.

After that, dispatch with `update: false` (the default) to compare; failures
upload a `visual-report` artifact with the side-by-side diffs.

> The baselines committed from local development bootstrap `pnpm visual` on a
> developer machine; the container-generated ones are authoritative for CI.
>
> The Elements, Vue and React folders start empty: their first baselines come
> from a dispatch with `update: true`, never from a local run, whose fonts
> would not match the container's. Until that pull request is merged, a
> comparison run fails on those specs for want of a baseline.
