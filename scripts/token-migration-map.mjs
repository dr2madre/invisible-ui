// Migration-only names. These are not runtime aliases or supported old APIs.
export const families = {
  pink: "magenta-pink",
  red: "alizarin-red",
  orange: "burnt-orange",
  yellow: "naples-yellow",
  lime: "lime-green",
  green: "sap-green",
  teal: "viridian-green",
  sky: "cerulean-blue",
  blue: "cobalt-blue",
  purple: "dioxazine-purple",
  grey: "grey",
  stone: "warm-grey",
};

const roles = {
  "color-background": "background.default",
  "color-text": "foreground.default",
  "color-text-secondary": "foreground.secondary",
  "color-text-disabled": "foreground.disabled",
  "color-border": "border.default",
  "color-control-border": "border.control",
  "color-surface": "container.background.default",
  "color-surface-hover": "container.background.hover",
  "color-disabled": "background.disabled",
  "state-hover": "background.hover",
  "state-pressed": "background.pressed",
  "color-focus-ring": "focus.ring.color",
  "color-focus-halo": "focus.halo.color",
  "color-primary": "action.primary.background.default",
  "color-primary-hover": "action.primary.background.hover",
  "color-on-primary": "action.primary.foreground.default",
  "color-secondary": "action.secondary.background.default",
  "color-secondary-hover": "action.secondary.background.hover",
  "color-on-secondary": "action.secondary.foreground.default",
  "color-on-status": "feedback.solid.foreground.default",
  "color-on-warning": "feedback.warning.solid.foreground.default",
  "color-warning-label-surface": "feedback.warning.label.background.default",
  "color-destructive-surface": "action.danger.background.default",
  "color-on-destructive-surface": "action.danger.foreground.default",
  "color-secondary-surface": "action.secondary.contextual.background.default",
  "color-on-secondary-surface": "action.secondary.contextual.foreground.default",
  "color-selected-text": "selection.contextual.foreground.default",
  "color-secondary-body-text": "action.secondary.body.foreground.default",
  "color-danger-body-text": "feedback.danger.body.foreground.default",
  "color-success-body-text": "feedback.success.body.foreground.default",
  "color-emphasis-surface": "emphasis.background.default",
  "color-on-emphasis": "emphasis.foreground.default",
  "color-emphasis-border": "emphasis.border.default",
  "color-selected": "selection.background.default",
  "color-on-selected": "selection.foreground.default",
};
for (const status of ["info", "success", "warning", "danger", "neutral"]) {
  roles[`color-${status}`] = `feedback.${status}.solid.background.default`;
  roles[`color-${status}-hover`] = `feedback.${status}.solid.background.hover`;
  for (const [old, name] of [
    ["surface", "background"],
    ["text", "foreground"],
    ["border", "border"],
  ])
    roles[`color-${status}-${old}`] = `feedback.${status}.${name}.default`;
}
const special = {
  "dialog-overlay": "components.dialog.overlay.default",
  "navigation-bar-current-indicator":
    "components.navigation-bar.current-indicator.background.default",
  "grid-cell-secondary-surface": "components.data-grid.cell.secondary.background.default",
  "code-block-surface": "components.code-block.background.default",
};

export function newTokenPath(old) {
  const [group, a, b] = old.split(".");
  if (group === "palette") return `colors.palette.${families[a] ?? a}${b ? `.${b}` : ""}`;
  if (group === "style")
    return `colors.${["primary", "secondary"].includes(a) ? "brand" : "feedback"}.${a}.${b}`;
  if (group === "role") {
    if (special[b]) return special[b];
    if (!roles[b]) throw new Error(`Unmapped role: ${old}`);
    return `components.general.${roles[b]}`;
  }
  if (group === "component") {
    if (b === "card-secondary-background") return "components.card.secondary.background.default";
    if (!b.endsWith("-background")) throw new Error(`Unmapped component: ${old}`);
    return `components.${b.slice(0, -11)}.background.default`;
  }
  if (group === "radius") return `metrics.radius.${a === "surface" ? "container" : a}`;
  if (group === "focus") return `components.general.focus.${a.replace("-", ".")}`;
  if (group === "density") return `metrics.density.${a}.${b}`;
  if (group === "typography") {
    if (a.startsWith("font-size-")) return `typography.font-size.${a.slice(10)}`;
    return (
      {
        "line-height": "typography.line-height.default",
        "line-height-tight": "typography.line-height.heading",
        "heading-weight": "typography.font-weight.heading",
      }[a] ?? fail(old)
    );
  }
  return fail(old);
}
function fail(path) {
  throw new Error(`Unmapped token: ${path}`);
}

export function oldCssName(path) {
  const [group, a, b] = path.split(".");
  if (["role", "component"].includes(group)) return `--ds-${b}`;
  if (group === "palette") return `--ds-${a === "grey" ? "neutral" : a}${b ? `-${b}` : ""}`;
  if (group === "style")
    return `--ds-${["primary", "secondary"].includes(a) ? "brand" : "feedback"}-${a}${b === "default" ? "" : `-${b}`}`;
  if (group === "focus" || group === "radius") return `--ds-${group}-${a}`;
  if (group === "typography") return `--ds-${a}`;
  if (group === "density")
    return a === "compact" ? null : `--ds-${b}${a === "touch" ? "-touch" : ""}`;
  return fail(path);
}
