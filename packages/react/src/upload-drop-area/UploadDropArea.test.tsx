import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { UploadDropArea } from "./UploadDropArea";

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

// Picked and dropped files go through the same accept filter (the core's
// splitFiles): the ones it leaves out never reach onFiles, are reported to
// onRejected and are named in an alert under the area.
describe("React UploadDropArea (accept filter)", () => {
  const pick = (...files: File[]) => {
    Object.defineProperty(input(), "files", { configurable: true, value: files });
    fireEvent.change(input());
  };
  const alert = () => screen.getByRole("alert");

  it("keeps the dropped files accept names and reports the others", () => {
    const onFiles = vi.fn();
    const onRejected = vi.fn();
    render(
      <UploadDropArea accept="image/*, .pdf" multiple onFiles={onFiles} onRejected={onRejected} />,
    );
    drop(png, text, pdf, jpeg);
    expect(onFiles).toHaveBeenCalledWith([png, pdf, jpeg]);
    expect(onRejected).toHaveBeenCalledWith([{ file: text, reason: "type" }]);
    expect(alert()).toHaveTextContent("notes.txt is not an accepted file type.");
    expect(
      alert().querySelector(".field__error.field__message .field__msg-icon svg"),
    ).not.toBeNull();
    expect(zone()).not.toContainElement(alert());
    expect(input()).toHaveAttribute("aria-describedby", alert().id);
  });

  it("filters picked files the same way", () => {
    const onFiles = vi.fn();
    const onRejected = vi.fn();
    render(<UploadDropArea accept=".pdf" multiple onFiles={onFiles} onRejected={onRejected} />);
    pick(pdf, text);
    expect(onFiles).toHaveBeenCalledWith([pdf]);
    expect(onRejected).toHaveBeenCalledWith([{ file: text, reason: "type" }]);
    expect(alert()).toHaveTextContent("notes.txt is not an accepted file type.");
  });

  it("reports nothing to onFiles when every file is left out", () => {
    const onFiles = vi.fn();
    render(<UploadDropArea accept="image/*" multiple onFiles={onFiles} />);
    drop(pdf, text);
    pick(pdf);
    expect(onFiles).not.toHaveBeenCalled();
    expect(alert()).toHaveTextContent("report.pdf is not an accepted file type.");
  });

  it("takes the first accepted file on a single-file area and names the rest", () => {
    const onFiles = vi.fn();
    const onRejected = vi.fn();
    render(<UploadDropArea accept="image/*" onFiles={onFiles} onRejected={onRejected} />);
    drop(pdf, png, jpeg);
    expect(onFiles).toHaveBeenCalledWith([png]);
    expect(onRejected).toHaveBeenCalledWith([
      { file: pdf, reason: "type" },
      { file: jpeg, reason: "count" },
    ]);
    expect(alert()).toHaveTextContent(
      "report.pdf is not an accepted file type.photo.JPG was not added: only one file is accepted.",
    );
  });

  it("clears the message once a batch is taken whole", () => {
    render(<UploadDropArea accept="image/*" multiple />);
    drop(text);
    expect(alert()).toBeInTheDocument();
    drop(png);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(input()).not.toHaveAttribute("aria-describedby");
  });

  it("has no accessibility violations with the message", async () => {
    const { container } = render(<UploadDropArea accept="image/*" multiple />);
    drop(text);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
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
