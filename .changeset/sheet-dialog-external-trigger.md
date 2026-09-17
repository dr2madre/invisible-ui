---
"@design-system/svelte": minor
"@design-system/vue": minor
---

`SheetDialog` can leave its trigger to the page.

`renderTrigger={false}` renders no button of its own, so an application whose hamburger belongs in its header can drive `open` directly; `returnFocusTo` names the element focus goes back to when the panel closes. Without that name focus returns to whatever held it when the panel opened, which is right when a button opened it and wrong when anything else did.

The default is unchanged: every dialog still renders its own trigger and still returns focus to it. This is the one variant that can be driven entirely from outside, because a navigation drawer's button lives outside the navigation (ADR 0013).
