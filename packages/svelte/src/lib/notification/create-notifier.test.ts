import { get } from "svelte/store";
import { describe, expect, it } from "vitest";
import { createNotifier } from "./create-notifier";

describe("createNotifier", () => {
  it("starts empty", () => {
    expect(get(createNotifier())).toEqual([]);
  });

  it("queues notices in order and returns ids", () => {
    const notifier = createNotifier();
    const a = notifier.show({ title: "A" });
    const b = notifier.show({ title: "B" });
    const items = get(notifier);
    expect(items.map((n) => n.title)).toEqual(["A", "B"]);
    expect(items.map((n) => n.id)).toEqual([a, b]);
    expect(a).not.toBe(b);
  });

  it("dismisses by id", () => {
    const notifier = createNotifier();
    const a = notifier.show({ title: "A" });
    notifier.show({ title: "B" });
    notifier.dismiss(a);
    expect(get(notifier).map((n) => n.title)).toEqual(["B"]);
  });

  it("clears all", () => {
    const notifier = createNotifier();
    notifier.show();
    notifier.show();
    notifier.clear();
    expect(get(notifier)).toEqual([]);
  });

  it("updates a notice in place, keeping its id", () => {
    const notifier = createNotifier();
    const id = notifier.show({ title: "A" });
    notifier.update(id, { title: "B", status: "success" });
    const items = get(notifier);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id, title: "B", status: "success" });
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

      expect(get(notifier)).toHaveLength(1);
      expect(get(notifier)[0]).toMatchObject({ status: "info", title: "Saving…", duration: 0 });

      resolve("now");
      await wrapped;

      expect(get(notifier)).toHaveLength(1);
      expect(get(notifier)[0]).toMatchObject({ status: "success", title: "Saved now" });
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

      expect(get(notifier)[0]).toMatchObject({ status: "danger", title: "Error: boom" });
    });
  });
});
