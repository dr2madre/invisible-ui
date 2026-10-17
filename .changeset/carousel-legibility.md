---
"@invisible-ui/svelte": patch
"@invisible-ui/vue": patch
"@invisible-ui/react": patch
"@invisible-ui/elements": patch
---

Coverflow neighbours are scaled and turned but no longer faded, so their text
keeps its contrast; slides more than two places away stay hidden. The overlay
under a slide's title ends at 55% black instead of transparent, so white text
keeps at least 4.5:1 over any image (4.76:1 over white), and the description is
no longer dimmed. The slide track and the gallery scroll no longer animate
under `prefers-reduced-motion`.
