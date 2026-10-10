# Kbd parity checklist

Reference commit: `e32e67cd2cc2fb993c9758007c27026cafc20420`

Reference paths: `packages/svelte/src/lib/kbd`

The Flutter `Kbd` checked against the Svelte `Kbd`
(`packages/svelte/src/lib/kbd/Kbd.svelte`).
Docs page: [Kbd](https://dr2madre.github.io/invisible-ui/components/navigation/kbd/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/kbd_test.dart`
that holds it.

## Names

| Flutter | Svelte | Meaning |
| --- | --- | --- |
| `Kbd('Esc')` | `<Kbd>Esc</Kbd>` | one key |
| `Kbd.chord(['⌘', 'K'])` | `keys={["⌘", "K"]}` | a chord |
| `separator` | `separator` | the text between keys, "+" by default |

## Behaviour and semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| One keycap per key, joined by the separator | matched | `one key, or a chord joined by the separator; assistive technology reads the keys alone` |
| The separator is hidden from assistive technology | matched | same test |
| `<kbd>` marks keyboard input | adapted | Flutter has no keyboard-input role; one node reads the keys in order: same test |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Monospace, at 0.8125 em of the surrounding text | matched | `a monospaced keycap at 0.8125 of the surrounding size, at least 24 wide` |
| A raised keycap: background, border, a 1 pixel shadow, control radius, at least 1.5 rem wide | matched | same test |
| The separator in the secondary text colour | matched | `one key, …` checks the text contrast |
| A long chord wraps, right to left from the right | adapted | the web chord stays on one line; the Flutter chord wraps in a narrow parent: `a long chord wraps at text scale 2.0 in a narrow parent, right to left` |
| Targets | out of scope | not interactive |
