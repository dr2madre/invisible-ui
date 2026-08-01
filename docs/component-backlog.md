# Component backlog (internal)

Candidate work for future planning — not commitments. Grouped by **size**:
components (atoms/molecules), patterns (compositions), and super-patterns
(almost ready applications). Guiding principle: most of these are things a
consumer *could* build with the design system — we add them anyway when they
are so recurrent that everyone would otherwise rebuild them.

Before adding anything here, check the public
[naming map](../packages/docs/src/content/docs/components/naming.mdx): most
"missing" components already exist under a different name.

## A. Components (gaps vs peer libraries)

| Candidate | What it is | Peer precedent | Status / notes |
| --- | --- | --- | --- |
| **Empty State** | "No data yet" view (icon + message + optional action) — the calm sibling of Error State | shadcn (Empty), most systems | **Probable next.** Likely a sibling or variant of Error State: same layout, different intent (nothing failed). |
| **Number Input** | Numeric field with +/− steppers, min/max/step, wheel & arrow keys | Ark, MUI, React Aria, Chakra | The most common form gap. Native-first: `inputmode="decimal"` + spinbutton pattern. |
| **Multi-select (tag input)** | Combobox selecting several values, shown as removable tags | Ark (TagsInput), MUI, React Aria | Builds on `core/combobox` + Tag. Decide: separate component vs `multiple` on Combobox. |
| **Range Slider** | Two-thumb min–max slider | Radix, Ark, MUI, shadcn | Our Slider is a single native `input[type=range]` (no native dual). The first slider primitive that can't stay native. |
| **Splitter** | Drag-to-resize panes | Ark/Zag, Radix & shadcn (Resizable) | "Splitter" is the WAI-ARIA spec name ("window splitter") — nobody says it. Pick a human name when building (shadcn: *Resizable*; also seen: *Split Pane*). |
| **Editable** | Text that becomes an input on press (inline rename) | Ark/Zag, Chakra | Small; pairs naturally with the PromptDialog rename story. |
| Color Picker | Swatch/area/channel color selection | Ark/Zag, React Aria | **Later** — complex surface; wait for a real use case. |

## B. Patterns (compositions — buildable with the system, provided because recurrent)

| Candidate | What it is | Peer precedent | Status / notes |
| --- | --- | --- | --- |
| **Sidebar** | The app shell's side navigation: collapsible, groups, mobile behaviour | shadcn (their most-used piece) | A pattern, not a primitive — composed from existing parts (nav, collapsible, sheet on mobile). Documented under Patterns like Login Form / Notification Center. |
| Timeline | Ordered event list with markers | AntD, MUI Lab | **Later** — an organism people can (and do) build however they like; presentational only. |

## C. Super-patterns (almost ready applications)

| Candidate | What it is | Peer precedent | Status / notes |
| --- | --- | --- | --- |
| Form (with validation) | Fields wired to a validation story: schema, error messages, submit state | shadcn (Form + react-hook-form/zod) | Practically a ready application on top of Field/inputs. Needs its own design round (which validation story, which framework bindings). |
| Data Table | Table + sorting, filtering, selection, pagination as one machine | shadcn (TanStack recipe), MUI DataGrid | Our Table is presentational by design; this is the machinery on top. |
| Charts | Ready-made chart components on the tokens | shadcn (Recharts-based) | **Later** — a separate track; decide the underlying chart engine first. |

Non-gaps (already covered — do **not** add): Toast/Snackbar → Notification;
Drawer → Sheet Dialog; Command palette → Search Dialog; Badge → Count/Tag;
OTP → PIN Input; Spinner → Loading; Error/404 page → Error State;
Autocomplete → Combobox; File upload → Upload Drop Area; Input Group → likely a
Field/Text Input variant, assess there before adding a component.

## D. React-adapter parity (porting, not design)

The React PoC (Button, Checkbox, Switch, Select, Combobox, Dialog) already
exercises every integration shape, so the remaining ~66 components are
mechanical ports — each one: `useX` hook over the existing core primitive +
ported CSS + tests from the Svelte suite. Python (Reflex) inherits each port
for free.

Suggested order (by typical consumer demand):

| Batch | Components |
| --- | --- |
| 1 — forms core | Text Input, Text Area, Radio Group, Checkbox Group, Field, Label |
| 2 — overlays & menus | Popover, Tooltip, Dropdown Menu, Alert/Confirm/Prompt Dialog |
| 3 — feedback | Notification (+ Region), Inline Notification, Progress, Loading, Skeleton, Tag, Count |
| 4 — data & nav | Tabs, Accordion, Card, Table, Pagination, Breadcrumb, Avatar |
| 5 — the long tail | date/time family, carousel, tree view, stepper, the rest |

Parity is **not** currently a goal (the PoC proved portability; see
`docs/adapters-roadmap.md`) — this section exists so that, if demand appears,
the order is already thought through.
