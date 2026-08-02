/**
 * `@design-system/vue`: the Vue 3 adapter over `@design-system/core`.
 *
 * A proof-of-concept set (Button, Checkbox, Switch, Select) proving the
 * framework-agnostic core drives another framework natively; see
 * `docs/adapters-roadmap.md`. Styles are opt-in:
 *
 *   import "@design-system/vue/styles.css";
 */

// The Vue seam over the core's prop bags.
export { normalizeProps } from "./normalize";

// Components
export { Button, type ButtonProps } from "./button/Button";
export { Checkbox, type CheckboxProps } from "./checkbox/Checkbox";
export { Switch, type SwitchProps } from "./switch/Switch";
export { Select, type SelectItem, type SelectProps } from "./select/Select";
export { Icon, type IconProps } from "./icon/Icon";

// Composables: the headless layer, for consumers rendering their own markup.
export { useButton, type ButtonVariant, type UseButtonOptions } from "./button/use-button";
export { useCheckbox, type CheckedState, type UseCheckboxOptions } from "./checkbox/use-checkbox";
export { useSwitch, type UseSwitchOptions } from "./switch/use-switch";
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
