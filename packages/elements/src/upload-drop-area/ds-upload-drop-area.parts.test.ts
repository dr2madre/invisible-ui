import { describe, expect, it } from "vitest";
import { DsUploadDropArea } from "./ds-upload-drop-area";

// Only the drop area is registered here, as on a page that imports one element.
describe("<ds-upload-drop-area> on its own", () => {
  it("registers the picker spinner it builds", () => {
    customElements.define("ds-upload-drop-area", DsUploadDropArea);
    document.body.innerHTML = `<ds-upload-drop-area></ds-upload-drop-area>`;
    expect(customElements.get("ds-loading")).toBeUndefined();
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    input.dispatchEvent(new Event("click", { bubbles: true }));
    const spinner = document.querySelector("ds-loading")!;
    expect(customElements.get("ds-loading")).toBeDefined();
    expect(spinner).toBeInstanceOf(customElements.get("ds-loading")!);
  });
});
