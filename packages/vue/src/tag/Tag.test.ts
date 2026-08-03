import { fireEvent, render, screen } from "@testing-library/vue";
import { h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Count } from "../count/Count";
import { LocaleProvider } from "../i18n/i18n";
import { Tag } from "./Tag";

const tag = () => document.querySelector<HTMLElement>(".tag")!;

const renderTag = (props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) =>
  render(Tag, { props, slots: { default: () => "In review", ...slots } });

describe("Vue Tag (styled)", () => {
  it("renders its text and reflects status/variant", () => {
    renderTag({ status: "success", variant: "solid" });
    expect(screen.getByText("In review")).toBeInTheDocument();
    expect(tag()).toHaveAttribute("data-status", "success");
    expect(tag()).toHaveAttribute("data-variant", "solid");
  });

  it("is not removable by default", () => {
    renderTag();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a labelled remove button and fires onRemove when removable", async () => {
    const onRemove = vi.fn();
    renderTag({ removable: true, removeLabel: "Remove review tag", onRemove });
    const button = screen.getByRole("button", { name: "Remove review tag" });
    await fireEvent.click(button);
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("takes the remove label from the locale catalog by default", () => {
    render(LocaleProvider, {
      props: { messages: { "tag.remove": "Rimuovi" } },
      slots: { default: () => h(Tag, { removable: true }, { default: () => "Bozza" }) },
    });
    expect(screen.getByRole("button", { name: "Rimuovi" })).toBeInTheDocument();
  });

  it("can host a Count in the trailing slot", () => {
    renderTag({}, { trailing: () => h(Count, { count: 3 }) });
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderTag({ removable: true, removeLabel: "Remove tag" });
    expect(await axe(container)).toHaveNoViolations();
  });
});
