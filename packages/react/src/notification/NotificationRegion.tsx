import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../i18n/i18n";
import { useIsomorphicLayoutEffect } from "../internal/layout-effect";
import { hasOpenModal, onModalChange } from "../internal/modal-stack";
import { swipeDismiss, type SwipeDismissHandle } from "../internal/swipe";
import type { NotificationItem, Notifier } from "./create-notifier";
import { Notification } from "./Notification";

export type NotificationPlacement =
  "top-start" | "top-center" | "top-end" | "bottom-start" | "bottom-center" | "bottom-end";

export interface NotificationRegionProps {
  /** The notifier whose queue this region renders. */
  notifier: Notifier;
  placement?: NotificationPlacement;
  /** Accessible name for the region landmark. Defaults to the catalog's "Notifications". */
  label?: string;
  /**
   * Optional cap on notifications rendered at once. `0` (default) means no
   * count cap: the pile fills the window height and the oldest are clipped at
   * the far edge.
   */
  maxVisible?: number;
  /** Distance from the viewport edges, as a CSS length. Default `1rem`. */
  inset?: string;
  /** Allow swiping a notification away (pointer and touch). Default `true`. */
  swipeable?: boolean;
  /** Enter and reflow duration in ms. */
  duration?: number;
  /** Leave duration in ms. Defaults to 1.75 times `duration`, a gentler exit. */
  exitDuration?: number;
}

/** A notification on its way out, and where it stood in the stack. */
interface Leaving {
  item: NotificationItem;
  index: number;
}

const EMPTY: ReadonlyMap<string, NotificationItem> = new Map();
// Extra time after a transition before its classes go, so the last frame lands.
const SETTLE = 50;

const sameItems = (a: readonly NotificationItem[], b: readonly NotificationItem[]) =>
  a === b || (a.length === b.length && a.every((item, index) => item === b[index]));

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  if (typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener?.("change", onChange);
  return () => query.removeEventListener?.("change", onChange);
};
const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MOTION).matches;
// The server cannot know the preference.
const noPreference = () => false;

const nextFrame = (callback: () => void) =>
  requestAnimationFrame(() => requestAnimationFrame(callback));

/**
 * NotificationRegion: a fixed, stacking container that renders a notifier's
 * queue. It is a landmark (`role="region"` with a label); each Notification
 * inside is its own live region, so a new one is announced.
 *
 * Notifications enter and leave with a slide and a fade, and the stack slides
 * into its new place when one leaves. There is no motion under reduced
 * motion. The region spans the window height and stacks every notification,
 * the newest fully visible on top; when the pile would pass the far edge it
 * is clipped there. `maxVisible` adds a count cap.
 *
 * While a modal dialog is open anywhere in the document, new notifications
 * wait in the notifier's queue, unshown and unannounced (ADR 0016): the
 * dialog holds the user's attention and makes the page behind it inert. When
 * the last modal closes they appear in order, and their auto-dismiss
 * countdowns start then. Notifications already shown when a modal opens
 * stay, with their countdowns held; a change to one of them shows, and is
 * announced, after the modal closes. A message about the dialog's own task
 * belongs in the dialog's status area (`notify()` on the dialog), and a
 * message that needs a decision now belongs in a dialog opened on top.
 *
 * The region always mounts in `<body>`, through a portal, so no ancestor
 * stacking context can paint over it and no dialog it is placed in can hold
 * it. It renders in the browser only: the server and the first client render
 * output nothing.
 *
 *   const notifier = createNotifier();
 *   <NotificationRegion notifier={notifier} placement="top-end" />
 */
export function NotificationRegion({
  notifier,
  placement = "top-end",
  label,
  maxVisible = 0,
  inset = "1rem",
  swipeable = true,
  duration = 200,
  exitDuration,
}: NotificationRegionProps) {
  const { t, locale, dir } = useI18n();
  const items = useSyncExternalStore(
    notifier.subscribe,
    notifier.getSnapshot,
    notifier.getSnapshot,
  );
  const reduced = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, noPreference);
  const motion = reduced ? 0 : duration;
  const motionOut = reduced ? 0 : (exitDuration ?? Math.round(duration * 1.75));

  // The body, once mounted; and whether a modal dialog is open, with what was
  // on screen when it opened: only that stays there, as it was, while one is.
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [modal, setModal] = useState({ open: false, held: EMPTY });
  // What the last commit put on screen: the snapshot a modal holds.
  const onScreen = useRef<readonly NotificationItem[]>([]);

  useEffect(() => {
    const doc = document;
    const sync = () => {
      const open = hasOpenModal(doc);
      setModal((current) =>
        current.open === open
          ? current
          : {
              open,
              held: open ? new Map(onScreen.current.map((item) => [item.id, item])) : EMPTY,
            },
      );
    };
    // The body and the open modals exist only in the browser, after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHost(doc.body);
    sync();
    return onModalChange(doc, sync);
  }, []);

  // New notifications always enter; past the cap the oldest leave.
  const visible = useMemo(() => {
    const eligible = modal.open
      ? items.flatMap((item) => {
          const shown = modal.held.get(item.id);
          return shown ? [shown] : [];
        })
      : items;
    return maxVisible > 0 ? eligible.slice(-maxVisible) : eligible;
  }, [items, modal, maxVisible]);

  // A notification that leaves stays rendered, in its place, while it
  // animates out. The list is reconciled while rendering, as React's
  // "adjust state on a prop change" pattern does.
  const [presence, setPresence] = useState<{
    list: readonly NotificationItem[];
    leaving: readonly Leaving[];
  }>({ list: [], leaving: [] });
  if (!sameItems(presence.list, visible)) {
    const staying = new Set(visible.map((item) => item.id));
    const gone =
      motionOut > 0
        ? presence.list.flatMap((item, index) => (staying.has(item.id) ? [] : [{ item, index }]))
        : [];
    setPresence({
      list: visible,
      leaving: [...presence.leaving.filter(({ item }) => !staying.has(item.id)), ...gone],
    });
  }
  const rendered = useMemo(() => {
    const list = [...visible];
    for (const { item, index } of presence.leaving) {
      if (!list.includes(item)) list.splice(Math.min(index, list.length), 0, item);
    }
    return list;
  }, [visible, presence.leaving]);
  const leavingIds = useMemo(
    () => new Set(presence.leaving.map(({ item }) => item.id)),
    [presence.leaving],
  );

  // Pause the whole stack while any notification is hovered or holds focus,
  // so a burst pauses together. The events bubble from the slots through the
  // region's pointer-events: none root; leaving is "no longer inside".
  const regionRef = useRef<HTMLDivElement>(null);
  const [pointerInside, setPointerInside] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const paused = pointerInside || focusInside || modal.open;
  const inside = (target: EventTarget | null) =>
    target instanceof Node && (regionRef.current?.contains(target) ?? false);

  // Motion and swipe work on the slots' DOM after each commit: enter, leave,
  // and the reflow of the ones that stayed (FLIP). Slots are the region's
  // children, in the order of `rendered`.
  const dom = useRef({
    positions: new Map<string, { top: number; left: number }>(),
    swipes: new Map<string, { el: HTMLElement; handle: SwipeDismissHandle }>(),
    timers: new Set<ReturnType<typeof setTimeout>>(),
    frames: new Set<number>(),
  });
  // Declared before the motion effect, so a remount in development finds the
  // maps empty and attaches the gestures again.
  useIsomorphicLayoutEffect(() => {
    const { swipes, timers, frames, positions } = dom.current;
    return () => {
      for (const { handle } of swipes.values()) handle.destroy();
      for (const timer of timers) clearTimeout(timer);
      for (const id of frames) cancelAnimationFrame(id);
      swipes.clear();
      timers.clear();
      frames.clear();
      positions.clear();
    };
  }, []);
  useIsomorphicLayoutEffect(() => {
    const region = regionRef.current;
    onScreen.current = region ? visible : [];
    if (!region) return;
    const { positions, swipes, timers, frames } = dom.current;
    const later = (callback: () => void, delay: number) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);
      timers.add(timer);
    };
    const frame = (callback: () => void) => {
      const id = nextFrame(() => {
        frames.delete(id);
        callback();
      });
      frames.add(id);
    };

    const slots = Array.from(region.children) as HTMLElement[];
    const present = new Set<string>();
    rendered.forEach((item, index) => {
      const el = slots[index];
      if (!el) return;
      const { id } = item;
      present.add(id);

      if (leavingIds.has(id)) {
        positions.delete(id);
        swipes.get(id)?.handle.destroy();
        swipes.delete(id);
        if (el.inert) return;
        // A leaving notification takes no input; removing it fires no
        // focusout, so focus leaves it first.
        el.inert = true;
        if (el.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
        el.classList.add("notice-leave-from", "notice-leave-active");
        void el.offsetHeight;
        frame(() => el.classList.replace("notice-leave-from", "notice-leave-to"));
        later(
          () =>
            setPresence((current) => ({
              ...current,
              leaving: current.leaving.filter((entry) => entry.item.id !== id),
            })),
          motionOut + SETTLE,
        );
        return;
      }

      const before = positions.get(id);
      const after = { top: el.offsetTop, left: el.offsetLeft };
      positions.set(id, after);
      if (!before) {
        if (motion > 0) {
          el.classList.add("notice-enter-from", "notice-enter-active");
          void el.offsetHeight;
          frame(() => {
            el.classList.replace("notice-enter-from", "notice-enter-to");
            later(
              () => el.classList.remove("notice-enter-active", "notice-enter-to"),
              motion + SETTLE,
            );
          });
        }
      } else if (motionOut > 0 && (before.top !== after.top || before.left !== after.left)) {
        el.style.transform = `translate(${before.left - after.left}px, ${before.top - after.top}px)`;
        el.style.transitionDuration = "0s";
        void el.offsetHeight;
        el.classList.add("notice-move");
        el.style.transform = "";
        el.style.transitionDuration = "";
        later(() => el.classList.remove("notice-move"), motionOut + SETTLE);
      }

      // Each commit hands the gesture this render's props.
      const swipe = swipes.get(id);
      const options = { disabled: !swipeable, onDismiss: () => notifier.dismiss(id, "user") };
      if (swipe?.el === el) swipe.handle.update(options);
      else {
        swipe?.handle.destroy();
        swipes.set(id, { el, handle: swipeDismiss(el, options) });
      }
    });
    for (const id of positions.keys()) if (!present.has(id)) positions.delete(id);
    for (const [id, swipe] of swipes) {
      if (present.has(id)) continue;
      swipe.handle.destroy();
      swipes.delete(id);
    }
  });

  if (!host) return null;

  // The padding and the private motion variables come from the props, set
  // inline as in the other adapters, so an outside override cannot win.
  const style = {
    padding: inset,
    "--_notice-motion": `${motion}ms`,
    "--_notice-motion-out": `${motionOut}ms`,
  } as CSSProperties;

  return createPortal(
    <div
      ref={regionRef}
      className="notification-region"
      data-placement={placement}
      role="region"
      aria-label={label ?? t("notificationRegion.label")}
      lang={locale}
      dir={dir}
      style={style}
      onPointerOver={() => setPointerInside(true)}
      onPointerOut={(event) => {
        if (!inside(event.relatedTarget)) setPointerInside(false);
      }}
      onFocus={() => setFocusInside(true)}
      onBlur={(event) => {
        if (!inside(event.relatedTarget)) setFocusInside(false);
      }}
    >
      {rendered.map((notice, index) => (
        // Older notifications paint above newer ones, so each covers the
        // shadow of the one above it; the order is part of the stacking
        // geometry the sheet leaves to the adapter.
        <div key={notice.id} className="notice-slot" style={{ zIndex: 100000 - (index + 1) }}>
          <Notification
            status={notice.status}
            title={notice.title}
            text={notice.text}
            duration={notice.duration}
            closable={notice.closable}
            role={notice.role}
            actions={notice.actions}
            inverted={notice.inverted}
            snack={notice.snack}
            component={notice.component}
            componentProps={notice.componentProps}
            paused={paused}
            iconShape={notice.iconShape}
            iconBox={notice.iconBox}
            onClose={(reason) => notifier.dismiss(notice.id, reason)}
          />
        </div>
      ))}
    </div>,
    host,
  );
}
