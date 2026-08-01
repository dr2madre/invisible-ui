# Component backlog (internal)

Candidate work for future planning — not commitments. Two lists: genuinely
**new components** the system lacks compared to its peers (Radix, Ark/Zag, MUI,
React Aria), and the **React-adapter parity** gap (porting, not design).

Before adding anything here, check the public
[naming map](../packages/docs/src/content/docs/components/naming.mdx): most
"missing" components already exist under a different name.

## A. New components (gaps vs peer libraries)

| Candidate | What it is | Peer precedent | Notes / suggested approach |
| --- | --- | --- | --- |
| **Number Input** | Numeric field with +/− steppers, min/max/step, wheel & arrow keys | Ark, MUI, React Aria, Chakra | The most common form gap. Native-first: `input[type=number]`-ish on `inputmode="decimal"` + spinbutton pattern. Highest value. |
| **Multi-select (tag input)** | Combobox selecting several values, shown as removable tags | Ark (TagsInput), MUI, React Aria | Builds on `core/combobox` + Tag. Decide: separate component vs `multiple` on Combobox. |
| **Range Slider** | Two-thumb min–max slider | Radix, Ark, MUI | Our Slider is a single native `input[type=range]` (no native dual). Needs an ARIA implementation — the first slider primitive that can't stay native. |
| **Color Picker** | Swatch/area/channel color selection | Ark/Zag, React Aria | Big surface; only if a real use case appears. |
| **Splitter** | Drag-to-resize panes | Ark/Zag, Radix (Resizable) | `role="separator"` + `aria-valuenow` per WAI-ARIA window splitter. |
| **Editable** | Text that becomes an input on press (inline rename) | Ark/Zag, Chakra | Small; pairs naturally with the PromptDialog rename story. |
| Timeline | Ordered event list with markers | AntD, MUI Lab | Presentational only — may just be a docs pattern, not a component. |

Non-gaps (already covered — do **not** add): Toast/Snackbar → Notification;
Drawer → Sheet Dialog; Command palette → Search Dialog; Badge → Count/Tag;
OTP → PIN Input; Spinner → Loading; Empty/error page → Error State;
Autocomplete → Combobox; File upload → Upload Drop Area.

## B. React-adapter parity (porting, not design)

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
