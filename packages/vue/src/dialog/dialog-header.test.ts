import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AlertDialog } from "../alert-dialog/AlertDialog";
import { ConfirmDialog } from "../confirm-dialog/ConfirmDialog";
import { PromptDialog } from "../prompt-dialog/PromptDialog";
import { SearchDialog } from "../search-dialog/SearchDialog";
import { SheetDialog } from "../sheet-dialog/SheetDialog";
import { Dialog } from "./Dialog";

// The header every dialog in the family shares: the same parts, the same
// classes, and a close button each dialog turns on or off.
const open = async (user: ReturnType<typeof userEvent.setup>, name = "Open") =>
  user.click(screen.getByRole("button", { name }));

describe("Vue dialog family header", () => {
  it("keeps the close button on Dialog by default and drops it on request", async () => {
    const { rerender } = render(Dialog, { props: { title: "Settings", open: true } });
    expect(await screen.findByRole("button", { name: "Close" })).toHaveClass(
      "dialog-header__close",
    );

    await rerender({ closeButton: false });
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Settings" })).toHaveClass("dialog-header__title");
  });

  it("shows the SheetDialog description as the subtitle inside the header", async () => {
    render(SheetDialog, {
      props: { title: "Filters", description: "Narrow the list", open: true },
    });
    const subtitle = await screen.findByText("Narrow the list");
    expect(subtitle).toHaveClass("dialog-header__subtitle");
    expect(subtitle.closest(".dialog-header")).not.toBeNull();
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription("Narrow the list");
  });

  it("gives AlertDialog an optional close button that acknowledges like Escape", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(AlertDialog, {
      props: { title: "Saved", description: "The file was saved.", closeButton: true, onDismiss },
    });
    await open(user);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("leaves AlertDialog, ConfirmDialog and PromptDialog without a close button by default", async () => {
    const user = userEvent.setup();
    render(AlertDialog, { props: { title: "Saved", description: "The file was saved." } });
    await open(user);
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Saved" })).toHaveClass("dialog-header__title");
  });

  it("closes ConfirmDialog from the close button without confirming", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(ConfirmDialog, {
      props: { title: "Archive the project?", closeButton: true, onConfirm },
    });
    await open(user);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes PromptDialog from the close button without confirming", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(PromptDialog, {
      props: { title: "Rename", label: "Name", value: "Draft", closeButton: true, onConfirm },
    });
    await open(user);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("hides the SearchDialog title by default and shows it with a close button on request", async () => {
    const user = userEvent.setup();
    const items = [{ value: "settings" }];
    const { unmount } = render(SearchDialog, { props: { items } });
    await open(user, "Search…");
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Search");
    expect(screen.getByRole("heading", { name: "Search" })).toHaveClass(
      "dialog-header__title--hidden",
    );
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    unmount();

    render(SearchDialog, { props: { items, hideTitle: false, closeButton: true } });
    await open(user, "Search…");
    expect(screen.getByRole("heading", { name: "Search" })).not.toHaveClass(
      "dialog-header__title--hidden",
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
