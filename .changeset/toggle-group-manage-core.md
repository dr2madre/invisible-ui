---
"@design-system/core": minor
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

The toggle group's keyboard behaviour moves to the core as
`toggleGroup.manage(root, { orientation, selector })`, which returns its
teardown. It applies the shared rule to a group element in the page: one tab
stop with arrow keys and Home/End from three toggles, mirrored in
right-to-left text, nothing added inside a toolbar, and toggles that are
added, removed or disabled later followed, with focus handed to the toggle at
the removed one's place. It sets no style. Svelte, Vue, React and Elements
now call it in place of four copies of the same logic; what users see and
press does not change.
