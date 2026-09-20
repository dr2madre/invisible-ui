---
"@design-system/core": patch
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
---

Six fixes to what a consumer sees.

Every callback a Svelte factory reports is now reported after that factory's own state is written, not during. A handler reading the control's store saw the value from before the change, and a handler writing to it lost that write without a word; both were silent, and both are gone. "Every" is a check rather than a claim: a test reads the factory sources and lists every callback it can find them reporting, whether they call it, hand it to core, pull it out of the options or reach it through a string, and fails until each one is either asserted or named with the reason it cannot be.

A menu says which item was chosen after it has closed, in every adapter, because core decides that order. A handler that read the menu saw it still open, and one that reopened it was closed again straight afterwards. The notification list empties before it tells each notification it is gone, so a handler that shows a replacement keeps it.

The Pin Input announces a completion only for a value its state still holds. A page that cleared the field from its own change handler was told the pin was complete, with the cleared cells already in the state. Svelte and Vue answer the same way.

The Svelte Carousel follows a changed slide list. Five slides, moved to the fifth, then given three: no slide was active and Next was disabled, with no way back. The count, the loop and the orientation now follow the props, and the current slide is clamped into the new count without reporting a change, because the page did not choose it.

Both styled Carousels tell core which way they run, so a vertical carousel moves with Up and Down instead of Left and Right.

The Vue Number Field hears the reset of a form it names with the `form` attribute from outside it. The attribute reached only the hidden input that submits the value, so the field kept the edit while every other adapter put it back.

The React Combobox and Multi Select put their list inside the dialog they are in, as the other adapters do. A list in the page body shows through the dialog's layer and cannot be clicked.
