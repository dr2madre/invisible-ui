import { screen } from "@testing-library/dom";
import { afterEach } from "vitest";
import { axe } from "vitest-axe";
import "../define";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("<ds-loading-generation-area>", () => {
  it("is a named status and clamps visible progress", () => {
    document.body.innerHTML = `
      <ds-loading-generation-area label="Generating image" status="Rendering" value="140"
        detail="3 of 8 files" label-position="bottom"></ds-loading-generation-area>`;
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("data-position", "bottom");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(status).toHaveTextContent("Rendering");
    expect(status).toHaveTextContent("100%");
    expect(status).toHaveTextContent("3 of 8 files");
  });

  it("uses its default name and supports a decorative presentation", () => {
    document.body.innerHTML = "<ds-loading-generation-area></ds-loading-generation-area>";
    expect(screen.getByRole("status", { name: "Loading…" })).toBeInTheDocument();
    const host = document.querySelector("ds-loading-generation-area")!;
    host.setAttribute("decorative", "");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(host.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("preserves the indicator and completed content across updates", () => {
    document.body.innerHTML = `
      <ds-loading-generation-area status="Working">
        <span slot="indicator">Indicator</span>
        <p>Loaded content</p>
      </ds-loading-generation-area>`;
    const host = document.querySelector("ds-loading-generation-area")!;
    expect(screen.getByText("Indicator")).toBeVisible();
    expect(screen.queryByText("Loaded content")).not.toBeInTheDocument();
    host.setAttribute("status", "Still working");
    expect(screen.getByText("Indicator")).toBeVisible();
    host.setAttribute("loading", "false");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Loaded content")).toBeVisible();
    host.setAttribute("loading", "true");
    expect(screen.getByText("Indicator")).toBeVisible();
  });

  it("has no accessibility violations", async () => {
    document.body.innerHTML =
      '<ds-loading-generation-area status="Loading data"></ds-loading-generation-area>';
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
