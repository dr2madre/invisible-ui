import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./loading.fixture.svelte";

const root = () => document.querySelector<HTMLElement>(".loading")!;

describe("Loading", () => {
  it("is a polite status with an accessible name by default", () => {
    render(Fixture);
    const el = screen.getByRole("status", { name: "Loading…" });
    expect(el).toBe(root());
    expect(el.querySelectorAll(".loading__dot")).toHaveLength(3);
  });

  it("accepts a custom label", () => {
    render(Fixture, { props: { label: "Saving changes" } });
    expect(screen.getByRole("status", { name: "Saving changes" })).toBeInTheDocument();
  });

  it("renders a rotating arc for the spinner variant", () => {
    render(Fixture, { props: { variant: "spinner" } });
    expect(root()).toHaveAttribute("data-variant", "spinner");
    expect(root().querySelector(".loading__spinner")).not.toBeNull();
    expect(root().querySelectorAll(".loading__dot")).toHaveLength(0);
    expect(root().querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders a sliding segment for the bar variant", () => {
    render(Fixture, { props: { variant: "bar" } });
    expect(root()).toHaveAttribute("data-variant", "bar");
    expect(root().querySelector(".loading__segment")).not.toBeNull();
    expect(root().querySelectorAll(".loading__dot")).toHaveLength(0);
  });

  it("keeps the dots markup for the typing variant (different motion)", () => {
    render(Fixture, { props: { variant: "typing" } });
    expect(root()).toHaveAttribute("data-variant", "typing");
    expect(root().querySelectorAll(".loading__dot")).toHaveLength(3);
  });

  it("renders a single morphing shape for the morph variant", () => {
    render(Fixture, { props: { variant: "morph" } });
    expect(root().querySelector(".loading__shape")).not.toBeNull();
  });

  it("exposes the detail as aria-valuetext on a determinate bar", () => {
    render(Fixture, {
      props: { variant: "bar", value: 50, label: "Downloading", detail: "2.3 MB of 4.6 MB" },
    });
    expect(screen.getByRole("progressbar", { name: "Downloading" })).toHaveAttribute(
      "aria-valuetext",
      "2.3 MB of 4.6 MB",
    );
  });

  it("hides the visible text from assistive tech (no live-region re-announcements)", () => {
    render(Fixture, { props: { showLabel: true, showValue: true, value: 30 } });
    expect(root().querySelector(".loading__label")).toHaveAttribute("aria-hidden", "true");
  });

  it("becomes a determinate progressbar when the bar has a value", () => {
    render(Fixture, { props: { variant: "bar", value: 60, label: "Downloading" } });
    const el = screen.getByRole("progressbar", { name: "Downloading" });
    expect(el).toHaveAttribute("aria-valuenow", "60");
    expect(el.querySelector(".loading__fill")?.getAttribute("style")).toContain("inline-size: 60%");
    expect(el.querySelector(".loading__segment")).toBeNull();
  });

  it("renders visible label, percentage and detail when asked", () => {
    render(Fixture, {
      props: {
        variant: "bar",
        value: 38,
        label: "Downloading",
        showLabel: true,
        showValue: true,
        detail: "3 of 8 files",
      },
    });
    const text = root().querySelector(".loading__label")!;
    expect(text).toHaveTextContent("Downloading");
    expect(text).toHaveTextContent("38%");
    expect(text).toHaveTextContent("3 of 8 files");
  });

  it("is hidden from assistive tech when decorative", () => {
    render(Fixture, { props: { decorative: true } });
    expect(root()).toHaveAttribute("aria-hidden", "true");
    expect(root()).not.toHaveAttribute("role");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container)).toHaveNoViolations();
  });
});
