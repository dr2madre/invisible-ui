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
export { DsMultiSelect, type MultiSelectItem } from "./multi-select/ds-multi-select";
export { DsDialog } from "./dialog/ds-dialog";
export { DsAlertDialog } from "./alert-dialog/ds-alert-dialog";
export { DsConfirmDialog } from "./confirm-dialog/ds-confirm-dialog";
export { DsPromptDialog } from "./prompt-dialog/ds-prompt-dialog";
export { DsSearchDialog, type SearchDialogItem } from "./search-dialog/ds-search-dialog";
export { DsEmptyState } from "./empty-state/ds-empty-state";
export { DsErrorState } from "./error-state/ds-error-state";
export { DsInlineNotification } from "./inline-notification/ds-inline-notification";
export { DsLoading, type LoadingVariant } from "./loading/ds-loading";
export {
  DsLoadingGenerationArea,
  type LoadingGenerationAreaPosition,
} from "./loading-generation-area/ds-loading-generation-area";
export { DsLabel } from "./label/ds-label";
export { DsField } from "./field/ds-field";
export { DsTextField, DsTextarea } from "./text-field/ds-text-field";
export { DsSearchField } from "./search-field/ds-search-field";
export { DsSheetDialog, type SheetDialogSide } from "./sheet-dialog/ds-sheet-dialog";
export {
  DsTable,
  type SortDirection,
  type TableCellContent,
  type TableCellContext,
  type TableColumnDef,
  type TableRow,
  type TableSelectionCellContext,
  type TableSortState,
} from "./table/ds-table";
export { DsRadioGroup, type RadioGroupItem } from "./radio-group/ds-radio-group";
export { DsCheckboxGroup } from "./checkbox-group/ds-checkbox-group";
export { DsCount, type CountStatus } from "./count/ds-count";
export { DsCard } from "./card/ds-card";
export { DsPagination } from "./pagination/ds-pagination";
export { DsSeparator, type SeparatorOrientation } from "./separator/ds-separator";
export { DsTag, type TagStatus } from "./tag/ds-tag";
export {
  DsTabs,
  type TabsActivationMode,
  type TabsItem,
  type TabsPanelContent,
} from "./tabs/ds-tabs";
export { DsTreeView, type TreeLoadRequest, type TreeNode } from "./tree-view/ds-tree-view";
