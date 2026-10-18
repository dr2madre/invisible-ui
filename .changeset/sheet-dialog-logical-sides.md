---
"@invisible-ui/core": minor
"@invisible-ui/svelte": minor
"@invisible-ui/vue": minor
"@invisible-ui/react": minor
"@invisible-ui/elements": minor
---

Sheet Dialog takes the logical sides `start` and `end`, and `end` is the new
default. The physical names `left` and `right` are removed: they placed the
panel by the reading direction anyway, so `left` becomes `start` and `right`
becomes `end`. Nothing was published, so no alias is kept. In
right-to-left text the panel now slides in from the edge it sits on and is
dragged closed toward it; before, the slide-in came from inside the screen
and the drag could not close it. A released drag no longer animates its snap
back under `prefers-reduced-motion`. The drag distance reaches the sheet
through the `--_sheet-drag` custom property instead of an inline `transform`.
The drawer of Sidebar now asks for `start` or `end`, so its edge is right in
right-to-left text too. Core exports the shared rules as the `sheetDialog` namespace:
`edge`, `outward` and `shouldDismiss`, and `SheetSide` holds only `top`,
`bottom`, `start` and `end`.
