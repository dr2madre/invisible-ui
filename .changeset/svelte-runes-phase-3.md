---
"@design-system/svelte": minor
---

Breaking: named slots are now snippet props, and forwarded events are now callback props. The last 34 components moved to the runes syntax: AlertDialog, Blockquote, Button, Calendar, Card, Carousel, Collapsible, Combobox, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, InlineNotification, Link, LoadingGenerationArea, LoginForm, Notification, Popover, PromptDialog, RangeSlider, SearchDialog, SearchField, SheetDialog, Sidebar, Slider, Table, TableSet, TableView, Tabs, Tag, TextField, TreeView and UploadDropArea. Every component of the package now runs in runes mode. Behaviour, props and callbacks are unchanged; only the way content and events are passed changes (ADR 0015).

A snippet keeps the name of the slot it replaces, and slot props become one object parameter with the same names.

| Before | After |
| --- | --- |
| `<span slot="trigger">Open</span>` | `{#snippet trigger()}<span>Open</span>{/snippet}` |
| `<svelte:fragment slot="footer">…</svelte:fragment>` | `{#snippet footer()}…{/snippet}` |
| `<Icon slot="left">…</Icon>` (Button, TextField) | `{#snippet left()}<Icon>…</Icon>{/snippet}` |
| Table, TableSet `slot="cell" let:row let:column let:value let:rowIndex` | `{#snippet cell({ row, column, value, rowIndex })}` |
| Table `slot="selectionCell" let:row let:rowId let:rowIndex` | `{#snippet selectionCell({ row, rowId, rowIndex })}` |
| Tabs `slot="panel" let:item` | `{#snippet panel({ item })}` |
| Calendar `slot="day" let:date let:selected …` | `{#snippet day({ date, inMonth, selected, events, price })}` |
| TreeView `slot="icon" let:node` | `{#snippet icon({ node })}` |
| Field `let:controlProps let:controlId` | `{#snippet children({ controlProps, controlId })}` |
| Carousel `let:item let:index let:active` | `{#snippet children({ item, index, active })}` |
| `<Link on:click={track}>` | `<Link onclick={track}>` |
| InlineNotification `on:mouseenter`, `on:mouseleave`, `on:focusin`, `on:focusout` | `onmouseenter`, `onmouseleave`, `onfocusin`, `onfocusout` |

Three slots take a new name, because a snippet prop shares one namespace with the other props and must be an identifier:

| Before | After |
| --- | --- |
| Popover `slot="trigger"` (the `trigger` prop is the opening mode) | `{#snippet triggerContent()}` |
| TreeView `slot="label" let:node` (the `label` prop names the tree) | `{#snippet labelContent({ node })}` |
| LoginForm `slot="provider-icon" let:provider` | `{#snippet providerIcon({ provider })}` |

Where a slot and a prop filled the same place, they are one prop that takes either form, and the snippet keeps the name: `Card.title`, `Card.description` and `Blockquote.cite` take a string or a snippet; `actions` on EmptyState, ErrorState and InlineNotification takes the action list or a snippet that replaces the area.

`bind:` keeps working, through `$bindable()`, on each controllable prop: `open` on the dialogs, Popover and Collapsible, and `value` on Tabs, TextField, SearchField, Slider, RangeSlider, Combobox and Calendar, among others. Binding a variable that holds `undefined` to one of these props now throws; give the variable an initial value.
