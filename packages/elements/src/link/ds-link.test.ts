import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";

const mount = (markup: string) => {
  document.body.innerHTML = markup;
  return document.querySelector("ds-link")!;
};

const link = () => document.querySelector<HTMLAnchorElement>(".link")!;

describe("<ds-link>", () => {
  it("renders a semantic link with its text and href", () => {
    mount(`<ds-link href="/guide">Read the guide</ds-link>`);
    const el = screen.getByRole("link", { name: "Read the guide" });
    expect(el).toHaveAttribute("href", "/guide");
    expect(el).toHaveAttribute("data-variant", "primary");
  });

  it("reflects the subtle variant and a changed href", () => {
    const host = mount(`<ds-link href="/guide" variant="subtle">Read the guide</ds-link>`);
    expect(link()).toHaveAttribute("data-variant", "subtle");
    host.setAttribute("href", "/next");
    expect(link()).toHaveAttribute("href", "/next");
  });

  it("opens external links in a new tab with a safe rel and a decorative icon", () => {
    mount(`<ds-link href="https://example.com" external>Read the guide</ds-link>`);
    expect(link()).toHaveAttribute("target", "_blank");
    expect(link()).toHaveAttribute("rel", "noopener noreferrer");
    const icon = document.querySelector(".link__external")!;
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("focusable", "false");
    expect(screen.getByRole("link", { name: "Read the guide" })).toBeInTheDocument();
  });

  it("stays internal by default and drops the external treatment when unset", () => {
    const host = mount(`<ds-link href="/guide" external>Read the guide</ds-link>`);
    host.removeAttribute("external");
    expect(link()).not.toHaveAttribute("target");
    expect(link()).not.toHaveAttribute("rel");
    expect(document.querySelector(".link__external")).toBeNull();
    expect(link()).toHaveTextContent("Read the guide");
  });

  it("takes one tab stop and activates on Enter", async () => {
    const user = userEvent.setup();
    // A fragment href keeps jsdom from attempting a document navigation.
    const host = mount(`<ds-link href="#guide">Read the guide</ds-link>`);
    const pressed = vi.fn();
    host.addEventListener("click", pressed);

    await user.tab();
    expect(link()).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(pressed).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations", async () => {
    mount(`<ds-link href="/guide">Read the guide</ds-link>`);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("has no accessibility violations when external", async () => {
    mount(`<ds-link href="https://example.com" external>Read the guide</ds-link>`);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
