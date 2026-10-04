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
export { Tabs, type TabsItem, type TabsProps } from "./tabs/Tabs";
export {
  Accordion,
  type AccordionEntry,
  type AccordionHeadingLevel,
  type AccordionProps,
} from "./accordion/Accordion";
export { Collapsible, type CollapsibleProps } from "./collapsible/Collapsible";
export { Breadcrumb, type BreadcrumbItem, type BreadcrumbProps } from "./breadcrumb/Breadcrumb";
export { Pagination, type PaginationProps } from "./pagination/Pagination";
export { Stepper, type StepDescriptor, type StepperProps } from "./stepper/Stepper";
export {
  Sidebar,
  type SidebarItem,
  type SidebarProps,
  type SidebarSection,
} from "./sidebar/Sidebar";
export { TreeView, type TreeViewProps } from "./tree-view/TreeView";
export {
  ButtonGroup,
  type ButtonGroupAlign,
  type ButtonGroupOrientation,
  type ButtonGroupProps,
} from "./button-group/ButtonGroup";
export { Separator, type SeparatorProps } from "./separator/Separator";
export { Avatar, initialsOf, type AvatarProps } from "./avatar/Avatar";
export {
  AvatarGroup,
  type AvatarGroupItem,
  type AvatarGroupProps,
} from "./avatar-group/AvatarGroup";
export { Count, type CountProps, type CountStatus } from "./count/Count";
export { Tag, type TagProps, type TagStatus } from "./tag/Tag";
export { Kbd, type KbdProps } from "./kbd/Kbd";
export { Code, type CodeProps } from "./code/Code";
export { CodeBlock, type CodeBlockProps } from "./code-block/CodeBlock";
export { Blockquote, type BlockquoteProps } from "./blockquote/Blockquote";
export { Skeleton, type SkeletonProps } from "./skeleton/Skeleton";
export { AspectRatio, type AspectRatioProps } from "./aspect-ratio/AspectRatio";
export { ScrollArea, type ScrollAreaProps } from "./scroll-area/ScrollArea";
export { Progress, type ProgressProps } from "./progress/Progress";
export { Meter, type MeterProps } from "./meter/Meter";
export { Link, type LinkProps, type LinkVariant } from "./link/Link";
export { Label, type LabelProps } from "./label/Label";
export { Field, type FieldControl, type FieldProps } from "./field/Field";
export { Card, type CardProps } from "./card/Card";
export {
  FeedbackIcon,
  type FeedbackIconProps,
  type FeedbackStatus,
} from "./feedback-icon/FeedbackIcon";
export { Loading, type LoadingProps, type LoadingVariant } from "./loading/Loading";
export {
  LoadingGenerationArea,
  type LoadingGenerationAreaPosition,
  type LoadingGenerationAreaProps,
} from "./loading-generation-area/LoadingGenerationArea";
export { EmptyState, type EmptyStateAction, type EmptyStateProps } from "./empty-state/EmptyState";
export { ErrorState, type ErrorStateAction, type ErrorStateProps } from "./error-state/ErrorState";
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
export {
  createNotifier,
  type NotificationAction,
  type NotificationDismissReason,
  type NotificationItem,
  type NotificationOptions,
  type NotificationPromiseMessages,
  type NotificationStatus,
  type Notifier,
  type StatusOptions,
} from "./notification/create-notifier";
export { Textarea, type TextareaProps } from "./text-field/Textarea";
export {
  Table,
  type TableCellContext,
  type TableColumnDef,
  type TableProps,
  type TableRow,
  type TableSelectionCellContext,
} from "./table/Table";
export { TableSet, type TableSetProps, type TableViewDef } from "./table/TableSet";
export { Toolbar, type ToolbarOrientation, type ToolbarProps } from "./toolbar/Toolbar";
export {
  Carousel,
  type CarouselItemContext,
  type CarouselProps,
  type CarouselSlide,
  type CarouselVariant,
} from "./carousel/Carousel";
export {
  LoginForm,
  type LoginFormProps,
  type LoginFormProvider,
  type LoginFormValue,
} from "./login-form/LoginForm";
export { UploadDropArea, type UploadDropAreaProps } from "./upload-drop-area/UploadDropArea";
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
export {
  useTabs,
  type ActivationMode,
  type TabItem,
  type TabsOrientation,
  type UseTabs,
  type UseTabsOptions,
} from "./tabs/use-tabs";
export {
  useAccordion,
  type AccordionItem,
  type AccordionType,
  type UseAccordionOptions,
} from "./accordion/use-accordion";
export { useCollapsible, type UseCollapsibleOptions } from "./collapsible/use-collapsible";
export {
  usePagination,
  type PageItem,
  type UsePaginationOptions,
} from "./pagination/use-pagination";
export {
  useStepper,
  type StepStatus,
  type StepperOrientation,
  type UseStepperOptions,
} from "./stepper/use-stepper";
export {
  useTreeView,
  type TreeLoadRequest,
  type TreeNode,
  type UseTreeView,
  type UseTreeViewOptions,
  type VisibleTreeNode,
} from "./tree-view/use-tree-view";
export { useProgress, type UseProgressOptions } from "./progress/use-progress";
export { useMeter, type UseMeterOptions } from "./meter/use-meter";
export { useLabel, type UseLabelOptions } from "./label/use-label";
export { useField, type UseFieldOptions } from "./field/use-field";
export {
  useScrollArea,
  type ScrollAxis,
  type ScrollbarGeometry,
  type ScrollOrientation,
  type UseScrollArea,
} from "./scroll-area/use-scroll-area";
export {
  useTable,
  type RowId,
  type SelectionMode,
  type SortDirection,
  type SortState,
  type TableApi,
  type UseTable,
  type UseTableOptions,
} from "./table/use-table";
export {
  useCarousel,
  type CarouselApi,
  type CarouselOrientation,
  type CarouselState,
  type UseCarouselOptions,
} from "./carousel/use-carousel";
export { useDropArea, type UseDropArea, type UseDropAreaOptions } from "./drop-area/use-drop-area";
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
