import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Label } from "./Label";
import { useLabel } from "./use-label";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const Fixture = defineComponent({
  props: { required: { type: Boolean, default: false } },
  setup(props) {
    return () => [
      h(Label, { for: "name", required: props.required }, { default: () => "Full name" }),
      h("input", { id: "name", type: "text" }),
    ];
  },
});

// The headless composable, for consumers rendering their own label markup.
const HeadlessFixture = defineComponent({
  setup() {
    const api = useLabel(() => ({ for: "email", id: "email-label" }));
    return () => [
      h("label", { ...api.value.rootProps }, "Email"),
      h("input", { id: "email", type: "email" }),
    ];
  },
});

describe("Vue Label (styled)", () => {
  it("labels the control and focuses it on click", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const input = screen.getByLabelText("Full name");
    expect(input).toHaveAttribute("id", "name");

    await user.click(screen.getByText("Full name"));
    expect(input).toHaveFocus();
  });

  it("shows a required marker hidden from assistive tech", () => {
    const { container } = render(Fixture, { props: { required: true } });
    const marker = screen.getByText("*");
    expect(marker).toHaveAttribute("aria-hidden", "true");
    // The association still holds with the marker present.
    const label = container.querySelector("label.label")!;
    expect(label).toHaveAttribute("for", "name");
    expect(screen.getByRole("textbox")).toHaveAttribute("id", "name");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { required: true } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});

describe("Vue label (headless composable)", () => {
  it("associates the label with its control via for/id", () => {
    render(HeadlessFixture);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("id", "email");
    const label = screen.getByText("Email");
    expect(label).toHaveAttribute("for", "email");
    expect(label).toHaveAttribute("id", "email-label");
  });

  it("focuses the control when the label is clicked", async () => {
    const user = userEvent.setup();
    render(HeadlessFixture);
    await user.click(screen.getByText("Email"));
    expect(screen.getByLabelText("Email")).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(HeadlessFixture);
    expect(await axe(container)).toHaveNoViolations();
  });
});
