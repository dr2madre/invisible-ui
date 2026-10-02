// The Elements accessibility lab page (elements-lab.html). Only what HTML
// cannot say lives here: data assigned as properties, and the application's
// side of each scenario (filtering, loading, answering a load request).
import "@design-system/elements/styles.css";
import "@design-system/elements/define";
import type {
  DsDialog,
  DsNavigationMenu,
  DsNotificationRegion,
  DsPopover,
  DsSidebar,
  DsTableSet,
  DsTabs,
  DsTreeView,
  TableColumnDef,
  TableRow,
  TreeLoadRequest,
  TreeNode,
} from "@design-system/elements";

const one = <T extends Element>(selector: string) => document.querySelector(selector) as T;

// Notifications: every button, on the page or in the dialog, goes to the
// page's region, which holds them while the dialog is open (ADR 0016). The
// failed upload is about the dialog's task, so it goes to the dialog's status
// area. Delegated, because the dialog moves its body when it renders.
let notices = 0;
document.addEventListener("click", (event) => {
  const target = event.target as Element;
  if (target.closest("[data-lab-upload]")) {
    notices += 1;
    const dialog = one<DsDialog>("[data-lab-share]");
    dialog.notify({
      status: "danger",
      title: `Upload ${notices} failed`,
      description: "The connection dropped.",
      action: { label: "Retry", onAction: () => {} },
    });
    return;
  }
  const button = target.closest<HTMLElement>("[data-notify]");
  if (!button) return;
  const region = one<DsNotificationRegion>("[data-lab-page-region]");
  notices += 1;
  if (button.dataset.notify === "assertive")
    region.show({ title: `Upload ${notices} failed`, status: "danger", role: "alert" });
  else region.show({ title: `Changes ${notices} saved`, status: "success" });
});

// Table Set: the application filters, the set announces the count.
const people: TableRow[] = [
  { id: 1, name: "Ada", city: "London" },
  { id: 2, name: "Grace", city: "New York" },
  { id: 3, name: "Alan", city: "London" },
  { id: 4, name: "Edsger", city: "Rotterdam" },
  { id: 5, name: "Barbara", city: "Boston" },
];
const peopleColumns: TableColumnDef[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "city", header: "City" },
];
const set = one<DsTableSet>("[data-lab-people]");
set.columns = peopleColumns;
set.rows = people;
set.setAttribute("total-row-count", String(people.length));
set.addEventListener("input", (event) => {
  const value = (event as CustomEvent<{ value?: unknown }>).detail?.value;
  if (typeof value !== "string") return;
  const query = value.trim().toLowerCase();
  set.toggleAttribute("filters-active", query !== "");
  set.rows = people.filter((row) => String(row.name).toLowerCase().includes(query));
});

// Loading and Count: every press changes the text the live region carries.
const statuses = ["Fetching rows", "Sorting rows", "Almost done"];
let status = 0;
one<HTMLElement>("[data-lab-loading-next]").addEventListener("click", () => {
  status = (status + 1) % statuses.length;
  one<HTMLElement>("[data-lab-loading]").setAttribute("status", statuses[status]!);
});
const counter = (button: string, count: string, noun: string) => {
  one<HTMLElement>(button).addEventListener("click", () => {
    const host = one<HTMLElement>(count);
    const next = Number(host.getAttribute("count") ?? "0") + 1;
    host.setAttribute("count", String(next));
    host.setAttribute("label", `${next} unread ${noun}${next === 1 ? "" : "s"}`);
  });
};
counter("[data-lab-count-add]", "[data-lab-count]", "message");
counter("[data-lab-badge-add]", "[data-lab-badge]", "notification");

// Tree View: the first load of "remote" fails, the retry succeeds.
const answerLoads = (tree: DsTreeView, nodes: TreeNode[]) => {
  let attempts = 0;
  tree.nodes = nodes;
  tree.addEventListener("load-children", (event) => {
    const { value } = (event as CustomEvent<TreeLoadRequest>).detail;
    attempts += 1;
    const fails = attempts === 1;
    tree.loadErrors = tree.loadErrors.filter((entry) => entry !== value);
    tree.loading = [...tree.loading, value];
    window.setTimeout(() => {
      tree.loading = tree.loading.filter((entry) => entry !== value);
      if (fails) {
        tree.loadErrors = [...tree.loadErrors, value];
        return;
      }
      tree.nodes = tree.nodes.map((node) =>
        node.value === value
          ? { ...node, children: [{ value: "remote/api.ts" }, { value: "remote/client.ts" }] }
          : node,
      );
    }, 1500);
  });
};
answerLoads(one<DsTreeView>("[data-lab-tree]"), [
  { value: "src", children: [{ value: "index.ts" }, { value: "button.ts" }] },
  { value: "remote", hasChildren: true },
  { value: "package.json" },
]);

// Tabs: two carry a count, one does not.
one<DsTabs>("[data-lab-tabs]").items = [
  { value: "inbox", label: "Inbox", count: 12, content: "Twelve messages." },
  { value: "sent", label: "Sent", content: "No count on this tab." },
  { value: "archive", label: "Archive", count: 3, content: "Three messages." },
];

// Sidebar: every destination has an icon, so the bar can collapse to a rail.
const HOME = "M3 12l9-9 9 9M5 10v10h14V10";
const CHART = "M4 20V10M10 20V4M16 20v-8M22 20H2";
one<DsSidebar>("[data-lab-sidebar]").sections = [
  {
    items: [
      { value: "home", label: "Home", icon: HOME },
      { value: "reports", label: "Reports", icon: CHART },
    ],
  },
];

// Error State and Empty State, inserted after load so a live one has
// something to announce.
const stateSlot = one<HTMLElement>("[data-lab-state-slot]");
document.addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLElement>("[data-lab-state]");
  if (!button) return;
  const error = button.dataset.labState === "error-state";
  const state = document.createElement(error ? "ds-error-state" : "ds-empty-state");
  state.setAttribute("title", error ? "The report did not load" : "No reports yet");
  state.setAttribute(
    "description",
    error ? "Check the connection and try again." : "Reports you create appear here.",
  );
  if (button.dataset.live === "true") state.setAttribute("live", "");
  stateSlot.replaceChildren(state);
});

// Table View: three more batches, then no more.
type LabTableView = HTMLElement & { columns: TableColumnDef[]; rows: TableRow[] };
const orders = one<LabTableView>("[data-lab-orders]");
const batch = (from: number) =>
  Array.from({ length: 8 }, (_, index) => ({
    id: from + index,
    order: `Order ${from + index}`,
    total: `${(from + index) * 7} EUR`,
  }));
orders.columns = [
  { key: "order", header: "Order" },
  { key: "total", header: "Total", align: "end" },
];
orders.rows = batch(1);
let batches = 0;
orders.addEventListener("load-more", () => {
  if (orders.hasAttribute("loading")) return;
  orders.setAttribute("loading", "");
  window.setTimeout(() => {
    batches += 1;
    orders.rows = [...orders.rows, ...batch(orders.rows.length + 1)];
    orders.removeAttribute("loading");
    if (batches === 3) orders.removeAttribute("has-more");
  }, 1000);
});

// Popover: the application closes it from a button inside the card.
one<HTMLElement>("[data-lab-popover-done]").addEventListener("click", (event) => {
  const popover = (event.currentTarget as Element).closest<DsPopover>("ds-popover");
  if (popover) popover.open = false;
});

// Navigation Menu: two panels and a plain link.
one<DsNavigationMenu>("[data-lab-nav]").items = [
  { value: "home", label: "Home", href: "#navigation-menu" },
  {
    value: "products",
    label: "Products",
    links: [
      { label: "Catalog", href: "#navigation-menu", description: "Every table in one place" },
      { label: "Lineage", href: "#navigation-menu" },
    ],
  },
  { value: "docs", label: "Docs", links: [{ label: "Guides", href: "#navigation-menu" }] },
];

// Right to left: the same widgets, inside dir="rtl".
one<DsTabs>("[data-lab-rtl-tabs]").items = [
  { value: "first", label: "First", content: "First panel." },
  { value: "second", label: "Second", content: "Second panel." },
  { value: "third", label: "Third", content: "Third panel." },
];
const rtlTree = one<DsTreeView>("[data-lab-rtl-tree]");
rtlTree.nodes = [
  { value: "documents", children: [{ value: "letters" }, { value: "invoices" }] },
  { value: "pictures", children: [{ value: "holidays" }] },
];
