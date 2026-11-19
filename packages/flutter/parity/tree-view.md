# Tree View parity checklist

Reference commit: `f2943333bf31794885e523ca48b6dd87f189d5af`

Reference review (2026-10-18): checked the token-model change in the Svelte
reference. Behavior and accessibility markup did not change; CSS token names
changed, with resolved Light/Dark values checked by the token runtime tests.

Reference review (2026-10-19, primary selected): the selected, checked,
current or on parts point at the shared primary selected colour,
`components.general.selection.background.default`, and the selected label and
fill derived from it, in place of the secondary action colour. Dark lightens
the primary, so a label on a solid selected fill turns black. Flutter reads
the same tokens.

Reference paths: `core/src/tree-view` `packages/svelte/src/lib/tree-view`

The Flutter `TreeView` checked against the Svelte `TreeView`
(`packages/svelte/src/lib/tree-view/TreeView.svelte`) and the headless tree
in `core/src/tree-view`, which follow the
[WAI-ARIA tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/).
Docs page: [Tree View](https://dr2madre.github.io/invisible-ui/components/patterns/tree-view/).

Each line is **matched**, **adapted** (with the platform reason), **open**
(with the gap), **out of scope** or **not yet verified**. Every matched line
names the test that holds it, in `test/tree_view_test.dart` unless it says
`vectors:` for `test/tree_view_vectors_test.dart`, which runs the file in
`core/src/tree-view/__vectors__` that `core/src/tree-view/vectors.test.ts`
runs through `connect()` too.

## Names

| Flutter | Svelte and core | ADR 0011 meaning |
| --- | --- | --- |
| `TreeView<T>` | `TreeView` | values are any type `T`; the vectors use strings |
| `label` | `label` | the tree's accessible name |
| `nodes: List<TreeNode<T>>` | `nodes: TreeNode[]` | the node forest |
| `TreeNode(value:, label:, disabled:, hasChildren:, children:, icon:)` | `TreeNode { value, disabled, hasChildren, children }` | `children: null` with `hasChildren` is an unloaded parent; `children: []` is a loaded leaf |
| `TreeView(selected:, onSelectionChanged:)` | `selected` with `onSelectedChange` | controlled `value`, change callback |
| `TreeView(expanded:, onExpansionChanged:)` | `expanded` with `onExpandedChange` | controlled expanded set, change callback |
| `TreeView.uncontrolled(initialSelected:, initialExpanded:)` | `selected` and `expanded` unbound | `defaultValue` |
| `loading`, `loadErrors` | `loading`, `loadErrors` | app-owned load state, reflected without a report |
| `onLoadChildren` with `TreeLoadRequest(value:, requestId:)` | `onLoadChildren` with `TreeLoadRequest { value, requestId }` | a request, never a fetch |
| `enabled: false` | `disabled` | `enabled` is the Flutter name |
| Roving focus | internal (`focused`) | internal too |

## Data model

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Only nodes under open parents are visible | matched | `a press on the chevron opens and closes the parent without selecting…`; vectors |
| An unloaded parent, a loaded parent, a leaf and a completed empty load | matched | vectors: `ArrowRight on a closed unloaded parent…`, `ArrowRight on a completed empty load does nothing` |
| A disabled tree disables every node | matched | `a disabled tree has no tab stop, opens and selects nothing`; vectors: `A disabled tree…` |
| Values unique across the tree | adapted | the widget asserts it in debug builds; core does not check |
| Expanded values are kept as given, including hidden or unknown ones (no pruning) | matched | vectors: `ArrowRight keeps the other open parents, in order` |

## Keyboard

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Down and Up move over visible enabled nodes, skipping disabled ones, no wrap | matched | `left to right: Down and Up move…`; vectors |
| Arrow toward the inline-end opens a closed parent | matched | same test; vectors: `ArrowRight opens a closed parent` |
| Arrow toward the inline-end enters an open loaded parent | matched | same test; vectors: `ArrowRight on an open loaded parent moves to its first child` |
| Arrow toward the inline-end requests the children of an open unloaded parent, unless a request is out | matched | `a failure shows the error status…`; vectors: `…that is loading does nothing`, `…whose load failed requests again` |
| Arrow toward the inline-start closes an open parent, else moves to the parent | matched | `left to right: …`; vectors: `ArrowLeft closes an open parent`, `ArrowLeft on a child moves to its parent` |
| Right to left swaps the two arrows | matched | `right to left: Left opens and enters, Right rises and closes…`; vectors: `Right to left, …` cases |
| Home and End jump to the first and last visible enabled node | matched | `left to right: …`; vectors: `Home…`, `End…` |
| Enter and Space select the focused node | matched | `Enter and Space select the focused node, once each`; vectors: `Enter selects the node`, `Space selects the node` |
| Arrows, Home and End stay in the tree, as the web prevents their default | matched | the tree's `RovingKeyAction` handles them whenever a node has focus |
| Typeahead: a character, or a sequence typed within 500 ms, builds a query; case-insensitive prefix match on labels, over visible enabled nodes after the focused one, wrapping; it moves focus and never selects or opens | matched | `typeahead moves focus to the next visible enabled label that starts with the typed text, ignoring case and wrapping` (the selected node keeps its check). The web matches the text the row shows; Flutter matches `TreeNode.label`, which is that text. The shared vectors have no typeahead case |
| A character typed with Control, Meta or Alt, or a space, is no typeahead character | matched | `a character typed with Control, Meta or Alt, or a space, is no typeahead character`; `typedCharacter` in `lib/src/internal/roving.dart` skips them |
| `*` is an ordinary typeahead character, not the key that opens every parent beside the focused node | matched | by decision; core has no `*` key either. `* is an ordinary typeahead character: it opens, selects and requests nothing`. The shared vectors have no `*` case |
| Multi-selection (Shift and Control with arrows, Space toggles) | out of scope | single selection only, by decision; the `TreeView` dartdoc says so |

## Focus

| Line | Status | Evidence or reason |
| --- | --- | --- |
| One tab stop: the focused node, else the selected one, else the first visible enabled node | matched | `one tab stop: the first node, else the selected one, else the node that last had focus` |
| A hidden or disabled focused or selected node gives the stop to the next rule | matched | `TreeModel.tabStop`, the rule of `canReceiveFocus` in `connect.ts`; `a disabled tree has no tab stop…` |
| A disabled node takes no focus | matched | `a disabled node is dimmed, takes no focus and no press` |
| Keyboard focus ring on the focused row, only in traditional highlight mode | matched | `the focus ring shows on the focused row after keyboard use` |
| A focused row inside a scrolling parent comes into view | matched | the row calls `Scrollable.ensureVisible` on focus, as the browser scrolls a focused element into view |

## Pointer and touch

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A press on a row focuses and selects it | matched | `a press on a row focuses and selects it, reports once…` |
| A press on the chevron opens or closes without selecting | matched | `a press on the chevron opens and closes the parent without selecting…` |
| A press on the chevron of an open parent whose load failed closes it without a request | matched | by decision, the chevron always opens and closes; retry is Right Arrow, and in Flutter also the Retry semantics action. `after a failure the chevron still closes the parent without a request; opening it again asks again` |
| A press on the chevron of a closed parent whose load failed opens it and requests again | matched | same test |
| A disabled node takes no press; a disabled tree takes none | matched | `a disabled node is dimmed…`, `a disabled tree has no tab stop, opens and selects nothing` |

## State and callbacks

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reflection never emits: a changed `selected` or `expanded` is shown without a report (ADR 0011) | matched | `controlled: a changed selection or expanded set is shown without a report…` |
| Give-back: the parent echoing the reported value moves nothing | matched | same test |
| A selection of the selected node reports nothing | matched | `a press on a row focuses and selects it, reports once…`, `Enter and Space select the focused node, once each` |
| Report after commit, once per action; expansion and load request committed before either is reported | matched | `TreeView` commits every change of an action in one `setState`, then reports; `…a closed parent offers Expand…` (Expand on an unloaded parent reports once and requests once) |
| Uncontrolled keeps its own state from the initial values | matched | `uncontrolled: starts from the initial values and keeps its own state` |
| Callbacks are read at call time | matched | `callbacks are read when the action happens` |

## Lazy loading

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Opening an unloaded parent requests its children once, also before the controlled `loading` arrives | matched | `opening an unloaded parent requests its children once…` |
| Each request carries a growing `requestId` | matched | `a failure shows the error status…` |
| A request marks the parent loading and clears its failure locally | matched | same test (the status turns to loading on retry) |
| `loading` and `loadErrors` are reflected when the parent changes them | matched | both lazy loading tests |
| Status text after the label: `tree.loading` and `tree.loadError` filled with the label | matched | both lazy loading tests (`InvisibleMessages.treeLoading`, `treeLoadError`) |
| The error status in the danger text role | matched | `a failure shows the error status in the danger role…` |
| Status in a polite live region (`role="status"`, `aria-live="polite"`) | adapted | `Semantics(liveRegion: true)`; Flutter live regions have no politeness level and announce politely: `opening an unloaded parent…` |
| Status as the row's description (`aria-describedby`) | adapted | the row's semantics hint: same test |
| `aria-busy` on a loading parent | adapted | Flutter has no busy property; the hint and the live region carry the loading state |
| Retry for assistive technology: an open parent whose load failed offers a "Retry" custom action (`InvisibleMessages.treeRetry`), absent while a request is out | adapted | the web has no equivalent action; there retry is Right Arrow only. `a failure shows the error status… the Retry action ask again…`. Assistive technology: not tested |
| The load-error text (`tree.loadError`) names Right Arrow | matched | kept as it is; the text change is a pending decision |
| Loaded children replace the status | matched | `a failure shows the error status…` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Tree `role="tree"` named by `label`, `aria-multiselectable="false"` | adapted | Flutter has no tree role: a container with `SemanticsRole.list` named by the label: `rows carry selected, expanded only on parents…` |
| Treeitem `role="treeitem"` with `aria-selected` | adapted | each node is a `SemanticsRole.listItem` container whose row node carries the label, the selected state, enabled, focusable and focused, and a tap action that selects: same test |
| `aria-expanded` on parents only | matched | same test (`Documents` and `Pictures` have the expanded state, `Notes` has none) |
| `aria-level`, `aria-setsize`, `aria-posinset` | adapted | Flutter has no level property: each open parent's children sit in a nested `SemanticsRole.list` inside its list item, so depth and set size come from the nesting: same test |
| `aria-disabled` on disabled nodes | matched | same test (`Music` is not enabled) |
| Chevron, icon and check hidden from assistive technology | matched | each sits in excluded semantics; `labeledTapTargetGuideline` passes in the same test |
| Opening and closing a parent with a screen reader on touch, without a keyboard | adapted | an enabled parent offers one custom semantics action: "Expand" (`InvisibleMessages.treeExpand`) while closed, "Collapse" (`treeCollapse`) while open. Only the action that applies is offered, so the action list matches the expanded state and never offers a no-op. Neither moves focus or changes the selection. The web reference has no such action. `ltr: a closed parent offers Expand and an open one Collapse…` and the `rtl` twin; `a disabled tree offers no actions`. Assistive technology: not tested |
| Screen reader output on macOS, Windows, Linux, iOS and Android | not yet verified | Assistive technology: not tested |

## Layout and tokens

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Rows look flat, indented by 17.6 per level after 6.4 at the inline-start; padding 4.8 block and 8 inline-end; gap 5.6; tree padding 4 | matched | the reference sets them in its stylesheet; `…children sit right after it, indented` |
| Leaf rows keep the chevron's space | adapted | the Svelte spacer is 17.6 wide beside a 24 chevron; the Flutter spacer matches the chevron's hit area, so labels line up at every density |
| Row radius `radius.control` | matched | `controlRadius` from the theme |
| Hover `neutral-surface`; selected `secondary` at 10% over transparent, 16% on hover | matched | `selected rows are tinted with the secondary role, deeper on hover…` |
| Check at the inline-end in `secondary`, space always kept, shown on the selected row only | matched | `a press on a row focuses and selects it, reports once and shows the check on that row only` |
| Chevron points to the inline-end and turns a quarter toward the content while open, mirrored in right to left | matched | `right to left: … the chevron turns the other way`; `the chevron turns a quarter while open…` |
| Chevron hit area at least 24, and the theme's minimum target | matched | `every row and chevron keeps 44 by 44 under touch` |
| Row hit area 24 by 24, 44 by 44 under touch, growing with text scale | matched | `rows carry selected…` (`targetGuideline24`), `every row and chevron keeps 44 by 44 under touch` |
| Disabled rows at opacity 0.5 | matched | `a disabled node is dimmed, takes no focus and no press` |
| Label on one line with an ellipsis | matched | `text scale 2.0 in a 320 pixel parent…` |
| The status sits beside the label and moves under it when the row is too narrow | adapted | the Svelte status shrinks and wraps beside the label; a narrow Flutter row would grow very tall, so the status takes its own line |
| Text scale 2.0 in a 320 pixel parent without overflow | matched | `text scale 2.0 in a 320 pixel parent: nothing overflows…` (also checks the Collapse action, `labeledTapTargetGuideline` and `targetGuideline24`) |
| Text contrast | matched | `rows carry selected…` (`textContrastGuideline`) |
| Colours `text`, `text-secondary`, `danger-text`, `secondary`, `neutral-surface` | matched | the reference sets them in its stylesheet; same roles |
| Reduced motion: no chevron turn animation | matched | `the chevron turns a quarter while open, instantly under reduced motion` |
| Forced colours | adapted | Flutter has no forced-colours mode; the focus ring draws alone under high contrast |

## Out of scope

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Multi-selection | out of scope | open design question; the reference is single-select |
| The `labels` map | out of scope | labels are on the node (`TreeNode.label`) |
| The `labelContent` and `icon` snippets | out of scope | the label is text on the node, and `TreeNode.icon` is a widget |
| CSS custom properties (`--ds-tree-*`) | out of scope | Flutter themes through `InvisibleTheme` |
