import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { Loading } from "./Loading";

const root = () => document.querySelector<HTMLElement>(".loading")!;

describe("React Loading", () => {
  it("is a polite status with an accessible name by default", () => {
    render(<Loading />);
    const el = screen.getByRole("status", { name: "Loading…" });
    expect(el).toBe(root());
    expect(el).toHaveAttribute("data-variant", "dots");
    expect(el.querySelectorAll(".loading__dot")).toHaveLength(3);
  });

  it("accepts a custom label", () => {
    render(<Loading label="Saving changes" />);
    expect(screen.getByRole("status", { name: "Saving changes" })).toBeInTheDocument();
  });

  it("takes its default name from the catalog", () => {
    render(
      <LocaleProvider messages={{ "loading.label": "Caricamento…" }}>
        <Loading />
      </LocaleProvider>,
    );
    expect(screen.getByRole("status", { name: "Caricamento…" })).toBeInTheDocument();
  });

  it("renders a rotating arc for the spinner variant", () => {
    render(<Loading variant="spinner" />);
    expect(root()).toHaveAttribute("data-variant", "spinner");
    expect(root().querySelector(".loading__spinner")).not.toBeNull();
    expect(root().querySelectorAll(".loading__dot")).toHaveLength(0);
    expect(root().querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("shows the status below a determinate bar and feeds aria-valuetext", () => {
    render(<Loading variant="bar" value={40} label="Import" status="Fetching records…" />);
    const el = screen.getByRole("progressbar", { name: "Import" });
    expect(el.querySelector(".loading__status")).toHaveTextContent("Fetching records…");
    expect(el).toHaveAttribute("aria-valuetext", "Fetching records…");
  });

  it("announces a live status in full, named by the status text", () => {
    render(<Loading status="Connecting…" />);
    const el = screen.getByRole("status");
    expect(el).toHaveAttribute("aria-atomic", "true");
    expect(el).not.toHaveAttribute("aria-label");
    expect(el.querySelector(".loading__status")).toHaveTextContent("Connecting…");
  });

  it("renders a sliding segment for the bar variant", () => {
    render(<Loading variant="bar" />);
    expect(root()).toHaveAttribute("data-variant", "bar");
    expect(root().querySelector(".loading__segment")).not.toBeNull();
    expect(root().querySelectorAll(".loading__dot")).toHaveLength(0);
  });

  it("keeps the dots markup for the typing variant (different motion)", () => {
    render(<Loading variant="typing" />);
    expect(root()).toHaveAttribute("data-variant", "typing");
    expect(root().querySelectorAll(".loading__dot")).toHaveLength(3);
  });

  it("renders a single morphing shape for the morph variant", () => {
    render(<Loading variant="morph" />);
    expect(root().querySelector(".loading__shape")).not.toBeNull();
  });

  it("exposes the detail as aria-valuetext on a determinate bar", () => {
    render(<Loading variant="bar" value={50} label="Downloading" detail="2.3 MB of 4.6 MB" />);
    expect(screen.getByRole("progressbar", { name: "Downloading" })).toHaveAttribute(
      "aria-valuetext",
      "2.3 MB of 4.6 MB",
    );
  });

  it("hides the visible text from assistive tech (no live-region re-announcements)", () => {
    render(<Loading showLabel showValue value={30} />);
    expect(root().querySelector(".loading__label")).toHaveAttribute("aria-hidden", "true");
  });

  it("becomes a determinate progressbar when the bar has a value, clamped to 0-100", () => {
    const { rerender } = render(<Loading variant="bar" value={60} label="Downloading" />);
    const el = screen.getByRole("progressbar", { name: "Downloading" });
    expect(el).toHaveAttribute("aria-valuenow", "60");
    expect(el).toHaveAttribute("aria-valuemin", "0");
    expect(el).toHaveAttribute("aria-valuemax", "100");
    expect(el.querySelector<HTMLElement>(".loading__fill")!.style.inlineSize).toBe("60%");
    expect(el.querySelector(".loading__segment")).toBeNull();

    rerender(<Loading variant="bar" value={140} label="Downloading" />);
    expect(el).toHaveAttribute("aria-valuenow", "100");
  });

  it("renders visible label, percentage and detail when asked", () => {
    render(
      <Loading
        variant="bar"
        value={38}
        label="Downloading"
        showLabel
        showValue
        detail="3 of 8 files"
      />,
    );
    const text = root().querySelector(".loading__label")!;
    expect(text).toHaveTextContent("Downloading");
    expect(text).toHaveTextContent("38%");
    expect(text).toHaveTextContent("3 of 8 files");
  });

  it("is hidden from assistive tech when decorative", () => {
    render(<Loading decorative />);
    expect(root()).toHaveAttribute("aria-hidden", "true");
    expect(root()).not.toHaveAttribute("role");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("covers the nearest positioned ancestor as an overlay, with or without a veil", () => {
    const { rerender } = render(<Loading overlay />);
    expect(root()).toHaveClass("loading", "loading--overlay", "loading--veil");
    rerender(<Loading overlay veil={false} />);
    expect(root()).toHaveClass("loading--overlay");
    expect(root()).not.toHaveClass("loading--veil");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Loading />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("React Loading, the no-flash delay", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows nothing until the delay has passed", () => {
    render(<Loading label="Loading" delay={200} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("takes its timer with it when it goes", () => {
    const { unmount } = render(<Loading label="Loading" delay={200} />);
    expect(vi.getTimerCount(), "the delay is waiting").toBe(1);
    unmount();
    expect(vi.getTimerCount(), "an indicator that has gone left a timer running").toBe(0);
  });
});
