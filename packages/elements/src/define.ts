/**
 * Side-effect entry point: registers every element under its `ds-*` tag.
 * Safe to import more than once (guards against re-definition).
 */
import { DsButton } from "./button/ds-button";
import { DsCard } from "./card/ds-card";
import { DsCheckboxGroup } from "./checkbox-group/ds-checkbox-group";
import { DsCheckbox } from "./checkbox/ds-checkbox";
import { DsCombobox } from "./combobox/ds-combobox";
import { DsCount } from "./count/ds-count";
import { DsMultiSelect } from "./multi-select/ds-multi-select";
import { DsPagination } from "./pagination/ds-pagination";
import { DsDialog } from "./dialog/ds-dialog";
import { DsEmptyState } from "./empty-state/ds-empty-state";
import { DsErrorState } from "./error-state/ds-error-state";
import { DsInlineNotification } from "./inline-notification/ds-inline-notification";
import { DsLoading } from "./loading/ds-loading";
import { DsLoadingGenerationArea } from "./loading-generation-area/ds-loading-generation-area";
import { DsField } from "./field/ds-field";
import { DsLabel } from "./label/ds-label";
import { DsRadioGroup } from "./radio-group/ds-radio-group";
import { DsSelect } from "./select/ds-select";
import { DsSeparator } from "./separator/ds-separator";
import { DsTextField, DsTextarea } from "./text-field/ds-text-field";
import { DsSearchField } from "./search-field/ds-search-field";
import { DsSheetDialog } from "./sheet-dialog/ds-sheet-dialog";
import { DsSwitch } from "./switch/ds-switch";
import { DsTable } from "./table/ds-table";
import { DsTableSet } from "./table/ds-table-set";
import { DsTableView } from "./table/ds-table-view";
import { DsTabs } from "./tabs/ds-tabs";
import { DsTag } from "./tag/ds-tag";
import { DsTreeView } from "./tree-view/ds-tree-view";

const define = (tag: string, ctor: CustomElementConstructor) => {
  if (typeof customElements === "undefined") return;
  if (!customElements.get(tag)) customElements.define(tag, ctor);
};

define("ds-button", DsButton);
define("ds-card", DsCard);
define("ds-checkbox", DsCheckbox);
define("ds-switch", DsSwitch);
define("ds-select", DsSelect);
define("ds-separator", DsSeparator);
define("ds-combobox", DsCombobox);
define("ds-multi-select", DsMultiSelect);
define("ds-dialog", DsDialog);
define("ds-empty-state", DsEmptyState);
define("ds-error-state", DsErrorState);
define("ds-inline-notification", DsInlineNotification);
define("ds-loading", DsLoading);
define("ds-loading-generation-area", DsLoadingGenerationArea);
define("ds-label", DsLabel);
define("ds-field", DsField);
define("ds-text-field", DsTextField);
define("ds-textarea", DsTextarea);
define("ds-search-field", DsSearchField);
define("ds-sheet-dialog", DsSheetDialog);
define("ds-radio-group", DsRadioGroup);
define("ds-checkbox-group", DsCheckboxGroup);
define("ds-table", DsTable);
define("ds-table-view", DsTableView);
define("ds-table-set", DsTableSet);
define("ds-count", DsCount);
define("ds-tabs", DsTabs);
define("ds-pagination", DsPagination);
define("ds-tag", DsTag);
define("ds-tree-view", DsTreeView);

export {};
