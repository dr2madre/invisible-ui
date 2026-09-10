---
"@design-system/svelte": patch
"@design-system/vue": patch
---

A dropped file joins the form the way a picked one does. It only reached
the onFiles callback before, so the form never submitted it and a reset
had nothing to clear; it now becomes the input's file list, verified
against a native input's own behaviour in three engines. A single file
input keeps the first file of a multi-file drop, because that is all it
could ever hold.
