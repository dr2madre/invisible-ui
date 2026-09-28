// The four navigation glyphs of the Svelte segmented-control demo
// (packages/docs/src/demos/icons), each written as one path so every adapter
// can draw it: the custom elements take an icon as path data only.
export const navIcons = [
  {
    value: "home",
    label: "Home",
    path: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  },
  {
    value: "search",
    label: "Search",
    path: "M19 11a8 8 0 1 1-16 0 8 8 0 1 1 16 0z M21 21l-4.35-4.35",
  },
  {
    value: "alerts",
    label: "Alerts",
    path: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
  },
  {
    value: "profile",
    label: "Profile",
    path: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M16 7a4 4 0 1 1-8 0 4 4 0 1 1 8 0z",
  },
] as const;
