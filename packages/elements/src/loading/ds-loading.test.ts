import { screen } from "@testing-library/dom";
import { afterEach, vi } from "vitest";
import { axe } from "vitest-axe";
import "../define";

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("<ds-loading>", () => {
  it("renders a named polite indicator by default", () => {
    document.body.innerHTML = "<ds-loading></ds-loading>";
    expect(screen.getByRole("status", { name: "Loading…" })).toBeVisible();
    expect(document.querySelectorAll(".loading__dot")).toHaveLength(3);
  });

  it("renders clamped determinate progress and reactive visible detail", () => {
    document.body.innerHTML = `
      <ds-loading variant="bar" value="120" label="Importing" show-value
        detail="8 of 8 files"></ds-loading>`;
    const progress = screen.getByRole("progressbar", { name: "Importing" });
    expect(progress).toHaveAttribute("aria-valuenow", "100");
    expect(progress).toHaveAttribute("aria-valuetext", "8 of 8 files");
    expect(progress.querySelector(".loading__fill")).toHaveStyle("inline-size: 100%");
    expect(progress).toHaveTextContent("100%");
    document.querySelector("ds-loading")!.setAttribute("value", "45");
    expect(progress).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Importing" })).toHaveAttribute(
      "aria-valuenow",
      "45",
    );
  });

  it("supports live status messages and decorative indicators", () => {
    document.body.innerHTML = '<ds-loading variant="spinner" status="Connecting…"></ds-loading>';
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(status).toHaveTextContent("Connecting…");
    document.querySelector("ds-loading")!.setAttribute("decorative", "");
    expect(screen.queryByRole("status")).toBeNull();
    expect(document.querySelector(".loading")).toHaveAttribute("aria-hidden", "true");
  });

  it("honors the no-flash delay and cancels it on disconnect", () => {
    vi.useFakeTimers();
    const host = document.createElement("ds-loading");
    host.setAttribute("delay", "150");
    document.body.appendChild(host);
    expect(host.querySelector(".loading")).toBeNull();
    vi.advanceTimersByTime(149);
    expect(host.querySelector(".loading")).toBeNull();
    vi.advanceTimersByTime(1);
    expect(host.querySelector(".loading")).toBeVisible();
    host.setAttribute("delay", "200");
    host.remove();
    vi.advanceTimersByTime(200);
    expect(host.querySelector(".loading")).toBeNull();
  });

  it("has no accessibility violations", async () => {
    document.body.innerHTML =
      '<ds-loading variant="bar" value="40" label="Importing"></ds-loading>';
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
