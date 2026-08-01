# Translation notes (internal)

Notes for the future localization of the documentation and FAQ answers.

## Target languages

Planned set (docs + FAQ answers):

| Language | Code | Notes |
| --- | --- | --- |
| Italian | `it` | First target; tone quirks below. |
| French | `fr` | |
| Spanish | `es` | |
| German | `de` | |
| Portuguese | `pt-BR` | Brazilian variant first — the larger developer community; `pt-PT` later if demand. |
| Chinese | `zh-CN` | Simplified first; `zh-TW` (traditional) later if demand. |
| Russian | `ru` | |
| Arabic | `ar` | **RTL** — the components already support it (CSS logical properties, `LocaleProvider dir`), so the docs site must too; Arabic is the test that proves it. |

Worth considering as a second wave (large developer communities, commonly
covered by major docs sites): **Japanese** (`ja`), **Korean** (`ko`),
**Indonesian** (`id`), **Turkish** (`tr`), **Hindi** (`hi`).

Implementation path: Starlight (the docs framework) has built-in i18n —
per-locale content folders and localized UI strings — so the site side is
solved; the work is the translation itself and keeping it fresh (untranslated
pages fall back to English automatically).

## Tone quirks

- **"vanilla" → "fiordilatte"** (playful, deliberate). In English, "vanilla
  JS" / "vanilla custom elements" means the plain, no-additives flavour. The
  Italian base gelato flavour is *fiordilatte*, so the Italian prose may
  translate the metaphor as "custom elements fiordilatte" — **only in
  discursive pages** (intros, marketing, guides) where the wink lands.
  **Never** in keywords, headings people search for, code comments, API names
  or the naming map: there the technical term "vanilla" stays, because it is
  what people type into search engines.

## General rules (seed list — grow as translation starts)

- Component names stay in English everywhere (they are API surface).
- ARIA/W3C terms stay in English (`role`, `aria-*`, pattern names).
- The button-copy guideline ("buttons name outcomes") must be re-validated in
  Italian, not translated literally — e.g. *Delete file* / *Keep file* →
  «Elimina il file» / «Conserva il file».
