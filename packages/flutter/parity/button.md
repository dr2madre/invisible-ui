# Button parity checklist

Reference commit: `8fa469ac66e57deb23b9a8ad76add6bb1d03af45`

Reference paths: `core/src/button` `packages/svelte/src/lib/button`

The Flutter `Button` checked against the Svelte `Button`
(`packages/svelte/src/lib/button/Button.svelte`) and the headless button in
`core/src/button`, which follow the
[WAI-ARIA button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).
Docs page: [Button](https://dr2madre.github.io/invisible-ui/components/forms/button/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/button_test.dart` that holds it.

## Names

ADR 0017 decision 6: the Flutter API uses Flutter names. This table maps
them to the web names and to the ADR 0011 vocabulary.

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `onPressed` | `onpress` | the activation callback, read at call time |
| `onPressed: null` | `disabled` | disabled; Flutter buttons disable this way |
| `variant: ButtonVariant.standard` | `variant="default"` | the baseline variant; `default` is a reserved word in Dart |
| `variant: ButtonVariant.primary`, `.secondary`, `.ghost`, `.danger` | the same names | semantic intent, never a look |
| `loading` | `loading` | busy: presses ignored, focus kept |
| `icon` | `left` snippet, `leftIcon` | the leading icon |
| `child` | the children | the label |
| `Button.icon(icon:, semanticLabel:)` | `iconOnly` with `ariaLabel` | icon-only, with a required name |
| `semanticLabel` | `ariaLabel` | the accessible name |
| `focusNode`, `autofocus` | none | Flutter focus wiring |

## States

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Idle | matched | `a tap calls onPressed once` |
| Hover changes the fill, mouse only | matched | `colours come from the theme roles` |
| Focused, ring for keyboard focus only (`:focus-visible`) | matched | `shows for keyboard focus only` |
| Pressed has no own style | matched | the reference sets none |
| Disabled: not focusable, ignores presses, half opacity, no hover | matched | `a null onPressed disables the button`, `a disabled button shows no hover state` |
| Loading: presses ignored, focus kept, label kept | matched | `presses are ignored and focus stays` |
| Loading: a spinner replaces the leading icon, or the glyph of an icon-only button | matched | `a spinner replaces the leading icon; the label stays`, `a spinner replaces the glyph of an icon-only button` |
| Loading: the spinner stands still under reduced motion | matched | `the spinner stands still under reduced motion` |
| Loading: `loadingStatus`, a live succession of steps | out of scope | needs `SemanticsService` announcements; follows with the Loading component |
| Copy button (`copy`, `copiedLabel`, ADR 0016) | out of scope | needs the clipboard and a status region; on demand |
| Read-only, invalid, selected | out of scope | the reference button has none of them |

## Variants

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `default`, `primary`, `secondary`, `ghost`, `danger` | matched | `every button meets the labeled tap target guideline` renders all five |
| Danger shows a hazard glyph unless an icon is given | matched | `danger shows the hazard glyph unless an icon is given` |
| Danger can hide the hazard glyph (`leftIcon={false}`) | out of scope | no consumer asks for it; the glyph keeps the meaning off colour alone |
| Ghost underlines its text label | matched | `ghost underlines its label` |
| Trailing icon (`rightIcon`, `right` snippet) | out of scope | no consumer asks for it yet |
| Leading icon plus label | matched | `the leading icon leads in both directions` |
| Icon-only with a required name | matched | `an icon-only button is named by its semantic label`, `an icon-only button refuses an empty label` |

## Keyboard

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Enter activates | matched | `Enter activates the focused button`, `Numpad Enter activates the focused button` |
| Space activates | adapted | `Space activates the focused button`. A native button fires Space on key up; the Flutter `ActivateIntent` fires on key down, as every Flutter button does |
| Tab moves focus; a disabled button is skipped | matched | `Tab skips a disabled button` |
| Keys do nothing without focus | matched | `keys do nothing while the button is not focused` |

## Focus

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Ring shows only in keyboard highlight mode | matched | `shows for keyboard focus only` |
| Ring colour: the light role, `style.focus.onDark` in dark | matched | `shows for keyboard focus only`, `uses style.focus.onDark in the dark theme` |
| Ring and halo widths from the focus tokens, on the control's edge | matched | `the focus ring follows the theme; dark uses style.focus.onDark` (theme test) |
| Forced colours: a solid outline at the ring offset | adapted | Flutter has no forced-colours mode; under `MediaQuery.highContrastOf` the ring is drawn alone at `InvisibleFocusRing.offset` |
| The layout never moves when focus shows | matched | the ring paints outside the control's bounds |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Role `button` | matched | `a text button is a focusable, enabled button named by its label` |
| Name from the label | matched | same test |
| Name from `ariaLabel` replaces the label | matched | `a semantic label replaces what the text says` |
| Disabled state | matched | `a null onPressed disables the button` |
| `aria-busy` while loading | adapted | Flutter semantics have no busy flag. The button's value carries the theme's `loadingLabel` ("Loading…"), so a screen reader says it after the name: `the busy state is announced with the theme message` |
| Labeled tap target | matched | `every button meets the labeled tap target guideline` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Tokens

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Colours from the roles: background, text, surface, control border, primary, primary hover, on primary, secondary surface, on secondary surface, state hover, danger, destructive surface, on destructive surface | matched | `colours come from the theme roles` |
| Mixed borders and hovers (`color-mix()` in the stylesheet) | matched | computed in sRGB from the same roles, as the stylesheet does |
| Padding from `density.regular.control-padding-*` | matched | `compact and touch padding fall back to regular` (theme test) |
| Radius from `radius.control` | matched | `light and dark come from the tokens` (theme test) |
| Line height `typography.line-height-tight`, weight 500 | matched | the reference sets weight 500 in its stylesheet |
| Gap, icon-only padding and size, icon sizes, border width, disabled opacity | matched | the reference sets them in its own stylesheet, not in the tokens; the Flutter values are the same numbers |
| Colour transition of 120 ms, none under reduced motion | matched | the reference uses a 120 ms transition |

## Density and target size

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Hit area at least 24 by 24 under compact and regular | matched | `targets are at least 24 by 24 under regular and compact` |
| Hit area at least 44 by 44 under touch | matched | `targets are at least 44 by 44 under touch` |
| An explicit `minTargetSize` applies at any density | matched | `an explicit 44 by 44 target applies at regular density` |
| A press between the painted button and the target edge counts | matched | `a press outside the painted button but inside the target counts` |
| Compact and touch padding | adapted | the tokens define control padding for regular only; compact and touch use the regular values until the tokens define theirs |

## Direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The leading icon leads in left-to-right and right-to-left | matched | `the leading icon leads in both directions` |
| Text scale 2.0 grows the button and its icons, no overflow | matched | `text scale 2.0 grows the button without overflow` |
| A long label wraps in a narrow space | matched | `a long label wraps in a narrow space at text scale 2.0` |
| Ghost underline offset (`text-underline-offset`) | adapted | Flutter text decoration has no offset |
