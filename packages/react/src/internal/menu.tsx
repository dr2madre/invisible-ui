import { menu as core } from "@design-system/core";
import { autoUpdate } from "@floating-ui/react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { flushSync } from "react-dom";
import { CheckGlyph, ChevronEndGlyph, Icon } from "../icon/Icon";
import type { Dir } from "../i18n/i18n";
import { normalizeProps } from "../normalize";
import { onOutsidePointerDown } from "./floating";
import { useIsomorphicLayoutEffect } from "./layout-effect";

/**
 * The menu layer Dropdown Menu, Context Menu and Menubar share: the open
 * state of one menu, the popup with every open level, and the DOM side of
 * `docs/menu-submenu-spec.md` that the core leaves to the adapter: roving
 * focus, typeahead per level, the hover delay and grace area, submenu
 * placement and the outside press. Keys, roles and states come from
 * `menu.connect` in `@design-system/core`.
 */

export type MenuPrefix = "menu" | "context-menu" | "menubar";

/** The open state of one menu: the root flag, the focused item and the open submenus. */
interface MenuSession {
  open: boolean;
  activeValue: string | null;
  openPath: string[];
}

const CLOSED: MenuSession = { open: false, activeValue: null, openPath: [] };

/** How long the pointer rests on a submenu trigger, or a sibling, before it acts. */
const HOVER_DELAY = 100;
/** How long the pointer may rest inside the grace area before it ends. */
const GRACE_REST = 300;
const TYPEAHEAD_RESET = 500;

export interface UseMenuOptions {
  items: core.MenuEntry[];
  disabled: boolean;
  onSelect?: (value: string) => void;
  direction: Dir;
  /**
   * Where focus goes when the menu closes by a key or an activation. Defaults
   * to the trigger, found by the id the core gives it.
   */
  returnFocus?: () => void;
}

export interface UseMenu {
  api: core.MenuApi;
  setOpenPath: (path: string[]) => void;
  /** Close every level after a press outside, leaving focus where the press put it. */
  dismiss: () => void;
}

/**
 * The state of one menu and its connected core API. Closing by a key or an
 * activation returns focus before `onSelect` runs, so an item can move focus
 * itself, and a dialog it opens hands focus back to the trigger when it
 * closes (ADR 0016); an outside press leaves focus alone.
 */
export function useMenu({
  items,
  disabled,
  onSelect,
  direction,
  returnFocus,
}: UseMenuOptions): UseMenu {
  const id = `ds-menu-${useId()}`;
  const [session, setSession] = useState<MenuSession>(CLOSED);

  // A menu turned off closes: its keys live on items that no longer act.
  if (disabled && session.open) setSession(CLOSED);

  const setOpen = useCallback(
    (open: boolean) => {
      if (open) {
        setSession((s) => ({ ...s, open }));
        return;
      }
      // Closed in the DOM and focus back before the core reports the choice.
      flushSync(() => setSession((s) => (s.open ? { ...s, open } : s)));
      if (returnFocus) returnFocus();
      else document.getElementById(core.triggerId(id))?.focus();
    },
    [id, returnFocus],
  );
  const setActiveValue = useCallback((activeValue: string | null) => {
    setSession((s) => (s.activeValue === activeValue ? s : { ...s, activeValue }));
  }, []);
  const setOpenPath = useCallback((openPath: string[]) => {
    setSession((s) => ({ ...s, openPath }));
  }, []);

  const api = useMemo(
    () =>
      core.connect({
        state: { ...session, items, disabled, id },
        setOpen,
        setActiveValue,
        setOpenPath,
        onSelect,
        direction,
        normalize: normalizeProps,
      }),
    [session, items, disabled, id, setOpen, setActiveValue, setOpenPath, onSelect, direction],
  );

  // Closed without the core's close, which would move focus.
  const dismiss = useCallback(() => setSession(CLOSED), []);

  return { api, setOpenPath, dismiss };
}

// --- Typeahead ---------------------------------------------------------------

/** Printable keys build a short-lived buffer; it starts over when focus changes level. */
function createTypeahead() {
  let buffer = "";
  let scope = "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    match(event: KeyboardEvent, entries: core.MenuEntry[], level: string, active: string | null) {
      const printable =
        event.key.length === 1 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        /\S/.test(event.key);
      if (!printable) return null;
      if (level !== scope) buffer = "";
      scope = level;
      buffer += event.key;
      clearTimeout(timer);
      timer = setTimeout(() => (buffer = ""), TYPEAHEAD_RESET);
      return core.matchItem(entries, buffer, active);
    },
    reset() {
      clearTimeout(timer);
      buffer = "";
    },
  };
}

// --- Submenu placement -------------------------------------------------------

/**
 * Place a submenu beside its trigger with `menu.placeSubmenu`: against the
 * edge of the parent level, its first item level with the trigger, flipped or
 * overlapping when the inline end has no room, never taller than the viewport.
 * The physical side goes on `data-side`, for the grace area.
 */
function placeSubmenuPopup(
  popup: HTMLElement,
  trigger: HTMLElement,
  parent: HTMLElement,
  direction: Dir,
): void {
  popup.style.maxHeight = "";
  const anchor = trigger.getBoundingClientRect();
  const edge = parent.getBoundingClientRect();
  const style = getComputedStyle(popup);
  const inset = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.borderTopWidth) || 0);
  const viewport = popup.ownerDocument.documentElement;
  const placement = core.placeSubmenu({
    anchor: { x: edge.left, y: anchor.top - inset, width: edge.width, height: anchor.height },
    menu: { width: popup.offsetWidth, height: popup.offsetHeight },
    viewport: { width: viewport.clientWidth, height: viewport.clientHeight },
    direction,
  });
  popup.style.left = `${placement.x}px`;
  popup.style.top = `${placement.y}px`;
  popup.style.maxHeight = `${placement.maxHeight}px`;
  popup.dataset.side = placement.physicalSide ?? "";
}

// --- Rendering ---------------------------------------------------------------

/** What every level of one popup needs: the API and the pointer handlers. */
interface LevelContext {
  api: core.MenuApi;
  prefix: MenuPrefix;
  direction: Dir;
  onStopEnter: (stop: core.MenuStop, level: string[], event: PointerEvent) => void;
  onStopLeave: (stop: core.MenuStop, event: PointerEvent) => void;
  onTriggerClick: (handler: unknown) => void;
  onSubmenuEnter: () => void;
}

type Handler = (event?: unknown) => void;

function MenuStopNode({
  stop,
  level,
  inGroup,
  ctx,
}: {
  stop: core.MenuStop;
  level: string[];
  inGroup: boolean;
  ctx: LevelContext;
}) {
  const { api, prefix } = ctx;
  const submenu = core.isSubmenu(stop);
  // The pointer handlers below replace the core's mouse enter, so a pointer
  // crossing the grace area moves nothing.
  const { onMouseEnter: _hover, onClick, ...props } = api.getItemProps(stop.value);
  const button = (
    <button
      type="button"
      className={`${prefix}__item`}
      {...props}
      onClick={submenu ? () => ctx.onTriggerClick(onClick) : (onClick as Handler)}
      onPointerEnter={(event) => ctx.onStopEnter(stop, level, event)}
      onPointerLeave={(event) => ctx.onStopLeave(stop, event)}
    >
      {inGroup || stop.kind ? (
        <span className={`${prefix}__check`} aria-hidden="true">
          {stop.checked ? (
            <Icon size="100%">
              <CheckGlyph />
            </Icon>
          ) : null}
        </span>
      ) : null}
      {core.labelOf(stop)}
      {submenu ? (
        <span className={`${prefix}__submenu-chevron`} aria-hidden="true">
          <Icon size="100%">
            <ChevronEndGlyph />
          </Icon>
        </span>
      ) : null}
    </button>
  );
  if (!submenu || !api.openPath.includes(stop.value)) return button;
  return (
    <>
      {button}
      <SubmenuPopup
        value={stop.value}
        entries={stop.items}
        level={[...level, stop.value]}
        ctx={ctx}
      />
    </>
  );
}

function MenuLevel({
  entries,
  level,
  ctx,
}: {
  entries: core.MenuEntry[];
  level: string[];
  ctx: LevelContext;
}) {
  const { api, prefix } = ctx;
  const submenu = level[level.length - 1];
  return (
    <>
      {entries.map((entry, index) => {
        if (core.isSeparator(entry)) {
          return (
            <div
              key={`separator-${index}`}
              className={`${prefix}__separator`}
              {...api.separatorProps}
            />
          );
        }
        if (core.isGroup(entry)) {
          return (
            <div
              key={`group-${index}`}
              className={`${prefix}__group`}
              {...api.getGroupProps(index, submenu)}
            >
              <div className={`${prefix}__group-label`} {...api.getGroupLabelProps(index, submenu)}>
                {entry.label}
              </div>
              {entry.items.map((item) => (
                <MenuStopNode key={item.value} stop={item} level={level} inGroup ctx={ctx} />
              ))}
            </div>
          );
        }
        return (
          <MenuStopNode key={entry.value} stop={entry} level={level} inGroup={false} ctx={ctx} />
        );
      })}
    </>
  );
}

/**
 * One open submenu. It stays a DOM descendant of the root popup, so its keys
 * reach the root's handler and an outside press sees one tree.
 */
function SubmenuPopup({
  value,
  entries,
  level,
  ctx,
}: {
  value: string;
  entries: core.MenuEntry[];
  level: string[];
  ctx: LevelContext;
}) {
  const { api, prefix, direction } = ctx;
  const props = api.getSubmenuProps(value);
  const triggerId = props["aria-labelledby"] as string;
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const popup = ref.current;
    const trigger = popup?.ownerDocument.getElementById(triggerId);
    const parent = popup?.parentElement?.closest<HTMLElement>('[role="menu"]');
    if (!popup || !trigger || !parent) return;
    const place = () => placeSubmenuPopup(popup, trigger, parent, direction);
    if (typeof ResizeObserver !== "undefined") return autoUpdate(trigger, popup, place);
    place();
  }, [triggerId, direction]);

  return (
    <div
      ref={ref}
      className={`${prefix}__popup ${prefix}__submenu`}
      {...props}
      onPointerEnter={ctx.onSubmenuEnter}
    >
      <MenuLevel entries={entries} level={level} ctx={ctx} />
    </div>
  );
}

// --- The popup ---------------------------------------------------------------

export interface MenuPopupProps {
  api: core.MenuApi;
  prefix: MenuPrefix;
  direction: Dir;
  lang: string;
  setOpenPath: (path: string[]) => void;
  /** Position the root popup and keep it positioned; returns the cleanup. */
  position: (popup: HTMLElement) => () => void;
  /** Elements beside the popup a press may land on without closing it, such as the trigger. */
  inside?: () => (Element | null)[];
  /** Close every level after a press outside. */
  onDismiss: () => void;
  /** A name for the popup when no trigger labels it. */
  label?: string;
}

interface Grace {
  exit: core.Point;
  rect: core.Rect;
  side: core.Side;
  /** The stop the pointer reached inside the area, applied when the grace ends. */
  pending: { stop: core.MenuStop; level: string[] } | null;
  rest: ReturnType<typeof setTimeout> | undefined;
  /** The document listener that follows the pointer while the grace lasts. */
  onMove: (event: globalThis.PointerEvent) => void;
}

const pointOf = (event: { clientX: number; clientY: number }): core.Point => ({
  x: event.clientX,
  y: event.clientY,
});

const insideRect = (p: core.Point, r: core.Rect) =>
  p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;

/**
 * The root popup of an open menu with every open submenu inside it. Render it
 * only while the menu is open: its effects follow the opening.
 */
export function MenuPopup({
  api,
  prefix,
  direction,
  lang,
  setOpenPath,
  position,
  inside,
  onDismiss,
  label,
}: MenuPopupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const latest = useRef({ api, setOpenPath, position, inside, onDismiss });
  useIsomorphicLayoutEffect(() => {
    latest.current = { api, setOpenPath, position, inside, onDismiss };
  });

  // The one pending hover action, and who started it.
  const timer = useRef<{ id?: ReturnType<typeof setTimeout>; owner: string | null }>({
    owner: null,
  });
  const grace = useRef<Grace | null>(null);
  const pointerType = useRef("mouse");
  const [typeahead] = useState(createTypeahead);

  const cancel = () => {
    clearTimeout(timer.current.id);
    timer.current = { owner: null };
  };
  const schedule = (owner: string, action: () => void) => {
    cancel();
    timer.current = {
      owner,
      id: setTimeout(() => {
        timer.current = { owner: null };
        action();
      }, HOVER_DELAY),
    };
  };

  // What a pointer resting on a stop does: it takes focus, a submenu trigger
  // opens its submenu, and anything else closes the submenus open below its
  // level, each after the hover delay.
  const apply = (stop: core.MenuStop, level: string[]) => {
    const current = latest.current.api;
    const disabled = core.isStopDisabled(stop);
    if (!disabled) current.setActive(stop.value);
    if (core.isSubmenu(stop) && !disabled) {
      if (current.openPath.includes(stop.value)) cancel();
      else schedule(stop.value, () => latest.current.api.openSubmenu(stop.value, "none"));
    } else if (current.openPath.length > level.length) {
      schedule(stop.value, () => latest.current.setOpenPath(level));
    } else {
      cancel();
    }
  };

  const onGraceMove = (event: globalThis.PointerEvent) => {
    const g = grace.current;
    if (!g) return;
    const point = pointOf(event);
    if (insideRect(point, g.rect)) endGrace();
    else if (!core.isInGraceArea(point, g.exit, g.rect, g.side)) endGrace(true);
    else restartRest(g);
  };
  const restartRest = (g: Grace) => {
    clearTimeout(g.rest);
    g.rest = setTimeout(() => endGrace(true), GRACE_REST);
  };
  function endGrace(applyPending = false) {
    const g = grace.current;
    if (!g) return;
    clearTimeout(g.rest);
    document.removeEventListener("pointermove", g.onMove);
    grace.current = null;
    if (applyPending && g.pending) apply(g.pending.stop, g.pending.level);
  }

  const onStopEnter = (stop: core.MenuStop, level: string[], event: PointerEvent) => {
    // Touch has no hover: a tap opens and closes.
    if (event.pointerType === "touch") return;
    const g = grace.current;
    if (g && core.isInGraceArea(pointOf(event), g.exit, g.rect, g.side)) {
      g.pending = { stop, level };
      return;
    }
    endGrace();
    apply(stop, level);
  };

  const onStopLeave = (stop: core.MenuStop, event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    // Leaving before the delay ran out is not resting on it.
    if (timer.current.owner === stop.value) cancel();
    const current = latest.current.api;
    if (!core.isSubmenu(stop) || !current.openPath.includes(stop.value)) return;
    const id = current.getSubmenuProps(stop.value).id as string;
    const submenu = ref.current?.ownerDocument.getElementById(id);
    const side = submenu?.dataset.side as core.Side | "" | undefined;
    if (!submenu || !side) return;
    endGrace();
    const r = submenu.getBoundingClientRect();
    const g: Grace = {
      exit: pointOf(event),
      rect: { x: r.left, y: r.top, width: r.width, height: r.height },
      side,
      pending: null,
      rest: undefined,
      onMove: onGraceMove,
    };
    grace.current = g;
    restartRest(g);
    document.addEventListener("pointermove", g.onMove);
  };

  const onSubmenuEnter = () => {
    endGrace();
    cancel();
  };

  // The core reads the pointer type from the click to tell a mouse press on
  // an open trigger (keeps it open) from a touch or pen tap (closes it). A
  // React click event does not carry it, so the last press supplies it.
  const onTriggerClick = (handler: unknown) => {
    (handler as Handler)({ pointerType: pointerType.current });
    pointerType.current = "mouse";
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    cancel();
    endGrace();
    (api.menuProps.onKeyDown as Handler)(event);
    if (event.defaultPrevented) return;
    // The level that has focus: the active item's, else the deepest open one.
    const scope =
      (api.activeValue == null ? undefined : api.findEntry(api.activeValue)?.path) ?? api.openPath;
    const match = typeahead.match(
      event,
      api.entriesAt(scope),
      scope.join("\u0000"),
      api.activeValue,
    );
    if (match == null) return;
    // Typeahead moves within the level that has focus and closes what is open below it.
    if (api.openPath.length > scope.length) setOpenPath(scope);
    api.setActive(match);
  };

  // Position, and close on an outside press, for as long as the menu is open.
  useIsomorphicLayoutEffect(() => {
    const popup = ref.current;
    if (!popup) return;
    const stopPosition = latest.current.position(popup);
    const stopOutside = onOutsidePointerDown(
      () => [popup, ...(latest.current.inside?.() ?? [])],
      () => latest.current.onDismiss(),
    );
    return () => {
      stopPosition();
      stopOutside();
    };
  }, []);

  // Pending hover work and the grace area end with the opening.
  useEffect(
    () => () => {
      clearTimeout(timer.current.id);
      const g = grace.current;
      if (g) {
        clearTimeout(g.rest);
        document.removeEventListener("pointermove", g.onMove);
      }
      typeahead.reset();
    },
    [typeahead],
  );

  // Roving focus: the active item holds DOM focus, at every level.
  const active = api.activeValue;
  const pathKey = api.openPath.join("\u0000");
  useIsomorphicLayoutEffect(() => {
    const popup = ref.current;
    if (!popup) return;
    const node =
      active == null
        ? null
        : popup.querySelector<HTMLElement>(`[data-value="${CSS.escape(active)}"]`);
    (node ?? popup).focus();
  }, [active, pathKey]);

  const ctx: LevelContext = {
    api,
    prefix,
    direction,
    onStopEnter,
    onStopLeave,
    onTriggerClick,
    onSubmenuEnter,
  };

  const { onKeyDown: _keys, "aria-labelledby": labelledBy, ...menuProps } = api.menuProps;

  return (
    <div
      ref={ref}
      className={`${prefix}__popup`}
      {...menuProps}
      aria-labelledby={label ? undefined : (labelledBy as string)}
      aria-label={label}
      lang={lang}
      dir={direction}
      onKeyDown={onKeyDown}
      onPointerDownCapture={(event) => {
        pointerType.current = event.pointerType || "mouse";
      }}
    >
      <MenuLevel entries={api.entriesAt([])} level={[]} ctx={ctx} />
    </div>
  );
}
