# Component backlog (internal)

Candidate work for future planning — not commitments. Grouped by **size**:
components (atoms/molecules), patterns (compositions), and super-patterns
(almost ready applications). Guiding principle: most of these are things a
consumer *could* build with the design system — we add them anyway when they
are so recurrent that everyone would otherwise rebuild them.

Before adding anything here, check the public
[naming map](../packages/docs/src/content/docs/components/naming.mdx): most
"missing" components already exist under a different name.

What each entry actually owns, and what is already shipped, is recorded in
[state-ownership-audit.md](./state-ownership-audit.md). A state the application
is meant to own is not a gap: the audit separates the two.

## Build order

Every candidate from sections A–C in one ranked plan. Score = **ease of
creation × absolute utility** (how often we expect people to reach for it),
each 1–5; ties break on utility. Items the review explicitly parked sit at the
bottom regardless of score.

| # | Candidate | Size | Ease | Utility | Score | Why here |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Empty State** | component | 5 | 5 | 25 | **Shipped.** Sibling of the existing Error State — same layout, new intent. |
| 2 | **Number Input** | component | 4 | 5 | 20 | Native-first (`inputmode="decimal"` + spinbutton); the most common form gap. |
| 3 | **Sidebar** | pattern | 3 | 5 | 15 | Composition of existing parts (nav, collapsible, sheet on mobile); the most used piece of an app shell. |
| 4 | **Editable** | component | 4 | 3 | 12 | Small; pairs with the PromptDialog rename story. |
| 5 | **Multi-select (tag input)** | component | 2 | 4 | 8 | Builds on `core/combobox` + Tag, but multi-value state is a real design round. |
| 6 | **Range Slider** | component | 2 | 3 | 6 | First slider that can't stay native — full ARIA implementation. |
| 7 | **Data Table** | super-pattern | 1 | 4 | 4 | Sorting, column visibility, pagination and views already ship; what remains is row selection, filtering and one coordinator over them. |
| 8 | **Form (validation)** | super-pattern | 1 | 4 | 4 | Practically a ready application; needs its own design round first. |
| 9 | **Splitter / Resizable** | component | 2 | 2 | 4 | Niche until app-shell layouts appear; rename before building. |
| 10 | Timeline | pattern | 3 | 2 | — | **Parked** by review: an organism people build however they like. |
| 11 | Charts | super-pattern | 1 | 3 | — | **Parked**: engine decision planned in [charts-strategy.md](./charts-strategy.md); Sparkline (step 0) can ship early, no engine needed. |
| 12 | Color Picker | component | 1 | 2 | — | **Parked**: wait for a real use case. |

## A. Components (coverage gaps)

| Candidate | What it is | Peer precedent | Status / notes |
| --- | --- | --- | --- |
| **Empty State** | "No data yet" view (illustration + message + optional action) — the calm sibling of Error State | most systems | **Shipped** (Svelte): `illustration` slot with themed icon fallback, `actions` slot. Same layout as Error State, different intent (nothing failed). |
| **Number Input** | Numeric field with +/− steppers, min/max/step, wheel & arrow keys | Ark, MUI, React Aria, Chakra | The most common form gap. Native-first: `inputmode="decimal"` + spinbutton pattern. |
| **Multi-select (tag input)** | Combobox selecting several values, shown as removable tags | Ark (TagsInput), MUI, React Aria | **Genuinely missing state.** `core/combobox` owns a single `value`; the multi-value set, its duplicate rule and its keyboard contract do not exist. Decide: separate component vs `multiple` on Combobox. |
| **Range Slider** | Two-thumb min–max slider | Radix, Ark, MUI | Our Slider is a single native `input[type=range]` (no native dual). The first slider primitive that can't stay native. |
| **Splitter** | Drag-to-resize panes | Ark/Zag, Radix | "Splitter" is the WAI-ARIA spec name ("window splitter") — nobody says it. Pick a human name when building (commonly *Resizable* or *Split Pane*). |
| **Editable** | Text that becomes an input on press (inline rename) | Ark/Zag, Chakra | Small; pairs naturally with the PromptDialog rename story. |
| Color Picker | Swatch/area/channel color selection | Ark/Zag, React Aria | **Later** — complex surface; wait for a real use case. |

## B. Patterns (compositions — buildable with the system, provided because recurrent)

| Candidate | What it is | Peer precedent | Status / notes |
| --- | --- | --- | --- |
| **Sidebar** | The app shell's side navigation: collapsible, groups, mobile behaviour | most app shells | A pattern, not a primitive — composed from existing parts (nav, collapsible, sheet on mobile). The active destination, the routing and the breakpoint policy stay in the application: Menu, Collapsible and Sheet Dialog must not own them. Documented under Patterns like Login Form / Notification Center. |
| Timeline | Ordered event list with markers | AntD, MUI Lab | **Later** — an organism people can (and do) build however they like; presentational only. |
| Async Content | One region that walks the data cycle: initial moment → query running (Loading/Skeleton) → answer: content, Empty State or Error State | query-state wrappers in data-fetching libraries | **Later** — needs its own design round. The pieces all exist; the only missing part is the **orchestration** on top, so the right moment for each state is built in (never the empty state while the query runs). The query, its cache and its authorization stay in the application. |

## C. Super-patterns (almost ready applications)

| Candidate | What it is | Peer precedent | Status / notes |
| --- | --- | --- | --- |
| Form (with validation) | A headless controller for values, validation and the submission cycle | react-hook-form + zod recipes | **Genuinely missing state**, and separate from Field, which stays a semantic renderer, and from the application's business rules. Needs its own design round (which validation story, which framework bindings). |
| Data Table | Row selection, filtering, and one coordinator over sorting, filtering, selection and pagination | TanStack Table recipes, MUI DataGrid | **Partially shipped.** `core/table` owns sorting and column visibility; Table View adds pagination and infinite loading; Table Set adds views and per-view coordination. Missing: row selection, filtering, and the machine that keeps them consistent. See [state-ownership-audit.md](./state-ownership-audit.md). |
| Charts | Ready-made chart components on the tokens | Recharts-based kits | **Later** — strategy and engine evaluation in [charts-strategy.md](./charts-strategy.md). |

Non-gaps (already covered — do **not** add): Toast/Snackbar → Notification;
Drawer → Sheet Dialog; Command palette → Search Dialog; Badge → Count/Tag;
OTP → PIN Input; Spinner → Loading; Error/404 page → Error State;
Autocomplete → Combobox; File upload → Upload Drop Area; Input Group → likely a
Field/Text Input variant, assess there before adding a component.

## D. Adapter parity (porting, not design)

The shared six-component set (Button, Checkbox, Switch, Select, Combobox,
Dialog) already exercises every integration shape in all adapters, so the
remaining ~66 components are mechanical ports — each one: a composable/hook
over the existing core primitive + ported CSS + tests from the Svelte suite.
Python (Reflex) inherits each React port for free.

**Adapter order (decided 2026-08-02): Vue first to full parity, then web
components, then React.** Vue reached full parity on 2026-08-03.

Batch order (by typical consumer demand):

| Batch | Components |
| --- | --- |
| 1 — forms core | Text Input, Text Area, Radio Group, Checkbox Group, Field, Label |
| 2 — overlays & menus | Popover, Tooltip, Dropdown Menu, Alert/Confirm/Prompt Dialog |
| 3 — feedback | Notification (+ Region), Inline Notification, Progress, Loading, Skeleton, Tag, Count |
| 4 — data & nav | Tabs, Accordion, Card, Table, Pagination, Breadcrumb, Avatar |
| 5 — the long tail | date/time family, carousel, tree view, stepper, the rest |

Parity became a goal on 2026-08-02, starting with Vue. Progress is
tracked on the public [Framework support] page
(`packages/docs/src/content/docs/frameworks.mdx`).
