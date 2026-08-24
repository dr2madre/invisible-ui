---
"@design-system/elements": patch
---

`<ds-combobox>` and `<ds-multi-select>` keep working when they are moved
in the page while their list is open. Being taken out and put back, which
is what a server-driven swap or a reordered list does, removed the
outside-press listener and stopped the repositioning without setting them
up again: the list stayed open with nothing able to close it. They are
set up again on reconnect.
