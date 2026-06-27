import { render, fireEvent } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./drop-zone.fixture.svelte";

const zone = () => document.querySelector<HTMLElement>(".drop-zone")!;
const input = () => document.querySelector<HTMLInputElement>(".drop-zone__input")!;

describe("DropZone", () => {
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
    expect(zone()).toHaveClass("drop-zone--dragging");
    await fireEvent.dragLeave(zone());
    expect(zone()).not.toHaveClass("drop-zone--dragging");
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
