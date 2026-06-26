import { fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Notice from "./Notice.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Notice", () => {
  it("renders an alert with title and text, closable by default", () => {
    render(Notice, { props: { title: "Saved", text: "All good", duration: 0 } });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("All good")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("calls onclose when the close button is clicked", async () => {
    const onclose = vi.fn();
    render(Notice, { props: { title: "Hi", duration: 0, onclose } });
    await fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onclose).toHaveBeenCalledOnce();
  });

  it("renders action buttons that run and then dismiss", async () => {
    const onclose = vi.fn();
    const onClick = vi.fn();
    render(Notice, {
      props: { title: "Deleted", duration: 0, onclose, actions: [{ label: "Undo", onClick }] },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(onclose).toHaveBeenCalledOnce();
  });

  it("keepOpen actions do not dismiss", async () => {
    const onclose = vi.fn();
    render(Notice, {
      props: { title: "Hi", duration: 0, onclose, actions: [{ label: "Details", keepOpen: true }] },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Details" }));
    expect(onclose).not.toHaveBeenCalled();
  });

  it("renders a high-contrast inverted surface when requested", () => {
    render(Notice, { props: { title: "Offline", duration: 0, inverted: true } });
    expect(screen.getByRole("status")).toHaveAttribute("data-inverted");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Notice, { props: { title: "Saved", text: "x", duration: 0 } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });

  describe("timing", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("auto-dismisses after the duration", () => {
      const onclose = vi.fn();
      render(Notice, { props: { title: "Hi", duration: 1000, onclose } });
      expect(onclose).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1000);
      expect(onclose).toHaveBeenCalledOnce();
    });

    it("does not auto-dismiss when duration is 0", () => {
      const onclose = vi.fn();
      render(Notice, { props: { title: "Hi", duration: 0, onclose } });
      vi.advanceTimersByTime(10000);
      expect(onclose).not.toHaveBeenCalled();
    });

    it("pauses the countdown while hovered", async () => {
      const onclose = vi.fn();
      render(Notice, { props: { title: "Hi", duration: 1000, onclose } });
      // No wrapper: the live region (the Alert) is the element that pauses.
      const region = screen.getByRole("status");

      await fireEvent.mouseEnter(region);
      vi.advanceTimersByTime(5000);
      expect(onclose).not.toHaveBeenCalled();

      await fireEvent.mouseLeave(region);
      vi.advanceTimersByTime(1000);
      expect(onclose).toHaveBeenCalledOnce();
    });
  });
});
