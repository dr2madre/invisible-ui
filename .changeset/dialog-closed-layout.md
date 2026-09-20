---
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

Keep native dialog panels out of the rendered page until they are open. The
dialog grid layout now applies only after `showModal()` sets the native `open`
attribute, so an Elements dialog no longer appears behind controls that follow
it and framework dialogs cannot flash in document flow before entering the top
layer.
