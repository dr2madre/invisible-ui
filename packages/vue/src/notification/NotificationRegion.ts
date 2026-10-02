import {
  computed,
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  TransitionGroup,
  type PropType,
} from "vue";
import { useI18n } from "../i18n/i18n";
import { hasOpenModal, onModalChange } from "../internal/modal-stack";
import { swipeDismiss, type SwipeDismissHandle } from "../internal/swipe";
import { useHydratedTeleport } from "../internal/use-hydrated-teleport";
import { scopedTeleport } from "../internal/locale-teleport";
import { Notification } from "./Notification";
import type { NotificationItem, Notifier } from "./create-notifier";

export type NotificationPlacement =
  "top-start" | "top-center" | "top-end" | "bottom-start" | "bottom-center" | "bottom-end";

export interface NotificationRegionProps {
  /** The notifier whose queue this region renders. */
  notifier: Notifier;
  placement?: NotificationPlacement;
  /** Accessible name for the region landmark. Defaults to the i18n catalog's "Notifications". */
  label?: string;
  /**
   * Optional cap on notifications rendered at once. `0` (default) means no
   * count cap — the pile fills the window height and clips the oldest at the
   * far edge. Set a number to also limit by count.
   */
  maxVisible?: number;
  /** Distance from the viewport edges, as a CSS length. Default `1rem`. */
  inset?: string;
  /** Allow swiping a notification away (pointer/touch). Default `true`. */
  swipeable?: boolean;
  /** Enter/reflow duration in ms. */
  duration?: number;
  /** Leave duration in ms. Defaults to 1.75× `duration` — a gentler exit. */
  exitDuration?: number;
}

/**
 * NotificationRegion — a fixed, stacking container that renders a notifier's
 * queue, ported from the Svelte adapter. It is an accessible landmark
 * (`role="region"` with a label); each Notification inside is its own live
 * region, so additions are announced.
 *
 * Notifications enter and leave with a fly/fade transition and the stack
 * reflows via the `TransitionGroup` move class (the enter/leave/move CSS lives
 * in the region's stylesheet, driven by the private `--_notice-motion*` variables). Motion is
 * disabled when the user prefers reduced motion.
 *
 * The region spans the full window height and stacks every notification
 * (newest fully visible on top); when the pile would pass the far edge it is
 * clipped there, never at a smaller box. `maxVisible` is an optional count
 * cap for consumers who want one — unset by default, so the window height is
 * the only bound.
 *
 * While a modal dialog is open anywhere in the document, new notifications
 * wait in the notifier's queue, unshown and unannounced (ADR 0016): the dialog
 * holds the user's attention and makes the page behind it inert. When the
 * last modal closes they appear in order, and their auto-dismiss countdowns
 * start then. Notifications already shown when a modal opens stay, with their
 * countdowns held; a change to one of them shows, and is announced, after the
 * modal closes. A message about the dialog's own task belongs in the dialog's
 * status area (`notify()` on the dialog), and a message that needs a decision
 * now belongs in a dialog opened on top. The region always mounts in `<body>`.
 *
 *   h(NotificationRegion, { notifier, placement: "top-end" })
 */
export const NotificationRegion = defineComponent({
  name: "NotificationRegion",
  props: {
    notifier: { type: Object as PropType<Notifier>, required: true },
    placement: { type: String as PropType<NotificationPlacement>, default: "top-end" },
    label: { type: String, default: undefined },
    maxVisible: { type: Number, default: 0 },
    inset: { type: String, default: "1rem" },
    swipeable: { type: Boolean, default: true },
    duration: { type: Number, default: 200 },
    exitDuration: { type: Number, default: undefined },
  },
  setup(props) {
    const teleportDisabled = useHydratedTeleport();
    const i18n = useI18n();

    // Read after mount and kept in sync with the OS setting: the server cannot
    // know the preference, so the first client render must match its output.
    const prefersReduced = ref(false);
    let stopReducedMotion = () => {};
    onMounted(() => {
      if (typeof window.matchMedia !== "function") return;
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      const sync = () => (prefersReduced.value = query.matches);
      sync();
      query.addEventListener?.("change", sync);
      stopReducedMotion = () => query.removeEventListener?.("change", sync);
    });
    onUnmounted(() => stopReducedMotion());

    const motion = computed(() => (prefersReduced.value ? 0 : props.duration));
    const motionOut = computed(() =>
      prefersReduced.value ? 0 : (props.exitDuration ?? Math.round(props.duration * 1.75)),
    );

    // New notifications always enter; past the limit the OLDEST leave. Only an
    // open modal holds a new notification back.
    const capped = computed(() => {
      const list = props.notifier.notifications.value;
      return props.maxVisible > 0 ? list.slice(-props.maxVisible) : list;
    });

    // Whether a modal dialog is open in the document, and what was on screen
    // when one opened: only that stays there, as it was, while one is. A
    // region mounted behind a modal had nothing on screen, so its snapshot
    // starts empty. The server has no document and sees no modal.
    const modalOpen = shallowRef(typeof document !== "undefined" && hasOpenModal(document));
    const held = shallowRef<ReadonlyMap<string, NotificationItem>>(new Map());
    let stopWatchingModals = () => {};
    onMounted(() => {
      modalOpen.value = hasOpenModal(document);
      stopWatchingModals = onModalChange(document, () => {
        const open = hasOpenModal(document);
        if (open === modalOpen.value) return;
        if (open) held.value = new Map(capped.value.map((notice) => [notice.id, notice]));
        modalOpen.value = open;
      });
    });
    onUnmounted(() => stopWatchingModals());

    const visible = computed(() => {
      if (!modalOpen.value) return capped.value;
      const snapshot = held.value;
      return props.notifier.notifications.value.flatMap((notice) => {
        const shown = snapshot.get(notice.id);
        return shown ? [shown] : [];
      });
    });

    // Stable paint order, assigned once per notification: older = higher, so
    // every toast covers the shadow of the one above (the newer one) — and a
    // dismissed toast keeps its slot in the order while it animates out,
    // instead of momentarily tying with a neighbour when indexes shift.
    const paintOrder = new Map<string, number>();
    let seq = 0;
    // How many dismissed notifications keep their slot: enough to cover the
    // ones still animating out, not enough to grow for the life of the region.
    const RECENT = 8;
    const zOf = (id: string) => 100000 - (paintOrder.get(id) ?? 0);

    // Pause the WHOLE stack while any notification is hovered or holds focus,
    // so a burst pauses together (not just the one under the pointer).
    // pointerover/out and focusin/out bubble from the interactive slots
    // through the region's pointer-events:none root; leaving is "no longer
    // inside the region".
    const regionEl = ref<HTMLElement | null>(null);
    const pointerInside = ref(false);
    const focusInside = ref(false);
    const paused = computed(() => pointerInside.value || focusInside.value || modalOpen.value);
    const inside = (target: EventTarget | null) =>
      target instanceof Node && (regionEl.value?.contains(target) ?? false);

    // One swipe gesture per rendered slot, attached through a cached element
    // ref callback (the Vue counterpart of the Svelte action) and refreshed on
    // every patch so `swipeable` changes reach it.
    const swipes = new Map<string, SwipeDismissHandle>();
    const slotRefs = new Map<string, (el: unknown) => void>();
    const swipeOptions = (id: string) => ({
      disabled: !props.swipeable,
      onDismiss: () => props.notifier.dismiss(id, "user"),
    });
    const slotRef = (id: string) => {
      let cached = slotRefs.get(id);
      if (!cached) {
        cached = (el: unknown) => {
          const existing = swipes.get(id);
          if (el instanceof HTMLElement) {
            if (existing) existing.update(swipeOptions(id));
            else swipes.set(id, swipeDismiss(el, swipeOptions(id)));
          } else if (existing) {
            existing.destroy();
            swipes.delete(id);
            slotRefs.delete(id);
          }
        };
        slotRefs.set(id, cached);
      }
      return cached;
    };
    onUnmounted(() => {
      for (const handle of swipes.values()) handle.destroy();
      swipes.clear();
      slotRefs.clear();
    });

    return () => {
      const { t } = i18n.value;
      const list = visible.value;
      for (const n of list) if (!paintOrder.has(n.id)) paintOrder.set(n.id, ++seq);
      const showing = new Set(list.map((n) => n.id));
      const gone = [...paintOrder.keys()].filter((id) => !showing.has(id));
      for (const id of gone.slice(0, Math.max(0, gone.length - RECENT))) paintOrder.delete(id);
      // The numbers are then closed up again, so what is left is what is on
      // screen plus a few on their way out. Counting on for the life of the
      // region would push the paint order out of its range.
      let renumbered = 0;
      for (const id of [...paintOrder.keys()]) paintOrder.set(id, ++renumbered);
      seq = renumbered;

      // Teleported to <body>: a viewport-fixed region must escape ancestor
      // stacking contexts (e.g. a layout's `isolation: isolate`), or its
      // z-index only competes inside them and headers/content paint above the
      // toasts.
      return scopedTeleport(teleportDisabled.value, i18n.value, null, [
        h(
          "div",
          {
            ref: regionEl,
            class: "notification-region",
            "data-placement": props.placement,
            role: "region",
            "aria-label": props.label ?? t("notificationRegion.label"),
            style: {
              padding: props.inset,
              // Private variables: always set inline from the props, so an
              // external custom-property override could never win.
              "--_notice-motion": `${motion.value}ms`,
              "--_notice-motion-out": `${motionOut.value}ms`,
            },
            onPointerover: () => {
              pointerInside.value = true;
            },
            onPointerout: (event: PointerEvent) => {
              if (!inside(event.relatedTarget)) pointerInside.value = false;
            },
            onFocusin: () => {
              focusInside.value = true;
            },
            onFocusout: (event: FocusEvent) => {
              if (!inside(event.relatedTarget)) focusInside.value = false;
            },
          },
          [
            h(
              TransitionGroup,
              { name: "notice" },
              {
                default: () =>
                  list.map((notice) =>
                    h(
                      "div",
                      {
                        key: notice.id,
                        class: "notice-slot",
                        style: { zIndex: zOf(notice.id) },
                        ref: slotRef(notice.id),
                      },
                      [
                        h(Notification, {
                          status: notice.status,
                          title: notice.title,
                          text: notice.text,
                          duration: notice.duration,
                          closable: notice.closable,
                          role: notice.role,
                          actions: notice.actions,
                          inverted: notice.inverted,
                          snack: notice.snack,
                          component: notice.component,
                          componentProps: notice.componentProps,
                          paused: paused.value,
                          iconShape: notice.iconShape,
                          iconBox: notice.iconBox,
                          onClose: (reason) => props.notifier.dismiss(notice.id, reason),
                        }),
                      ],
                    ),
                  ),
              },
            ),
          ],
        ),
      ]);
    };
  },
});
