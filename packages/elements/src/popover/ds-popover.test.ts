import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsLocaleProvider } from "../locale-provider/ds-locale-provider";
import type { DsPopover } from "./ds-popover";

const mount = (attributes = "") => {
  document.body.innerHTML = `
    <button type="button">before</button>
    <ds-popover ${attributes}>
      <span slot="trigger">Open popover</span>
      <p>Popover body</p>
      <button type="button">Action</button>
    </ds-popover>
    <button type="button">after</button>`;
  const host = document.querySelector("ds-popover") as DsPopover;
  const onOpenChange = vi.fn();
  host.addEventListener("open-change", (event) =>
    onOpenChange((event as CustomEvent<{ open: boolean }>).detail.open),
  );
  return { host, onOpenChange };
};
const trigger = () => screen.getByRole("button", { name: "Open popover" });
const body = () => screen.queryByText("Popover body");

describe("<ds-popover>", () => {
  it("is closed by default with the trigger advertising the panel", () => {
    mount();
    expect(trigger()).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveClass("button");
    expect(body()).not.toBeVisible();
  });

  it("opens on click, moves focus into the panel, and reports it open", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = mount();
    await user.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(body()).toBeVisible();
    expect(screen.getByRole("button", { name: "Action" })).toHaveFocus();
  });

  it("gives the panel a name, from the trigger by default", async () => {
    const user = userEvent.setup();
    const { host } = mount();
    await user.click(trigger());
    expect(screen.getByRole("dialog", { name: "Open popover" })).toBeInTheDocument();

    host.setAttribute("label", "Quick settings");
    expect(screen.getByRole("dialog", { name: "Quick settings" })).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = mount();
    await user.click(trigger());
    await user.keyboard("{Escape}");
    expect(body()).not.toBeVisible();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(trigger()).toHaveFocus();
  });

  it("closes on an outside pointer press", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(trigger());
    expect(body()).toBeVisible();
    await user.click(screen.getByRole("button", { name: "before" }));
    expect(body()).not.toBeVisible();
  });

  it("closes when focus leaves the trigger and the panel", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(trigger());
    screen.getByRole("button", { name: "after" }).focus();
    expect(body()).not.toBeVisible();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
  });

  it("follows the open property without reporting it", () => {
    const { host, onOpenChange } = mount();
    host.open = true;
    expect(body()).toBeVisible();
    host.open = false;
    expect(body()).not.toBeVisible();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("uses the catalog label for a trigger without content", () => {
    document.body.innerHTML = `<ds-popover><p>Body</p></ds-popover>`;
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
  });

  it("takes the default trigger label from the locale provider", () => {
    document.body.innerHTML = `<ds-locale-provider locale="it"><ds-popover><p>Corpo</p></ds-popover></ds-locale-provider>`;
    const provider = document.querySelector("ds-locale-provider") as DsLocaleProvider;
    provider.messages = { "dialog.trigger": "Apri" };
    expect(screen.getByRole("button", { name: "Apri" })).toBeInTheDocument();
  });

  it("styles the trigger with the variant", () => {
    mount('trigger-variant="primary"');
    expect(trigger()).toHaveAttribute("data-variant", "primary");
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(trigger());
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("<ds-popover trigger=hover>", () => {
  const mountHover = () => {
    document.body.innerHTML = `
      <a href="#before">before</a>
      <ds-popover trigger="hover" open-delay="0" close-delay="0">
        <a slot="trigger" href="#ada">@ada</a>
        <div><strong>Ada Lovelace</strong><p>Mathematician, the first programmer.</p></div>
      </ds-popover>
      <a href="#after">after</a>`;
    const host = document.querySelector("ds-popover") as DsPopover;
    const onOpenChange = vi.fn();
    host.addEventListener("open-change", (event) =>
      onOpenChange((event as CustomEvent<{ open: boolean }>).detail.open),
    );
    return { host, onOpenChange };
  };
  const card = () => document.querySelector<HTMLElement>(".popover__content")!;
  // pointerenter and pointerleave do not bubble: the wrapper is the target.
  const wrap = () => document.querySelector<HTMLElement>(".popover__hover-trigger")!;

  it("is closed by default", () => {
    mountHover();
    expect(card()).not.toBeVisible();
  });

  it("opens on keyboard focus of the trigger without moving focus", () => {
    const { onOpenChange } = mountHover();
    screen.getByRole("link", { name: "@ada" }).focus();
    expect(card()).toBeVisible();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(card().contains(document.activeElement)).toBe(false);
  });

  it("opens on pointer enter and closes on pointer leave", () => {
    mountHover();
    fireEvent.pointerEnter(wrap());
    expect(card()).toBeVisible();
    fireEvent.pointerLeave(wrap());
    expect(card()).not.toBeVisible();
  });

  it("opens the preview on the first click; once open the default proceeds", () => {
    mountHover();
    const link = screen.getByRole("link", { name: "@ada" });
    expect(fireEvent.click(link)).toBe(false);
    expect(card()).toBeVisible();
    expect(fireEvent.click(link)).toBe(true);
  });

  it("closes when focus leaves the trigger and the card", () => {
    mountHover();
    screen.getByRole("link", { name: "@ada" }).focus();
    expect(card()).toBeVisible();
    screen.getByRole("link", { name: "after" }).focus();
    expect(card()).not.toBeVisible();
  });

  it("closes on Escape", () => {
    mountHover();
    screen.getByRole("link", { name: "@ada" }).focus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(card()).not.toBeVisible();
  });

  it("holds no focusable content and no dialog role", () => {
    mountHover();
    fireEvent.pointerEnter(wrap());
    expect(
      card().querySelectorAll("a[href], button, input, select, textarea, [tabindex]"),
    ).toHaveLength(0);
    expect(card()).not.toHaveAttribute("role");
  });

  it("has no accessibility violations when open", async () => {
    mountHover();
    fireEvent.pointerEnter(wrap());
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
