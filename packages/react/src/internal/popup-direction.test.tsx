import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DropdownMenu } from "../dropdown-menu/DropdownMenu";
import { Tooltip } from "../tooltip/Tooltip";

// A popup is portalled out of the wrapper, so it takes the direction of the
// control that opens it rather than the page's. There is no locale provider.
function Wrapped({ dir }: { dir: "ltr" | "rtl" }) {
  return (
    <div dir={dir}>
      <DropdownMenu label="Actions" items={[{ value: "copy", label: "Copy" }]} />
      <Tooltip text="Help">
        <button type="button">Info</button>
      </Tooltip>
    </div>
  );
}

describe("React popups in a plain dir wrapper", () => {
  it("a menu takes the direction of its trigger, and its arrows follow it", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Wrapped dir="rtl" />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menu")).toHaveAttribute("dir", "rtl");
    await user.keyboard("{Escape}");
    rerender(<Wrapped dir="ltr" />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menu")).toHaveAttribute("dir", "ltr");
  });

  it("a tooltip takes the direction of its trigger", async () => {
    render(<Wrapped dir="rtl" />);
    screen.getByRole("button", { name: "Info" }).focus();
    expect(await screen.findByRole("tooltip")).toHaveAttribute("dir", "rtl");
  });
});
