import { defineComponent, h, ref, type PropType } from "vue";
import { useI18n } from "../i18n/i18n";

export type LoadingVariant = "dots" | "spinner" | "bar" | "typing" | "morph";

export interface LoadingProps {
  /**
   * Indicator shape: pulsing `dots`, a rotating `spinner` arc, bouncing
   * `typing` dots (chat "waiting for a reply"), a `morph`ing shape
   * (square ⇄ circle), or a `bar` (full-width track — place it at the top of
   * the content it covers, e.g. a card).
   */
  variant?: LoadingVariant;
  /**
   * Completion percentage (0–100) for the `bar` variant: the bar becomes
   * determinate (a fill that grows to done) and exposes progressbar semantics.
   * Leave `null` for the indeterminate sliding segment.
   */
  value?: number | null;
  /** Accessible name. Defaults to the i18n catalog's "Loading…". */
  label?: string;
  /** Also render the label as visible text next to the indicator. */
  showLabel?: boolean;
  /** Show the percentage (from `value`) as visible text. */
  showValue?: boolean;
  /**
   * Extra visible detail, e.g. "3 of 8 files" or "48 MB of 128 MB". On a
   * determinate bar it is also exposed as `aria-valuetext`.
   */
  detail?: string;
  /** Hide from assistive tech (the surrounding region announces the state). */
  decorative?: boolean;
  /**
   * Live status message — a running description of what the process is doing
   * ("Connecting…", "Fetching records…", "Rendering…"). Unlike `label` (a
   * static accessible name), this renders as visible text **inside** the polite
   * `role="status"` region and is announced on every change, so a succession of
   * backend-reported steps is read out as it progresses. The region is
   * `aria-atomic`, so each new message is announced in full. On a determinate
   * bar the text renders below the track and also feeds `aria-valuetext` when
   * no `detail` is set (a progressbar announces its value text, not a live
   * region). Ignored when `decorative`.
   */
  status?: string;
  /**
   * No-flash delay (ms): keep the indicator hidden until this long has passed,
   * so a fast operation never flashes a loader. If the component is removed
   * before the delay elapses, nothing is ever shown. Follows the response-time
   * rule — reveal a loader only once a wait is actually noticeable. Default `0`
   * (shown immediately).
   */
  delay?: number;
  /**
   * Render as a centered overlay filling the nearest positioned ancestor — the
   * built-in busy-region pattern. Mark that region `aria-busy="true"`.
   */
  overlay?: boolean;
  /**
   * With `overlay`: paint a translucent backdrop that also blocks pointer
   * interaction while busy. Set `false` to overlay just the indicator (no dim,
   * no pointer blocking) — e.g. over a control whose own modal already guards
   * interaction.
   */
  veil?: boolean;
}

/**
 * Loading — an inline loading indicator, ported from the Svelte adapter.
 * Variants: `dots` (three dots that pulse in turn), `spinner` (a rotating
 * arc), `typing` (bouncing dots — chat "waiting for a reply"), `morph` (a
 * shape blending square ⇄ circle), and `bar` (a full-width track —
 * indeterminate sliding segment, or a growing fill when given a `value`).
 * Everything uses `currentColor`, so it follows the surface's own text color.
 *
 * Accessibility: by default a polite `role="status"` named by `label` (from
 * the i18n catalog when not passed). A determinate bar is a `progressbar`
 * with `aria-value*` (and `aria-valuetext` when `detail` is set). The visible
 * text is `aria-hidden` — the accessible name/value already carries it, and a
 * ticking percentage inside a live region would otherwise be re-announced on
 * every change. Set `decorative` when the surrounding region announces the
 * state itself (e.g. a button with `aria-busy`). All motion respects
 * `prefers-reduced-motion` (indicators stay visible, static).
 *
 * Sizing follows the font (`1em`); themeable via `--ds-loading-size`,
 * `--ds-loading-gap`, `--ds-loading-spinner-size`, `--ds-loading-bar-height`,
 * `--ds-loading-label-size`, `--ds-loading-label-gap`,
 * `--ds-loading-bar-label-gap` and `--ds-loading-duration` (animation speed).
 */
export const Loading = defineComponent({
  name: "Loading",
  props: {
    variant: { type: String as PropType<LoadingVariant>, default: "dots" },
    value: { type: Number as PropType<number | null>, default: null },
    label: { type: String, default: undefined },
    showLabel: { type: Boolean, default: false },
    showValue: { type: Boolean, default: false },
    detail: { type: String, default: undefined },
    decorative: { type: Boolean, default: false },
    status: { type: String, default: undefined },
    delay: { type: Number, default: 0 },
    overlay: { type: Boolean, default: false },
    veil: { type: Boolean, default: true },
  },
  setup(props) {
    const i18n = useI18n();

    // No-flash delay: stay hidden until `delay` ms pass. A client-only timer
    // keeps this SSR-safe; assigning after teardown is a harmless no-op,
    // matching the rest of the codebase's SSR-safe pattern.
    const visible = ref(props.delay <= 0);
    if (props.delay > 0 && typeof window !== "undefined") {
      setTimeout(() => {
        visible.value = true;
      }, props.delay);
    }

    return () => {
      if (!visible.value) return null;

      const { t } = i18n.value;
      const resolvedLabel = props.label ?? t("loading.label");
      const hasStatus = props.status != null;
      const determinate = props.variant === "bar" && props.value != null;
      const clamped = props.value == null ? null : Math.min(100, Math.max(0, props.value));
      const hasText =
        props.showLabel || props.detail != null || (props.showValue && clamped != null);

      const indicator =
        props.variant === "bar"
          ? h("span", { class: "loading__track" }, [
              determinate
                ? h("span", { class: "loading__fill", style: { inlineSize: `${clamped}%` } })
                : h("span", { class: "loading__segment" }),
            ])
          : h("span", { class: "loading__indicator" }, [
              ...(props.variant === "spinner"
                ? [
                    h(
                      "svg",
                      {
                        class: "loading__spinner",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        "stroke-width": "2.5",
                        "stroke-linecap": "round",
                        "aria-hidden": "true",
                        focusable: "false",
                      },
                      [h("path", { d: "M21 12a9 9 0 1 1-6.2-8.56" })],
                    ),
                  ]
                : props.variant === "morph"
                  ? [h("span", { class: "loading__shape" })]
                  : [
                      h("span", { class: "loading__dot" }),
                      h("span", { class: "loading__dot" }),
                      h("span", { class: "loading__dot" }),
                    ]),
            ]);

      return h(
        "span",
        {
          class: [
            "loading",
            { "loading--overlay": props.overlay, "loading--veil": props.overlay && props.veil },
          ],
          "data-variant": props.variant,
          role: props.decorative ? undefined : determinate ? "progressbar" : "status",
          "aria-label": props.decorative || (hasStatus && !determinate) ? undefined : resolvedLabel,
          "aria-atomic": hasStatus && !props.decorative ? "true" : undefined,
          "aria-hidden": props.decorative ? "true" : undefined,
          "aria-valuemin": determinate && !props.decorative ? 0 : undefined,
          "aria-valuemax": determinate && !props.decorative ? 100 : undefined,
          "aria-valuenow": determinate && !props.decorative ? (clamped ?? undefined) : undefined,
          "aria-valuetext":
            determinate && !props.decorative ? (props.detail ?? props.status) : undefined,
        },
        [
          indicator,
          // Live status: visible AND announced (on the determinate bar the
          // role is progressbar, so the announcement travels via
          // aria-valuetext).
          hasStatus ? h("span", { class: "loading__status" }, props.status) : null,
          // Hidden from AT: the name/value attributes above already carry
          // this, and live regions would re-announce every tick of a changing
          // percentage.
          hasText
            ? h("span", { class: "loading__label", "aria-hidden": "true" }, [
                props.showLabel ? h("span", resolvedLabel) : null,
                props.showValue && clamped != null
                  ? h("span", { class: "loading__meta" }, `${Math.round(clamped)}%`)
                  : null,
                props.detail != null ? h("span", { class: "loading__meta" }, props.detail) : null,
              ])
            : null,
        ],
      );
    };
  },
});
