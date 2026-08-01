# Next frontend target — strategy (internal)

Which technology the design system should support after Svelte, React and
Reflex/Python. Same values as everything else here: **least possible
opinionation**, **no bets on things that may die**, **solid, well-made
foundations**. Outcome of the PoC below becomes ADR 0008.

## The constraint that shapes everything

The core is TypeScript producing **DOM-shaped prop bags** (ARIA attributes,
event handlers). A target can consume it only if it renders **real DOM**.
That single fact sorts every candidate:

| Candidate | Renders real DOM? | Consequence |
| --- | --- | --- |
| Vue, Angular, Solid, vanilla JS, Web Components | ✅ | direct adapters possible (like Svelte/React) |
| HTMX / Rails Hotwire / Phoenix LiveView / Laravel Livewire | ✅ (server-sent HTML) | can't run `connect()` server-side, but can consume **custom elements** in their HTML |
| Rust (Leptos, Dioxus) | ✅ (WASM → DOM) | interop possible; ecosystem young — watch list |
| Rust (Tauri) | ✅ (webview) | **already covered today**: a Tauri app is a web frontend in a Rust shell — our existing adapters just work |
| Streamlit (Python) | ✅ (its custom components are wrapped **React** components) | a component kit can reuse `@design-system/react`, same move as Reflex |
| **Flutter** | ❌ — paints its own pixels (Impeller/Skia), no DOM, no ARIA | behaviour adapters **impossible** for a DOM-based core. What *can* reach Flutter is the **tokens**: Style Dictionary already has Dart output on the roadmap (item 8) — the escape from the Material look is a theme, not behaviour |
| COBOL / legacy backends | n/a (backend) | we never touch the backend; the play is being the easiest UI layer for **modernization frontends** (see below) |

## State of the art (checked August 2026)

- **Vue** — alive and well: ~18% share, second/third framework, Vue 4 ships
  Vapor mode by default, 93% developer retention. Not dying, not fringe.
- **Web Components / custom elements** — the quiet winner: React 19 finally
  supports them fully, Vue/Angular/Svelte interop is excellent, enterprise
  usage grew to ~18% of Chrome page loads, and Microsoft/GitHub/Adobe/SAP all
  ship design systems on them.
- **Rust frontend** — Leptos and Dioxus maturing fast (Dioxus is YC-backed,
  used by Airbus and ESA), but pre-1.0 APIs; production-adventurous, not
  production-boring yet.

## Recommendation: the next adapter is **Web Components (custom elements)**

One adapter that answers almost every line of the brainstorm at once:

- **"Pure JavaScript"** — a custom element *is* the pure-JS/no-framework story:
  `<ds-dialog>` in any HTML page, no build step.
- **Vue (and Angular)** — both consume custom elements natively and
  excellently; a dedicated Vue adapter becomes a *demand-driven* option, not a
  prerequisite.
- **Server-driven trends (HTMX, LiveView, Hotwire, Livewire)** — these render
  HTML on the server and sprinkle behaviour; custom elements are exactly the
  behaviour they can sprinkle. This is today's visible "works with the
  backend" trend.
- **Legacy modernization (the bank case)** — old portals (JSP/JSF, jQuery,
  SharePoint, even Office Add-ins for the Excel world — which are web-based)
  cannot adopt a framework, but they can paste a `<script>` tag and use
  `<ds-select>`. Nobody rewrites COBOL with us; teams putting a new face on
  old systems are exactly who needs framework-free, accessible components.
- **Least opinionated choice possible** — it's a **W3C standard**, not a
  framework: immune to framework churn by definition. The most
  invisible-ui-coherent target that exists.

Implementation stance, consistent with the repo's style: **vanilla custom
elements, zero dependencies** (no Lit/Stencil — the heavy lifting is already
in the core; the adapter is the same thin seam Svelte and React are).
Shadow DOM per component with the tokens piercing via CSS custom properties
(they inherit through shadow roots by design). SSR via Declarative Shadow DOM
where it matters.

## Why this isn't 2019's Web Components

Web Components have a mixed reputation among experienced frontend engineers,
for good historical reasons. The known objections, and why they don't apply to
this plan:

- **"They were overhyped around 2018–2020 and teams got burned."** True — and
  the blockers that burned those teams have since been removed *by the
  standards themselves*: React 19 supports custom elements properly, form
  participation is solved by ElementInternals, server rendering by Declarative
  Shadow DOM. The 2019 experience predates all three.
- **"The developer experience is worse than React or Svelte for building
  apps."** Also true — and out of scope. Nobody builds an *application* in
  custom elements here: Svelte and React users get real, native components
  from their own adapters and never touch an element. The elements exist for
  contexts that have **no** framework — plain pages, server-driven stacks,
  legacy portals.
- **"Shadow DOM makes theming painful."** CSS custom properties inherit
  through shadow roots by design — and the `--ds-*` tokens are already the
  system's only theming mechanism, so the existing contract carries over
  unchanged.
- **"It's another frontend fashion."** It is the opposite of one: a W3C
  standard, shipped in production by the design systems of GitHub, Microsoft,
  Adobe and SAP. Standards outlive framework cycles by construction.

The architectural rule that defuses the whole debate: the classic failure mode
is building the design system *inside* Web Components and routing every
framework through them. Here behaviour lives in the framework-agnostic core,
and the elements are **one more adapter at the same level as Svelte and
React** — nobody is routed through them.

## What the others get instead

| Target | Path | When |
| --- | --- | --- |
| **Vue** | consume the custom elements; direct adapter only on real demand | after WC PoC |
| **Flutter** | tokens only: finish the Style Dictionary **Dart** output so a Flutter theme escapes Material with our design language | independent, small |
| **Rust** | today: Tauri + existing adapters (document it). Watch Leptos/Dioxus; revisit at their 1.0 | watch list |
| **Streamlit** | component kit wrapping `@design-system/react` (the Reflex move again) | small, on demand |
| **Solid / Qwik / Angular** | direct adapters; the core already proved it needs no changes | on demand |

## PoC plan

1. `packages/elements` (`@design-system/elements`): the **same six components
   as the React PoC** (Button, Checkbox, Switch, Select, Combobox, Dialog) as
   custom elements over the existing core — every integration shape is already
   understood, so the comparison is apples-to-apples.
2. Prove consumption in three habitats: a **plain HTML page** (script tag, no
   build), a **Vue app**, and an **HTMX page**.
3. Sort the known hard parts: attribute↔property reflection, events
   (CustomEvent naming), form participation (ElementInternals — the standard
   is made for this), SSR/Declarative Shadow DOM, tokens through shadow roots.
4. **ADR 0008** records the outcome and the decision rule for further
   framework adapters ("demand-driven, core stays untouched").

## Sources

[Vue 2025→2026 review](https://vueschool.io/articles/news/vue-js-2025-in-review-and-a-peek-into-2026/) ·
[Web Components in 2026](https://talent500.com/blog/web-components-comeback-modern-frontend/) ·
[WC in design systems](https://thedesignsystem.guide/knowledge-base/all-about-web-components) ·
[Leptos vs Dioxus 2026](https://reintech.io/blog/leptos-vs-yew-vs-dioxus-rust-frontend-framework-comparison-2026)
