import { fireEvent, render, screen } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Notification } from "./Notification";

describe("Vue Notification (styled)", () => {
  it("renders a status live region with title and text, closable by default", () => {
    render(Notification, { props: { title: "Saved", text: "All good", duration: 0 } });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("All good")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    const onClose = vi.fn();
    render(Notification, { props: { title: "Hi", duration: 0, onClose } });
    await fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledWith("user");
  });

  it("renders action buttons that run and then dismiss", async () => {
    const onClose = vi.fn();
    const onClick = vi.fn();
    render(Notification, {
      props: { title: "Deleted", duration: 0, onClose, actions: [{ label: "Undo", onClick }] },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledWith("action");
  });

  it("keepOpen actions do not dismiss", async () => {
    const onClose = vi.fn();
    render(Notification, {
      props: { title: "Hi", duration: 0, onClose, actions: [{ label: "Details", keepOpen: true }] },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Details" }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders a high-contrast inverted surface when requested", () => {
    render(Notification, { props: { title: "Offline", duration: 0, inverted: true } });
    expect(screen.getByRole("status")).toHaveAttribute("data-inverted");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Notification, {
      props: { title: "Saved", text: "x", duration: 0 },
    });
    expect(await axe(container)).toHaveNoViolations();
  });

  describe("timing", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("auto-dismisses after the duration", () => {
      const onClose = vi.fn();
      render(Notification, { props: { title: "Hi", duration: 1000, onClose } });
      expect(onClose).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1000);
      expect(onClose).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledWith("timeout");
    });

    it("does not auto-dismiss when duration is 0", () => {
      const onClose = vi.fn();
      render(Notification, { props: { title: "Hi", duration: 0, onClose } });
      vi.advanceTimersByTime(10000);
      expect(onClose).not.toHaveBeenCalled();
    });

    it("holds the countdown while paused, resumes when released", async () => {
      const onClose = vi.fn();
      // The region drives pausing for the whole stack via the `paused` prop.
      const { rerender } = render(Notification, {
        props: { title: "Hi", duration: 1000, paused: true, onClose },
      });

      vi.advanceTimersByTime(5000);
      expect(onClose).not.toHaveBeenCalled();

      await rerender({ title: "Hi", duration: 1000, paused: false, onClose });
      vi.advanceTimersByTime(1000);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("restarts the countdown when the duration changes", async () => {
      const onClose = vi.fn();
      const { rerender } = render(Notification, {
        props: { title: "Saving…", duration: 0, onClose },
      });

      vi.advanceTimersByTime(10000);
      expect(onClose).not.toHaveBeenCalled();

      // A promise notification swapping loading → success gains a duration.
      await rerender({ title: "Saved", duration: 500, onClose });
      vi.advanceTimersByTime(500);
      expect(onClose).toHaveBeenCalledWith("timeout");
    });
  });
});
