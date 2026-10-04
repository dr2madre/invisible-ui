// @vitest-environment node
import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as adapter from "./index";

const fixtures: Record<string, ReactElement> = {
  Button: <adapter.Button>Save</adapter.Button>,
  Checkbox: <adapter.Checkbox label="Accept" />,
  Switch: <adapter.Switch label="Notifications" />,
  Select: <adapter.Select label="Fruit" items={[]} />,
  SearchField: <adapter.SearchField label="Search" />,
  TextField: <adapter.TextField label="Name" />,
  Combobox: <adapter.Combobox label="Framework" items={[]} />,
  MultiSelect: <adapter.MultiSelect label="Skills" items={[]} values={["vue"]} />,
  Dialog: <adapter.Dialog title="Details">Dialog body</adapter.Dialog>,
  AlertDialog: <adapter.AlertDialog title="File deleted" description="The file is gone." />,
  ConfirmDialog: <adapter.ConfirmDialog title="Discard changes?" />,
  PromptDialog: <adapter.PromptDialog title="Rename file" label="File name" />,
  SheetDialog: <adapter.SheetDialog title="Filters">Sheet body</adapter.SheetDialog>,
  SearchDialog: <adapter.SearchDialog items={[{ value: "save", label: "Save" }]} />,
  Popover: <adapter.Popover triggerContent="Details">Popover body</adapter.Popover>,
  Tooltip: (
    <adapter.Tooltip text="Copy to clipboard">
      <button type="button">Copy</button>
    </adapter.Tooltip>
  ),
  DropdownMenu: (
    <adapter.DropdownMenu
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
  ),
  ContextMenu: (
    <adapter.ContextMenu items={[{ value: "reload", label: "Reload" }]}>
      <p>Region</p>
    </adapter.ContextMenu>
  ),
  Menubar: (
    <adapter.Menubar
      label="Main"
      menus={[{ value: "file", label: "File", items: [{ value: "new", label: "New" }] }]}
    />
  ),
  NavigationMenu: (
    <adapter.NavigationMenu
      label="Site"
      items={[
        { value: "docs", label: "Docs", links: [{ label: "Guide", href: "#guide" }] },
        { value: "blog", label: "Blog", href: "#blog" },
      ]}
    />
  ),
  Radio: <adapter.Radio name="plan" value="free" label="Free" checked />,
  RadioGroup: <adapter.RadioGroup label="Size" items={[{ value: "s" }]} value="s" />,
  CheckboxGroup: <adapter.CheckboxGroup label="Toppings" items={[{ value: "basil" }]} />,
  SegmentedControl: <adapter.SegmentedControl label="View" items={[{ value: "list" }]} />,
  ToggleButton: <adapter.ToggleButton label="Bold">B</adapter.ToggleButton>,
  ToggleGroup: (
    <adapter.ToggleGroup label="Formatting">
      <adapter.ToggleButton label="Bold">B</adapter.ToggleButton>
    </adapter.ToggleGroup>
  ),
  Slider: <adapter.Slider label="Volume" value={30} />,
  RangeSlider: <adapter.RangeSlider label="Price" thumbLabels={["Minimum", "Maximum"]} />,
  NumberField: <adapter.NumberField label="Quantity" value={2} />,
  PinInput: <adapter.PinInput label="Code" length={4} />,
  RatingGroup: <adapter.RatingGroup label="Rating" value={3} />,
  Calendar: <adapter.Calendar value="2026-06-15" />,
  DatePicker: <adapter.DatePicker label="Event date" value="2026-06-15" />,
  DateRangePicker: <adapter.DateRangePicker label="Stay" start="2026-06-10" end="2026-06-14" />,
  TimeField: <adapter.TimeField label="Start" value="09:30" />,
  Tabs: <adapter.Tabs label="Settings" items={[{ value: "a", label: "A", content: "Panel" }]} />,
  Accordion: <adapter.Accordion items={[{ value: "a", label: "A", content: "Panel" }]} />,
  Collapsible: <adapter.Collapsible label="Details">Body</adapter.Collapsible>,
  Breadcrumb: <adapter.Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Page" }]} />,
  Pagination: <adapter.Pagination page={2} pageCount={10} />,
  Stepper: <adapter.Stepper steps={[{ label: "Account" }, { label: "Review" }]} current={1} />,
  Sidebar: (
    <adapter.Sidebar
      value="home"
      sections={[{ label: "Main", items: [{ value: "home", label: "Home", href: "/" }] }]}
    />
  ),
  TreeView: (
    <adapter.TreeView
      label="Files"
      nodes={[{ value: "src", children: [{ value: "index.ts" }] }]}
      expanded={["src"]}
    />
  ),
  ButtonGroup: (
    <adapter.ButtonGroup label="Alignment">
      <adapter.Button>Left</adapter.Button>
    </adapter.ButtonGroup>
  ),
  Separator: <adapter.Separator />,
  Avatar: <adapter.Avatar name="Ada Lovelace" src="/ada.png" />,
  AvatarGroup: (
    <adapter.AvatarGroup label="Team" items={[{ name: "Ada" }, { name: "Grace" }]} max={1} />
  ),
  Count: <adapter.Count count={3} label="3 unread messages" />,
  Tag: <adapter.Tag removable>Draft</adapter.Tag>,
  Kbd: <adapter.Kbd keys={["Ctrl", "K"]} />,
  Code: <adapter.Code>pnpm install</adapter.Code>,
  CodeBlock: <adapter.CodeBlock code="pnpm install" language="bash" />,
  Blockquote: <adapter.Blockquote cite="Ada Lovelace">A quote.</adapter.Blockquote>,
  Skeleton: <adapter.Skeleton lines={2} />,
  AspectRatio: <adapter.AspectRatio ratio={16 / 9}>Media</adapter.AspectRatio>,
  ScrollArea: <adapter.ScrollArea label="Logs">Content</adapter.ScrollArea>,
  Progress: <adapter.Progress value={40} label="Upload" />,
  Meter: <adapter.Meter value={40} label="Storage" />,
  Link: <adapter.Link href="/guide">Guide</adapter.Link>,
  Label: <adapter.Label htmlFor="name">Name</adapter.Label>,
  Field: (
    <adapter.Field label="Email" error="Required">
      {({ controlProps }) => <input {...controlProps} />}
    </adapter.Field>
  ),
  Card: <adapter.Card title="Revenue" variant="dashboard" value="€48k" />,
  FeedbackIcon: <adapter.FeedbackIcon status="success" label="Done" />,
  Loading: <adapter.Loading variant="bar" value={40} label="Upload" />,
  LoadingGenerationArea: <adapter.LoadingGenerationArea status="Rendering…" value={40} />,
  EmptyState: <adapter.EmptyState title="No projects yet" actionLabel="Add a project" />,
  ErrorState: <adapter.ErrorState title="Couldn't load" actionLabel="Try again" />,
  InlineNotification: (
    <adapter.InlineNotification title="Heads up" description="Details." href="/docs" closable />
  ),
  Notification: <adapter.Notification title="Saved" text="All good" duration={3000} />,
  // The region renders in the browser only; the wrapper gives the check markup.
  NotificationRegion: (
    <div>
      <adapter.NotificationRegion notifier={adapter.createNotifier()} />
    </div>
  ),
  Textarea: <adapter.Textarea label="Message" value="Hello" />,
  Table: (
    <adapter.Table
      caption="People"
      columns={[{ key: "name", header: "Name", sortable: true }]}
      rows={[{ id: 1, name: "Ada" }]}
      sort={{ key: "name", direction: "asc" }}
    />
  ),
  TableSet: (
    <adapter.TableSet
      title="People"
      caption="People"
      columns={[{ key: "name", header: "Name", sortable: true }]}
      rows={[{ id: 1, name: "Ada" }]}
      pageSize={10}
      configurable
      allowViewToggle
    />
  ),
  Toolbar: (
    <adapter.Toolbar label="Text formatting">
      <button type="button">Bold</button>
    </adapter.Toolbar>
  ),
  Carousel: <adapter.Carousel label="Featured" items={[{ title: "One" }, { title: "Two" }]} />,
  LoginForm: <adapter.LoginForm providers={[{ id: "google", label: "Google" }]} />,
  UploadDropArea: <adapter.UploadDropArea accept="image/*" caption="PNG up to 5 MB" />,
  Icon: (
    <adapter.Icon label="Add">
      <path d="M12 5v14M5 12h14" />
    </adapter.Icon>
  ),
  LocaleProvider: (
    <adapter.LocaleProvider locale="en-US">
      <span>Localized content</span>
    </adapter.LocaleProvider>
  ),
};

const publicComponentNames = Object.entries(adapter)
  .filter(
    ([name, value]) =>
      /^[A-Z]/.test(name) &&
      (typeof value === "function" ||
        (typeof value === "object" && value !== null && "$$typeof" in value)),
  )
  .map(([name]) => name)
  .sort();

describe("React adapter SSR", () => {
  it("covers every public renderable export", () => {
    // React components are the capitalized function exports plus forwardRef
    // objects. A new public component fails here until it gets a valid fixture.
    expect(publicComponentNames).toEqual(Object.keys(fixtures).sort());
  });

  for (const [name, element] of Object.entries(fixtures)) {
    it(`server-renders ${name} without a DOM`, () => {
      const html = renderToString(element);

      expect(html.length).toBeGreaterThan(0);
    });
  }
});

describe("React adapter SSR: the dialog family opened on the server", () => {
  // An open dialog renders its panel on the server too; showModal() waits for
  // the browser, so the markup is there with nothing touching the DOM.
  it.each([
    ["AlertDialog", <adapter.AlertDialog key="a" open title="Saved" description="Done." />],
    ["ConfirmDialog", <adapter.ConfirmDialog key="c" open title="Discard changes?" />],
    ["PromptDialog", <adapter.PromptDialog key="p" open title="Rename" label="Name" value="a" />],
    ["SheetDialog", <adapter.SheetDialog key="s" open draggable side="bottom" title="Filters" />],
    ["SearchDialog", <adapter.SearchDialog key="q" open items={[{ value: "a", label: "A" }]} />],
  ])("server-renders an open %s", (_, element) => {
    const html = renderToString(element);
    expect(html).toContain("<dialog");
    expect(html).toContain('aria-modal="true"');
  });
});

describe("React adapter SSR: overlays open on the server", () => {
  // A portalled overlay waits for the browser, so an open one renders its
  // trigger on the server, stated open, and no panel.
  it.each([
    [
      "Popover",
      <adapter.Popover key="p" open triggerContent="Details">
        Body
      </adapter.Popover>,
    ],
    [
      "NavigationMenu",
      <adapter.NavigationMenu
        key="n"
        label="Site"
        value="docs"
        items={[{ value: "docs", label: "Docs", links: [{ label: "Guide", href: "#guide" }] }]}
      />,
    ],
  ])("server-renders an open %s as its trigger", (_, element) => {
    const html = renderToString(element);
    expect(html).toContain('aria-expanded="true"');
    expect(html).not.toContain("Guide");
  });
});

describe("React adapter SSR — i18n determinism", () => {
  it("renders locale scopes independently of the host locale, with lang and dir", () => {
    const italian = renderToString(
      <adapter.LocaleProvider locale="it-IT">
        <adapter.Combobox label="Frutta" items={[]} />
      </adapter.LocaleProvider>,
    );
    expect(italian).toContain('lang="it-IT"');
    const arabic = renderToString(
      <adapter.LocaleProvider locale="ar-EG">
        <span>x</span>
      </adapter.LocaleProvider>,
    );
    expect(arabic).toContain('dir="rtl"');
    expect(arabic).toContain('lang="ar-EG"');
  });
});

describe("React adapter SSR: the notification region", () => {
  // The region mounts in <body> through a portal, which waits for the
  // browser: the server renders none of it, queued notifications included.
  it("renders nothing on the server", () => {
    const notifier = adapter.createNotifier();
    notifier.info("Welcome back");
    expect(renderToString(<adapter.NotificationRegion notifier={notifier} />)).toBe("");
  });
});
