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
      "DsAvatar",
      "DsAvatarGroup",
      "DsBreadcrumb",
      "DsButton",
      "DsCard",
      "DsCheckbox",
      "DsCheckboxGroup",
      "DsCombobox",
      "DsCount",
      "DsDialog",
      "DsDropdownMenu",
      "DsEmptyState",
      "DsErrorState",
      "DsField",
      "DsInlineNotification",
      "DsLabel",
      "DsLoading",
      "DsLoadingGenerationArea",
      "DsMultiSelect",
      "DsNavigationMenu",
      "DsPagination",
      "DsProgress",
      "DsRadioGroup",
      "DsScrollArea",
      "DsSearchField",
      "DsSelect",
      "DsSeparator",
      "DsSheetDialog",
      "DsSidebar",
      "DsSwitch",
      "DsTab",
      "DsTabList",
      "DsTabPanel",
      "DsTable",
      "DsTabs",
      "DsTag",
      "DsTextField",
      "DsTextarea",
      "DsTooltip",
      "DsTreeView",
    ]);
  });

  it("imports the registration entrypoint without browser globals", async () => {
    await expect(import("./define")).resolves.toBeDefined();
  });
});
