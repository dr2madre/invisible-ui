# Count parity checklist

Reference commit: `e32e67cd2cc2fb993c9758007c27026cafc20420`

Reference paths: `packages/svelte/src/lib/count`

The Flutter `Count` checked against the Svelte `Count`
(`packages/svelte/src/lib/count/Count.svelte`).
Docs page: [Count](https://dr2madre.github.io/invisible-ui/components/feedback/count/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/count_test.dart`
that holds it.

## Names

| Flutter | Svelte | Meaning |
| --- | --- | --- |
| `count`, `max`, `dot`, `showZero` | the same names | the number, its ceiling, the dot and the zero rule |
| `status: NotificationStatus.danger` … | `status: "danger"` … | the colour; the same five statuses as the notifications |
| `semanticLabel` | `label` | the fuller accessible name |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Past `max` it shows "N+" | matched | `past max it shows N+; at 0 nothing unless showZero` |
| Hidden at 0 unless `showZero` | matched | same test |
| `dot` shows a dot with no number | matched | `a dot has no number: named by its label, or decorative` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="status"` named by `label ?? digits`; the digits hidden | adapted | Flutter has no status role; a live region node with the same name: `semantics: a live region named by the label, or by the digits; the digits themselves are hidden` |
| A dot with a label is a status; without one it is hidden | matched | `a dot has no number: …` |
| The colour never carries the meaning alone | matched | the number and the name carry it; the colour adds to them |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The status colour with the text that reads on it (dark text on warning) | matched | `each status takes its colour and the text that reads on it` |
| A pill at least 1.25 rem square, 0.6875 rem text, weight 600; a 0.55 rem dot | matched | `a dot has no number: …` (the dot), `grows with the text at scale 2.0, right to left` |
| Grows with the text size | matched | same test |
| Targets | out of scope | not interactive |
