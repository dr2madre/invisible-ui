# Textarea parity across adapters (internal)

**Status: completed.** The Textarea now has the same form, validation-message,
and contrast surface in the Svelte and Vue adapters. The sections below retain
the implementation rationale and verification boundary that guided the work.

## The gap that was closed

`<ds-textarea>` already took `success`, `name` and `autocomplete`. Before this
work, the Svelte and Vue Textareas took none of the three.

The initial instinct was to call the web component over-built and trim it. The
files showed the opposite. A form control without a `name` is never submitted,
so `<ds-textarea>` was the only textarea in the design system usable inside a
form. Svelte and Vue had a hole; elements did not have a surplus.

Two more gaps sit next to it:

- **The error message carried no glyph** in Svelte or Vue, where the TextField
  carried one in both (`TextField.svelte`, `TextField.ts`). An error signalled
  by red text alone fails WCAG 1.4.1 — the reason the danger button carries a
  hazard mark, with a test that records it.
- **The Svelte Textarea had missed the contrast work in #221.** Its scoped
  styles used raw `--ds-color-danger` for body text (the required marker, the
  error text) where `TextField.svelte` used
  `--ds-color-danger-body-text`. The dark theme lightens only the second
  (`tokens.css`), so dark mode had the wrong contrast.

## Implemented approach

The implementation aligned upward in one Svelte/Vue change.

### Svelte — `packages/svelte/src/lib/text-field/Textarea.svelte`

- Add the `name`, `success` and `autocomplete` props, with the TextField's
  JSDoc wording. `name` and `autocomplete` go on the `<textarea>`.
- Pass `hasSuccess: !!success` to `createTextField` and to `setFlags`.
  `TextFieldFlags` already accepts it.
- Destructure `successAction`; `createTextField` already returns it.
- Add the `{:else if success}` branch with `use:successAction`, shaped like the
  TextField's.
- Give both messages their glyph, importing `Icon` the way the TextField does.
- Scoped styles: move `.field__required` and `.field__error` to the
  `-body-text` tokens, and add `.field__success`, `.field__msg-icon` and the
  flex row, copying the TextField's block.

### Vue — `packages/vue/src/textarea/Textarea.ts`

- The same three props on `TextareaProps` and on `props`.
- `hasSuccess: Boolean(props.success)` into `useTextField`, which already takes
  it. `name` and `autocomplete` onto the `h("textarea", …)`.
- Success branch spreading `...api.value.successProps`, shaped like the
  TextField's, and a glyph in each message using `Icon` and `HazardGlyph`.
- `textarea--success` on the root; `textarea.css` already defines it.
- No stylesheet change. The rules added in #229 are idle only because nothing
  in Vue renders a success message or a message glyph. This work makes them
  live, and the byte parity with the elements sheet holds.

The API manifest was regenerated so the Svelte and Vue blocks of
`textarea.json` include the aligned props.

### Worth flagging in review

The glyphs change how a shipped component looks: the Textarea's error gains an
icon in both adapters. It is an accessibility fix for the reason above, and it
is the only part an existing user would see.

## Verification

```sh
pnpm exec turbo run test typecheck build
pnpm lint && pnpm format:check
pnpm api:check          # after pnpm api:generate
```

Tests to add in `styled-textarea.test.ts` and `Textarea.test.ts`, one per
adapter:

- the value submits in a native form under `name`;
- the success message is reachable from `aria-describedby` and carries
  `aria-live="polite"`;
- the error wins when error and success are both set;
- each message carries a glyph;
- `vitest-axe` reports no violations.

The docs demo renders the Svelte Textarea with `name`, `autocomplete`, and
success feedback. The existing docs E2E smoke covers its real-browser render;
the adapter suites cover form submission and accessibility wiring.

## Related: changesets

The release workflow is dormant by design (`workflow_dispatch` only) and all
five packages are `private: true`, so a changeset produces no release today.
PRs #218–#234 carry none. Writing changesets for a subset now yields a
changelog that looks complete and is not.

When `private` comes off to publish, write one release changeset covering the
range. `.github/workflows/release.yml` lists the four steps to go live.
