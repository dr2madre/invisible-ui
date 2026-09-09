# Accessibility lab

A place to run the accessibility checks a machine cannot make, and a way to
record what a person saw. It holds no results: everything here is a procedure
and a blank form.

Two rules govern this document, and both are load-bearing.

**Nothing automated may fill in a manual check.** An axe sweep, an emulated
forced-colors run and a computed contrast ratio are all useful, and none of
them is a screen reader, a finger, a magnifier or a real high-contrast
desktop. Where the automated suite covers part of a question, this document
says so and stops there.

**A result without an environment is not a result.** "The combobox announces
its state" means nothing without the operating system, the browser, the
assistive technology and their versions. The run sheet asks for all of them
before it asks for anything else.

## Start with what is already open

`docs/component-audit-remediation-plan.md` names eight scenarios it leaves to
a person, and they are still open. The run sheet puts them first, before the
page sweep. They are few, they are specific, and somebody already decided they
were worth a session. This lab adds to that list; it does not replace it.

## What the automated suite already answers

Do not repeat these by hand. Each row also says what its answer does not
cover, because that is where the session's time belongs.

| Question | Where | What it does not tell you |
| --- | --- | --- |
| Are there axe-detectable violations on any page of the built catalog? | `e2e/a11y-catalog.spec.ts` | **Chromium only.** Only rules a machine can decide, and only each page's resting state: the markup inside an opened dialog, menu or listbox is never scanned. |
| Does every control keep a visible boundary, and a focus indicator, in forced colors? | `e2e/forced-colors.spec.ts` | Emulated, Chromium only. Whether each state stays distinguishable is not checked, and several are still carried by a tint alone. |
| Does focus return to the trigger, stay visible, and stay out of hidden content? | `e2e/interactions.spec.ts`, `e2e/overlay-composition.spec.ts`, `e2e/dialog-workflow.spec.ts`, `e2e/carousel-inert.spec.ts`, `e2e/stepper-responsive.spec.ts` | The named flows only: popover, dialog, nested overlays, carousel, stepper. Focus order across a whole page, and escape from a composite widget, are nobody's test. |
| Are the keyboard maps and ARIA wiring the ones the pattern asks for? | the adapter suites, in jsdom | jsdom has no accessibility tree and no focus ring: it can see that a key was handled, never that the eye kept its place. |
| Does every component page reflow at 320 and 1024 CSS pixels without sideways scroll? | `e2e/reflow.spec.ts`, and for open overlays `e2e/dialog-workflow.spec.ts`, `e2e/overlay-composition.spec.ts`, `e2e/multi-select.spec.ts`, `e2e/table-selection.spec.ts` | The sweep sees each page at rest. A narrow viewport is also not 400% zoom: zoom scales text and spacing together. |
| Is every pointer target at least 24 by 24 CSS pixels? | `e2e/target-size.spec.ts` | Anything with a zero-sized rect is skipped, so every control inside a closed dialog, menu or listbox goes unmeasured. Links, sliders and tree items are not in the selector. Size is also not reachability. |
| Do four specific boundaries clear 3:1? | `e2e/control-boundary.spec.ts` | Exactly four: the text field border, the switch off track and thumb, the checkbox border, and the text field's focus ring. Every other control's boundary is unmeasured. |
| Does a touch work at all? | `e2e/multi-select.spec.ts`, `e2e/multi-select-parity.spec.ts`, `e2e/table-selection.spec.ts` | Two components, with an emulated touchscreen that has no finger width and no gestures. |
| Does a locale change reformat in place, derive `dir`, and survive expanded text? | `e2e/i18n.spec.ts` (one page, three locales), `e2e/async-content.spec.ts`, `e2e/stepper-responsive.spec.ts` | Layout only, and "expanded text" there means a larger root font, not longer strings. Whether a translation reads well is a human question. |
| Does a view announce once rather than twice? | `e2e/async-content.spec.ts` | It counts live regions. It cannot hear one. |

## What only a person can answer

These are the six checks in the run sheet.

**Screen reader.** Does the control announce its role, name, value and state?
Does a change announce once, not twice and not never? Is the reading order the
order the page means? Nothing automated reads anything.

**Touch.** Can every action be completed by a real finger, including
dismissal? Anything that only appears on hover, or only responds to a right
click, is unreachable. The emulated touch above covers two components and has
no finger width.

**Zoom to 400%.** At 400% browser zoom on a 1280-pixel-wide window, is
everything still reachable and readable? This is WCAG 1.4.10, and it is not
the same as a 320-pixel viewport.

**Forced colours.** **This one needs Windows.** `forced-colors: active` comes
from a Windows contrast theme; macOS "Increase contrast" does not set it. On a
Mac the honest entry is "untested, no Windows device", which is a permitted
answer.

**Text expansion.** With labels about a third longer, as a translation
routinely is, does the layout hold? The demos carry English strings, so use a
pseudolocalization extension or edit the text in devtools. The one page with a
locale switcher is `components/localization/locale-provider/`.

**Keyboard only.** With the pointer unplugged, can the whole component be
operated, is focus always visible, and can focus always leave? The flows in
the table above are covered; a whole page's focus order is not.

## Running a session

1. Build and serve the catalog, so the pages under test are the built ones:

   ```
   pnpm build
   pnpm --filter @design-system/docs preview
   ```

   It serves on `http://localhost:4321`, which is the origin the sheet's URLs
   already carry.

2. Generate a fresh run sheet:

   ```
   pnpm a11y:lab
   ```

   It writes `a11y-lab-run.md`: the eight open scenarios, then every component
   page with its URL and the six checks. It is empty. It is regenerated rather
   than edited in place, and never committed with results in it.

3. Fill in the environment block first.

4. Work down the open scenarios, then the pages. For each check, write what
   happened, not whether it passed. "VoiceOver read 'Fruit, combo box,
   collapsed' and did not announce the filtered count" is a finding. "Pass" is
   not.

5. Turn what you found into issues, and the sheet into the session report.
   Anything you could not test, for want of a device or an assistive
   technology, is recorded as untested, never as passed.

## What this lab is not

It is not a conformance claim, and it does not make one possible on its own.
It does not replace the manual verification the remediation plan requires: it
carries that plan's open scenarios into the sheet and adds a page sweep after
them. And it pre-answers nothing: the generator writes an empty field into
every result column, which its tests hold it to.
