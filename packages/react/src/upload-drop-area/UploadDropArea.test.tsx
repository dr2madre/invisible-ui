import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { UploadDropArea, acceptsFile } from "./UploadDropArea";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const zone = () => document.querySelector<HTMLElement>(".upload-drop-area")!;
const input = () => document.querySelector<HTMLInputElement>(".upload-drop-area__input")!;

const drop = (...files: File[]) => fireEvent.drop(zone(), { dataTransfer: { files } });

const png = new File(["x"], "photo.png", { type: "image/png" });
const jpeg = new File(["x"], "photo.JPG", { type: "image/jpeg" });
const pdf = new File(["x"], "report.pdf", { type: "application/pdf" });
const text = new File(["x"], "notes.txt", { type: "text/plain" });

/** Open the picker the way a click on the area does. */
const openPicker = () =>
  act(() => {
    input().dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

afterEach(() => vi.restoreAllMocks());

describe("React UploadDropArea", () => {
  it("renders a label wrapping a file input", () => {
    render(<UploadDropArea />);
    expect(zone().tagName).toBe("LABEL");
    expect(zone()).toContainElement(input());
    expect(input()).toHaveAttribute("type", "file");
  });

  it("forwards accept, multiple and name to the input", () => {
    render(<UploadDropArea accept="image/*" multiple name="attachments" />);
    expect(input()).toHaveAttribute("accept", "image/*");
    expect(input()).toHaveAttribute("multiple");
    expect(input()).toHaveAttribute("name", "attachments");
  });

  it("highlights on dragover and clears on dragleave", () => {
    render(<UploadDropArea />);
    fireEvent.dragOver(zone());
    expect(zone()).toHaveAttribute("data-dragover");
    fireEvent.dragLeave(zone());
    expect(zone()).not.toHaveAttribute("data-dragover");
  });

  it("clears the highlight on drop", () => {
    render(<UploadDropArea />);
    fireEvent.dragOver(zone());
    drop(text);
    expect(zone()).not.toHaveAttribute("data-dragover");
  });

  it("emits dropped files via onFiles", () => {
    const onFiles = vi.fn();
    render(<UploadDropArea onFiles={onFiles} />);
    drop(text);
    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onFiles).toHaveBeenCalledWith([text]);
  });

  it("keeps the first file of a multi-file drop on a single-file area", () => {
    const onFiles = vi.fn();
    render(<UploadDropArea onFiles={onFiles} />);
    drop(text, pdf);
    expect(onFiles).toHaveBeenCalledWith([text]);
  });

  it("keeps every file of a drop on a multi-file area", () => {
    const onFiles = vi.fn();
    render(<UploadDropArea multiple onFiles={onFiles} />);
    drop(text, pdf);
    expect(onFiles).toHaveBeenCalledWith([text, pdf]);
  });

  it("ignores drags while disabled", () => {
    const onFiles = vi.fn();
    render(<UploadDropArea disabled onFiles={onFiles} />);
    expect(zone()).toHaveClass("upload-drop-area--disabled");
    expect(input()).toBeDisabled();
    fireEvent.dragOver(zone());
    expect(zone()).not.toHaveAttribute("data-dragover");
    drop(text);
    expect(onFiles).not.toHaveBeenCalled();
  });

  it("emits picked files from the native input", () => {
    const onFiles = vi.fn();
    render(<UploadDropArea onFiles={onFiles} />);
    Object.defineProperty(input(), "files", { configurable: true, value: [text] });
    fireEvent.change(input());
    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onFiles).toHaveBeenCalledWith([text]);
  });

  it("shows the default prompt with the styled action word", () => {
    render(<UploadDropArea />);
    expect(zone()).toHaveTextContent("Drag & drop files or browse");
    expect(document.querySelector(".upload-drop-area__action")).toHaveTextContent("browse");
  });

  it("replaces the prompt and the icon, and shows the caption", () => {
    render(
      <UploadDropArea caption="PNG up to 5 MB" icon={<svg data-testid="custom-icon" />}>
        Drop a photo
      </UploadDropArea>,
    );
    expect(document.querySelector(".upload-drop-area__text")).toHaveTextContent("Drop a photo");
    expect(document.querySelector(".upload-drop-area__action")).toBeNull();
    expect(document.querySelector(".upload-drop-area__icon")).toContainElement(
      screen.getByTestId("custom-icon"),
    );
    expect(document.querySelector(".upload-drop-area__caption")).toHaveTextContent(
      "PNG up to 5 MB",
    );
  });

  it("marks the area busy while the picker opens, until a file is chosen", () => {
    render(<UploadDropArea />);
    openPicker();
    expect(zone()).toHaveAttribute("aria-busy", "true");
    expect(zone()).toHaveClass("upload-drop-area--opening");

    Object.defineProperty(input(), "files", { configurable: true, value: [text] });
    fireEvent.change(input());
    expect(zone()).not.toHaveAttribute("aria-busy");
  });

  it("clears the busy state when the window gets focus back", () => {
    render(<UploadDropArea />);
    openPicker();
    act(() => {
      window.dispatchEvent(new FocusEvent("focus"));
    });
    expect(zone()).not.toHaveAttribute("aria-busy");
  });

  it("clears the busy state when the picker is cancelled", () => {
    render(<UploadDropArea />);
    openPicker();
    act(() => {
      input().dispatchEvent(new Event("cancel"));
    });
    expect(zone()).not.toHaveAttribute("aria-busy");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<UploadDropArea caption="Any file" />);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});

// A drop keeps only the files `accept` names, as the picker does: a rejected
// file never reaches onFiles.
describe("React UploadDropArea (accept on drop)", () => {
  it("keeps the files a MIME wildcard names", () => {
    const onFiles = vi.fn();
    render(<UploadDropArea accept="image/*" multiple onFiles={onFiles} />);
    drop(png, pdf, jpeg);
    expect(onFiles).toHaveBeenCalledWith([png, jpeg]);
  });

  it("keeps the files an exact MIME type names", () => {
    const onFiles = vi.fn();
    render(<UploadDropArea accept="application/pdf" multiple onFiles={onFiles} />);
    drop(png, pdf, text);
    expect(onFiles).toHaveBeenCalledWith([pdf]);
  });

  it("keeps the files an extension names, whatever their case", () => {
    const onFiles = vi.fn();
    render(<UploadDropArea accept=".pdf, .jpg" multiple onFiles={onFiles} />);
    drop(png, pdf, jpeg, text);
    expect(onFiles).toHaveBeenCalledWith([pdf, jpeg]);
  });

  it("reports nothing when every dropped file is rejected", () => {
    const onFiles = vi.fn();
    render(<UploadDropArea accept="image/*" multiple onFiles={onFiles} />);
    drop(pdf, text);
    expect(onFiles).not.toHaveBeenCalled();
  });

  it("keeps the first accepted file on a single-file area, not the first dropped", () => {
    const onFiles = vi.fn();
    render(<UploadDropArea accept="image/*" onFiles={onFiles} />);
    drop(pdf, png, jpeg);
    expect(onFiles).toHaveBeenCalledWith([png]);
  });
});

describe("acceptsFile", () => {
  it("accepts everything for an empty or missing list", () => {
    expect(acceptsFile(pdf, undefined)).toBe(true);
    expect(acceptsFile(pdf, "")).toBe(true);
    expect(acceptsFile(pdf, " , ")).toBe(true);
  });

  it("reads extensions, MIME types and wildcards", () => {
    expect(acceptsFile(jpeg, ".jpg")).toBe(true);
    expect(acceptsFile(png, "IMAGE/PNG")).toBe(true);
    expect(acceptsFile(png, "image/*")).toBe(true);
    expect(acceptsFile(pdf, "image/*,.docx")).toBe(false);
    expect(acceptsFile(text, "text/html")).toBe(false);
  });
});

// Opening the picker listens for the window regaining focus, which is how the
// component learns the dialog closed. If the area goes away while the picker
// is still open, that listener must leave with it.
describe("React UploadDropArea teardown", () => {
  it("takes its focus listener with it", () => {
    const added = vi.spyOn(window, "addEventListener");
    const removed = vi.spyOn(window, "removeEventListener");
    const count = (spy: typeof added) => spy.mock.calls.filter(([type]) => type === "focus").length;

    for (let cycle = 0; cycle < 5; cycle += 1) {
      const view = render(<UploadDropArea />);
      openPicker();
      view.unmount();
    }

    expect(count(added), "the picker was opened five times").toBe(5);
    expect(count(removed), "and let go five times").toBe(5);
  });
});
