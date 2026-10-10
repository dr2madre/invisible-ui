# AvatarGroup parity checklist

Reference commit: `e32e67cd2cc2fb993c9758007c27026cafc20420`

Reference paths: `packages/svelte/src/lib/avatar-group`

The Flutter `AvatarGroup` checked against the Svelte `AvatarGroup`
(`packages/svelte/src/lib/avatar-group/AvatarGroup.svelte`), with the chip
name of the React adapter, which reads the catalog.
Docs page: [Avatar Group](https://dr2madre.github.io/invisible-ui/components/data-layout/avatar-group/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/avatar_test.dart`
that holds it.

## Names

| Flutter | Svelte | Meaning |
| --- | --- | --- |
| `items: [AvatarGroupItem(...)]` | `items: AvatarGroupItem[]` | the people; each item has `name`, `image` (`src`), `semanticLabel` (`alt`) and `color` |
| `label` (required) | `label` (required) | the name of the group |
| `max`, `size`, `shape` | `max`, `size`, `shape` | the same meanings; `max` defaults to 4 |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| At most `max` avatars; the rest fold into a "+N" chip | matched | `a group shows at most max and names the rest from the catalog; it is a named group` |
| No chip when everyone fits | matched | `no chip when everyone fits; right to left the first avatar sits at the right` |
| A person's position is part of their identity, so two people may share a name | matched | the key is the position and the name |
| The item colour is checked so it cannot close the style declaration | adapted | a Flutter `Color` is a typed value, so no text reaches a style: nothing to check |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A group (`role="group"`) named by `label` | adapted | Flutter 3.32 has no group role; a container node named by `label` with its avatars as children: `a group shows …` |
| Each avatar keeps its own name | matched | same test |
| The chip is an image named "N more" from the catalog (`avatarGroup.more`) | matched | same test, also with a translated plural message |
| `avatarGroup.more` is a plural message | adapted | `InvisibleMessages.avatarGroupMore` is a function of the count, so a translation picks its own plural forms: same test |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Each avatar overlaps the one before by 0.625 rem | matched | `a group shows …` measures the row |
| From the inline-start, mirrored right to left | matched | `no chip when everyone fits; …` |
| The chip on the neutral surface in the secondary text colour | matched | `a group shows …` checks the text contrast |
| No separator ring by default | matched | none is drawn; the ring is a web custom property only |
| A narrow parent | adapted | the web row overflows; the Flutter row shrinks to fit: `at text scale 2.0 in a narrow parent the group shrinks to fit` |
| Targets | out of scope | not interactive |
