import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";

import Calendar from "./calendar/Calendar.svelte";
import Carousel from "./carousel/Carousel.svelte";
import CodeBlock from "./code-block/CodeBlock.svelte";
import Combobox from "./combobox/Combobox.svelte";
import Dialog from "./dialog/Dialog.svelte";
import InlineNotification from "./inline-notification/InlineNotification.svelte";
import SheetDialog from "./sheet-dialog/SheetDialog.svelte";
import Tag from "./tag/Tag.svelte";
import TableView from "./table/TableView.svelte";

// These props are the only name their control has: the buttons they name carry
// an icon and no text. A default from the translation catalog covers the common
// case, and a consumer overriding it must win, or the override silently does
// nothing and the button keeps a name in the wrong language.

describe("accessible names a consumer overrides", () => {
  it("the dialog's close button takes the given name", () => {
    render(Dialog, { props: { open: true, title: "Edit", closeLabel: "Dismiss" } });
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("the combobox's clear button takes the given name", () => {
    render(Combobox, {
      props: {
        label: "Fruit",
        value: "apple",
        clearLabel: "Empty the field",
        items: [{ value: "apple", label: "Apple" }],
      },
    });
    expect(screen.getByRole("button", { name: "Empty the field" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it("the carousel's arrows take the given names", () => {
    render(Carousel, {
      props: {
        label: "Featured",
        items: [{ title: "One" }, { title: "Two" }],
        prevLabel: "Back one slide",
        nextLabel: "On one slide",
      },
    });
    expect(screen.getByRole("button", { name: "Back one slide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "On one slide" })).toBeInTheDocument();
  });

  it("the calendar's arrows take the given names", () => {
    render(Calendar, {
      props: {
        label: "Pick a day",
        focusedDate: "2026-06-15",
        prevLabel: "Month before",
        nextLabel: "Month after",
      },
    });
    expect(screen.getByRole("button", { name: "Month before" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Month after" })).toBeInTheDocument();
  });

  it("the notification's close button takes the given name", () => {
    render(InlineNotification, {
      props: { title: "Saved", closable: true, closeLabel: "Hide this" },
    });
    expect(screen.getByRole("button", { name: "Hide this" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("the sheet dialog's close button takes the given name", () => {
    render(SheetDialog, {
      props: { open: true, title: "Filters", closeLabel: "Put it away" },
    });
    expect(screen.getByRole("button", { name: "Put it away" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("the tag's remove button takes the given name", () => {
    render(Tag, { props: { removable: true, removeLabel: "Take Svelte off" } });
    expect(screen.getByRole("button", { name: "Take Svelte off" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("the code block's copy button takes the given name", () => {
    render(CodeBlock, { props: { code: "let x = 1;", copyLabel: "Take a copy" } });
    expect(screen.getByRole("button", { name: "Take a copy" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy code" })).not.toBeInTheDocument();
  });

  it("the table's column button takes the given name", () => {
    render(TableView, {
      props: {
        label: "People",
        configurable: true,
        configLabel: "Choose the columns",
        columns: [{ key: "name", header: "Name" }],
        rows: [{ id: "1", name: "Ada" }],
      },
    });
    expect(screen.getByRole("button", { name: "Choose the columns" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Columns" })).not.toBeInTheDocument();
  });
});
