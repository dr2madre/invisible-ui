import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Notification } from "./Notification";

describe("React Notification", () => {
  it("renders a status with title and text, closable by default", () => {
    render(<Notification title="Saved" text="All good" />);
    expect(screen.getByRole("status", { name: "Saved" })).toBeInTheDocument();
    expect(screen.getByText("All good")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("calls onClose with the user reason when the close button is pressed", () => {
    const onClose = vi.fn();
    render(<Notification title="Hi" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledExactlyOnceWith("user");
  });

  it("renders action buttons that run and then dismiss", () => {
    const onClose = vi.fn();
    const onClick = vi.fn();
    render(
      <Notification title="Deleted" onClose={onClose} actions={[{ label: "Undo", onClick }]} />,
    );
    const undo = screen.getByRole("button", { name: "Undo" });
    expect(undo).toHaveAttribute("data-variant", "ghost");
    fireEvent.click(undo);
    expect(onClick).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledExactlyOnceWith("action");
  });

  it("keepOpen actions do not dismiss", () => {
    const onClose = vi.fn();
    render(
      <Notification
        title="Hi"
        onClose={onClose}
        actions={[{ label: "Details", keepOpen: true }]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Details" }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders a high-contrast inverted surface when requested", () => {
    render(<Notification title="Offline" inverted />);
    expect(screen.getByRole("status")).toHaveAttribute("data-inverted");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Notification title="Saved" text="x" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  describe("timing", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("auto-dismisses after the duration", () => {
      const onClose = vi.fn();
      render(<Notification title="Hi" duration={1000} onClose={onClose} />);
      act(() => vi.advanceTimersByTime(999));
      expect(onClose).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));
      expect(onClose).toHaveBeenCalledExactlyOnceWith("timeout");
    });

    it("does not auto-dismiss when duration is 0", () => {
      const onClose = vi.fn();
      render(<Notification title="Hi" onClose={onClose} />);
      act(() => vi.advanceTimersByTime(10000));
      expect(onClose).not.toHaveBeenCalled();
    });

    it("a notification taken away mid-countdown never fires", () => {
      const onClose = vi.fn();
      const { unmount } = render(<Notification title="Hi" duration={1000} onClose={onClose} />);
      act(() => vi.advanceTimersByTime(400));
      unmount();
      expect(vi.getTimerCount(), "the countdown was left running").toBe(0);
      act(() => vi.advanceTimersByTime(5000));
      expect(onClose).not.toHaveBeenCalled();
    });

    it("holds the countdown while paused, resumes with the time left", () => {
      const onClose = vi.fn();
      const { rerender } = render(<Notification title="Hi" duration={1000} onClose={onClose} />);
      act(() => vi.advanceTimersByTime(400));
      rerender(<Notification title="Hi" duration={1000} paused onClose={onClose} />);
      act(() => vi.advanceTimersByTime(5000));
      expect(onClose).not.toHaveBeenCalled();

      rerender(<Notification title="Hi" duration={1000} onClose={onClose} />);
      act(() => vi.advanceTimersByTime(599));
      expect(onClose).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("starts the countdown over when the duration changes", () => {
      const onClose = vi.fn();
      const { rerender } = render(<Notification title="Saving" onClose={onClose} />);
      act(() => vi.advanceTimersByTime(3000));
      rerender(<Notification title="Saved" duration={1000} onClose={onClose} />);
      act(() => vi.advanceTimersByTime(999));
      expect(onClose).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));
      expect(onClose).toHaveBeenCalledWith("timeout");
    });

    it("calls the latest onClose, swapped after mount", () => {
      const first = vi.fn();
      const second = vi.fn();
      const { rerender } = render(<Notification title="Hi" duration={1000} onClose={first} />);
      rerender(<Notification title="Hi" duration={1000} onClose={second} />);
      act(() => vi.advanceTimersByTime(1000));
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledOnce();
    });
  });
});
