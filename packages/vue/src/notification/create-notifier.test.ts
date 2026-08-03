import { describe, expect, it, vi } from "vitest";
import { createNotifier, type Notifier } from "./create-notifier";

const items = (notifier: Notifier) => notifier.notifications.value;

describe("createNotifier", () => {
  it("starts empty", () => {
    expect(items(createNotifier())).toEqual([]);
  });

  it("queues notices in order and returns ids", () => {
    const notifier = createNotifier();
    const a = notifier.show({ title: "A" });
    const b = notifier.show({ title: "B" });
    const list = items(notifier);
    expect(list.map((n) => n.title)).toEqual(["A", "B"]);
    expect(list.map((n) => n.id)).toEqual([a, b]);
    expect(a).not.toBe(b);
  });

  it("dismisses by id", () => {
    const notifier = createNotifier();
    const a = notifier.show({ title: "A" });
    notifier.show({ title: "B" });
    notifier.dismiss(a);
    expect(items(notifier).map((n) => n.title)).toEqual(["B"]);
  });

  it("clears all", () => {
    const notifier = createNotifier();
    notifier.show();
    notifier.show();
    notifier.clear();
    expect(items(notifier)).toEqual([]);
  });

  it("updates a notice in place, keeping its id", () => {
    const notifier = createNotifier();
    const id = notifier.show({ title: "A" });
    notifier.update(id, { title: "B", status: "success" });
    const list = items(notifier);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id, title: "B", status: "success" });
  });

  it("status helpers set the status and title", () => {
    const notifier = createNotifier();
    notifier.success("Saved", { duration: 3000 });
    notifier.danger("Failed");
    const list = items(notifier);
    expect(list.map((n) => [n.status, n.title])).toEqual([
      ["success", "Saved"],
      ["danger", "Failed"],
    ]);
    expect(list[0].duration).toBe(3000);
  });

  it("replaces in place when show() is given a live id (dedup)", () => {
    const notifier = createNotifier();
    notifier.show({ id: "save", title: "Saving…" });
    notifier.show({ id: "save", title: "Saved", status: "success" });
    const list = items(notifier);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: "save", title: "Saved", status: "success" });
  });

  it("fires onDismiss with the reason and only once", () => {
    const notifier = createNotifier();
    const onDismiss = vi.fn();
    const id = notifier.show({ title: "Bye", onDismiss });
    notifier.dismiss(id, "timeout");
    notifier.dismiss(id, "user"); // already gone — must not fire again
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith("timeout");
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

  it("replacing by id does not fire the old onDismiss", () => {
    const notifier = createNotifier();
    const onDismiss = vi.fn();
    notifier.show({ id: "x", title: "One", onDismiss });
    notifier.show({ id: "x", title: "Two" });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  describe("promise", () => {
    it("shows a loading notice, then swaps to success", async () => {
      const notifier = createNotifier();
      let resolve!: (value: string) => void;
      const p = new Promise<string>((r) => (resolve = r));

      const wrapped = notifier.promise(p, {
        loading: "Saving…",
        success: (data) => `Saved ${data}`,
        error: "Failed",
      });

      expect(items(notifier)).toHaveLength(1);
      expect(items(notifier)[0]).toMatchObject({ status: "info", title: "Saving…", duration: 0 });

      resolve("now");
      await wrapped;

      expect(items(notifier)).toHaveLength(1);
      expect(items(notifier)[0]).toMatchObject({ status: "success", title: "Saved now" });
    });

    it("swaps to a danger notice on rejection and rethrows", async () => {
      const notifier = createNotifier();
      const p = Promise.reject(new Error("boom"));

      await expect(
        notifier.promise(p, {
          loading: "Loading",
          success: "OK",
          error: (e) => `Error: ${(e as Error).message}`,
        }),
      ).rejects.toThrow("boom");

      expect(items(notifier)[0]).toMatchObject({ status: "danger", title: "Error: boom" });
    });
  });
});
