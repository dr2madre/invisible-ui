## Summary

<!-- What does this change and why? -->

## Executable checks

`pnpm gate` is the whole non-browser gate, the same entry point CI runs.
Browser checks: `pnpm e2e` (three engines), `pnpm visual` (container
baselines, see docs/visual-testing.md).

- [ ] `pnpm gate` passes on the final commit
- [ ] `pnpm e2e` passes where the change reaches a demo, a style or an interaction
- [ ] A changeset accompanies a change to a published package (`pnpm changeset`)

## Prevention checklist

Statements the author confirms; each names how it was verified. They add to
the executable checks above, they never replace them. Cross out what does not
apply and say why.

- [ ] Every public prop changes correctly after mount (rerender test per prop, per adapter)
- [ ] Reflecting a controlled value emits no callback (`not.toHaveBeenCalled()`)
- [ ] A callback observes state already committed; replacing a callback after mount works
- [ ] SSR output already carries the semantics and attributes (`ssr.test.ts` case)
- [ ] Mouse, keyboard, touch and synthetic activation follow native semantics (test with a direct `.click()` and no preceding pointer event)
- [ ] RTL, vertical, reflow and zoom are tested, not deduced from horizontal LTR
- [ ] Numeric constraints hold as invariants over generated cases; float arithmetic on grid values is re-gridded and asserted with exact equality
- [ ] A refused or no-op request still leaves the native control in sync (assert the DOM value, not only the callback)
- [ ] Each new test fails under a relevant mutation (say which mutations were run)
- [ ] Every documentation claim matches evidence that exists today; screen-reader, touch AT, zoom and forced-colors claims wait for the manual session
