import { describe, expect, it, vi } from "vitest";
import { createNotifier } from "./create-notifier";

describe("React createNotifier", () => {
  it("starts empty", () => {
    expect(createNotifier().getSnapshot()).toEqual([]);
  });

  it("queues notifications in order and returns ids", () => {
    const notifier = createNotifier();
    const a = notifier.show({ title: "A" });
    const b = notifier.show({ title: "B" });
    const items = notifier.getSnapshot();
    expect(items.map((n) => n.title)).toEqual(["A", "B"]);
    expect(items.map((n) => n.id)).toEqual([a, b]);
    expect(a).not.toBe(b);
  });

  it("numbers ids per notifier, not across notifiers", () => {
    const first = createNotifier();
    const firstIds = [first.show(), first.show()];
    const second = createNotifier();
    expect([second.show(), second.show()]).toEqual(firstIds);
  });

  it("tells its listeners after every change, with a new list each time", () => {
    const notifier = createNotifier();
    const listener = vi.fn();
    const stop = notifier.subscribe(listener);
    const before = notifier.getSnapshot();
    const id = notifier.show({ title: "A" });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(notifier.getSnapshot()).not.toBe(before);
    // The snapshot is stable between changes.
    expect(notifier.getSnapshot()).toBe(notifier.getSnapshot());
    stop();
    notifier.dismiss(id);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("dismisses by id", () => {
    const notifier = createNotifier();
    const a = notifier.show({ title: "A" });
    notifier.show({ title: "B" });
    notifier.dismiss(a);
    expect(notifier.getSnapshot().map((n) => n.title)).toEqual(["B"]);
  });

  it("clears all", () => {
    const notifier = createNotifier();
    notifier.show();
    notifier.show();
    notifier.clear();
    expect(notifier.getSnapshot()).toEqual([]);
  });

  it("updates a notification in place, keeping its id", () => {
    const notifier = createNotifier();
    const id = notifier.show({ title: "A" });
    notifier.update(id, { title: "B", status: "success" });
    const items = notifier.getSnapshot();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id, title: "B", status: "success" });
  });

  it("status helpers set the status and title", () => {
    const notifier = createNotifier();
    notifier.success("Saved", { duration: 3000 });
    notifier.danger("Failed");
    notifier.info("Note");
    notifier.warning("Careful");
    notifier.neutral("Tip");
    const items = notifier.getSnapshot();
    expect(items.map((n) => [n.status, n.title])).toEqual([
      ["success", "Saved"],
      ["danger", "Failed"],
      ["info", "Note"],
      ["warning", "Careful"],
      ["neutral", "Tip"],
    ]);
    expect(items[0]!.duration).toBe(3000);
  });

  it("replaces in place when show() is given a live id", () => {
    const notifier = createNotifier();
    notifier.show({ id: "save", title: "Saving…" });
    notifier.show({ id: "save", title: "Saved", status: "success" });
    const items = notifier.getSnapshot();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: "save", title: "Saved", status: "success" });
  });

  it("fires onDismiss with the reason and only once", () => {
    const notifier = createNotifier();
    const onDismiss = vi.fn();
    const id = notifier.show({ title: "Bye", onDismiss });
    notifier.dismiss(id, "timeout");
    notifier.dismiss(id, "user");
    expect(onDismiss).toHaveBeenCalledExactlyOnceWith("timeout");
  });

  it("dismiss() defaults the reason to api; clear() fires api for each", () => {
    const notifier = createNotifier();
    const a = vi.fn();
    const b = vi.fn();
    const id = notifier.show({ title: "A", onDismiss: a });
    notifier.show({ title: "B", onDismiss: b });
    notifier.dismiss(id);
    expect(a).toHaveBeenCalledWith("api");
    notifier.clear();
    expect(b).toHaveBeenCalledWith("api");
  });

  it("reports a dismissal after the list has changed (ADR 0011)", () => {
    const notifier = createNotifier();
    const seen: number[] = [];
    const id = notifier.show({ onDismiss: () => seen.push(notifier.getSnapshot().length) });
    notifier.show({ onDismiss: () => seen.push(notifier.getSnapshot().length) });
    notifier.dismiss(id);
    notifier.clear();
    expect(seen).toEqual([1, 0]);
  });

  it("keeps a replacement shown from inside a clear() handler", () => {
    const notifier = createNotifier();
    notifier.show({
      id: "sync",
      title: "Syncing",
      onDismiss: () => notifier.show({ id: "sync", title: "Sync stopped" }),
    });
    notifier.clear();
    expect(notifier.getSnapshot().map((n) => n.title)).toEqual(["Sync stopped"]);
  });

  it("replacing by id does not fire the old onDismiss", () => {
    const notifier = createNotifier();
    const onDismiss = vi.fn();
    notifier.show({ id: "x", title: "One", onDismiss });
    notifier.show({ id: "x", title: "Two" });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  describe("promise", () => {
    it("shows a loading notification, then swaps to success", async () => {
      const notifier = createNotifier();
      let resolve!: (value: string) => void;
      const p = new Promise<string>((r) => (resolve = r));
      const wrapped = notifier.promise(p, {
        loading: "Saving…",
        success: (data) => `Saved ${data}`,
        error: "Failed",
      });
      expect(notifier.getSnapshot()).toHaveLength(1);
      expect(notifier.getSnapshot()[0]).toMatchObject({
        status: "info",
        title: "Saving…",
        duration: 0,
        closable: false,
      });

      resolve("now");
      await wrapped;
      expect(notifier.getSnapshot()).toHaveLength(1);
      expect(notifier.getSnapshot()[0]).toMatchObject({
        status: "success",
        title: "Saved now",
        closable: true,
      });
    });

    it("swaps to a danger alert on rejection and rethrows", async () => {
      const notifier = createNotifier();
      await expect(
        notifier.promise(Promise.reject(new Error("boom")), {
          loading: "Loading",
          success: "OK",
          error: (e) => `Error: ${(e as Error).message}`,
        }),
      ).rejects.toThrow("boom");
      expect(notifier.getSnapshot()[0]).toMatchObject({
        status: "danger",
        title: "Error: boom",
        role: "alert",
      });
    });
  });
});
