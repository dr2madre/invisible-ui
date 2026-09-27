---
"@design-system/svelte": patch
---

Each notifier now numbers its notification ids on its own, so two notifiers (one per server request, for example) no longer share a sequence. A new test also checks that the meter's band, colour and announced range follow its `min`, `max`, `low`, `high` and `optimum` props after mount.
