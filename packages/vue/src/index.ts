/**
 * `@design-system/vue`: the Vue 3 adapter over `@design-system/core`.
 *
 * The shared component set (Button, Checkbox, Switch, Select, Combobox,
 * Dialog) proving the framework-agnostic core drives another framework
 * natively, plus the forms batch (TextField, Textarea, RadioGroup,
 * CheckboxGroup, Field, Label), the overlays & menus batch (Popover,
 * Tooltip, DropdownMenu, AlertDialog, ConfirmDialog, PromptDialog) and the
 * feedback batch (Notification + NotificationRegion + createNotifier,
 * InlineNotification, FeedbackIcon, Progress, Loading, Skeleton, Tag, Count)
 * ported from the Svelte adapter; see `docs/adapters-roadmap.md`. Styles are
 * opt-in:
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
export { Combobox, type ComboboxOption, type ComboboxProps } from "./combobox/Combobox";
export { Dialog, type DialogProps } from "./dialog/Dialog";
export { TextField, type TextFieldProps } from "./text-field/TextField";
export { Textarea, type TextareaProps } from "./textarea/Textarea";
export { RadioGroup, type RadioGroupItem, type RadioGroupProps } from "./radio-group/RadioGroup";
export { CheckboxGroup, type CheckboxGroupProps } from "./checkbox-group/CheckboxGroup";
export { Field, type FieldProps } from "./field/Field";
export { Label, type LabelProps } from "./label/Label";
export { Icon, type IconProps } from "./icon/Icon";
export { Popover, type PopoverProps } from "./popover/Popover";
export { Tooltip, type TooltipProps } from "./tooltip/Tooltip";
export { DropdownMenu, type DropdownMenuProps } from "./dropdown-menu/DropdownMenu";
export { AlertDialog, type AlertDialogProps } from "./alert-dialog/AlertDialog";
export { ConfirmDialog, type ConfirmDialogProps } from "./confirm-dialog/ConfirmDialog";
export { PromptDialog, type PromptDialogProps } from "./prompt-dialog/PromptDialog";
export {
  FeedbackIcon,
  type FeedbackIconProps,
  type FeedbackStatus,
} from "./feedback-icon/FeedbackIcon";
export {
  InlineNotification,
  type InlineNotificationAction,
  type InlineNotificationProps,
} from "./inline-notification/InlineNotification";
export { Notification, type NotificationProps } from "./notification/Notification";
export {
  NotificationRegion,
  type NotificationPlacement,
  type NotificationRegionProps,
} from "./notification/NotificationRegion";
export { createNotifier } from "./notification/create-notifier";
export type {
  Notifier,
  NotificationAction,
  NotificationDismissReason,
  NotificationItem,
  NotificationOptions,
  NotificationPromiseMessages,
  NotificationStatus,
  StatusOptions,
} from "./notification/create-notifier";
export { Progress, type ProgressProps } from "./progress/Progress";
export { Loading, type LoadingProps, type LoadingVariant } from "./loading/Loading";
export { Skeleton, type SkeletonProps } from "./skeleton/Skeleton";
export { Tag, type TagProps, type TagStatus } from "./tag/Tag";
export { Count, type CountProps, type CountStatus } from "./count/Count";

// Composables: the headless layer, for consumers rendering their own markup.
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
export { useTextField, type UseTextFieldOptions } from "./text-field/use-text-field";
export {
  useRadioGroup,
  type RadioGroupOrientation,
  type RadioItem,
  type UseRadioGroupOptions,
} from "./radio-group/use-radio-group";
export {
  useCheckboxGroup,
  type CheckboxGroupItem,
  type UseCheckboxGroupOptions,
} from "./checkbox-group/use-checkbox-group";
export { useField, type UseFieldOptions } from "./field/use-field";
export { useLabel, type UseLabelOptions } from "./label/use-label";
export { usePopover, type UsePopover, type UsePopoverOptions } from "./popover/use-popover";
export { useTooltip, type UseTooltip, type UseTooltipOptions } from "./tooltip/use-tooltip";
export {
  useDropdownMenu,
  type MenuItem,
  type UseDropdownMenu,
  type UseDropdownMenuOptions,
} from "./dropdown-menu/use-dropdown-menu";
export {
  useProgress,
  type ProgressApi,
  type ProgressContext,
  type ProgressState,
  type UseProgress,
} from "./progress/use-progress";
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
