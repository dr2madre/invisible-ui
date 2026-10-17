---
"@invisible-ui/core": minor
"@invisible-ui/elements": minor
"@invisible-ui/react": minor
"@invisible-ui/svelte": minor
"@invisible-ui/vue": minor
---

The PIN input arrows follow the reading direction: in a right-to-left layout,
ArrowLeft moves to the next cell and ArrowRight to the previous one. The core
keydown handler reads the cell's computed direction on each press, or takes
the new `direction` option of `pinInput.connect`; the new `pinInput.keyTarget`
answers which cell a key moves to. Every adapter follows, with no change to
its props.

The number field, the PIN input and the time field accept Arabic-Indic
(U+0660–0669) and Persian (U+06F0–06F9) digits in every locale, typed, from a
soft keyboard or pasted. The value they report keeps ASCII digits. The public
`i18n.foldDigits` is unchanged: it still folds only the locale's own digits.

A locale that groups thousands with an apostrophe, such as `de-CH`, takes both
the typographic `’` it displays and the straight `'` keyboards type. No other
locale takes an apostrophe, and a malformed number stays invalid.

The time field takes a paste: a whole time, such as `09:30`, sets every
segment, and other text types its characters from the focused segment, as
the keys would. Before, the segments refused every paste.

The rules are held by the shared vectors the Flutter adapter reads too.
