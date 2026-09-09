// Build the run sheet for a manual accessibility session: the scenarios the
// component audit left open, then every component page with the checks a
// machine cannot make. Nothing in it is filled in.
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

/** The sheet: the open scenarios, the environment block, then the pages. */
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
    `Run sheet: ${OPEN_SCENARIOS.length} open scenarios, ${entries.length} pages, ${CHECKS.length} checks each. Written to ${out}.`,
  );
  console.log("It is empty. Fill it in by hand, or it says nothing.");
}
