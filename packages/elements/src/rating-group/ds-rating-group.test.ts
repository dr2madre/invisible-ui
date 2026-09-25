import { fireEvent, screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsRatingGroup } from "./ds-rating-group";

const mount = (html: string) => {
  document.body.innerHTML = html;
  return document.querySelector("ds-rating-group") as DsRatingGroup;
};
const group = () => screen.getByRole("radiogroup", { name: "Rating" });
const star = (name: string) => screen.getByRole<HTMLInputElement>("radio", { name });

describe("<ds-rating-group>", () => {
  it("renders a radiogroup of native stars named from the catalog", () => {
    mount(`<ds-rating-group label="Rating"></ds-rating-group>`);
    const stars = within(group()).getAllByRole<HTMLInputElement>("radio");
    expect(stars).toHaveLength(5);
    expect(star("1 star")).toBeInTheDocument();
    expect(star("3 stars")).toBeInTheDocument();
    expect(group()).toHaveAttribute("aria-orientation", "horizontal");
    expect(stars[0]!.name).toBe(stars[4]!.name);
    expect(stars[0]!.name).not.toBe("");
  });

  it("respects max, also after the first render", () => {
    const host = mount(`<ds-rating-group label="Rating" max="10"></ds-rating-group>`);
    expect(within(group()).getAllByRole("radio")).toHaveLength(10);
    host.setAttribute("max", "3");
    expect(within(group()).getAllByRole("radio")).toHaveLength(3);
  });

  it("selects a rating on click and reports the number", async () => {
    const user = userEvent.setup();
    const host = mount(`<ds-rating-group label="Rating"></ds-rating-group>`);
    const seen: unknown[] = [];
    host.addEventListener("change", (event) => seen.push((event as CustomEvent).detail.value));

    await user.click(star("3 stars"));
    expect(seen).toEqual([3]);
    expect(host.value).toBe(3);
    expect(star("3 stars")).toBeChecked();
    // The pointer still over the stars shows the preview; the fill returns on leave.
    await user.unhover(group());
    expect(document.querySelectorAll(".rating__star--filled")).toHaveLength(3);
  });

  it("reflects a preselected value and a value set by the page", () => {
    const host = mount(`<ds-rating-group label="Rating" value="4"></ds-rating-group>`);
    expect(star("4 stars")).toBeChecked();
    host.value = 2;
    expect(star("2 stars")).toBeChecked();
    expect(document.querySelectorAll(".rating__star--filled")).toHaveLength(2);
    host.value = null;
    expect(
      within(group())
        .getAllByRole("radio")
        .some((input) => (input as HTMLInputElement).checked),
    ).toBe(false);
  });

  it("does not select when disabled", async () => {
    const user = userEvent.setup();
    const host = mount(`<ds-rating-group label="Rating" disabled></ds-rating-group>`);
    const onChange = vi.fn();
    host.addEventListener("change", onChange);

    await user.click(star("3 stars"));
    expect(onChange).not.toHaveBeenCalled();
    expect(group()).toHaveClass("rating--disabled");
    expect(star("3 stars")).toBeDisabled();
  });

  it("previews the stars under the pointer and drops the preview on leave", () => {
    mount(`<ds-rating-group label="Rating" value="1"></ds-rating-group>`);
    const labels = document.querySelectorAll(".rating__star");
    fireEvent.pointerEnter(labels[3]!);
    expect(document.querySelectorAll(".rating__star--preview")).toHaveLength(4);
    expect(document.querySelectorAll(".rating__star--filled")).toHaveLength(0);

    fireEvent.pointerLeave(group());
    expect(document.querySelectorAll(".rating__star--preview")).toHaveLength(0);
    expect(document.querySelectorAll(".rating__star--filled")).toHaveLength(1);
  });

  it("submits the rating under the field name", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `<form><ds-rating-group label="Rating" name="rating"></ds-rating-group></form>`;
    const form = document.querySelector("form")!;
    expect(new FormData(form).get("rating")).toBeNull();
    await user.click(star("4 stars"));
    expect(new FormData(form).get("rating")).toBe("4");
  });

  it("reads the star names from the locale provider around it", () => {
    document.body.innerHTML = `<ds-locale-provider locale="it"><ds-rating-group label="Rating"></ds-rating-group></ds-locale-provider>`;
    const provider = document.querySelector("ds-locale-provider") as HTMLElement & {
      messages: Record<string, unknown>;
    };
    provider.messages = { "rating.stars": { one: "{count} stella", other: "{count} stelle" } };
    expect(star("1 stella")).toBeInTheDocument();
    expect(star("3 stelle")).toBeInTheDocument();
  });

  it("the label and name attributes drive the group after the first render", () => {
    const host = mount(`<ds-rating-group label="Rating" name="rating"></ds-rating-group>`);
    host.setAttribute("label", "Score");
    host.setAttribute("name", "score");
    expect(screen.getByRole("radiogroup", { name: "Score" })).toBeInTheDocument();
    expect(star("1 star").name).toBe("score");
  });

  it("has no accessibility violations", async () => {
    mount(`<ds-rating-group label="Rating" value="3"></ds-rating-group>`);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
