import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./form-composition.fixture.svelte";

// Composition contract B: one native form composing native controls and every
// hidden-input family. The unit of assertion is the whole FormData payload,
// name AND order, not any single control.

const entries = (form: HTMLFormElement) => [...new FormData(form).entries()];

describe("Svelte form composition", () => {
  it("serializes exactly the accepted values in source order", () => {
    render(Fixture, {});
    const form = screen.getByTestId("composed-form") as HTMLFormElement;
    expect(entries(form)).toEqual([
      ["name", "Ada"],
      ["subscribe", "yes"],
      ["country", "it"],
      ["fruit", "pear"],
      ["skills", "svelte"],
      ["skills", "vue"],
      ["amount", "1234.5"],
      ["time", "09:30"],
      ["due", "2026-06-15"],
    ]);
  });

  it("keeps focus and drafts when application errors are inserted mid-edit", async () => {
    const { rerender } = render(Fixture, {});
    const name = screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement;
    const amount = screen.getByRole("spinbutton", { name: "Amount" }) as HTMLInputElement;
    amount.focus();
    await fireEvent.input(amount, { target: { value: "7," } });
    await rerender({
      nameError: "Name is taken",
      amountError: "Amount is wrong",
      timeError: "Too early",
    });
    // The invalid states arrive without erasing input or moving focus.
    expect(document.activeElement).toBe(amount);
    expect(amount.value).toBe("7,");
    expect(name.value).toBe("Ada");
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(amount).toHaveAttribute("aria-invalid", "true");
    // Each error is announced by its own field, not a shared region.
    expect(screen.getByText("Name is taken")).toBeVisible();
    expect(screen.getByText("Too early")).toBeVisible();
  });

  it("does not double-notify on reflection or reset", async () => {
    const onNameChange = vi.fn();
    const onAmountChange = vi.fn();
    const onAmountCommit = vi.fn();
    const { rerender } = render(Fixture, {
      props: { onNameChange, onAmountChange, onAmountCommit },
    });
    const amount = screen.getByRole("spinbutton", { name: "Amount" }) as HTMLInputElement;
    await fireEvent.input(amount, { target: { value: "7" } });
    expect(onAmountChange).toHaveBeenCalledTimes(1);
    // Reflected give-back of the reported value stays silent.
    await rerender({ onNameChange, onAmountChange, onAmountCommit });
    expect(onAmountChange).toHaveBeenCalledTimes(1);
    const form = screen.getByTestId("composed-form") as HTMLFormElement;
    form.reset();
    await Promise.resolve();
    // Reset restores the mount payload without emitting any callback.
    expect(onAmountChange).toHaveBeenCalledTimes(1);
    expect(onAmountCommit).not.toHaveBeenCalled();
    expect(onNameChange).not.toHaveBeenCalled();
    expect(new FormData(form).get("amount")).toBe("1234.5");
  });

  it("keeps two composed instances apart: unique ids, independent payloads", () => {
    render(Fixture, { props: { second: true } });
    const ids = [...document.querySelectorAll("[id]")].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    const first = screen.getByTestId("composed-form") as HTMLFormElement;
    const second = screen.getByTestId("second-form") as HTMLFormElement;
    expect(new FormData(first).get("name")).toBe("Ada");
    expect(new FormData(second).get("name")).toBe("Grace");
    expect(new FormData(second).getAll("skills")).toEqual(["react"]);
  });

  it("has no axe violations with errors shown", async () => {
    const { container } = render(Fixture, {
      props: { nameError: "Name is taken", amountError: "Amount is wrong" },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
