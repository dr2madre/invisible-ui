/** Shared decorative SVG glyphs (same drawings as the other adapters' Icon). */
const svg = (inner: string, extra = "") =>
  `<svg class="icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="display:inline-block;flex:none;vertical-align:middle" ${extra}>${inner}</svg>`;

export const checkIcon = (cls = "") =>
  svg(
    `<polyline points="20 6 9 17 4 12" />`,
    `stroke-width="3" width="100%" height="100%" class="icon ${cls}"`,
  );

export const dashIcon = (cls = "") =>
  svg(
    `<line x1="5" y1="12" x2="19" y2="12" />`,
    `stroke-width="3" width="100%" height="100%" class="icon ${cls}"`,
  );

export const chevronIcon = () =>
  svg(`<polyline points="6 9 12 15 18 9" />`, `width="100%" height="100%"`);

export const searchIcon = () =>
  svg(
    `<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />`,
    `width="100%" height="100%"`,
  );

export const closeIcon = () =>
  svg(
    `<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />`,
    `width="100%" height="100%"`,
  );

export const plusIcon = () =>
  svg(`<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />`);

/** The check at text size, for a message line (the box check fills its box). */
export const successIcon = () => svg(`<polyline points="20 6 9 17 4 12" />`);

export const hazardIcon = () =>
  svg(
    `<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12" y2="17" />`,
  );

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
