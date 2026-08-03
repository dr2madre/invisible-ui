import { render, screen, within } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { RatingGroup } from "./RatingGroup";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const group = () => screen.getByRole("radiogroup", { name: "Rating" });

describe("Vue RatingGroup (styled)", () => {
  it("renders a radiogroup of labelled stars", () => {
    render(RatingGroup, { props: { label: "Rating" } });
    expect(within(group()).getAllByRole("radio")).toHaveLength(5);
    expect(within(group()).getByRole("radio", { name: "1 star" })).toBeInTheDocument();
    expect(within(group()).getByRole("radio", { name: "3 stars" })).toBeInTheDocument();
  });

  it("respects max", () => {
    render(RatingGroup, { props: { label: "Rating", max: 10 } });
    expect(within(group()).getAllByRole("radio")).toHaveLength(10);
  });

  it("selects a rating on click and reports the number", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(RatingGroup, { props: { label: "Rating", onValueChange } });

    await user.click(screen.getByRole("radio", { name: "3 stars" }));
    expect(onValueChange).toHaveBeenLastCalledWith(3);
    expect(screen.getByRole("radio", { name: "3 stars" })).toBeChecked();
  });

  it("supports v-model: emits update:modelValue on selection", async () => {
    const user = userEvent.setup();
    const { emitted } = render(RatingGroup, { props: { label: "Rating", modelValue: null } });

    await user.click(screen.getByRole("radio", { name: "4 stars" }));
    expect(emitted("update:modelValue")).toEqual([[4]]);
  });

  it("reflects a preselected value", () => {
    render(RatingGroup, { props: { label: "Rating", value: 4 } });
    expect(screen.getByRole("radio", { name: "4 stars" })).toBeChecked();
  });

  it("fills the stars up to the selected one", () => {
    const { container } = render(RatingGroup, { props: { label: "Rating", value: 3 } });
    expect(container.querySelectorAll(".rating__star--filled")).toHaveLength(3);
  });

  it("previews the stars under the pointer", async () => {
    const user = userEvent.setup();
    const { container } = render(RatingGroup, { props: { label: "Rating", value: 1 } });

    await user.hover(screen.getByRole("radio", { name: "4 stars" }));
    expect(container.querySelectorAll(".rating__star--preview")).toHaveLength(4);
    expect(container.querySelectorAll(".rating__star--filled")).toHaveLength(0);
  });

  it("does not select when disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(RatingGroup, { props: { label: "Rating", disabled: true, onValueChange } });

    await user.click(screen.getByRole("radio", { name: "3 stars" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("submits the rating under the group name", async () => {
    const user = userEvent.setup();
    const Fixture = defineComponent({
      render: () =>
        h("form", { "data-testid": "form" }, [h(RatingGroup, { label: "Rating", name: "score" })]),
    });
    render(Fixture);
    const form = screen.getByTestId("form") as HTMLFormElement;

    await user.click(screen.getByRole("radio", { name: "2 stars" }));
    expect(new FormData(form).get("score")).toBe("2");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(RatingGroup, { props: { label: "Rating", value: 3 } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
