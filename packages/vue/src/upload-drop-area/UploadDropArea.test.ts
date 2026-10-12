import { fireEvent, render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { UploadDropArea } from "./UploadDropArea";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const zone = () => document.querySelector<HTMLElement>(".upload-drop-area")!;
const input = () => document.querySelector<HTMLInputElement>(".upload-drop-area__input")!;

describe("Vue UploadDropArea", () => {
  it("renders a label wrapping a file input", () => {
    render(UploadDropArea);
    expect(zone().tagName).toBe("LABEL");
    expect(input()).toHaveAttribute("type", "file");
  });

  it("forwards accept and multiple to the input", () => {
    render(UploadDropArea, { props: { accept: "image/*", multiple: true } });
    expect(input()).toHaveAttribute("accept", "image/*");
    expect(input()).toHaveAttribute("multiple");
  });

  it("highlights on dragover and clears on dragleave", async () => {
    render(UploadDropArea);
    await fireEvent.dragOver(zone());
    expect(zone()).toHaveAttribute("data-dragover");
    await fireEvent.dragLeave(zone());
    expect(zone()).not.toHaveAttribute("data-dragover");
  });

  it("emits dropped files via onFiles", async () => {
    const onFiles = vi.fn();
    render(UploadDropArea, { props: { onFiles } });
    const file = new File(["x"], "a.txt", { type: "text/plain" });
    await fireEvent.drop(zone(), { dataTransfer: { files: [file] } });
    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it("ignores drags while disabled", async () => {
    const onFiles = vi.fn();
    render(UploadDropArea, { props: { disabled: true, onFiles } });
    await fireEvent.dragOver(zone());
    expect(zone()).not.toHaveAttribute("data-dragover");
    const file = new File(["x"], "a.txt", { type: "text/plain" });
    await fireEvent.drop(zone(), { dataTransfer: { files: [file] } });
    expect(onFiles).not.toHaveBeenCalled();
  });

  it("emits picked files from the native input", async () => {
    const onFiles = vi.fn();
    render(UploadDropArea, { props: { onFiles } });
    const file = new File(["x"], "b.txt", { type: "text/plain" });
    Object.defineProperty(input(), "files", { configurable: true, value: [file] });
    await fireEvent.change(input());
    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it("shows the default prompt with the styled action word", () => {
    render(UploadDropArea);
    expect(zone()).toHaveTextContent("Drag & drop files or browse");
    expect(document.querySelector(".upload-drop-area__action")).toHaveTextContent("browse");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(UploadDropArea);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});

// Picked and dropped files go through the same accept filter (the core's
// splitFiles): the ones it leaves out never reach onFiles, are reported to
// onRejected and are named in an alert under the area.
describe("Vue UploadDropArea (accept filter)", () => {
  const png = new File(["x"], "photo.png", { type: "image/png" });
  const jpeg = new File(["x"], "photo.JPG", { type: "image/jpeg" });
  const pdf = new File(["x"], "report.pdf", { type: "application/pdf" });
  const text = new File(["x"], "notes.txt", { type: "text/plain" });
  const drop = (...files: File[]) => fireEvent.drop(zone(), { dataTransfer: { files } });
  const pick = (...files: File[]) => {
    Object.defineProperty(input(), "files", { configurable: true, value: files });
    return fireEvent.change(input());
  };

  it("keeps the dropped files accept names and reports the others", async () => {
    const onFiles = vi.fn();
    const onRejected = vi.fn();
    render(UploadDropArea, {
      props: { accept: "image/*, .pdf", multiple: true, onFiles, onRejected },
    });
    const before = input();
    await drop(png, text, pdf, jpeg);
    // The input survives the message appearing, so it keeps its files.
    expect(input()).toBe(before);
    expect(onFiles).toHaveBeenCalledWith([png, pdf, jpeg]);
    expect(onRejected).toHaveBeenCalledWith([{ file: text, reason: "type" }]);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("notes.txt is not an accepted file type.");
    expect(alert.querySelector(".field__error.field__message .field__msg-icon svg")).not.toBeNull();
    expect(zone()).not.toContainElement(alert);
    expect(input()).toHaveAttribute("aria-describedby", alert.id);
  });

  it("filters picked files the same way", async () => {
    const onFiles = vi.fn();
    const onRejected = vi.fn();
    render(UploadDropArea, { props: { accept: ".pdf", multiple: true, onFiles, onRejected } });
    await pick(pdf, text);
    expect(onFiles).toHaveBeenCalledWith([pdf]);
    expect(onRejected).toHaveBeenCalledWith([{ file: text, reason: "type" }]);
  });

  it("takes the first accepted file on a single-file area and names the rest", async () => {
    const onFiles = vi.fn();
    const onRejected = vi.fn();
    render(UploadDropArea, { props: { accept: "image/*", onFiles, onRejected } });
    await drop(pdf, png, jpeg);
    expect(onFiles).toHaveBeenCalledWith([png]);
    expect(onRejected).toHaveBeenCalledWith([
      { file: pdf, reason: "type" },
      { file: jpeg, reason: "count" },
    ]);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "photo.JPG was not added: only one file is accepted.",
    );
  });

  it("clears the message once a batch is taken whole, and keeps attributes on the label", async () => {
    const onFiles = vi.fn();
    render(UploadDropArea, {
      props: { accept: "image/*", multiple: true, onFiles },
      attrs: { class: "extra", "data-test": "upload" },
    });
    await drop(text);
    expect(onFiles).not.toHaveBeenCalled();
    expect(zone()).toHaveClass("upload-drop-area", "extra");
    expect(zone()).toHaveAttribute("data-test", "upload");
    await drop(png);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(input()).not.toHaveAttribute("aria-describedby");
  });

  it("has no accessibility violations with the message", async () => {
    const { container } = render(UploadDropArea, { props: { accept: "image/*" } });
    await drop(text);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
