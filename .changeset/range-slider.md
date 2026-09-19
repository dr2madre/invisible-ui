---
"@design-system/svelte": minor
"@design-system/vue": minor
"@design-system/core": minor
---

Range Slider: a two-thumb slider on two real range inputs, in core and both adapters.

`RangeSlider` is its own component, never a mode on `Slider`. The value is an ordered pair and everything about it — the clamp, the bound each thumb reports, the change it announces — works on the pair as a whole. Two native `<input type="range">` elements share one track, so each thumb keeps the browser's own slider role, keyboard map, pointer drag, focus and form participation.

**Both thumbs keep the slider's global `min` and `max`, always.** Giving a thumb the narrower bounds its sibling allows was measured moving it on screen while its value stood still, because a native thumb renders at `(value - min) / (max - min)` of the track. The bound a thumb may not cross travels instead as an explicit `aria-valuemin` / `aria-valuemax` override, and as `aria-valuetext`, which says in words why the arrows stop there. ARIA-in-HTML discourages that override on a native range input, so the text is not a nicety: `aria-valuetext` is permitted there, and does not depend on the override being honoured.

**The thumbs never cross and never trade places.** A thumb driven past its sibling stops at the sibling's value, less `minDistance` when one is given; the sibling does not move, and neither thumb becomes the other. `minDistance` is rounded *up* to the step grid, never down, and capped at the widest distance the grid can hold between `min` and `max`: the pair is never closer than was asked, and a distance wider than the track leaves exactly one legal pair, `[min, max]`. A pair with no room above for the distance slides down instead of staying invalid. DOM order, tab order and thumb identity hold even when both values are equal.

One action reports the complete pair exactly once, through `onValueChange`. Reflecting a controlled `value` reports nothing, and neither does a native form reset, which restores the current default pair — normalized the same way a drag would be, so a reset with no script running can never leave an invalid pair on screen. Both thumbs submit under one `name`, in order: `FormData.getAll(name)` reads `["20", "80"]`.

**Constraints may change after mount.** `min`, `max`, `step`, `minDistance`, `orientation` and `disabled` reach the machine, the DOM, the fill and the dependent bounds without a remount, in both adapters, and report nothing. A pair the new constraints no longer allow is normalized silently, and the form-reset default with it.

**Only the thumbs take a press.** That gives up the native click-to-jump on bare track and buys a press that lands on the thumb the user aimed at. The nearer thumb is raised as the pointer moves, along the logical axis: horizontal LTR, horizontal RTL (where a native range paints `min` on the right) and vertical (where it paints `min` at the bottom) alike, and never while a drag is in flight. Stacked thumbs stay operable without a hover: a pointer to one side of the stack reaches the thumb that would move that way, and with no pointer over the track at all, as for a touch, the upper thumb is on top unless the pair is stacked at `max`, where only the lower one can move. How touch assistive technology reaches a stacked pair is not verified before the manual accessibility session.

Props are `value`, `min`, `max`, `step`, `minDistance`, `orientation`, `disabled`, `label` for the group, `thumbLabels` for the two thumbs, `name`, `format`, `showValue`, `showRange` and `ticks`. Vue also binds with `v-model`. New tokens are `--ds-range-slider-length`, `--ds-range-slider-vertical-length`, `--ds-range-slider-track-size` and `--ds-range-slider-thumb-size`, whose default is 24px, the smallest pointer target WCAG 2.2 accepts. Core gains the `rangeSlider.lowerText` and `rangeSlider.upperText` messages.
