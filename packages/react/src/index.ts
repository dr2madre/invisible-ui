/**
 * `@design-system/react` — the React adapter over `@design-system/core`.
 *
 * Components and hooks driven by the framework-agnostic core; see
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
export { TextField, type TextFieldProps } from "./text-field/TextField";
export { SearchField, type SearchFieldProps } from "./search-field/SearchField";
export { Combobox, type ComboboxOption, type ComboboxProps } from "./combobox/Combobox";
export { MultiSelect, type MultiSelectProps } from "./multi-select/MultiSelect";
export {
  useMultiSelect,
  type MultiSelectItem,
  type UseMultiSelect,
  type UseMultiSelectOptions,
} from "./multi-select/use-multi-select";
export { Dialog, type DialogHandle, type DialogProps } from "./dialog/Dialog";
export { AlertDialog, type AlertDialogProps } from "./alert-dialog/AlertDialog";
export { ConfirmDialog, type ConfirmDialogProps } from "./confirm-dialog/ConfirmDialog";
export { PromptDialog, type PromptDialogProps } from "./prompt-dialog/PromptDialog";
export { SheetDialog, type SheetDialogProps } from "./sheet-dialog/SheetDialog";
export { SearchDialog, type SearchDialogProps } from "./search-dialog/SearchDialog";
export type {
  DialogNotice,
  DialogNoticeAction,
  DialogNoticeOptions,
  DialogNoticeStatus,
  DialogNotices,
} from "./dialog/use-dialog-notices";
export { Popover, type PopoverProps } from "./popover/Popover";
export { Tooltip, type TooltipProps } from "./tooltip/Tooltip";
export {
  DropdownMenu,
  type DropdownMenuProps,
  type MenuEntry,
  type MenuGroup,
  type MenuItem,
  type MenuSeparator,
  type MenuSubmenu,
} from "./dropdown-menu/DropdownMenu";
export { ContextMenu, type ContextMenuProps } from "./context-menu/ContextMenu";
export { Menubar, type MenubarMenu, type MenubarProps } from "./menubar/Menubar";
export {
  NavigationMenu,
  type NavigationMenuItem,
  type NavigationMenuLink,
  type NavigationMenuProps,
} from "./navigation-menu/NavigationMenu";
export { Radio, type RadioProps } from "./radio/Radio";
export { RadioGroup, type RadioGroupItem, type RadioGroupProps } from "./radio-group/RadioGroup";
export { CheckboxGroup, type CheckboxGroupProps } from "./checkbox-group/CheckboxGroup";
export {
  SegmentedControl,
  type SegmentedControlItem,
  type SegmentedControlOrientation,
  type SegmentedControlProps,
} from "./segmented-control/SegmentedControl";
export { ToggleButton, type ToggleButtonProps } from "./toggle-button/ToggleButton";
export {
  ToggleGroup,
  type ToggleGroupOrientation,
  type ToggleGroupProps,
  type ToggleGroupVariant,
} from "./toggle-group/ToggleGroup";
export { Slider, type SliderProps } from "./slider/Slider";
export { RangeSlider, type RangeSliderProps } from "./range-slider/RangeSlider";
export { NumberField, type NumberFieldProps } from "./number-field/NumberField";
export { PinInput, type PinInputProps } from "./pin-input/PinInput";
export { RatingGroup, type RatingGroupProps } from "./rating-group/RatingGroup";
export {
  Calendar,
  type CalendarDayContext,
  type CalendarEvent,
  type CalendarProps,
} from "./calendar/Calendar";
export { DatePicker, type DatePickerProps, type DateStyle } from "./date-picker/DatePicker";
export { DateRangePicker, type DateRangePickerProps } from "./date-range-picker/DateRangePicker";
export { TimeField, type TimeFieldProps } from "./time-field/TimeField";
export { Icon, type IconProps } from "./icon/Icon";

// Hooks — the headless layer, for consumers rendering their own markup.
export { useButton, type ButtonVariant, type UseButtonOptions } from "./button/use-button";
export { useCheckbox, type CheckedState, type UseCheckboxOptions } from "./checkbox/use-checkbox";
export { useSwitch, type UseSwitchOptions } from "./switch/use-switch";
export { useTextField, type UseTextFieldOptions } from "./text-field/use-text-field";
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
export {
  useSheetDialog,
  type SheetDialogSide,
  type UseSheetDialog,
  type UseSheetDialogOptions,
} from "./sheet-dialog/use-sheet-dialog";
export {
  useSearchDialog,
  type SearchDialogItem,
  type UseSearchDialog,
  type UseSearchDialogOptions,
} from "./search-dialog/use-search-dialog";
export { usePopover, type UsePopover, type UsePopoverOptions } from "./popover/use-popover";
export {
  useHoverPreview,
  type UseHoverPreview,
  type UseHoverPreviewOptions,
} from "./popover/use-hover-preview";
export { useTooltip, type UseTooltip, type UseTooltipOptions } from "./tooltip/use-tooltip";
export {
  useNavigationMenu,
  type UseNavigationMenu,
  type UseNavigationMenuOptions,
} from "./navigation-menu/use-navigation-menu";
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
export { useToggleButton, type UseToggleButtonOptions } from "./toggle-button/use-toggle-button";
export { useSlider, type SliderOrientation, type UseSliderOptions } from "./slider/use-slider";
export {
  useRangeSlider,
  type RangeSliderOrientation,
  type RangeValue,
  type UseRangeSliderOptions,
} from "./range-slider/use-range-slider";
export {
  useNumberField,
  type NumberFieldError,
  type UseNumberFieldOptions,
} from "./number-field/use-number-field";
export { usePinInput, type PinInputType, type UsePinInputOptions } from "./pin-input/use-pin-input";
export {
  useRatingGroup,
  type RatingItem,
  type UseRatingGroup,
  type UseRatingGroupOptions,
} from "./rating-group/use-rating-group";
export {
  useCalendar,
  type CalendarDay,
  type CalendarMode,
  type CalendarView,
  type UseCalendar,
  type UseCalendarOptions,
  type WeekStart,
} from "./calendar/use-calendar";
export {
  useTimeField,
  type HourCycle,
  type TimeSegmentType,
  type TimeValueError,
  type UseTimeField,
  type UseTimeFieldOptions,
} from "./time-field/use-time-field";
export type { Placement } from "./internal/floating";
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
