import { defineComponent, h, type PropType } from "vue";
import { useI18n } from "../i18n/i18n";

export type LoadingGenerationAreaPosition = "center" | "top" | "bottom" | "left" | "right";

export interface LoadingGenerationAreaProps {
  /** Accessible name. Defaults to the catalog's "Loading…". */
  label?: string;
  /** Hide from assistive tech (the surrounding region announces the state). */
  decorative?: boolean;
  /**
   * Whether the process is still running. While `true` (default) the loading
   * placeholder is shown; set it to `false` when done and the default slot (the
   * real content) is rendered in its place.
   */
  loading?: boolean;
  /** Show the dot field as the backdrop. */
  field?: boolean;
  /** Where the label/indicator zone sits over the area. */
  labelPosition?: LoadingGenerationAreaPosition;
  /** Live status message, announced on every change. */
  status?: string;
  /** Percentage (0–100), shown as "N%". */
  value?: number | null;
  /** Extra detail line, e.g. "48 MB of 128 MB" or "3 of 8 files". */
  detail?: string;
}

/**
 * LoadingGenerationArea — a loading **area**: a surface that signals a process
 * in progress, from two composable parts. Ported from the Svelte adapter.
 *
 * 1. A backdrop: a **halftone dot field** (`field`, on by default), a faint
 *    lattice of dots with a couple of soft, brighter *zones* that drift across
 *    it continuously, so different areas seem to render over time. The dots are
 *    a CSS `background` (no per-dot DOM), so it covers any size cheaply. Turn
 *    `field` off to use the component as a plain positioned loading area.
 * 2. A label **zone**, placed via `labelPosition` (`center` default, or
 *    `top`/`bottom`/`left`/`right`), showing any of: a live `status` message, a
 *    `value` percentage, and a `detail` line (bytes, counts).
 *
 * The dot field and an explicit indicator are alternatives, never stacked: the
 * field *is* the loading visual by default; turn `field` off and drop a
 * different loader (e.g. `<Loading variant="spinner" />`) into the `indicator`
 * slot to use that one.
 *
 * When loading finishes, flip `loading` to `false`: the default slot (the real
 * content) renders in place of the loading placeholder.
 *
 * Accessibility: a polite `role="status"` with an accessible name (`label`,
 * from the catalog by default). When `status` is set it drives the announcement
 * (the region is `aria-atomic`); the percentage and detail stay visible but
 * `aria-hidden`, so a fast-ticking value is announced once. `decorative` hides
 * it from assistive tech. The drift respects `prefers-reduced-motion`.
 * Themeable via `--ds-loading-generation-area-*`.
 */
export const LoadingGenerationArea = defineComponent({
  name: "LoadingGenerationArea",
  props: {
    label: { type: String, default: undefined },
    decorative: { type: Boolean, default: false },
    loading: { type: Boolean, default: true },
    field: { type: Boolean, default: true },
    labelPosition: {
      type: String as PropType<LoadingGenerationAreaPosition>,
      default: "center",
    },
    status: { type: String, default: undefined },
    value: { type: Number as PropType<number | null>, default: null },
    detail: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    const i18n = useI18n();

    return () => {
      if (!props.loading) {
        return h("div", { class: "loading-generation-area__content" }, slots.default?.());
      }

      const { t } = i18n.value;
      const resolvedLabel = props.label ?? t("loading.label");
      const clamped = props.value == null ? null : Math.min(100, Math.max(0, props.value));
      const hasStatus = props.status != null;
      const hasZone =
        hasStatus || clamped != null || props.detail != null || Boolean(slots.indicator);

      return h(
        "div",
        {
          class: ["loading-generation-area", { "loading-generation-area--field": props.field }],
          "data-position": props.labelPosition,
          role: props.decorative ? undefined : "status",
          "aria-label": props.decorative || hasStatus ? undefined : resolvedLabel,
          "aria-atomic": hasStatus && !props.decorative ? "true" : undefined,
          "aria-hidden": props.decorative ? "true" : undefined,
        },
        hasZone
          ? [
              h("div", { class: "loading-generation-area__zone" }, [
                slots.indicator?.(),
                hasStatus
                  ? h("span", { class: "loading-generation-area__status" }, props.status)
                  : null,
                clamped != null
                  ? h(
                      "span",
                      { class: "loading-generation-area__value", "aria-hidden": "true" },
                      `${Math.round(clamped)}%`,
                    )
                  : null,
                props.detail != null
                  ? h(
                      "span",
                      { class: "loading-generation-area__detail", "aria-hidden": "true" },
                      props.detail,
                    )
                  : null,
              ]),
            ]
          : undefined,
      );
    };
  },
});
