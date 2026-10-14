# Carousel parity checklist

Reference commit: `3a72a486d1ee462d04c027cc3511fb4c4dab559e`

Reference paths: `core/src/carousel` `packages/svelte/src/lib/carousel`

The Flutter `Carousel` checked against the Svelte `Carousel`
(`packages/svelte/src/lib/carousel/Carousel.svelte`), `core/src/carousel`
and the [WAI-ARIA carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/).
Docs page: [Carousel](https://dr2madre.github.io/invisible-ui/components/data-layout/carousel/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/carousel_test.dart` that holds it. The bounds, the steps and the arrow
keys also answer the shared vectors in `core/src/carousel/__vectors__`
(`test/data_vectors_test.dart`).

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `Carousel(index:, onChanged:)` | `onIndexChange` (React: `index` with `onIndexChange`) | controlled index |
| `Carousel.uncontrolled(initialIndex:)` | no index prop | uncontrolled |
| `items: List<CarouselSlide>` | `items` | the slides; `CarouselSlide(image:, title:, description:, data:)` |
| `itemBuilder` | `children` snippet | custom slide content |
| `variant: CarouselVariant` | `variant` | `slide`, `gallery`, `coverflow` |
| `orientation: Axis` | `orientation` | the coverflow axis and the arrow keys |
| `loop`, `showIndicators`, `label`, `previousLabel`, `nextLabel` | `loop`, `showIndicators`, `label`, `prevLabel`, `nextLabel` | the same meaning |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Previous, next and the dots move once per press and report once | matched | `next, previous and the dots move once per press, …` |
| Previous and next disabled at the ends without loop; loop wraps | matched | `semantics: …`, `the arrows move between slides, …`, and the vectors |
| Arrow keys move while focus is inside, mirrored right to left; up and down when vertical | matched | `the arrows move between slides, …` |
| Arrow keys stay with a text field inside a slide | adapted | the keys go to the text field while it has focus, so typing is never hijacked |
| A button a key press disables | adapted | focus moves to the other button; on the web focus drops to the page: `a button that a key press disables hands focus to the other` |
| A controlled index shows without a report; a shorter list clamps it silently | matched | `a controlled index shows without a report; …` |
| Gallery scrolls the current item into view; its viewport takes focus | matched | `gallery: every item is reachable, …` |
| Auto-advance | out of scope | the reference never advances on its own, so no rotation and no pause control (WCAG 2.2.2) are needed; an auto-advancing variant would need a pause control first (an open point) |
| Reduced motion: no slide animation | matched | `reduced motion: the slide moves at once`; the web drops the slide track, the coverflow transition and the gallery scroll animation too |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A group named `label`, described as a carousel (`aria-roledescription`) | adapted | Flutter has no role description: the container is named `label` and its hint is `carousel.roleDescription`: `semantics: …` |
| Slides named "N of M", described as slides | adapted | the slide's name is `carousel.slide` and its hint `carousel.slideRoleDescription`: same test |
| Slides out of view hidden and inert (slide, coverflow) | matched | excluded from semantics, focus and pointer: same test |
| The viewport is a polite live region | adapted | Flutter has no live region over moved content; each move the user makes is announced politely with the slide's name and title: `next, previous and the dots …` |
| Slide picker named "Choose slide", dots named "Go to slide N" | matched | `semantics: …`; the Svelte dots write "Go to slide" in English instead of `carousel.goTo` (an open point) |
| The current dot (`aria-current`) | adapted | the dot's selected state: same test |
| Previous and next named from the catalog | matched | same test |
| Screen reader output | not yet verified | Assistive technology: not tested |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Slide: one full-width 16:9 slide, image or surface, title and description over a dark band | adapted | the ratio is a minimum, so large text makes the slide taller instead of cutting it; the band stays at least 55% black under the text, so white text keeps 4.5:1 |
| Image-less slides cycle through the pastel set | adapted | the pastels are not in the token source; image-less slides take the neutral surface |
| Gallery: 224 wide items, 16 apart, scaled with the text | matched | `_galleryView` |
| Coverflow: the current item centred, neighbours translated, turned and scaled | matched | `_CoverflowTrack` |
| Coverflow neighbours fade with distance | adapted | never faded: their text keeps its contrast, and items more than two places away are not drawn: `coverflow: neighbours stay opaque, only near ones are drawn`. The web adapters no longer fade them either |
| Coverflow and the slide track mirror right to left | adapted | both follow the reading direction; the web coverflow does not mirror |
| The current dot shows by shape as well as colour | adapted | the current dot is wider and filled with the primary colour; the web fills the dot's button area |
| Arrow buttons over the stage at the inline start and end | matched | `PositionedDirectional` |
| Narrow at text scale 2.0: nothing overflows; 24 by 24, 44 by 44 under touch; contrast | matched | `narrow at text scale 2.0: …` |
