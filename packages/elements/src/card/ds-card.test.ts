import { screen, within } from "@testing-library/dom";
import { afterEach } from "vitest";
import { axe } from "vitest-axe";
import "../define";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("<ds-card>", () => {
  it("renders a labelled media article with light-DOM regions", () => {
    document.body.innerHTML = `
      <ds-card title="Project" description="Current work" orientation="horizontal">
        <span slot="icon">◆</span>
        <ds-tag slot="tags">Active</ds-tag>
        <p>Body content</p>
        <ds-button slot="actions">Open</ds-button>
      </ds-card>`;
    const article = screen.getByRole("article", { name: "Project" });
    expect(article).toHaveAttribute("data-orientation", "horizontal");
    expect(within(article).getByRole("heading", { name: "Project", level: 3 })).toBeVisible();
    expect(article.querySelector(".card__media--icon")).toHaveTextContent("◆");
    expect(article.querySelector(".card__tags")).toHaveTextContent("Active");
    expect(article.querySelector(".card__content")).toHaveTextContent("Body content");
    expect(within(article).getByRole("button", { name: "Open" })).toBeVisible();
  });

  it("renders dashboard values and reacts without losing slotted nodes", () => {
    document.body.innerHTML = `
      <ds-card variant="dashboard" title="Revenue" value="€48,200" change="+12.5%" trend="up">
        <span slot="metric">this month</span>
      </ds-card>`;
    const host = document.querySelector("ds-card")!;
    expect(screen.getByRole("article", { name: "Revenue" })).toHaveTextContent(
      "€48,200+12.5%this month",
    );
    expect(host.querySelector(".card__change")).toHaveAttribute("data-trend", "up");
    host.setAttribute("change", "-2%");
    host.setAttribute("trend", "down");
    expect(host.querySelector(".card__change")).toHaveTextContent("-2%");
    expect(host.querySelector(".card__change")).toHaveAttribute("data-trend", "down");
    expect(host.querySelector(".card__metric-content")).toHaveTextContent("this month");
  });

  it("reacts to the secondary surface hierarchy", () => {
    document.body.innerHTML = '<ds-card title="Project"></ds-card>';
    const host = document.querySelector("ds-card")!;
    expect(host.querySelector("article")).toHaveAttribute("data-surface", "default");
    host.setAttribute("surface", "secondary");
    expect(host.querySelector("article")).toHaveAttribute("data-surface", "secondary");
  });

  it("treats attribute content as text", () => {
    document.body.innerHTML =
      '<ds-card title="&lt;img src=x&gt;" description="&lt;button&gt;unsafe&lt;/button&gt;"></ds-card>';
    const host = document.querySelector("ds-card")!;
    expect(host.querySelector("img")).toBeNull();
    expect(host.querySelector("button")).toBeNull();
    expect(host.querySelector(".card__title")).toHaveTextContent("<img src=x>");
  });

  it("has no accessibility violations", async () => {
    document.body.innerHTML = '<ds-card title="Project" description="Current work"></ds-card>';
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
