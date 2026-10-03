import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useSearchDialog, type SearchDialogItem } from "./use-search-dialog";

const ITEMS: SearchDialogItem[] = [
  { value: "alpha", label: "Alpha" },
  { value: "beta", label: "Beta", disabled: true },
  { value: "gamma", label: "Gamma" },
];

/** The headless layer with markup the consumer owns. */
function Bare({
  onSelect,
  filter,
}: {
  onSelect?: (value: string) => void;
  filter?: (items: SearchDialogItem[], query: string) => SearchDialogItem[];
}) {
  const { api, dialogApi, open, items, inputValue, onInputChange, triggerRef, panelRef } =
    useSearchDialog({ items: ITEMS, onSelect, filter });
  return (
    <>
      <button {...dialogApi.triggerProps} ref={triggerRef} type="button">
        Find
      </button>
      {open ? (
        <dialog {...dialogApi.contentProps} ref={panelRef}>
          <h2 {...dialogApi.titleProps}>Find a page</h2>
          <label {...api.labelProps}>Page</label>
          <input
            {...api.inputProps}
            className="search-dialog__input"
            value={inputValue}
            onChange={onInputChange}
          />
          <ul {...api.listboxProps}>
            {items.map((item) => (
              <li key={item.value} {...api.getOptionProps(item.value)}>
                {item.label}
              </li>
            ))}
          </ul>
        </dialog>
      ) : null}
    </>
  );
}

describe("useSearchDialog (headless)", () => {
  it("drives a consumer's own markup", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Bare onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Find" }));
    expect(screen.getByRole("dialog", { name: "Find a page" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Page" })).toHaveFocus();

    await user.type(screen.getByRole("combobox"), "a");
    // The first enabled match is highlighted: Beta is disabled.
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith("gamma");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("runs a custom filter", async () => {
    const user = userEvent.setup();
    const startsWith = (items: SearchDialogItem[], query: string) =>
      items.filter((item) => item.value.startsWith(query));
    render(<Bare filter={startsWith} />);

    await user.click(screen.getByRole("button", { name: "Find" }));
    await user.type(screen.getByRole("combobox"), "g");
    expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(1);
  });
});
