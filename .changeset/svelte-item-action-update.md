---
"@design-system/svelte": patch
---

Item actions such as `tabAction`, `optionAction`, `itemAction` and
`pageAction` now follow a parameter that changes on the same element. Before,
the element kept the attributes and handlers of the item it was first given.
The navigation menu's trigger and content actions, and the scroll area's thumb
action, follow a changed parameter too.
