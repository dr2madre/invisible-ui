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
 * and the data & nav batch (Tabs, Accordion, Card, Table, Pagination,
 * Breadcrumb, Avatar, AvatarGroup) and the controls & inputs batch (Slider,
 * RatingGroup, SegmentedControl, ToggleButton, ToggleGroup, PinInput, Radio,
 * Meter, Toolbar, ButtonGroup, Link, Kbd, Separator) and the dates, times &
 * navigation surfaces batch (Calendar, DatePicker, DateRangePicker, TimeField,
 * Collapsible, HoverCard, ContextMenu, Menu, Menubar, NavigationMenu) and the
 * long tail that completes parity with the Svelte adapter (AspectRatio,
 * Blockquote, Code, CodeBlock, EmptyState, ErrorState, LoadingGenerationArea,
 * LoginForm, UploadDropArea, ScrollArea, Stepper, TreeView, Carousel,
 * SheetDialog, SearchDialog, TableSet) ported
 * from the Svelte adapter; see `docs/adapters-roadmap.md`. Styles are opt-in:
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
export { Tabs, type TabsItem, type TabsProps } from "./tabs/Tabs";
export { Accordion, type AccordionEntry, type AccordionProps } from "./accordion/Accordion";
export { Card, type CardProps } from "./card/Card";
export {
  Table,
  type SortDirection,
  type SortState,
  type TableColumnDef,
  type TableProps,
  type TableRow,
} from "./table/Table";
export { Pagination, type PaginationProps } from "./pagination/Pagination";
export { Breadcrumb, type BreadcrumbItem, type BreadcrumbProps } from "./breadcrumb/Breadcrumb";
export { Avatar, initialsOf, type AvatarProps } from "./avatar/Avatar";
export {
  AvatarGroup,
  type AvatarGroupItem,
  type AvatarGroupProps,
} from "./avatar-group/AvatarGroup";
export { Slider, type SliderProps } from "./slider/Slider";
export { RatingGroup, type RatingGroupProps } from "./rating-group/RatingGroup";
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
export { PinInput, type PinInputProps } from "./pin-input/PinInput";
export { Radio, type RadioProps } from "./radio/Radio";
export { Meter, type MeterProps } from "./meter/Meter";
export { Toolbar, type ToolbarOrientation, type ToolbarProps } from "./toolbar/Toolbar";
export {
  ButtonGroup,
  type ButtonGroupAlign,
  type ButtonGroupProps,
} from "./button-group/ButtonGroup";
export { Link, type LinkProps, type LinkVariant } from "./link/Link";
export { Kbd, type KbdProps } from "./kbd/Kbd";
export { Separator, type SeparatorOrientation, type SeparatorProps } from "./separator/Separator";
export {
  Calendar,
  type CalendarEvent,
  type CalendarMode,
  type CalendarProps,
} from "./calendar/Calendar";
export { DatePicker, type DatePickerProps, type DateStyle } from "./date-picker/DatePicker";
export { DateRangePicker, type DateRangePickerProps } from "./date-range-picker/DateRangePicker";
export { TimeField, type TimeFieldProps } from "./time-field/TimeField";
export { Collapsible, type CollapsibleProps } from "./collapsible/Collapsible";
export { HoverCard, type HoverCardProps } from "./hover-card/HoverCard";
export { ContextMenu, type ContextMenuProps } from "./context-menu/ContextMenu";
export { Menu, type MenuEntry, type MenuProps, type MenuSection } from "./menu/Menu";
export { Menubar, type MenubarProps } from "./menubar/Menubar";
export { NavigationMenu, type NavigationMenuProps } from "./navigation-menu/NavigationMenu";
export { AspectRatio, type AspectRatioProps } from "./aspect-ratio/AspectRatio";
export { Blockquote, type BlockquoteProps } from "./blockquote/Blockquote";
export { Code } from "./code/Code";
export { CodeBlock, type CodeBlockProps } from "./code-block/CodeBlock";
export { EmptyState, type EmptyStateAction, type EmptyStateProps } from "./empty-state/EmptyState";
export { ErrorState, type ErrorStateAction, type ErrorStateProps } from "./error-state/ErrorState";
export {
  LoadingGenerationArea,
  type LoadingGenerationAreaPosition,
  type LoadingGenerationAreaProps,
} from "./loading-generation-area/LoadingGenerationArea";
export {
  LoginForm,
  type LoginFormProps,
  type LoginFormProvider,
  type LoginFormValue,
} from "./login-form/LoginForm";
export { UploadDropArea, type UploadDropAreaProps } from "./upload-drop-area/UploadDropArea";
export { ScrollArea, type ScrollAreaProps } from "./scroll-area/ScrollArea";
export { Stepper, type StepDescriptor, type StepperProps } from "./stepper/Stepper";
export { TreeView, type TreeViewProps } from "./tree-view/TreeView";
export {
  Carousel,
  type CarouselProps,
  type CarouselSlide,
  type CarouselVariant,
} from "./carousel/Carousel";
export { SheetDialog, type SheetDialogProps } from "./sheet-dialog/SheetDialog";
export { SearchDialog, type SearchDialogProps } from "./search-dialog/SearchDialog";
export { TableSet, type TableSetProps, type TableViewDef } from "./table/TableSet";

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
export {
  useTabs,
  type ActivationMode,
  type TabItem,
  type UseTabs,
  type UseTabsOptions,
} from "./tabs/use-tabs";
export {
  useAccordion,
  type AccordionItem,
  type AccordionType,
  type UseAccordion,
  type UseAccordionOptions,
} from "./accordion/use-accordion";
export {
  usePagination,
  type PageItem,
  type UsePagination,
  type UsePaginationOptions,
} from "./pagination/use-pagination";
export {
  useSlider,
  type SliderApi,
  type SliderOrientation,
  type SliderState,
  type UseSliderOptions,
} from "./slider/use-slider";
export {
  useRatingGroup,
  type RatingItem,
  type UseRatingGroup,
  type UseRatingGroupOptions,
} from "./rating-group/use-rating-group";
export {
  useSegmentedControl,
  type SegmentItem,
  type UseSegmentedControlOptions,
} from "./segmented-control/use-segmented-control";
export {
  useToggleButton,
  type ToggleButtonApi,
  type ToggleButtonState,
  type UseToggleButtonOptions,
} from "./toggle-button/use-toggle-button";
export {
  usePinInput,
  type PinInputApi,
  type PinInputState,
  type PinInputType,
  type UsePinInput,
  type UsePinInputOptions,
} from "./pin-input/use-pin-input";
export {
  useMeter,
  type MeterApi,
  type MeterContext,
  type MeterState,
  type UseMeter,
} from "./meter/use-meter";
export {
  useButtonGroup,
  type ButtonGroupApi,
  type ButtonGroupOrientation,
  type ButtonGroupState,
  type UseButtonGroupOptions,
} from "./button-group/use-button-group";
export {
  useCalendar,
  type CalendarDay,
  type CalendarView,
  type UseCalendar,
  type UseCalendarOptions,
  type WeekStart,
} from "./calendar/use-calendar";
export {
  useTimeField,
  type HourCycle,
  type TimeParts,
  type TimeSegmentType,
  type UseTimeField,
  type UseTimeFieldOptions,
} from "./time-field/use-time-field";
export {
  useCollapsible,
  type UseCollapsible,
  type UseCollapsibleOptions,
} from "./collapsible/use-collapsible";
export {
  useHoverPreview,
  type UseHoverPreview,
  type UseHoverPreviewOptions,
} from "./popover/use-hover-preview";
export {
  useContextMenu,
  type UseContextMenu,
  type UseContextMenuOptions,
} from "./context-menu/use-context-menu";
export {
  useMenubar,
  type MenubarEntry,
  type MenubarMenu,
  type UseMenubar,
  type UseMenubarOptions,
} from "./menubar/use-menubar";
export {
  useNavigationMenu,
  type NavigationMenuItem,
  type NavigationMenuLink,
  type UseNavigationMenu,
  type UseNavigationMenuOptions,
} from "./navigation-menu/use-navigation-menu";
export { useDropArea, type UseDropArea, type UseDropAreaOptions } from "./drop-area/use-drop-area";
export {
  useScrollArea,
  type ScrollbarGeometry,
  type ScrollOrientation,
  type UseScrollArea,
} from "./scroll-area/use-scroll-area";
export {
  useStepper,
  type StepperApi,
  type StepperOrientation,
  type StepperState,
  type StepStatus,
  type UseStepperOptions,
} from "./stepper/use-stepper";
export {
  useTreeView,
  type TreeApi,
  type TreeNode,
  type TreeState,
  type UseTreeView,
  type UseTreeViewOptions,
  type VisibleNode,
} from "./tree-view/use-tree-view";
export {
  useCarousel,
  type CarouselApi,
  type CarouselOrientation,
  type CarouselState,
  type UseCarouselOptions,
} from "./carousel/use-carousel";
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
export {
  useTable,
  type RowId,
  type SelectionMode,
  type TableApi,
  type UseTable,
  type UseTableOptions,
} from "./table/use-table";
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
