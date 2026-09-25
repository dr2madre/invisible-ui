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
      "DsAlertDialog",
      "DsAvatar",
      "DsAvatarGroup",
      "DsBreadcrumb",
      "DsButton",
      "DsButtonGroup",
      "DsCard",
      "DsCheckbox",
      "DsCheckboxGroup",
      "DsCombobox",
      "DsConfirmDialog",
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
      "DsMultiSelect",
      "DsNavigationMenu",
      "DsPagination",
      "DsProgress",
      "DsPromptDialog",
      "DsRadio",
      "DsRadioGroup",
      "DsScrollArea",
      "DsSearchDialog",
      "DsSearchField",
      "DsSegmentedControl",
      "DsSelect",
      "DsSeparator",
      "DsSheetDialog",
      "DsSidebar",
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
