---
"@design-system/svelte": patch
---

The loading indicator's no-flash timer goes when the indicator goes. A
component taken away before its delay elapsed left the timer running,
so it kept a closure alive and fired into a component the page no longer
had. The cleanup sits inside the browser branch: a server render has no
teardown to hook.
