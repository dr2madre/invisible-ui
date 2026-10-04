# Combobox parity checklist

Reference commit: `e47db9b6717964787e0d689629f1beb73f18612d`

Reference paths: `core/src/combobox` `core/src/internal/collection.ts` `packages/svelte/src/lib/combobox`

The Flutter `Combobox` checked against the Svelte `Combobox`
(`packages/svelte/src/lib/combobox/Combobox.svelte` and
`create-combobox.ts`) and the headless combobox in `core/src/combobox`,
which follow the
[WAI-ARIA editable combobox with list autocomplete](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/).
Docs page: [Combobox](https://dr2madre.github.io/invisible-ui/components/forms/combobox/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/combobox_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `Combobox(value:, onChanged:)` | `value` with `onValueChange` | controlled `value`, change callback; null when cleared |
| `Combobox.uncontrolled(initialValue:)` | `value` unbound | `defaultValue` |
| `onInputChanged` | `onInputValueChange` | the text after a user change |
| `filter` | `filter` (create-combobox) | which options the text lets through; defaults to the web's contains filter |
| `searchable`, `placeholder`, `emptyText`, `clearLabel`, `hideLabel` | the same names | defaults from the catalog keys `combobox.placeholder`, `combobox.empty`, `combobox.clear` |
| `loading` | none | adapted: an async list says it is loading (catalog key `loading.label`) in place of the empty text |
| `items: [ChoiceItem(value:, label:, icon:)]` | `items: [{ value, label?, icon? }]` | the options; the icon is a widget |
| `enabled: false` | `disabled` | `disabled` |
| `description`, `error`, `required`, `validator`, `onSaved` | none | the field parts every Flutter value control carries |
| `width` | `width` | adapted: the field takes its parent's width, or 18rem when open |
| `name` | `name` | out of scope: Flutter forms submit no strings |

## Typing and choosing

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Typing opens, filters (contains, ignoring case and outer spaces), highlights the first enabled match | matched | `typing opens, filters by contains, ignoring case, and highlights the first enabled match`; the filter is also held by `choice_vectors_test.dart` |
| Enter chooses the highlighted option, fills the text, closes, then reports | matched | `Enter chooses the highlighted option, closes, fills the text, then reports` |
| No match shows the empty text | matched | `no match says so; loading says so instead` |
| Options that load as the user types | adapted | the app listens to `onInputChanged` and passes new items with a filter that keeps them all: `options loaded as the user types replace the list` |
| The highlighted option survives an item change only while it is still shown | matched | `_ComboboxState.didUpdateWidget`, as `setItems` does |

## Keyboard

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Down and Up open on the chosen option, else the first enabled; move past disabled options and wrap | matched | `Down opens on the chosen option, moves past a disabled one and wraps; Up moves back`; steps answer the shared vectors |
| The list shows what the text lets through, also on opening | matched | same test |
| Escape closes and puts the chosen text back (`commit`) | matched | `Escape closes and puts the chosen text back; with nothing to undo it is left to the dialog` |
| Escape with nothing to undo reaches the dialog | matched | same test (ADR 0017: consumed only when it undid something) |
| Leaving settles: the list closes and the text goes back | matched | `leaving puts the text back; Tab closes the list` |
| Home and End stay with the text caret | matched | the key handler leaves them to the text |
| `aria-activedescendant` for the highlighted option | adapted | focus stays in the field as on the web; each newly highlighted option is announced politely: `the highlighted option is announced` |

## Pointer, chevron and clear

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A press on the closed text opens on the chosen option | matched | `a tap on the text opens; an option tap chooses` |
| The chevron opens the full list, closes it, keeps focus in the field; named Show or Close options | matched | `the chevron opens the full list and closes it, keeping focus in the field` |
| A press outside closes and puts the text back | matched | `a press outside closes and puts the text back` |
| The clear button: there and in the tab order only with something to clear; empties text and choice; reports null; keeps its place | matched | `the clear button shows only with something to clear, empties text and choice, and reports null` |
| Clearing from the keyboard returns focus to the field | matched | `from the keyboard the clear button is a tab stop and focus returns to the field` |

## Select-only, states and semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `searchable: false`: read-only text, every option, the chosen option's icon leads | matched | `not searchable: read-only text, every option, the chosen icon leads` |
| Disabled: no list, no clear | matched | `disabled: no list, no clear, reported disabled` |
| `role="combobox"` with `aria-expanded` | adapted | `SemanticsRole.comboBox` fails Flutter's debug role check; a text field node named by the label with the expanded state: `semantics: a text field named by the label, expanded while open, with its hints; options selected` |
| `role="listbox"`, options with `aria-selected` | adapted | a list node with list items carrying the selected state: same test |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the default value and its text together (`resetValue`), reports nothing | matched | `a reset restores the default value and its text without a report` |
| A controlled value shows its label, is never reported and becomes the reset default | matched | `a controlled value is shown with its label, never reported, and becomes the reset default` |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Text scale 2.0, right to left, narrow column; the buttons at the inline-end, 44 by 44 under touch | matched | `text scale 2.0 right to left in a narrow column does not overflow; buttons keep 44 by 44 under touch` |
