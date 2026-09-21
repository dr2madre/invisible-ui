import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsTag } from "./ds-tag";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("<ds-tag>", () => {
  it("renders its light-DOM label and named regions", () => {
    document.body.innerHTML = `
      <ds-tag status="success" variant="solid">
        <span slot="icon">✓</span>
        Published
        <span slot="trailing">3</span>
      </ds-tag>`;
    const host = document.querySelector("ds-tag") as HTMLElement;
    expect(host.querySelector(".tag")).toHaveAttribute("data-status", "success");
    expect(host.querySelector(".tag")).toHaveAttribute("data-variant", "solid");
    expect(host.querySelector(".tag__label")).toHaveTextContent("Published");
    expect(host.querySelector(".tag__icon")).toHaveTextContent("✓");
    expect(host.querySelector(".tag__trailing")).toHaveTextContent("3");
  });

  it("reports one remove action and stays controlled", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = '<ds-tag removable remove-label="Remove filter">Filter</ds-tag>';
    const host = document.querySelector("ds-tag") as HTMLElement;
    const remove = vi.fn();
    host.addEventListener("remove", remove);
    await user.click(within(host).getByRole("button", { name: "Remove filter" }));
    expect(remove).toHaveBeenCalledTimes(1);
    expect(host.isConnected).toBe(true);
  });

  it("reflects removable and label attributes without losing the original label", () => {
    const host = document.createElement("ds-tag") as DsTag;
    host.textContent = "Original";
    document.body.appendChild(host);
    host.setAttribute("label", "Replacement");
    expect(host.querySelector(".tag__label")).toHaveTextContent("Replacement");
    host.removeAttribute("label");
    expect(host.querySelector(".tag__label")).toHaveTextContent("Original");
    host.removable = true;
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    host.removable = false;
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("has no accessibility violations", async () => {
    document.body.innerHTML = "<ds-tag removable>Filter</ds-tag>";
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
