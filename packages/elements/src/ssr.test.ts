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
      "DsButton",
      "DsCard",
      "DsCheckbox",
      "DsCheckboxGroup",
      "DsCombobox",
      "DsCount",
      "DsDialog",
      "DsEmptyState",
      "DsErrorState",
      "DsField",
      "DsInlineNotification",
      "DsLabel",
      "DsLoading",
      "DsLoadingGenerationArea",
      "DsMultiSelect",
      "DsPagination",
      "DsRadioGroup",
      "DsSearchField",
      "DsSelect",
      "DsSeparator",
      "DsSheetDialog",
      "DsSwitch",
      "DsTable",
      "DsTabs",
      "DsTag",
      "DsTextField",
      "DsTextarea",
    ]);
  });

  it("imports the registration entrypoint without browser globals", async () => {
    await expect(import("./define")).resolves.toBeDefined();
  });
});
