import { fireEvent, screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsLocaleProvider } from "../locale-provider/ds-locale-provider";
import type { DsNotification } from "./ds-notification";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const mount = (html: string) => {
  document.body.innerHTML = html;
  return document.querySelector("ds-notification") as DsNotification;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("<ds-notification>", () => {
  it("renders a polite live region with title and text, closable by default", () => {
    mount(`<ds-notification title="Saved" text="All good"></ds-notification>`);
    const region = screen.getByRole("status", { name: "Saved" });
    expect(region.localName).toBe("ds-notification");
    expect(region.querySelector(".inline-notification")).toHaveAttribute("data-status", "info");
    expect(region).toHaveTextContent("All good");
    expect(within(region).getByRole("button", { name: "Close" })).toHaveClass("button--icon-only");
    expect(region.querySelector(".feedback-icon")).toHaveAttribute("aria-hidden", "true");
  });

  it("uses the alert role for urgent messages and drops the close button on request", () => {
    mount(`<ds-notification title="Failed" role="alert" closable="false"></ds-notification>`);
    expect(screen.getByRole("alert", { name: "Failed" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("closes from the close button with the user reason and removes itself", async () => {
    const host = mount(`<ds-notification title="Hi"></ds-notification>`);
    const close = vi.fn();
    host.addEventListener("close", (event) => close((event as CustomEvent).detail.reason));
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(close).toHaveBeenCalledWith("user");
    expect(host.isConnected).toBe(false);
  });

  it("stays in place when the close event is canceled", async () => {
    const host = mount(`<ds-notification title="Hi"></ds-notification>`);
    host.addEventListener("close", (event) => event.preventDefault());
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(host.isConnected).toBe(true);
  });

  it("renders action buttons that run and then dismiss", async () => {
    const host = mount(`<ds-notification title="Deleted"></ds-notification>`);
    const onClick = vi.fn();
    const close = vi.fn();
    host.addEventListener("close", (event) => close((event as CustomEvent).detail.reason));
    host.actions = [{ label: "Undo", onClick }];
    const undo = screen.getByRole("button", { name: "Undo" });
    expect(undo).toHaveAttribute("data-variant", "ghost");
    await userEvent.click(undo);
    expect(onClick).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledWith("action");
  });

  it("keepOpen actions do not dismiss", async () => {
    const host = mount(`<ds-notification title="Hi"></ds-notification>`);
    const close = vi.fn();
    host.addEventListener("close", close);
    host.actions = [{ label: "Details", keepOpen: true }];
    await userEvent.click(screen.getByRole("button", { name: "Details" }));
    expect(close).not.toHaveBeenCalled();
    expect(host.isConnected).toBe(true);
  });

  it("renders a high-contrast inverted surface and a snack without body text", () => {
    mount(`<ds-notification title="Offline" text="Hidden" inverted snack></ds-notification>`);
    const region = screen.getByRole("status");
    expect(region.firstElementChild).toHaveAttribute("data-inverted");
    expect(region.firstElementChild).toHaveAttribute("data-snack");
    expect(region).not.toHaveTextContent("Hidden");
  });

  it("treats the title and the text as text, never markup", () => {
    mount(
      `<ds-notification title="&lt;img src=x&gt;" text="&lt;b&gt;bold&lt;/b&gt;"></ds-notification>`,
    );
    const region = screen.getByRole("status");
    expect(region.querySelector("img, b")).toBeNull();
    expect(region).toHaveTextContent("<b>bold</b>");
  });

  it("reads the close label from the catalog, the attribute winning", () => {
    document.body.innerHTML = `
      <ds-locale-provider locale="it"><ds-notification title="Salvato"></ds-notification></ds-locale-provider>`;
    const provider = document.querySelector("ds-locale-provider") as DsLocaleProvider;
    provider.messages = { "inlineNotification.close": "Chiudi" };
    expect(screen.getByRole("button")).toHaveAccessibleName("Chiudi");
    document.querySelector("ds-notification")!.setAttribute("close-label", "Dismiss saved");
    expect(screen.getByRole("button")).toHaveAccessibleName("Dismiss saved");
  });

  it("keeps focus on the button it held when the content changes", () => {
    const host = mount(`<ds-notification title="Saving"></ds-notification>`);
    screen.getByRole("button", { name: "Close" }).focus();
    host.setAttribute("title", "Saved");
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    mount(`<ds-notification title="Saved" text="x"></ds-notification>`);
    expect(await axe(document.body, noAxeColorContrast)).toHaveNoViolations();
  });

  describe("timing", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("auto-dismisses after the duration", () => {
      const host = mount(`<ds-notification title="Hi" duration="1000"></ds-notification>`);
      const close = vi.fn();
      host.addEventListener("close", (event) => close((event as CustomEvent).detail.reason));
      vi.advanceTimersByTime(999);
      expect(close).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(close).toHaveBeenCalledWith("timeout");
    });

    it("does not auto-dismiss without a duration", () => {
      const host = mount(`<ds-notification title="Hi"></ds-notification>`);
      const close = vi.fn();
      host.addEventListener("close", close);
      vi.advanceTimersByTime(10_000);
      expect(close).not.toHaveBeenCalled();
    });

    it("a notification taken away mid-countdown never fires", () => {
      const host = mount(`<ds-notification title="Hi" duration="1000"></ds-notification>`);
      const close = vi.fn();
      host.addEventListener("close", close);
      vi.advanceTimersByTime(400);
      host.remove();
      expect(vi.getTimerCount(), "the countdown was left running").toBe(0);
      vi.advanceTimersByTime(5000);
      expect(close).not.toHaveBeenCalled();
    });

    it("holds the countdown while paused and resumes with the time left", () => {
      const host = mount(`<ds-notification title="Hi" duration="1000"></ds-notification>`);
      const close = vi.fn();
      host.addEventListener("close", close);
      vi.advanceTimersByTime(600);
      host.paused = true;
      vi.advanceTimersByTime(5000);
      expect(close).not.toHaveBeenCalled();
      host.paused = false;
      vi.advanceTimersByTime(399);
      expect(close).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(close).toHaveBeenCalledOnce();
    });

    it("restarts the countdown when the duration changes", () => {
      const host = mount(`<ds-notification title="Hi" duration="1000"></ds-notification>`);
      const close = vi.fn();
      host.addEventListener("close", close);
      vi.advanceTimersByTime(800);
      host.duration = 1000;
      host.setAttribute("duration", "2000");
      vi.advanceTimersByTime(1999);
      expect(close).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(close).toHaveBeenCalledOnce();
    });

    it("a click during the countdown still closes once", () => {
      const host = mount(`<ds-notification title="Hi" duration="1000"></ds-notification>`);
      const close = vi.fn();
      host.addEventListener("close", close);
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      vi.advanceTimersByTime(2000);
      expect(close).toHaveBeenCalledOnce();
    });
  });
});
