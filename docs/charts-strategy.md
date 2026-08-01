# Charts strategy (internal)

How to bring charts into Invisible UI without betraying its two pillars:
**minimal opinionation** and **no fragile dependencies**. This is the
"pick the engine first" work the [backlog](./component-backlog.md) parked
Charts on. Outcome of the PoC below becomes ADR 0007.

North star: **Edward Tufte and information graphics** — maximise data-ink,
remove chartjunk, label directly instead of legends, prefer small multiples,
and treat the sparkline (Tufte's own invention) as a first-class citizen.

## The two worries, addressed by architecture

1. **"Will the engine still be maintained in five years?"** — legitimate: the
   audit below found one major library already stalled. Answer: never marry an
   engine. Charts get the same treatment as frameworks — a thin **seam**.
2. **"Charts must not make Invisible UI opinionated."** — the *look* must come
   from our tokens and our Tufte rules, never from an engine's defaults. If
   the engine is visible in the output, the integration is wrong.

## Recommended strategy: a chart shell + pluggable engines + an in-house track

Mirror the design system's own architecture (core + adapters):

```
┌─ Chart shell (ours) ──────────────────────────────────────┐
│  title/description wiring, role="img" + text alternative,  │
│  data-table fallback, tokens → theme bridge, Tufte theme   │
│   ┌──────────────┬──────────────┬────────────────────┐     │
│   │ engine:       │ engine:      │ in-house (D3       │     │
│   │ ECharts       │ Vega-Lite /  │ modules): Sparkline,│    │
│   │ adapter       │ Plot adapter │ small multiples     │    │
│   └──────────────┴──────────────┴────────────────────┘     │
└────────────────────────────────────────────────────────────┘
```

- **The shell is ours** and is where accessibility and identity live: an
  accessible container (name, description, a text/table alternative for
  screen readers — a chart is *content*, not decoration), plus a **theme
  bridge** that feeds the `--ds-*` tokens to whatever engine sits below. We
  already have the machinery: `tokens.json` (DTCG) + Style Dictionary can emit
  a JS theme object for canvas engines that can't read CSS custom properties.
- **Engines are adapters** behind one interface (`data + spec in → rendered
  chart out`). If an engine dies or disappoints, we swap the adapter; the
  consumer API and the look don't move. This is the user-facing form of "non
  sposare una libreria".
- **The in-house track starts tiny and grows only if earned**: a zero-dependency
  **Sparkline** (pure SVG, a few dozen lines — the most Tufte component
  possible) ships first, before any engine. If one day we want "our
  Highcharts", the path is building on **D3 modules** (d3-scale, d3-shape,
  d3-axis — the toolkit, not a chart library), which is how every serious
  custom library is built. The sparkline is step one of that path either way.

## Engine candidates — evaluated (status checked August 2026)

Hard requirement first: **framework-agnostic**. Recharts and visx are
React-only — they break the multi-framework core principle and are excluded
regardless of quality (shadcn can use Recharts; we cannot). Highcharts and
amCharts are excluded on commercial licensing. Plotly is excluded as heavy and
visually opinionated.

| Engine | License / governance | Alive? (Aug 2026) | Rendering | Opinionation | Tufte fit | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| **Apache ECharts** | Apache-2.0, **Apache Software Foundation** | ✅ v6.1, May 2026 — very active | canvas (svg opt) | defaults flashy, but deeply themable | good once themed | **Default engine.** ASF governance is the strongest longevity guarantee on the market. Needs the token→theme bridge (canvas can't read CSS vars). |
| **Vega-Lite** | BSD-3, Univ. of Washington IDL + community | ✅ v6.0, Mar 2025 — steady, slow cadence | canvas/svg | grammar = spec-neutral by design | very good | **Second adapter candidate** — proves the seam; its JSON grammar is the least opinionated interface conceivable. |
| **Observable Plot** | ISC, Observable Inc. | ⚠️ v0.6.17, **stalled since early 2025** | svg | minimal, elegant defaults | excellent | Best Tufte fit on paper, but the stall is exactly worry #1. Only via the seam, never as the sole engine. |
| **D3 (modules)** | ISC, Bostock/community | ✅ mature/stable (v7; toolkit is "finished" software) | svg | none — you draw everything | perfect | Not an engine — the **in-house track**'s foundation. |
| Chart.js | MIT, community | ✅ active | canvas | simple, limited types | fair | No advantage over ECharts for us. |
| uPlot | MIT, single maintainer | ✅ active | canvas | minimal | good (time series) | Bus-factor 1; possible niche adapter for huge time series, later. |

## Proof-of-concept plan (in build-order terms: after Empty State / Number Input)

0. **Sparkline** — in-house, zero deps, pure SVG on tokens. Ships value
   immediately, starts the in-house track, no engine decision needed.
1. **Chart shell** — the accessible container + the tokens→theme bridge
   (Style Dictionary target emitting a chart theme from `tokens.json`), plus
   the written **Tufte theme rules** (data-ink, direct labels, no gridlines by
   default, colorblind-safe palette from the tokens).
2. **Adapter 1: ECharts** — line, bar, area, scatter through the shell. The
   test: show a rendered chart to a designer — if they can tell it's ECharts,
   the theming failed.
3. **Adapter 2: Vega-Lite** — the *same four charts* through the same shell
   API. This is the proof that the seam is real (like Combobox was for the
   React adapter). Only then decide whether both stay supported or one is the
   blessed engine.
4. **ADR 0007** — record the outcome: seam API, default engine, theming
   contract, and the in-house track's scope.

## Risks & mitigations

- **Engine abandonment** → seam + our theme = migration is one adapter, not a
  rewrite. Observable Plot's stall (found during this audit) is the cautionary
  tale, not a hypothetical.
- **Canvas engines vs CSS tokens** → the theme bridge from `tokens.json` is a
  build step we already own (Style Dictionary emits JS as easily as CSS).
- **Scope creep of the in-house track** → gated: it only grows past Sparkline
  and small multiples if the engines demonstrably can't express the Tufte
  identity.
- **Two engines = double maintenance** → the PoC exists to decide; the end
  state may well be one blessed engine + a documented seam for bring-your-own.

Sources: [ECharts releases](https://github.com/apache/echarts/releases) ·
[Observable Plot releases](https://github.com/observablehq/plot/releases) ·
[Vega-Lite](https://en.wikipedia.org/wiki/Vega_and_Vega-Lite_visualisation_grammars) ·
[D3](https://en.wikipedia.org/wiki/D3.js)
