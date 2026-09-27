---
"@design-system/react": patch
---

Fix several React adapter bugs found in review:

- Combobox, Multi Select and Dialog now report each change once, after the
  state is written. Under StrictMode the callbacks no longer fire twice, and
  typing into a closed combobox no longer warns that a component was updated
  while another one was rendering.
- Combobox shows the selected label when its items arrive after the value, or
  when that item's label changes.
- The Combobox chevron and the Dialog's default trigger take their text from
  the message catalog, so they follow the locale.
- The Combobox and Multi Select popups keep the width of their control while
  open, instead of measuring it only once.
- Multi Select closes its list when it becomes disabled or read-only, and
  cancels its pending focus move when it unmounts.
- Button warns about a missing accessible name once per button rather than on
  every render.
