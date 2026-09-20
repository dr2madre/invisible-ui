---
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
---

Four fixes to what a consumer sees.

Every Svelte control reports a change after its own state is written, not during. A handler reading the control's store saw the value from before the change, and a handler writing to it lost that write without a word; both are silent, and both are gone.

The Svelte Carousel follows a changed slide list. Five slides, moved to the fifth, then given three: no slide was active and Next was disabled, with no way back. The count and the loop now follow the props, and the current slide is clamped into the new count.

The Vue Number Field hears the reset of a form it names with the `form` attribute from outside it. The attribute reached only the hidden input that submits the value, so the field kept the edit while every other adapter put it back.

The React Combobox and Multi Select put their list inside the dialog they are in, as the other adapters do. A list in the page body shows through the dialog's layer and cannot be clicked.
