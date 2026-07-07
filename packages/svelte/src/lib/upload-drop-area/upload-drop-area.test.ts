import { render, fireEvent } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./upload-drop-area.fixture.svelte";

const zone = () => document.querySelector<HTMLElement>(".upload-drop-area")!;
const input = () => document.querySelector<HTMLInputElement>(".upload-drop-area__input")!;

describe("UploadDropArea", () => {
  it("renders a label wrapping a file input", () => {
    render(Fixture);
    expect(zone().tagName).toBe("LABEL");
    expect(input()).toHaveAttribute("type", "file");
  });

  it("forwards accept and multiple to the input", () => {
    render(Fixture, { props: { accept: "image/*", multiple: true } });
    expect(input()).toHaveAttribute("accept", "image/*");
    expect(input()).toHaveAttribute("multiple");
  });

  it("highlights on dragover and clears on dragleave", async () => {
    render(Fixture);
    await fireEvent.dragOver(zone());
    expect(zone()).toHaveAttribute("data-dragover");
    await fireEvent.dragLeave(zone());
    expect(zone()).not.toHaveAttribute("data-dragover");
  });

  it("emits dropped files via onFiles", async () => {
    const onFiles = vi.fn();
    render(Fixture, { props: { onFiles } });
    const file = new File(["x"], "a.txt", { type: "text/plain" });
    await fireEvent.drop(zone(), { dataTransfer: { files: [file] } });
    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container)).toHaveNoViolations();
  });
});
