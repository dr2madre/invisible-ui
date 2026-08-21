---
"@design-system/svelte": patch
---

The prop manifests no longer corrupt multi-line declarations. The generator
cut every `export let` at its first newline, so a function type, a long
union or a multi-line default shipped truncated: LoginForm's `onSubmit` was
published as required with a broken type, NotificationRegion's `placement`
as `unknown` and required instead of a six-value union defaulting to
`"top-end"`, and Calendar's `onRangeChange` with an empty-string default.
The declaration body now runs to the statement's own semicolon. Types,
defaults and required flags of five components' manifests are corrected; no
runtime behaviour changes.
