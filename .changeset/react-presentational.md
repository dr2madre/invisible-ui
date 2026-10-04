---
"@design-system/react": minor
"@design-system/elements": patch
"@design-system/svelte": patch
"@design-system/vue": patch
---

The React adapter now ships the presentational components: `Avatar`,
`AvatarGroup`, `Count`, `Tag`, `Kbd`, `Code`, `CodeBlock`, `Blockquote`,
`Skeleton`, `AspectRatio`, `ScrollArea`, `Progress`, `Meter`, `Link`,
`Label`, `Field` and `Card`, with the markup, classes and behaviour of the
other adapters. Labels come from the catalog: the "+N" chip of an avatar
group, the code block's names and its copy button, the tag's remove button.
CodeBlock copies through the same logic as Button's `copy` (ADR 0016). A
link that opens a new tab gets `rel="noopener noreferrer"`, also when the
target comes in as a plain attribute. An avatar colour that could add
declarations of its own is dropped. All seventeen render on the server and
hydrate without mismatches.

Five hooks render the same behaviour in markup of your own: `useProgress`,
`useMeter`, `useLabel`, `useField` and `useScrollArea`. In React, Label
names its control with `htmlFor`, and Field takes its control from a
function child that receives `controlProps` and `controlId`. MultiSelect now
renders its values with `Tag`, and SearchDialog its shortcuts with `Kbd`.

`styles.css` now includes the field, label, progress, skeleton, count, card,
avatar, avatar group, meter, link, blockquote, aspect ratio, code, code block
and scroll area sheets. They are the same files the Vue and custom element
packages ship, now held byte for byte to the React copies.
