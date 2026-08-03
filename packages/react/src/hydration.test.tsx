import { act, type ReactElement } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "./button/Button";
import { Checkbox } from "./checkbox/Checkbox";
import { Combobox } from "./combobox/Combobox";
import { Dialog } from "./dialog/Dialog";
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
        <Dialog title="Details" trigger="Open details">
          Dialog body
        </Dialog>
        <Icon label="Add">
          <path d="M12 5v14M5 12h14" />
        </Icon>
      </main>
    </LocaleProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("React adapter hydration", () => {
  it("hydrates every public component without mismatches", async () => {
    const serverHtml = renderToString(<HydrationFixture />);
    document.body.innerHTML = `<div id="app">${serverHtml}</div>`;
    const host = document.querySelector<HTMLElement>("#app")!;
    const recoverableError = vi.fn();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    let root: Root | undefined;

    await act(async () => {
      root = hydrateRoot(host, <HydrationFixture />, {
        onRecoverableError: recoverableError,
      });
    });

    const hydrationErrors = error.mock.calls
      .flat()
      .map(String)
      .filter((message) => /hydration|did not match|server rendered/i.test(message));

    expect(recoverableError).not.toHaveBeenCalled();
    expect(hydrationErrors).toEqual([]);
    expect(host.querySelector("main")).not.toBeNull();
    expect(host.querySelector('[role="combobox"]')).not.toBeNull();
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.querySelector('[role="listbox"]')).not.toBeNull();

    await act(async () => root?.unmount());
  });
});
