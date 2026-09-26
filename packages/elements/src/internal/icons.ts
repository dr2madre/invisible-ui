interface SvgAttributes {
  width?: string;
  height?: string;
  strokeWidth?: number;
}

/** Shared decorative SVG glyphs (same drawings as the other adapters' Icon). */
const svg = (
  inner: string,
  className = "",
  { width = "1em", height = "1em", strokeWidth = 2 }: SvgAttributes = {},
) => {
  const classes = ["icon", className].filter(Boolean).join(" ");
  return `<svg class="${classes}" viewBox="0 0 24 24" width="${width}" height="${height}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="flex:none;vertical-align:middle">${inner}</svg>`;
};

export const checkIcon = (cls = "") =>
  svg(`<polyline points="20 6 9 17 4 12" />`, cls, {
    width: "100%",
    height: "100%",
    strokeWidth: 3,
  });

export const dashIcon = (cls = "") =>
  svg(`<line x1="5" y1="12" x2="19" y2="12" />`, cls, {
    width: "100%",
    height: "100%",
    strokeWidth: 3,
  });

export const chevronIcon = () =>
  svg(`<polyline points="6 9 12 15 18 9" />`, "", { width: "100%", height: "100%" });

/** A disclosure chevron: a single polyline at a themeable size. */
export const disclosureIcon = (points: string, size: string) =>
  svg(`<polyline points="${points}" />`, "", { width: size, height: size });

export const searchIcon = () =>
  svg(`<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />`, "", {
    width: "100%",
    height: "100%",
  });

export const closeIcon = () =>
  svg(`<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />`, "", {
    width: "100%",
    height: "100%",
  });

export const sortIcon = (direction: "asc" | "desc" | null) => {
  if (direction === "asc") return svg(`<polyline points="6 14 12 8 18 14" />`);
  if (direction === "desc") return svg(`<polyline points="6 10 12 16 18 10" />`);
  return svg(
    `<polyline points="8 9 12 5 16 9" /><polyline points="8 15 12 19 16 15" />`,
    "table__sort-icon-unset",
  );
};

export const plusIcon = () =>
  svg(`<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />`);

/** The sliders glyph on Table View's column-settings trigger. */
export const settingsIcon = () =>
  svg(
    `<line x1="21" y1="4" x2="14" y2="4" /><line x1="10" y1="4" x2="3" y2="4" /><line x1="21" y1="12" x2="12" y2="12" /><line x1="8" y1="12" x2="3" y2="12" /><line x1="21" y1="20" x2="16" y2="20" /><line x1="12" y1="20" x2="3" y2="20" /><line x1="14" y1="2" x2="14" y2="6" /><line x1="8" y1="10" x2="8" y2="14" /><line x1="16" y1="18" x2="16" y2="22" />`,
    "",
    { width: "1.15em", height: "1.15em" },
  );

/** The check at text size, for a message line (the box check fills its box). */
export const successIcon = () => svg(`<polyline points="20 6 9 17 4 12" />`);

export const hazardIcon = () =>
  svg(
    `<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12" y2="17" />`,
  );

export type FeedbackStatus = "info" | "success" | "warning" | "danger" | "neutral";

/** Built-in decorative glyph used by feedback surfaces. */
export const feedbackIcon = (status: FeedbackStatus) => {
  if (status === "success") return successIcon();
  if (status === "warning") return hazardIcon();
  if (status === "danger")
    return svg(
      `<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />`,
    );
  if (status === "neutral")
    return svg(
      `<path d="M9 18h6" /><path d="M10 22h4" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />`,
    );
  return svg(
    `<circle cx="12" cy="12" r="10" /><line x1="12" y1="11" x2="12" y2="16" /><line x1="12" y1="8" x2="12" y2="8" />`,
  );
};

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Build the same glyph as {@link svg} for a consumer-supplied path, through the
 * DOM instead of an HTML string: `d` reaches an attribute, never a parser, so a
 * hostile value can only draw a wrong shape.
 */
export function pathIcon(d: string, cls = "icon"): SVGSVGElement {
  const root = document.createElementNS(SVG_NS, "svg");
  for (const [name, value] of [
    ["class", cls],
    ["viewBox", "0 0 24 24"],
    ["width", "100%"],
    ["height", "100%"],
    ["fill", "none"],
    ["stroke", "currentColor"],
    ["stroke-width", "2"],
    ["stroke-linecap", "round"],
    ["stroke-linejoin", "round"],
    ["aria-hidden", "true"],
    ["focusable", "false"],
  ]) {
    root.setAttribute(name!, value!);
  }

  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", d);
  root.appendChild(path);
  return root;
}
