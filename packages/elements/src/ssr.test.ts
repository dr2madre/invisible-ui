// @vitest-environment node
import { describe, expect, it } from "vitest";

describe("custom-elements adapter SSR", () => {
  it("imports the selective entrypoint without browser globals", async () => {
    const adapter = await import("./index");

    expect(
      Object.keys(adapter)
        .filter((name) => name.startsWith("Ds"))
        .sort(),
    ).toEqual([
      "DsAccordion",
      "DsAccordionItem",
      "DsAlertDialog",
      "DsAspectRatio",
      "DsAvatar",
      "DsAvatarGroup",
      "DsBlockquote",
      "DsBreadcrumb",
      "DsButton",
      "DsButtonGroup",
      "DsCard",
      "DsCheckbox",
      "DsCheckboxGroup",
      "DsCollapsible",
      "DsCombobox",
      "DsConfirmDialog",
      "DsContextMenu",
      "DsCount",
      "DsDialog",
      "DsDropdownMenu",
      "DsEmptyState",
      "DsErrorState",
      "DsField",
      "DsIcon",
      "DsInlineNotification",
      "DsKbd",
      "DsLabel",
      "DsLink",
      "DsLoading",
      "DsLoadingGenerationArea",
      "DsLocaleProvider",
      "DsLoginForm",
      "DsMenubar",
      "DsMeter",
      "DsMultiSelect",
      "DsNavigationMenu",
      "DsNotification",
      "DsNotificationRegion",
      "DsNumberField",
      "DsPagination",
      "DsPinInput",
      "DsPopover",
      "DsProgress",
      "DsPromptDialog",
      "DsRadio",
      "DsRadioGroup",
      "DsRangeSlider",
      "DsRatingGroup",
      "DsScrollArea",
      "DsSearchDialog",
      "DsSearchField",
      "DsSegmentedControl",
      "DsSelect",
      "DsSeparator",
      "DsSheetDialog",
      "DsSidebar",
      "DsSkeleton",
      "DsSlider",
      "DsStepper",
      "DsSwitch",
      "DsTab",
      "DsTabList",
      "DsTabPanel",
      "DsTable",
      "DsTableSet",
      "DsTabs",
      "DsTag",
      "DsTextField",
      "DsTextarea",
      "DsToggleButton",
      "DsToggleGroup",
      "DsToolbar",
      "DsTooltip",
      "DsTreeView",
      "DsUploadDropArea",
    ]);
  });

  it("imports the registration entrypoint without browser globals", async () => {
    await expect(import("./define")).resolves.toBeDefined();
  });
});
