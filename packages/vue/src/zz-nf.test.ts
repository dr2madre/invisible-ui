import { render, screen } from "@testing-library/vue";
import { defineComponent, h, reactive } from "vue";
import { expect, it } from "vitest";
import { NumberField } from "./number-field/NumberField";

const settled = () => new Promise((r) => setTimeout(r, 0));

it("nf trace", async () => {
  const live = reactive<Record<string, unknown>>({ label: "Amount", name: "amount", value: 10 });
  render(
    defineComponent({
      setup: () => () => h("form", { "data-testid": "host" }, [h(NumberField, live as never)]),
    }),
  );
  const form = screen.getByTestId("host") as HTMLFormElement;
  const input = screen.getByRole("spinbutton", { name: "Amount" }) as HTMLInputElement;
  console.log(
    "DBG mount payload:",
    String(new FormData(form).get("amount")),
    "display:",
    input.value,
  );
  live.value = 25;
  await settled();
  console.log(
    "DBG after prop move:",
    String(new FormData(form).get("amount")),
    "display:",
    input.value,
  );
  input.value = "77";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settled();
  console.log("DBG after edit:", String(new FormData(form).get("amount")));
  form.reset();
  await settled();
  console.log("DBG after reset:", String(new FormData(form).get("amount")));
  expect(true).toBe(true);
});
