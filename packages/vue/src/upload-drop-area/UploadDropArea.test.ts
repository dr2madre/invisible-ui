import { fireEvent, render } from "@testing-library/vue";
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
