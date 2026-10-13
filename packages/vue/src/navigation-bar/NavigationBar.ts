import { navigationBar as core } from "@design-system/core";
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
  type Component,
  type PropType,
} from "vue";
import { useI18n } from "../i18n/i18n";
import { Icon } from "../icon/Icon";
import { hasOpenModal, onModalChange } from "../internal/modal-stack";
import { useStableId } from "../internal/use-stable-id";
import { normalizeProps } from "../normalize";

export type NavigationBadge = core.NavigationBadge;

/**
 * One destination of a Navigation Bar. `icon` is any Vue component, decorative:
 * the label is the name. Wrap it in `markRaw()` so Vue keeps it out of the
 * reactive proxy it builds for the `destinations` prop.
 */
export type NavigationDestination = core.NavigationDestination<Component>;

export interface NavigationBarProps {
  /** The destinations, in reading order. */
  destinations: NavigationDestination[];
  /** The current destination's value. The application owns it. */
  value?: string | null;
  /** Accessible name for the landmark. Defaults to the catalog's "Main". */
  label?: string;
  /** Called with a button destination's value on every activation. */
  onSelect?: (value: string) => void;
}

/** The badges as the announcements compare them, detached from the props. */
const snapshot = (destinations: NavigationDestination[]): core.NavigationTarget[] =>
  destinations.map(({ value, label, badge }) => ({ value, label, badge: badge && { ...badge } }));

/**
 * NavigationBar: primary navigation between a few top-level sections, ported
 * from the Svelte adapter. A `<nav>` landmark around a list of destinations,
 * each an icon above a visible label. A destination with an `href` is a link
 * the browser or the router follows; one without is a button that reports
 * `onSelect(value)`, again when it is already current. The current
 * destination is the application's `value`, marked with `aria-current="page"`,
 * a shape behind the icon and a heavier label.
 *
 * Every destination is a tab stop; the left and right arrows move between
 * them as well, mirrored under right to left, without wrapping. An
 * unavailable destination stays focusable with its reason read as its
 * description. A badge's text is part of the name, and a badge that appears
 * or changes is announced politely once (`announce: false` silences it);
 * while a modal dialog is open the announcement waits for it to close
 * (ADR 0016).
 *
 * The component reads no screen size. Slot: `unavailableIcon` replaces the
 * lock glyph. Themeable via `--ds-navigation-bar-*`.
 */
export const NavigationBar = defineComponent({
  name: "NavigationBar",
  props: {
    destinations: { type: Array as PropType<NavigationDestination[]>, required: true },
    value: { type: String as PropType<string | null>, default: null },
    label: { type: String, default: undefined },
    onSelect: { type: Function as PropType<(value: string) => void>, default: undefined },
  },
  setup(props, { slots }) {
    const i18n = useI18n();
    const id = useStableId("ds-navigation-bar");

    const api = computed(() =>
      core.connect({
        destinations: props.destinations,
        value: props.value,
        label: props.label ?? i18n.value.t("navigationBar.label"),
        id,
        // Read at activation time, so a replaced callback is the one called.
        onSelect: (value) => props.onSelect?.(value),
        normalize: normalizeProps,
      }),
    );

    // What the live region says now, and what waits for the last modal
    // dialog to close.
    const spoken = shallowRef<core.BadgeAnnouncement[]>([]);
    let held: core.BadgeAnnouncement[] = [];

    // A badge that appears or changes is announced once; nothing on mount.
    watch(
      () => snapshot(props.destinations),
      (next, previous) => {
        const announcements = core.badgeAnnouncements(previous, next, {
          translate: i18n.value.t,
        });
        if (announcements.length === 0) return;
        if (hasOpenModal(document)) held = core.holdAnnouncements(held, announcements);
        else spoken.value = announcements;
      },
    );

    let stop: (() => void) | undefined;
    onMounted(() => {
      stop = onModalChange(document, () => {
        if (held.length === 0 || hasOpenModal(document)) return;
        spoken.value = held;
        held = [];
      });
    });
    onBeforeUnmount(() => stop?.());

    const lock = () =>
      h(Icon, { size: "1em" }, () => [
        h("rect", { x: 5, y: 11, width: 14, height: 10, rx: 2 }),
        h("path", { d: "M8 11V7a4 4 0 0 1 8 0v4" }),
      ]);

    const renderDestination = (destination: NavigationDestination) => {
      const { badge, unavailable } = destination;
      const content = [
        h("span", { class: "navigation-bar__indicator", "aria-hidden": "true" }, [
          h("span", { class: "navigation-bar__icon" }, [h(destination.icon)]),
          badge
            ? h(
                "span",
                {
                  class: [
                    "navigation-bar__badge",
                    badge.content === undefined && "navigation-bar__badge--dot",
                  ],
                },
                badge.content ?? "",
              )
            : null,
          unavailable
            ? h("span", { class: "navigation-bar__status" }, slots.unavailableIcon?.() ?? lock())
            : null,
        ]),
        h("span", { class: "navigation-bar__label", "data-label": destination.label }, [
          h("span", { class: "navigation-bar__label-text" }, [
            destination.label,
            badge ? h("span", { class: "navigation-bar__hidden" }, `, ${badge.label}`) : null,
          ]),
        ]),
      ];
      return h("li", { key: destination.value, class: "navigation-bar__item" }, [
        h(
          destination.href === undefined ? "button" : "a",
          {
            class: "navigation-bar__destination",
            ...api.value.getDestinationProps(destination.value),
          },
          content,
        ),
        unavailable
          ? h(
              "span",
              {
                class: "navigation-bar__reason",
                ...api.value.getReasonProps(destination.value),
              },
              unavailable.reason,
            )
          : null,
      ]);
    };

    return () =>
      h("nav", { class: "navigation-bar", ...api.value.getRootProps() }, [
        h(
          "ul",
          { class: "navigation-bar__list", ...api.value.getListProps() },
          props.destinations.map(renderDestination),
        ),
        h(
          "div",
          { class: "navigation-bar__live", "aria-live": "polite" },
          spoken.value.map((announcement) =>
            h("span", { key: announcement.value }, announcement.text),
          ),
        ),
      ]);
  },
});
