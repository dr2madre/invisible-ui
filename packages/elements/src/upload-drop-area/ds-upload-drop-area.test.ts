import { fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsUploadDropArea } from "./ds-upload-drop-area";

const zone = () => document.querySelector<HTMLElement>(".upload-drop-area")!;
const input = () => document.querySelector<HTMLInputElement>(".upload-drop-area__input")!;

const mount = (html = "<ds-upload-drop-area></ds-upload-drop-area>") => {
  document.body.innerHTML = html;
  return document.querySelector("ds-upload-drop-area") as DsUploadDropArea;
};

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("<ds-upload-drop-area>", () => {
  it("renders a label wrapping a native file input", () => {
    mount();
    expect(zone().tagName).toBe("LABEL");
    expect(zone()).toContainElement(input());
    expect(input()).toHaveAttribute("type", "file");
    expect(zone()).toHaveTextContent("Drag & drop files or browse");
  });

  it("forwards accept, multiple, name and disabled to the input", () => {
    const host = mount(
      `<ds-upload-drop-area accept="image/*" multiple name="photos" caption="PNG up to 5 MB"></ds-upload-drop-area>`,
    );
    expect(input()).toHaveAttribute("accept", "image/*");
    expect(input()).toHaveAttribute("name", "photos");
    expect(input().multiple).toBe(true);
    expect(document.querySelector(".upload-drop-area__caption")).toHaveTextContent(
      "PNG up to 5 MB",
    );

    host.disabled = true;
    expect(input()).toBeDisabled();
    expect(zone()).toHaveClass("upload-drop-area--disabled");
    host.removeAttribute("caption");
    expect(document.querySelector(".upload-drop-area__caption")).toBeNull();
  });

  it("replaces the prompt and icon with light-DOM children", () => {
    mount(`
      <ds-upload-drop-area>
        <span slot="icon">↑</span>
        Add your photos
      </ds-upload-drop-area>`);
    expect(document.querySelector(".upload-drop-area__icon")).toHaveTextContent("↑");
    expect(document.querySelector(".upload-drop-area__text")).toHaveTextContent("Add your photos");
  });

  it("is reached with the keyboard as a named file input", async () => {
    const user = userEvent.setup();
    mount();
    await user.tab();
    expect(input()).toHaveFocus();
    expect(input()).toHaveAccessibleName("Drag & drop files or browse");
  });

  it("reports picked files through a files event", async () => {
    const user = userEvent.setup();
    const host = mount();
    const seen: File[][] = [];
    host.addEventListener("files", (event) => seen.push((event as CustomEvent).detail.files));
    const file = new File(["x"], "a.txt", { type: "text/plain" });

    await user.upload(input(), file);

    expect(seen).toEqual([[file]]);
    expect(host.files).toEqual([file]);
  });

  it("highlights on dragover and clears on dragleave", () => {
    mount();
    fireEvent.dragOver(zone());
    expect(zone()).toHaveAttribute("data-dragover");
    fireEvent.dragLeave(zone());
    expect(zone()).not.toHaveAttribute("data-dragover");
  });

  it("ignores drags while disabled", () => {
    const host = mount(`<ds-upload-drop-area disabled></ds-upload-drop-area>`);
    const onFiles = vi.fn();
    host.addEventListener("files", onFiles);
    fireEvent.dragOver(zone());
    expect(zone()).not.toHaveAttribute("data-dragover");
    fireEvent.drop(zone(), { dataTransfer: { files: [new File(["x"], "a.txt")] } });
    expect(onFiles).not.toHaveBeenCalled();
  });

  it("reports dropped files through a files event", () => {
    const host = mount();
    const onFiles = vi.fn();
    host.addEventListener("files", (event) => onFiles((event as CustomEvent).detail.files));
    const file = new File(["x"], "a.txt", { type: "text/plain" });
    fireEvent.drop(zone(), { dataTransfer: { files: [file] } });
    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it("shows the busy state while the picker opens and clears it on cancel", () => {
    mount();
    input().dispatchEvent(new Event("click", { bubbles: true }));
    expect(zone()).toHaveAttribute("aria-busy", "true");
    expect(zone()).toHaveClass("upload-drop-area--opening");
    input().dispatchEvent(new Event("cancel"));
    expect(zone()).not.toHaveAttribute("aria-busy");
    expect(zone().querySelector("ds-loading")).toBeNull();
  });

  it("takes its focus listener with it when removed while the picker is open", () => {
    const added = vi.spyOn(window, "addEventListener");
    const removed = vi.spyOn(window, "removeEventListener");
    const count = (spy: typeof added) => spy.mock.calls.filter(([type]) => type === "focus").length;

    for (let cycle = 0; cycle < 5; cycle += 1) {
      mount();
      input().dispatchEvent(new Event("click", { bubbles: true }));
      document.body.innerHTML = "";
    }

    expect(count(added)).toBe(5);
    expect(count(removed)).toBeGreaterThanOrEqual(5);
  });

  it("has no accessibility violations", async () => {
    mount(`<ds-upload-drop-area caption="PNG up to 5 MB"></ds-upload-drop-area>`);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
