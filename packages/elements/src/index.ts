/**
 * `@design-system/elements` — the Web Components adapter over
 * `@design-system/core`.
 *
 * Framework-free custom elements (light DOM, ADR 0008) for contexts without a
 * framework: plain HTML pages, server-driven stacks (HTMX and friends) and
 * legacy portals. Framework users should prefer their native adapter
 * (`@design-system/svelte`, `@design-system/react`).
 *
 * Two ways in:
 *
 * ```js
 * // Side-effect import: registers every <ds-*> tag.
 * import "@design-system/elements/define";
 *
 * // Or register selectively:
 * import { DsButton } from "@design-system/elements";
 * customElements.define("ds-button", DsButton);
 * ```
 *
 * Styles are opt-in: `@design-system/elements/styles.css`.
 */

export { DsButton } from "./button/ds-button";
export { DsCheckbox } from "./checkbox/ds-checkbox";
export { DsSwitch } from "./switch/ds-switch";
export { DsSelect, type SelectItem } from "./select/ds-select";
export { DsCombobox, type ComboboxItem } from "./combobox/ds-combobox";
export { DsDialog } from "./dialog/ds-dialog";
export { DsLabel } from "./label/ds-label";
export { DsField } from "./field/ds-field";
export { DsTextField, DsTextarea } from "./text-field/ds-text-field";
export { DsRadioGroup, type RadioGroupItem } from "./radio-group/ds-radio-group";
export { DsCheckboxGroup } from "./checkbox-group/ds-checkbox-group";
export { applyProps, applyDomProps, emit } from "./internal/base";
