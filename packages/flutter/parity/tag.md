# Tag parity checklist

Reference commit: `e32e67cd2cc2fb993c9758007c27026cafc20420`

Reference paths: `packages/svelte/src/lib/tag`

The Flutter `Tag` checked against the Svelte `Tag`
(`packages/svelte/src/lib/tag/Tag.svelte`).
Docs page: [Tag](https://dr2madre.github.io/invisible-ui/components/feedback/tag/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/tag_test.dart`
that holds it.

## Names

| Flutter | Svelte | Meaning |
| --- | --- | --- |
| `child` (required) | `children` | the text |
| `status: TagStatus.neutral` … `selected` | `status: "neutral"` … `"selected"` | the colour |
| `variant: TagVariant.soft`, `solid` | `variant: "soft"`, `"solid"` | the weight |
| `size: TagSize.small`, `medium` | `size: "sm"`, `"md"` | 12 or 13 pixel text |
| `icon`, `trailing` | `icon`, `trailing` | a decorative leading icon and trailing content |
| `onRemoved` | `removable` with `onRemove` | a remove button shows when `onRemoved` is set, as Flutter's chips take `onDeleted` |
| `removeLabel` | `removeLabel` | the name of the remove button |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| No remove button unless removable | matched | `without onRemoved there is no remove button; the text is the meaning` |
| The remove button reports on a click, Enter and Space | matched | `the remove button runs onRemoved on a tap, Enter and Space` |
| Where focus goes after the removal | out of scope | the app removes the tag, as on the web; it moves focus to the next tag or the field that adds them |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The chip is presentational; its text is the meaning | matched | `without onRemoved …` |
| The status never rests on colour alone | matched | the text carries it |
| The remove button is a button named `removeLabel ?? "Remove"` (`tag.remove`) | matched | `the remove button runs …`, `the remove button is named by removeLabel; the focus ring shows from the keyboard` |
| The cross is decorative | matched | `Glyph` has no semantics |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Soft: the status surface, text and border; selected tints the secondary at 8 % and 22 % | matched | `soft and solid colours per status` |
| Solid: the status colour with the text that reads on it | matched | same test |
| Text contrast | matched, one shortfall | every pair passes 4.5:1 except solid warning, the web's own pair, at 3.9:1 for 13 pixel text: same test |
| The cross at 0.7 opacity, full on hover and focus; focus ring on the button | matched | `the remove button is named by removeLabel; …` |
| Leading icon at 1 em in the text colour; trailing content after the text | matched | `a long tag wraps …` places the count and the button |
| The remove button at the inline-end, mirrored right to left | matched | `a long tag wraps at text scale 2.0 in a narrow parent, the remove button at the inline-end right to left` |
| `white-space: nowrap` | adapted | the web chip overflows a narrow parent; the Flutter text wraps inside the chip: same test |
| The remove button's target 24 by 24, 44 by 44 under touch | matched | `the remove button is named …` (24), `the remove button keeps 44 by 44 under touch`; under touch the chip grows to hold the target |
