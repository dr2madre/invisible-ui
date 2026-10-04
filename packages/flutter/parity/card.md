# Card parity checklist

Reference commit: `0c336bd6e53053c3c9e46ad4d7701879eba50315`

Reference paths: `packages/svelte/src/lib/card`

The Flutter `Card` checked against the Svelte `Card`
(`packages/svelte/src/lib/card`).
Docs page: [Card](https://dr2madre.github.io/invisible-ui/components/data-layout/card/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/card_test.dart`
that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `Card(...)` | `variant="media"` | the media card |
| `Card.dashboard(...)` | `variant="dashboard"` | the metric tile; a named constructor, since its fields differ |
| `orientation: CardOrientation.vertical`, `.horizontal` | `orientation` | direction of a media card |
| `secondary: true` | `surface="secondary"` | the quieter surface |
| `media` | `imageSrc` with `imageAlt`, `media` snippet | the media area; the app passes an `Image` with its own semantic label |
| `icon`, `tags`, `actions`, `child` | the snippets of the same names, `children` | content areas |
| `title`, `headingLevel` (2 to 6), `description` | the same props | heading and body |
| `value`, `change`, `trend: CardTrend`, `metric` | the same props | the dashboard figures |

## Content and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Vertical: media, tags above the title, description, content, actions | matched | `vertical: media, tags above the title, then the description and the actions` |
| Horizontal: media at the inline-start, title and tags on one line, actions at the inline-end, mirrored right to left | matched | `horizontal: media at the inline-start, mirrored right to left` |
| Horizontal media stretches to the card's height | adapted | a Flutter row stretches its children only to a known height, and measuring arbitrary content for it is not always possible: the media keeps its own height, centred |
| A horizontal card on a narrow width | adapted | under 400 logical pixels, scaled with the text, it stacks as a vertical card instead of squeezing the text: `a horizontal card stacks on a narrow width and at text scale 2.0, without overflow` |
| An icon takes the media area and is decorative | matched | `an icon takes the media area and stays decorative` |
| Dashboard: icon over title, value with its change beside it, coloured by trend | matched | `dashboard: the value with its change, coloured by trend, wrapping under the title on a narrow card` |
| Dashboard on a narrow card | adapted | the figures wrap under the title rather than overflow: same test |
| Secondary surface | matched | `the secondary surface` |
| Border, radius `radius.surface`, padding, gaps, type sizes | matched | the reference's stylesheet values |
| A title snippet replaces the heading | out of scope | the app can put its own heading in `child` |
| A clickable card | out of scope | the reference has none; actions go in `actions` |
| `--ds-card-*` custom properties | out of scope | not asked for yet |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| An article labelled by its title | adapted | Flutter has no article role: the card is one semantics group whose first child is the heading, so the title still introduces it: `one semantics group whose heading is the title` |
| The title is a heading at `headingLevel`, 3 by default | matched | same test |
| Contrast and labelled targets, light and dark | matched | `contrast and labelled targets, light`, `… dark` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |
