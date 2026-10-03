import { act, type ReactElement } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "./button/Button";
import { Checkbox } from "./checkbox/Checkbox";
import { Combobox } from "./combobox/Combobox";
import { MultiSelect } from "./multi-select/MultiSelect";
import { AlertDialog } from "./alert-dialog/AlertDialog";
import { ConfirmDialog } from "./confirm-dialog/ConfirmDialog";
import { Dialog } from "./dialog/Dialog";
import { PromptDialog } from "./prompt-dialog/PromptDialog";
import { SearchDialog } from "./search-dialog/SearchDialog";
import { SheetDialog } from "./sheet-dialog/SheetDialog";
import { Icon } from "./icon/Icon";
import { LocaleProvider } from "./i18n/i18n";
import { Select } from "./select/Select";
import { Switch } from "./switch/Switch";

function HydrationFixture(): ReactElement {
  return (
    <LocaleProvider locale="en-US">
      <main>
        <Button>Save</Button>
        <Checkbox label="Accept" checked />
        <Switch label="Notifications" checked onOff />
        <Select label="Fruit" items={[{ value: "apple", label: "Apple" }]} value="apple" />
        <Combobox
          label="Framework"
          items={[
            { value: "react", label: "React" },
            { value: "svelte", label: "Svelte" },
          ]}
          value="react"
        />
        <MultiSelect
          label="Skills"
          items={[
            { value: "react", label: "React" },
            { value: "svelte", label: "Svelte" },
          ]}
          values={["react"]}
        />
        <Dialog title="Details" trigger="Open details">
          Dialog body
        </Dialog>
        <AlertDialog title="File deleted" description="The file is gone." trigger="Show alert" />
        <ConfirmDialog title="Discard changes?" trigger="Discard" />
        <PromptDialog title="Rename file" label="File name" value="report" trigger="Rename" />
        <SheetDialog title="Filters" trigger="Filters" draggable side="bottom">
          Sheet body
        </SheetDialog>
        <SearchDialog items={[{ value: "save", label: "Save", shortcut: ["⌘", "S"] }]} />
        <Icon label="Add">
          <path d="M12 5v14M5 12h14" />
        </Icon>
      </main>
    </LocaleProvider>
  );
}

/** The dialog family rendered open on the server: the panels are in the HTML. */
function OpenDialogsFixture(): ReactElement {
  return (
    <LocaleProvider locale="en-US">
      <AlertDialog open title="File deleted" description="The file is gone." />
      <PromptDialog open title="Rename file" label="File name" value="report" />
      <SearchDialog open items={[{ value: "save", label: "Save", group: "Actions" }]} />
    </LocaleProvider>
  );
}

/** Hydrate a fixture over its own server HTML; returns the host and the errors seen. */
async function hydrate(fixture: ReactElement) {
  document.body.innerHTML = `<div id="app">${renderToString(fixture)}</div>`;
  const host = document.querySelector<HTMLElement>("#app")!;
  const recoverableError = vi.fn();
  const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
  let root: Root | undefined;
  await act(async () => {
    root = hydrateRoot(host, fixture, { onRecoverableError: recoverableError });
  });
  const hydrationErrors = error.mock.calls
    .flat()
    .map(String)
    .filter((message) => /hydration|did not match|server rendered/i.test(message));
  return {
    host,
    recoverableError,
    hydrationErrors,
    unmount: () => act(async () => root?.unmount()),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("React adapter hydration", () => {
  it("hydrates every public component without mismatches", async () => {
    const { host, recoverableError, hydrationErrors, unmount } = await hydrate(
      <HydrationFixture />,
    );

    expect(recoverableError).not.toHaveBeenCalled();
    expect(hydrationErrors).toEqual([]);
    expect(host.querySelector("main")).not.toBeNull();
    expect(host.querySelector('[role="combobox"]')).not.toBeNull();
    expect(host.querySelector('[role="dialog"], [role="alertdialog"]')).toBeNull();
    expect(host.querySelectorAll('[aria-haspopup="dialog"]')).toHaveLength(6);
    expect(document.body.querySelector('[role="listbox"]')).not.toBeNull();

    await unmount();
  });

  it("hydrates open dialogs and shows them once in the browser", async () => {
    const shown = vi.spyOn(HTMLDialogElement.prototype, "showModal");
    const { host, recoverableError, hydrationErrors, unmount } = await hydrate(
      <OpenDialogsFixture />,
    );

    expect(recoverableError).not.toHaveBeenCalled();
    expect(hydrationErrors).toEqual([]);
    expect(host.querySelectorAll("dialog")).toHaveLength(3);
    expect(shown).toHaveBeenCalledTimes(3);

    await unmount();
  });
});
