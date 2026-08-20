import { render } from "@testing-library/vue";
import { defineComponent, h, onMounted, ref } from "vue";
import { describe, expect, it } from "vitest";
import { scopedTeleport } from "./locale-teleport";

// The teleport target decides which layer an overlay lives in. Outside a
// dialog it is the body; inside a dialog it is that dialog, because a modal
// dialog paints above the body and makes it inert.

const scope = { locale: "en", dir: "ltr" as const, t: (key: string) => key };

const Harness = defineComponent({
  props: { inDialog: { type: Boolean, default: false } },
  setup(props) {
    const anchor = ref<HTMLElement | null>(null);
    const mounted = ref(false);
    onMounted(() => {
      mounted.value = true;
    });
    return () => {
      const overlay = mounted.value
        ? scopedTeleport(false, scope, anchor.value, [
            h("div", { "data-testid": "overlay" }, "overlay"),
          ])
        : null;
      const trigger = h("button", { ref: anchor }, "anchor");
      return props.inDialog
        ? h("dialog", { open: true, "data-testid": "dialog" }, [trigger, overlay])
        : h("div", [trigger, overlay]);
    };
  },
});

const overlay = () => document.querySelector("[data-testid='overlay']") as HTMLElement;

describe("scopedTeleport", () => {
  it("teleports to the body when no dialog encloses the anchor", async () => {
    render(Harness);
    await Promise.resolve();
    expect(overlay().closest("dialog")).toBeNull();
    // The scope wrapper carries lang/dir; the body is its layer.
    expect(overlay().parentElement?.getAttribute("lang")).toBe("en");
  });

  it("teleports into the dialog that encloses the anchor", async () => {
    render(Harness, { props: { inDialog: true } });
    await Promise.resolve();
    expect(overlay().closest("dialog")).not.toBeNull();
  });
});
