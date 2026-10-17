import { collapsible, navigationBar } from "@invisible-ui/core";
import { useId, useMemo, useState, type ReactNode } from "react";
import { useI18n } from "../i18n/i18n";
import { ChevronEndGlyph, ChevronStartGlyph, Icon } from "../icon/Icon";
import { useControllable } from "../internal/controllable";
import { cx } from "../internal/cx";
import { fail } from "../internal/dev";
import { useBadgeAnnouncements } from "../internal/use-badge-announcements";
import { normalizeProps } from "../normalize";
import { SheetDialog } from "../sheet-dialog/SheetDialog";
import { Tooltip } from "../tooltip/Tooltip";
import {
  canRail,
  holdsCurrent,
  resolveSections,
  type ResolvedSection,
  type SidebarItem,
  type SidebarSection,
} from "./identity";

export type { SidebarItem, SidebarSection };

export interface SidebarProps {
  /** Groups of items, rendered in order with an optional heading each. */
  sections: SidebarSection[];
  /** The current destination's value. The application owns it. */
  value?: string | null;
  /** Accessible name for the navigation landmark. Defaults to the catalog's "Main". */
  label?: string;
  /** Called when an item without an `href` is activated. */
  onSelect?: (value: string) => void;
  /** How this viewport shows the navigation. The application decides. */
  mode?: "inline" | "drawer";
  /** The rail: labels hidden from sight, icons kept. */
  collapsed?: boolean;
  /**
   * Given, the rail toggle is rendered and reports every press, as long as
   * every destination carries an icon: without one there would be nothing to
   * show once the labels are hidden.
   */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Whether the drawer is open (`mode="drawer"`). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Which sections are open, by id. Given it, the application owns the set and
   * this component only reports presses; left out, the component keeps the set
   * itself and opens the section holding the current item.
   */
  openGroups?: string[];
  onOpenGroupsChange?: (openGroups: string[]) => void;
  /** Whether following an item closes the drawer. */
  closeOnNavigate?: boolean;
  /** Which edge the drawer comes from. Follows the writing direction. */
  side?: "inline-start" | "inline-end";
  /** The drawer's accessible name. Falls back to `label`. */
  title?: string;
  /** Whether the drawer renders its own trigger button. */
  renderTrigger?: boolean;
  /** Where focus goes when a drawer with no trigger of its own closes. */
  returnFocusTo?: string;
  /** The drawer trigger's content (`mode="drawer"`). Defaults to the catalog's label. */
  trigger?: ReactNode;
  /** The logo at the top of the navigation. */
  logo?: ReactNode;
  /** The footer at the bottom of the navigation. */
  footer?: ReactNode;
}

interface ItemsProps {
  items: SidebarItem[];
  value: string | null;
  collapsed: boolean;
  onSelect?: (value: string) => void;
  onNavigate?: () => void;
}

const lock = (
  <Icon>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Icon>
);

/**
 * The items of one section. An item with an `href` is a link, one without is
 * a button that reports its value. On the rail the name leaves the page but
 * stays in the accessibility tree, and a tooltip gives it back to whoever is
 * looking.
 *
 * A badge shows its count or a dot after the label, or on the icon in the
 * rail, and its text is part of the name. An unavailable item stays
 * focusable, shows a lock and its reason under the label (in the rail's
 * tooltip once the labels are hidden), reads the reason as its description,
 * and does nothing when activated. The state and the activation come from the
 * headless navigation bar, shared with the Navigation Bar.
 */
function SidebarItems({ items, value, collapsed, onSelect, onNavigate }: ItemsProps) {
  const { t } = useI18n();
  const id = `ds-sidebar-items-${useId()}`;
  return (
    <ul className={cx("sidebar__list", collapsed && "sidebar__list--collapsed")}>
      {items.map((item, index) => {
        const current = item.value === value;
        const { badge, unavailable } = item;
        const reasonId = `${id}-reason-${index}`;
        const Element = item.href === undefined ? "button" : "a";
        const control = (
          <Element
            className={cx("sidebar__item", current && "sidebar__item--active")}
            {...normalizeProps(
              navigationBar.destinationProps({
                destination: item,
                current,
                reasonId,
                onSelect,
                onNavigate,
              }),
            )}
          >
            {item.icon != null ? (
              <span className="sidebar__icon" aria-hidden="true">
                {item.icon}
              </span>
            ) : null}
            <span className={collapsed ? "sidebar__label--hidden" : "sidebar__label"}>
              {item.label}
              {badge ? <span className="sidebar__label--hidden">, {badge.label}</span> : null}
              {unavailable ? (
                <span className="sidebar__reason" id={reasonId} aria-hidden="true">
                  {unavailable.reason}
                </span>
              ) : null}
            </span>
            {unavailable ? (
              <span className="sidebar__status" aria-hidden="true">
                {lock}
              </span>
            ) : null}
            {badge ? (
              <span
                className={cx(
                  "sidebar__badge",
                  badge.content === undefined && "sidebar__badge--dot",
                )}
                aria-hidden="true"
              >
                {badge.content ?? ""}
              </span>
            ) : null}
          </Element>
        );
        return (
          <li key={item.value}>
            {collapsed ? (
              <Tooltip
                text={
                  unavailable
                    ? t("sidebar.unavailableTooltip", {
                        label: item.label,
                        reason: unavailable.reason,
                      })
                    : item.label
                }
                placement="right"
              >
                {control}
              </Tooltip>
            ) : (
              control
            )}
          </li>
        );
      })}
    </ul>
  );
}

interface GroupProps {
  label: string;
  open: boolean;
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * One collapsible section: a disclosure button over its items. It holds no
 * state: what it shows is `open`, and a press is a request the Sidebar
 * answers, so a set the application controls moves only when it moves it.
 */
function SidebarGroup({ label, open, collapsed, onToggle, children }: GroupProps) {
  const id = `ds-sidebar-group-${useId()}`;
  const api = collapsible.connect({
    state: { open, disabled: false, id },
    setOpen: onToggle,
    normalize: normalizeProps,
  });
  return (
    <div className="sidebar__section" data-state={open ? "open" : "closed"}>
      <button className="sidebar__group" {...api.triggerProps}>
        <span className={collapsed ? "sidebar__label--hidden" : "sidebar__group-label"}>
          {label}
        </span>
        <span
          className={cx("sidebar__chevron", open && "sidebar__chevron--open")}
          aria-hidden="true"
        >
          <Icon>
            <ChevronEndGlyph />
          </Icon>
        </span>
      </button>
      <div className="sidebar__group-content" {...api.contentProps}>
        {children}
      </div>
    </div>
  );
}

interface NavProps {
  entries: ResolvedSection[];
  label: string;
  value: string | null;
  collapsed: boolean;
  mode: "inline" | "drawer";
  side: "inline-start" | "inline-end";
  openIds: string[];
  onSelect?: (value: string) => void;
  onNavigate?: () => void;
  onPressGroup: (id: string) => void;
  /** Given, the rail toggle is rendered; the Sidebar decides whether to. */
  onToggleCollapsed?: () => void;
  toggleLabel?: string;
  logo?: ReactNode;
  footer?: ReactNode;
}

/** The navigation landmark itself; the Sidebar owns every piece of state. */
function SidebarNav({
  entries,
  label,
  value,
  collapsed,
  mode,
  side,
  openIds,
  onSelect,
  onNavigate,
  onPressGroup,
  onToggleCollapsed,
  toggleLabel,
  logo,
  footer,
}: NavProps) {
  const { t } = useI18n();
  const targets = useMemo(() => entries.flatMap(({ section }) => section.items), [entries]);
  // A badge that appears or changes is announced once; nothing on mount.
  const [spoken, live] = useBadgeAnnouncements(targets, t);
  return (
    <nav
      className={cx("sidebar", collapsed && "sidebar--collapsed")}
      aria-label={label}
      data-mode={mode}
      data-side={side}
      data-collapsed={collapsed ? "" : undefined}
    >
      {logo != null ? <div className="sidebar__logo">{logo}</div> : null}

      {onToggleCollapsed ? (
        // A toggle button keeps one name and reports its state through
        // aria-pressed; a name that swapped as well would contradict it.
        <button
          type="button"
          className="sidebar__rail-toggle"
          aria-pressed={collapsed}
          onClick={onToggleCollapsed}
        >
          <span className="sidebar__icon" aria-hidden="true">
            <Icon>{collapsed ? <ChevronEndGlyph /> : <ChevronStartGlyph />}</Icon>
          </span>
          <span className="sidebar__label--hidden">{toggleLabel}</span>
        </button>
      ) : null}

      {/* Keyed by the name the section answers to, which the resolver makes
          unique: two sections may share a label, never an identity. */}
      {entries.map(({ section, id }) =>
        section.collapsible && section.label ? (
          <SidebarGroup
            key={id}
            label={section.label}
            open={openIds.includes(id)}
            collapsed={collapsed}
            onToggle={() => onPressGroup(id)}
          >
            <SidebarItems
              items={section.items}
              value={value}
              collapsed={collapsed}
              onSelect={onSelect}
              onNavigate={onNavigate}
            />
          </SidebarGroup>
        ) : (
          <div key={id} className="sidebar__section">
            {section.label ? (
              <p className={cx("sidebar__section-label", collapsed && "sidebar__label--hidden")}>
                {section.label}
              </p>
            ) : null}
            <SidebarItems
              items={section.items}
              value={value}
              collapsed={collapsed}
              onSelect={onSelect}
              onNavigate={onNavigate}
            />
          </div>
        ),
      )}

      {footer != null ? <div className="sidebar__footer">{footer}</div> : null}

      <div className="sidebar__live" aria-live="polite" ref={live}>
        {spoken.map((announcement) => (
          <span key={announcement.value}>{announcement.text}</span>
        ))}
      </div>
    </nav>
  );
}

/** The collapsible sections that start open. */
const initialGroups = (entries: ResolvedSection[], value: string | null) =>
  entries
    .filter(
      ({ section }) => section.collapsible && (section.defaultOpen || holdsCurrent(section, value)),
    )
    .map(({ id }) => id);

/**
 * Sidebar: the application's side navigation: an optional logo, labelled
 * sections of items (icon and label), and a footer. Items are links when given
 * an `href`, otherwise buttons that report `onSelect`. The current destination
 * is marked with `aria-current="page"`.
 *
 * Items take the Navigation Bar's destinations as they are. A `badge` shows a
 * count or a dot, its text is part of the item's name, and when it appears or
 * changes it is announced politely once (`announce: false` silences it); while
 * a modal dialog outside the sidebar is open the announcement waits for it to
 * close (ADR 0016). An `unavailable` item stays visible and focusable with its
 * reason shown and read as its description, and activating it does nothing.
 * To hide a destination, leave it out.
 *
 * Three things stay with the application: the routing, which destination is
 * current, and which viewport gets which presentation. This component reads no
 * media query; `mode` says what to render.
 *
 * Sections can collapse, the bar itself can collapse to a rail of icons, and
 * `mode="drawer"` puts the same navigation inside a SheetDialog (ADR 0013).
 * Themeable via `--ds-sidebar-*`.
 */
export function Sidebar({
  sections,
  value = null,
  label,
  onSelect,
  mode = "inline",
  collapsed: collapsedProp = false,
  onCollapsedChange,
  open: openProp = false,
  onOpenChange,
  openGroups,
  onOpenGroupsChange,
  closeOnNavigate = true,
  side = "inline-start",
  title,
  renderTrigger = true,
  returnFocusTo,
  trigger,
  logo,
  footer,
}: SidebarProps) {
  const { t, dir } = useI18n();
  const [collapsed, setCollapsed] = useControllable(collapsedProp, onCollapsedChange);
  const [open, setOpen] = useControllable(openProp, onOpenChange);

  // Resolved once per set of sections: a collapsible section answers to its
  // own id, and a mistake there is loud in development and deterministic in
  // production.
  const entries = useMemo(() => resolveSections(sections), [sections]);

  // The rail is only offered when every destination shows something without
  // its label. Otherwise it would hide the name and leave an empty control.
  const railable = canRail(sections);
  if (mode === "inline" && collapsed && !railable) {
    fail(
      "a collapsed sidebar needs an icon on every destination: without one a " +
        "destination shows nothing at all once the labels are out of sight",
    );
  }
  const isRail = mode === "inline" && collapsed && railable;

  // The ids this component keeps open, seeded from the first render.
  const [ownGroups, setOwnGroups] = useState(() => initialGroups(entries, value));

  // Which collapsible section holds the current destination. It moves when
  // the destination moves and when the sections change, and both open it,
  // silently, while nobody controls the set (ADR 0013).
  const holder =
    entries.find(({ section }) => section.collapsible && holdsCurrent(section, value))?.id ?? null;
  const [lastHolder, setLastHolder] = useState(holder);
  if (holder !== lastHolder) {
    setLastHolder(holder);
    if (openGroups === undefined && holder !== null && !ownGroups.includes(holder)) {
      setOwnGroups([...ownGroups, holder]);
    }
  }
  // While the application controls the set, the copy is that set, so handing
  // `openGroups` back continues from what was on screen.
  if (openGroups !== undefined && ownGroups !== openGroups) setOwnGroups(openGroups);
  const openIds = openGroups ?? ownGroups;

  const toggleGroup = (id: string) => {
    const next = openIds.includes(id) ? openIds.filter((g) => g !== id) : [...openIds, id];
    // Controlled, the press only asks: the copy stays the application's.
    if (openGroups === undefined) setOwnGroups(next);
    onOpenGroupsChange?.(next);
  };

  const pressGroup = (id: string) => {
    // On the rail the bar opens first: the items would otherwise expand into
    // a column too narrow to read them.
    if (isRail) {
      setCollapsed(false);
      if (!openIds.includes(id)) toggleGroup(id);
      return;
    }
    toggleGroup(id);
  };

  const resolvedLabel = label ?? t("sidebar.label");

  if (mode === "drawer") {
    // The drawer's edge follows the writing direction.
    const start = side === "inline-start";
    return (
      <SheetDialog
        open={open}
        renderTrigger={renderTrigger}
        returnFocusTo={returnFocusTo}
        side={start === (dir === "rtl") ? "right" : "left"}
        title={title ?? resolvedLabel}
        trigger={trigger ?? t("sidebar.open")}
        onOpenChange={setOpen}
      >
        <SidebarNav
          entries={entries}
          label={resolvedLabel}
          value={value}
          collapsed={false}
          mode="drawer"
          side={side}
          openIds={openIds}
          onSelect={onSelect}
          onNavigate={() => {
            if (closeOnNavigate) setOpen(false);
          }}
          onPressGroup={pressGroup}
          logo={logo}
          footer={footer}
        />
      </SheetDialog>
    );
  }

  return (
    <SidebarNav
      entries={entries}
      label={resolvedLabel}
      value={value}
      collapsed={isRail}
      mode="inline"
      side={side}
      openIds={openIds}
      onSelect={onSelect}
      onPressGroup={pressGroup}
      onToggleCollapsed={onCollapsedChange && railable ? () => setCollapsed(!collapsed) : undefined}
      toggleLabel={t("sidebar.collapse")}
      logo={logo}
      footer={footer}
    />
  );
}
