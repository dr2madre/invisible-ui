import { defineComponent, h, ref } from "vue";
import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { usePagination } from "./use-pagination";

// The composable is public API on its own: these tests pin the callback
// conventions at that layer, where the styled component's own live wrapper
// cannot mask a capture (ADR 0011).

function harness(callbackRef: { value: ((page: number) => void) | undefined }) {
  return defineComponent({
    setup() {
      const { api, rootRef } = usePagination(() => ({
        page: 1,
        pageCount: 5,
        onPageChange: callbackRef.value,
      }));
      return () =>
        h("nav", { ref: rootRef }, [
          h("button", { onClick: () => api.value.setPage(3) }, "go to 3"),
        ]);
    },
  });
}

describe("usePagination (composable)", () => {
  it("calls only the replacement callback after the option is swapped", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const callback = ref<((page: number) => void) | undefined>(first);
    const user = userEvent.setup();
    render(harness(callback));

    callback.value = second;
    await user.click(screen.getByRole("button", { name: "go to 3" }));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith(3);
  });
});
