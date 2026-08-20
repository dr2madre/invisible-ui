/**
 * Side-effect entry point: registers every element under its `ds-*` tag.
 * Safe to import more than once (guards against re-definition).
 */
import { DsButton } from "./button/ds-button";
import { DsCheckboxGroup } from "./checkbox-group/ds-checkbox-group";
import { DsCheckbox } from "./checkbox/ds-checkbox";
import { DsCombobox } from "./combobox/ds-combobox";
import { DsMultiSelect } from "./multi-select/ds-multi-select";
import { DsDialog } from "./dialog/ds-dialog";
import { DsField } from "./field/ds-field";
import { DsLabel } from "./label/ds-label";
import { DsRadioGroup } from "./radio-group/ds-radio-group";
import { DsSelect } from "./select/ds-select";
import { DsTextField, DsTextarea } from "./text-field/ds-text-field";
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
define("ds-multi-select", DsMultiSelect);
define("ds-dialog", DsDialog);
define("ds-label", DsLabel);
define("ds-field", DsField);
define("ds-text-field", DsTextField);
define("ds-textarea", DsTextarea);
define("ds-radio-group", DsRadioGroup);
define("ds-checkbox-group", DsCheckboxGroup);

export {};
