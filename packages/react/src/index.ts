/**
 * `@design-system/react` — the React adapter over `@design-system/core`.
 *
 * A proof-of-concept set (Button, Checkbox, Switch, Select, Combobox, Dialog)
 * proving the framework-agnostic core drives a second framework; see
 * `docs/adapters-roadmap.md`. Styles are opt-in:
 *
 *   import "@design-system/react/styles.css";
 */

// The React seam over the core's prop bags.
export { normalizeProps } from "./normalize";

// Components
export { Button, type ButtonProps } from "./button/Button";
export { Checkbox, type CheckboxProps } from "./checkbox/Checkbox";
export { Switch, type SwitchProps } from "./switch/Switch";
export { Select, type SelectItem, type SelectProps } from "./select/Select";
export { Combobox, type ComboboxOption, type ComboboxProps } from "./combobox/Combobox";
export { Dialog, type DialogProps } from "./dialog/Dialog";
export { Icon, type IconProps } from "./icon/Icon";

// Hooks — the headless layer, for consumers rendering their own markup.
export { useButton, type ButtonVariant, type UseButtonOptions } from "./button/use-button";
export { useCheckbox, type CheckedState, type UseCheckboxOptions } from "./checkbox/use-checkbox";
export { useSwitch, type UseSwitchOptions } from "./switch/use-switch";
export {
  useCombobox,
  type ComboboxItem,
  type UseCombobox,
  type UseComboboxOptions,
} from "./combobox/use-combobox";
export {
  useDialog,
  type DialogRole,
  type UseDialog,
  type UseDialogOptions,
} from "./dialog/use-dialog";
export { useDomProps } from "./use-dom-props";

// Localization
export {
  LocaleProvider,
  useI18n,
  type Dir,
  type I18nValue,
  type LocaleProviderProps,
  type TranslateFn,
} from "./i18n/i18n";
export { en, type MessageKey, type Messages } from "./i18n/messages";
