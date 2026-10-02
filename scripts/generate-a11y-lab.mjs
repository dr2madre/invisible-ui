// Build the run sheet for a manual accessibility session: the scenarios the
// component audit left open, the ones the Elements review left open, then
// every component page with the checks a machine cannot make. Nothing in it
// is filled in.
//
//   pnpm a11y:lab [--out <path>]
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = "packages/docs/src/content/docs/components";
/** `pnpm --filter @design-system/docs preview` serves here, under this base. */
const ORIGIN = "http://localhost:4321/invisible-ui/components";

/** Pages that are not a component: the section index and the naming guidance. */
const NOT_A_COMPONENT = new Set(["index", "naming"]);

/** A folder's `index.mdx` is served as the folder, not as `.../index/`. */
const urlFor = (slug) => `${ORIGIN}/${slug.replace(/(^|\/)index$/, "")}/`.replace(/\/+$/, "/");

/**
 * The categories, most interactive first. Not a risk ranking: the repository
 * defines none, and inventing one here would be a claim nobody has earned.
 * Controls and overlays simply carry more state than prose does, and a session
 * that runs out of time should have spent it there.
 */
const CATEGORY_ORDER = [
  "forms",
  "feedback",
  "data-layout",
  "navigation",
  "patterns",
  "localization",
  "formatting-display",
];

/**
 * The scenarios `docs/component-audit-remediation-plan.md` leaves to a person,
 * quoted from its "Targeted browser and assistive technology verification"
 * section. They come first because they are named, few, and still open.
 */
export const OPEN_SCENARIOS = [
  "Link and Button keyboard semantics",
  "Hover Card and interactive Popover focus behavior",
  "two independent Dialog instances",
  "Toolbar child insertion, removal and disabling",
  "ToggleButton disabling and re-enabling after mount, including inside Toolbar",
  "Combobox clear, form value and reconnection",
  "Svelte SSR-to-hydration ID stability",
  "built-package import in a clean consumer",
];

/**
 * `pnpm --filter @design-system/example-vue preview` serves the Vue example
 * here, after `pnpm build`. The docs demos are Svelte: the custom elements
 * render only in that example, on the page this origin carries.
 */
export const ELEMENTS_PAGE = "http://localhost:4173/elements-lab.html";

/**
 * The scenarios the Elements accessibility review (pull request #420) left to
 * a person with a screen reader. Each opens one section of
 * `examples/vue/elements-lab.html`, says what to do, and lists what to write
 * down. The list says what to listen for; the answer is the person's.
 */
export const ELEMENTS_SCENARIOS = [
  {
    title: "Calendar: range day names and selected state",
    section: "calendar-range",
    steps: [
      "Tab into the calendar. Focus lands on 10 March 2026, the range start.",
      "Press Right Arrow day by day to 15 March, then Left Arrow back to 9 March.",
      "Press Enter on 17 March, then on 19 March, and move across the new range.",
    ],
    record: [
      "The name read for 10 March, the range start",
      "The name read for 14 March, the range end",
      "The name and state read for 11, 12 and 13 March, inside the range",
      "Whether a selected state is read for the range days, and for 9 and 15 March",
      "What is read for 17 and 19 March after the new range is picked",
    ],
  },
  {
    title: "Notification Region: announced once, on the page",
    section: "notifications",
    steps: [
      "Press Show a polite notification once, and wait for the speech to end.",
      "Press Show an assertive notification once, while the screen reader is still reading something.",
      "Press each button twice in quick succession.",
    ],
    record: [
      "How many times the polite notification's title is read for one press",
      "How many times the assertive notification's title is read for one press",
      "Whether the assertive one interrupts the speech in progress",
      "What is read for two quick presses",
      "Where focus is after each press",
    ],
  },
  {
    // ADR 0016: a message about the dialog's task stays in the dialog, and a
    // page notification waits for the dialog to close.
    title: "Dialog: messages while it is open",
    section: "notifications",
    steps: [
      "Press Open the dialog.",
      "Press Copy the link.",
      "Press Report a failed upload, then press Tab once.",
      "Press Show a polite notification, then Show an assertive notification.",
      "Close the dialog with Escape, and wait for the speech to end.",
    ],
    record: [
      "What is read after Copy the link, and where focus is",
      "What is read for the failed upload, how many times, and where focus is",
      "What is read after Tab, and whether it is the Retry button",
      "Whether anything is read for the two notifications while the dialog is open",
      "What is read after Escape, in which order, and where focus is",
    ],
  },
  {
    title: "Table Set: result count announcements",
    section: "table-set-results",
    steps: [
      "Tab to Filter by name and type a: four people match.",
      "Type d, so the filter reads ad: one person matches.",
      "Type x, so nobody matches.",
      "Clear the field.",
    ],
    record: [
      "What is read after typing a, and how many times",
      "What is read after typing d",
      "What is read when nobody matches",
      "What is read after clearing the field",
      "Whether the typed characters and the count interrupt each other",
    ],
  },
  {
    title: "Loading: status updates",
    section: "loading-count",
    steps: [
      "Reload the page and listen to the section as it appears.",
      "Tab to Change the loading status and press it three times, waiting for speech to end each time.",
    ],
    record: [
      "What the loading indicator reads when the page loads",
      "What is read after each press, and how many times",
      "Whether the label, Loading the report, is read with each new status",
    ],
  },
  {
    title: "Count: updates, standalone and inside a button",
    section: "loading-count",
    steps: [
      "Press Add a message twice.",
      "Tab to the Notifications icon button and listen to it.",
      "Press Add a notification twice, then Shift+Tab back to the Notifications button.",
    ],
    record: [
      "What is read after each press of Add a message, and how many times",
      "The Notifications button's name, and whether the count is part of the name or read after it",
      "What is read after each press of Add a notification",
      "What the Notifications button reads after the count changed",
    ],
  },
  {
    title: "Tree View: loading, error and success status",
    section: "tree-status",
    steps: [
      "Tab into the tree and press Down Arrow to remote.",
      "Press Right Arrow. The load fails after about a second and a half.",
      "Press Right Arrow again to retry. This load succeeds.",
    ],
    record: [
      "What is read when the first load starts",
      "What is read when it fails",
      "What is read when the retry starts and when it succeeds",
      "Where focus is throughout, and the expanded state read for remote",
    ],
  },
  {
    title: "Tabs: tab name with a count",
    section: "tabs-count",
    steps: ["Tab into the Mailbox tabs.", "Press Right Arrow through Inbox, Sent and Archive."],
    record: [
      "The name read for Inbox, which carries 12",
      "The name read for Sent, which carries no count",
      "The name read for Archive, which carries 3",
      "Whether any count is read twice",
    ],
  },
  {
    title: "Sidebar: rail toggle pressed state",
    section: "sidebar-rail",
    steps: [
      "Tab to the button that collapses the sidebar and listen to it.",
      "Press Space, listen, then press Space again.",
      "With the rail collapsed, Tab to Home and Reports.",
    ],
    record: [
      "The toggle's name and state before the first press",
      "The name and state after each press, and whether the name changes",
      "The names read for Home and Reports on the rail",
    ],
  },
  {
    title: "Checkbox Group: description and error on the fieldset",
    section: "field-messages",
    steps: [
      "Tab into the Toppings group, landing on Olive.",
      "Tab to Caper, then Shift+Tab back to Olive.",
    ],
    record: [
      "What is read on entering the group: legend, description, error, invalid state",
      "What is read for Caper, and whether the messages repeat",
    ],
  },
  {
    title: "PIN Input: description and error on the cells",
    section: "field-messages",
    steps: [
      "Tab into the first Verification code cell.",
      "Type 1, 2 and 3, letting focus move to each next cell.",
    ],
    record: [
      "What is read for the first cell: group name, cell name, description, error, invalid state",
      "What is read as focus moves to each next cell",
    ],
  },
  {
    title: "Date Picker: description and error on the combobox",
    section: "field-messages",
    steps: [
      "Tab to Start date and listen.",
      "Press Enter to open the calendar, then Escape to close it.",
    ],
    record: [
      "The role, name and value read for the field",
      "Whether the description, the error and an invalid state are read, and in which order",
      "What is read when focus returns to the field after Escape",
    ],
  },
  {
    title: "Error State: with and without live",
    section: "states-live",
    steps: [
      "Press Insert an Error State with live, and leave focus on the button.",
      "Press Insert an Error State without live.",
    ],
    record: [
      "What is read after the live insertion, and whether it interrupts other speech",
      "What is read after the insertion without live",
    ],
  },
  {
    title: "Empty State: with and without live",
    section: "states-live",
    steps: [
      "Press Insert an Empty State with live, and leave focus on the button.",
      "Press Insert an Empty State without live.",
    ],
    record: [
      "What is read after the live insertion, and when",
      "What is read after the insertion without live",
    ],
  },
  {
    title: "Table View: focus after Load more",
    section: "table-view-load-more",
    steps: [
      "Tab to Load more inside the Orders box and press Enter.",
      "While it reads Loading, press Enter again.",
      "Repeat until the third batch has loaded and Load more is gone.",
    ],
    record: [
      "What is read for the button while a batch is loading, including any unavailable state",
      "What the second Enter does while loading",
      "Where focus lands when Load more disappears, and what is read there",
      "Whether a batch started loading on its own when the end of the box scrolled into view",
    ],
  },
  {
    title: "Popover: focus after closing from inside",
    section: "popover-close",
    steps: [
      "Tab to Share settings and press Enter.",
      "Tab to Done and press Enter.",
      "Open it again and press Escape from the checkbox.",
    ],
    record: [
      "Where focus is after the card opens, and what is read",
      "Where focus lands after Done, and what is read",
      "Where focus lands after Escape, and what is read",
    ],
  },
  {
    title: "Navigation Menu: focus leaving the menu",
    section: "navigation-menu",
    steps: [
      "Tab to Products and press Enter to open its panel.",
      "Press Down Arrow into the panel, then Tab past the last link to After the menu.",
      "Shift+Tab back to Products.",
    ],
    record: [
      "Whether the panel is still shown once focus reaches After the menu",
      "The expanded state read for Products after returning to it",
    ],
  },
  {
    title: "Tabs: arrow keys in right-to-left text",
    section: "rtl",
    steps: ["Tab into the Sections tabs.", "Press Left Arrow, then Right Arrow."],
    record: [
      "Which tab takes focus after Left Arrow: the one on its visual left or on its right",
      "Which tab takes focus after Right Arrow",
    ],
  },
  {
    title: "Carousel: arrow keys in right-to-left text",
    section: "rtl",
    steps: [
      "Tab to the Featured carousel's next slide button.",
      "Press Left Arrow twice, then Right Arrow once.",
    ],
    record: [
      "Which slide shows after each key, and the position read, such as 2 of 4",
      "Whether the slides move toward the arrow's visual direction",
    ],
  },
  {
    title: "Tree View: arrow keys in right-to-left text",
    section: "rtl",
    steps: [
      "Tab into the Folders tree, on documents.",
      "Press Left Arrow, then Right Arrow, then Right Arrow again.",
    ],
    record: [
      "What each key does: expand, collapse or move to a child",
      "The expanded state read for documents after each key",
    ],
  },
  {
    title: "Pagination: arrow keys in right-to-left text",
    section: "rtl",
    steps: ["Tab into the Pages pagination, on page 3.", "Press Left Arrow, then Right Arrow."],
    record: [
      "Which control takes focus after Left Arrow: the one on its visual left or on its right",
      "Which control takes focus after Right Arrow",
    ],
  },
];

/**
 * The checks in the sheet. Each is a question a person answers with a real
 * device, a real assistive technology or a real browser setting.
 */
export const CHECKS = [
  {
    title: "Screen reader",
    asks: "Does the control announce its role, name, value and state, and does a change announce once?",
  },
  {
    title: "Touch",
    asks: "Can every action be completed by a real finger, including dismissal, with no hover and no right click?",
  },
  {
    title: "Zoom to 400%",
    asks: "At 400% browser zoom, is everything still reachable and readable, with nothing lost off-screen?",
  },
  {
    title: "Forced colours",
    asks: "In a Windows contrast theme, is every control's boundary, state and focus still visible?",
  },
  {
    title: "Text expansion",
    asks: "With labels about a third longer, does the layout hold without clipping or overlap?",
  },
  {
    title: "Keyboard only",
    asks: "With the pointer unplugged, can the whole component be operated, and can focus always leave it?",
  },
];

/** What every result column is filled with: a blank for a person to complete. */
export const emptyField = () => "";

/** The columns of every result table. */
export const COLUMNS = ["Check", "What was seen", "Verdict"];

/** The environment a result is only meaningful alongside. */
export const ENVIRONMENT = [
  "Date",
  "Operator",
  "Operating system and version",
  "Browser and version",
  "Assistive technology and version",
  "Input device",
  "Commit under test",
];

/** Every component page in the docs, as a title and the URL to open. */
export const pages = (root = join(repoRoot, CONTENT)) => {
  const walk = (dir) =>
    readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);
      return statSync(path).isDirectory() ? walk(path) : path.endsWith(".mdx") ? [path] : [];
    });
  const rank = (slug) => {
    const at = CATEGORY_ORDER.indexOf(slug.split("/")[0]);
    return at === -1 ? CATEGORY_ORDER.length : at;
  };
  return walk(root)
    .map((path) => {
      const slug = relative(root, path).replace(/\.mdx$/, "");
      const title = /title:\s*"?([^"\n]+)"?/.exec(readFileSync(path, "utf8"))?.[1]?.trim() ?? slug;
      return { slug, title, url: urlFor(slug) };
    })
    .filter(({ slug }) => !NOT_A_COMPONENT.has(slug))
    .sort((a, b) => rank(a.slug) - rank(b.slug) || a.slug.localeCompare(b.slug));
};

const table = (rows) =>
  [
    `| ${COLUMNS.join(" | ")} |`,
    `| ${COLUMNS.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row} | ${emptyField()} | ${emptyField()} |`),
  ].join("\n");

/** The elements scenarios: where to go, what to do, what to write down. */
const elementsSection = () => {
  const lines = [
    `## Elements scenarios (${ELEMENTS_SCENARIOS.length})`,
    "",
    "Named by the Elements accessibility review and still open. The docs demos",
    "are Svelte, so these run on the Vue example's elements page: `pnpm build`,",
    "then `pnpm --filter @design-system/example-vue preview`. Reload the page",
    "before each scenario. Arrow keys reach the widget only in the screen",
    "reader's focus or forms mode; write down which mode was on.",
    "",
  ];
  for (const scenario of ELEMENTS_SCENARIOS) {
    lines.push(
      `### ${scenario.title}`,
      "",
      `${ELEMENTS_PAGE}#${scenario.section}`,
      "",
      ...scenario.steps.map((step, index) => `${index + 1}. ${step}`),
      "",
      table(scenario.record),
      "",
    );
  }
  return lines;
};

/** The sheet: the environment block, the open scenarios, then the pages. */
export const sheet = (entries) => {
  const lines = [
    "# Accessibility lab run sheet",
    "",
    "Generated, and empty on purpose. Nothing in this file is evidence until a",
    "person has run the check and written what they saw. See",
    "`docs/accessibility-lab.md` for what the automated suite already covers,",
    "and for what each of those answers does not tell you.",
    "",
    "## Environment",
    "",
    "Fill this in first. A result without it is not a result.",
    "",
    ...ENVIRONMENT.map((field) => `- ${field}: ${emptyField()}`),
    "",
    "## Open scenarios",
    "",
    "Named by `docs/component-audit-remediation-plan.md` and still open. Run",
    "these before the page sweep: they are few, and they are the ones somebody",
    "already decided were worth a person's time.",
    "",
    table(OPEN_SCENARIOS),
    "",
    ...elementsSection(),
    "## Checks",
    "",
    ...CHECKS.map((check) => `- **${check.title}**: ${check.asks}`),
    "",
    `## Pages (${entries.length})`,
    "",
    "Grouped by category, controls and overlays first. A check a page cannot",
    "take is answered in one word; guessing which those are is not this file's",
    "job.",
    "",
  ];
  for (const entry of entries) {
    lines.push(
      `### ${entry.title}`,
      "",
      entry.url,
      "",
      table(CHECKS.map((check) => check.title)),
      "",
    );
  }
  return lines.join("\n");
};

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const at = process.argv.indexOf("--out");
  if (at !== -1 && !process.argv[at + 1]) {
    console.error("--out needs a path to write to.");
    process.exit(1);
  }
  const out = at === -1 ? "a11y-lab-run.md" : process.argv[at + 1];
  const entries = pages();
  writeFileSync(out, sheet(entries));
  console.log(
    `Run sheet: ${OPEN_SCENARIOS.length} open scenarios, ${ELEMENTS_SCENARIOS.length} elements scenarios, ${entries.length} pages, ${CHECKS.length} checks each. Written to ${out}.`,
  );
  console.log("It is empty. Fill it in by hand, or it says nothing.");
}
