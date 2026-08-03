/**
 * Side-effect entry point: registers every element under its `ds-*` tag.
 * Safe to import more than once (guards against re-definition).
 */
import { DsButton } from "./button/ds-button";
import { DsCheckbox } from "./checkbox/ds-checkbox";
import { DsCombobox } from "./combobox/ds-combobox";
import { DsDialog } from "./dialog/ds-dialog";
import { DsSelect } from "./select/ds-select";
import { DsSwitch } from "./switch/ds-switch";

const define = (tag: string, ctor: CustomElementConstructor) => {
  if (typeof customElements === "undefined") return;
  if (!customElements.get(tag)) customElements.define(tag, ctor);
};

define("ds-button", DsButton);
define("ds-checkbox", DsCheckbox);
define("ds-switch", DsSwitch);
define("ds-select", DsSelect);
define("ds-combobox", DsCombobox);
define("ds-dialog", DsDialog);

export {};
