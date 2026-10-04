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
import { Popover } from "./popover/Popover";
import { Tooltip } from "./tooltip/Tooltip";
import { DropdownMenu } from "./dropdown-menu/DropdownMenu";
import { ContextMenu } from "./context-menu/ContextMenu";
import { Menubar } from "./menubar/Menubar";
import { NavigationMenu } from "./navigation-menu/NavigationMenu";
import { LocaleProvider } from "./i18n/i18n";
import { Select } from "./select/Select";
import { Switch } from "./switch/Switch";
import { Radio } from "./radio/Radio";
import { RadioGroup } from "./radio-group/RadioGroup";
import { CheckboxGroup } from "./checkbox-group/CheckboxGroup";
import { SegmentedControl } from "./segmented-control/SegmentedControl";
import { ToggleButton } from "./toggle-button/ToggleButton";
import { ToggleGroup } from "./toggle-group/ToggleGroup";
import { Slider } from "./slider/Slider";
import { RangeSlider } from "./range-slider/RangeSlider";
import { NumberField } from "./number-field/NumberField";
import { PinInput } from "./pin-input/PinInput";
import { RatingGroup } from "./rating-group/RatingGroup";
import { Calendar } from "./calendar/Calendar";
import { DatePicker } from "./date-picker/DatePicker";
import { DateRangePicker } from "./date-range-picker/DateRangePicker";
import { TimeField } from "./time-field/TimeField";
import { Tabs } from "./tabs/Tabs";
import { Accordion } from "./accordion/Accordion";
import { Collapsible } from "./collapsible/Collapsible";
import { Breadcrumb } from "./breadcrumb/Breadcrumb";
import { Pagination } from "./pagination/Pagination";
import { Stepper } from "./stepper/Stepper";
import { Sidebar } from "./sidebar/Sidebar";
import { TreeView } from "./tree-view/TreeView";
import { ButtonGroup } from "./button-group/ButtonGroup";
import { Separator } from "./separator/Separator";

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
        <Popover triggerContent="Details">Popover body</Popover>
        <Popover trigger="hover" triggerContent={<a href="#ada">@ada</a>}>
          Ada Lovelace
        </Popover>
        <Tooltip text="Copy to clipboard">
          <button type="button">Copy</button>
        </Tooltip>
        <DropdownMenu
          label="Actions"
          items={[
            { value: "rename", label: "Rename" },
            {
              type: "submenu",
              value: "share",
              label: "Share",
              items: [{ value: "email", label: "Email" }],
            },
          ]}
        />
        <ContextMenu items={[{ value: "reload", label: "Reload" }]}>
          <p>Region</p>
        </ContextMenu>
        <Menubar
          label="Main"
          menus={[{ value: "file", label: "File", items: [{ value: "new", label: "New" }] }]}
        />
        <NavigationMenu
          label="Site"
          items={[
            { value: "docs", label: "Docs", links: [{ label: "Guide", href: "#guide" }] },
            { value: "blog", label: "Blog", href: "#blog" },
          ]}
        />
        <Radio name="plan" value="free" label="Free" checked />
        <RadioGroup label="Size" items={[{ value: "s" }, { value: "m" }]} value="m" name="size" />
        <CheckboxGroup
          label="Toppings"
          items={[{ value: "basil" }, { value: "olives" }]}
          value={["basil"]}
        />
        <SegmentedControl
          label="View"
          items={[{ value: "list" }, { value: "grid" }]}
          value="grid"
        />
        <ToggleGroup label="Formatting" variant="segmented">
          <ToggleButton label="Bold" pressed check>
            B
          </ToggleButton>
          <ToggleButton label="Italic">I</ToggleButton>
        </ToggleGroup>
        <Slider label="Volume" value={30} showValue ticks step={10} />
        <RangeSlider
          label="Price"
          thumbLabels={["Minimum", "Maximum"]}
          value={[20, 80]}
          showValue
        />
        <NumberField label="Quantity" value={1234.5} min={0} name="quantity" description="Units." />
        <PinInput label="Code" length={4} value="12" name="code" />
        <RatingGroup label="Rating" value={3} name="rating" />
        <Calendar
          value="2026-06-15"
          views={["month", "week"]}
          events={[{ date: "2026-06-18", label: "Review" }]}
          prices={{ "2026-06-12": "€120" }}
        />
        <Calendar mode="range" rangeStart="2026-06-10" rangeEnd="2026-06-14" view="two-month" />
        <DatePicker label="Event date" value="2026-06-15" name="event" clearable />
        <DateRangePicker label="Stay" start="2026-06-10" end="2026-06-14" startName="from" />
        <TimeField label="Start" value="21:30" name="start" />
        <Tabs
          label="Settings"
          value="team"
          items={[
            { value: "account", label: "Account", content: "Account settings." },
            { value: "team", label: "Team", count: 3, content: "Team settings." },
          ]}
        />
        <Accordion
          items={[{ value: "shipping", label: "Shipping", content: "Ships in 3 days." }]}
          value={["shipping"]}
        />
        <Collapsible label="Details" open>
          Body
        </Collapsible>
        <Breadcrumb items={[{ label: "Home", href: "/", home: true }, { label: "Page" }]} />
        <Pagination page={6} pageCount={20} />
        <Stepper steps={[{ label: "Account" }, { label: "Review" }]} current={1} />
        <Sidebar
          value="daily"
          sections={[
            { label: "Main", items: [{ value: "home", label: "Home" }] },
            {
              id: "reports",
              label: "Reports",
              collapsible: true,
              items: [{ value: "daily", label: "Daily", href: "/daily" }],
            },
          ]}
        />
        <TreeView
          label="Files"
          nodes={[
            { value: "src", children: [{ value: "index.ts" }] },
            { value: "remote", hasChildren: true },
          ]}
          expanded={["src", "remote"]}
          loading={["remote"]}
          selected="index.ts"
        />
        <ButtonGroup label="Alignment">
          <Button>Left</Button>
          <Button>Right</Button>
        </ButtonGroup>
        <Separator />
        <Icon label="Add">
          <path d="M12 5v14M5 12h14" />
        </Icon>
      </main>
    </LocaleProvider>
  );
}

/** Overlays rendered open on the server: they open once hydrated. */
function OpenOverlaysFixture(): ReactElement {
  return (
    <LocaleProvider locale="en-US">
      <Popover open triggerContent="Details">
        Popover body
      </Popover>
      <NavigationMenu
        label="Site"
        value="docs"
        items={[{ value: "docs", label: "Docs", links: [{ label: "Guide", href: "#guide" }] }]}
      />
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
    expect(host.querySelectorAll('[aria-haspopup="dialog"]')).toHaveLength(9);
    expect(host.querySelectorAll('[aria-haspopup="menu"]')).toHaveLength(2);
    expect(host.querySelector('[role="menubar"]')).not.toBeNull();
    expect(host.querySelector("nav")).not.toBeNull();
    expect(document.body.querySelector('[role="listbox"]')).not.toBeNull();
    expect(host.querySelectorAll('[role="radiogroup"]')).toHaveLength(4);
    expect(host.querySelectorAll('[role="grid"]')).toHaveLength(3);
    expect(host.querySelector('[data-segment="dayPeriod"]')).toHaveTextContent("PM");
    expect(host.querySelectorAll('input[type="range"]')).toHaveLength(3);
    expect(host.querySelector('[role="spinbutton"]')).toHaveValue("1,234.5");
    expect(host.querySelector('[role="tab"][aria-selected="true"]')).toHaveTextContent("Team");
    expect(host.querySelector('[aria-current="page"].pagination__page')).toHaveTextContent("6");
    expect(host.querySelector('[aria-current="step"]')).toHaveTextContent("Review");
    expect(host.querySelector('[role="treeitem"][tabindex="0"]')).toHaveTextContent("index.ts");
    expect(host.querySelector(".tree__live")).toHaveTextContent("Loading remote…");
    expect(host.querySelector(".sidebar__group")).toHaveAttribute("aria-expanded", "true");

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

  it("hydrates open overlays and shows their panels once in the browser", async () => {
    const { recoverableError, hydrationErrors, unmount } = await hydrate(<OpenOverlaysFixture />);

    expect(recoverableError).not.toHaveBeenCalled();
    expect(hydrationErrors).toEqual([]);
    expect(document.body.querySelector(".popover__content")).not.toBeNull();
    expect(document.body.querySelector(".navmenu__content")).not.toBeNull();

    await unmount();
  });
});
