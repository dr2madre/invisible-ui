---
"@design-system/core": patch
"@design-system/svelte": patch
"@design-system/vue": patch
---

The public API report shows the declaration behind every namespace alias. The declaration bundle re-exports each machine's types as `type ns_Name = Name;`, and the report recorded that line, which says nothing about the type: a member added to or removed from a public interface left the report unchanged. The report now records what the alias points at, so such a change is a diff, and the gate fails on it. No package's API changes; the committed reports change once.
