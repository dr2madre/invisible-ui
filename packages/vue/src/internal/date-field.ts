import { h, type VNode } from "vue";
import { Icon } from "../icon/Icon";

/** The field parts DatePicker and DateRangePicker share. */

/** A hidden input that submits `value` under `name`, or nothing without a name. */
export const dateHiddenInput = (
  name: string | undefined,
  value: string | null,
  disabled: boolean,
): VNode | null =>
  name
    ? h("input", {
        type: "hidden",
        name,
        value: value ?? "",
        disabled: disabled || undefined,
      })
    : null;

/** The leading calendar glyph, highlighted once a date is chosen. */
export const dateFieldIcon = (active: boolean): VNode =>
  h(
    "span",
    {
      class: ["date-picker__icon", { "date-picker__icon--active": active }],
      "aria-hidden": "true",
    },
    [
      h(
        Icon,
        { size: "1.1rem" },
        {
          default: () => [
            h("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2" }),
            h("line", { x1: "16", y1: "2", x2: "16", y2: "6" }),
            h("line", { x1: "8", y1: "2", x2: "8", y2: "6" }),
            h("line", { x1: "3", y1: "10", x2: "21", y2: "10" }),
          ],
        },
      ),
    ],
  );

/** The trailing button that empties the field. */
export const dateClearButton = (label: string, onClick: () => void): VNode =>
  h(
    "button",
    {
      class: "date-picker__clear",
      type: "button",
      "aria-label": label,
      onClick,
    },
    [
      h(
        Icon,
        { size: "0.9rem" },
        {
          default: () => [
            h("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
            h("line", { x1: "6", y1: "6", x2: "18", y2: "18" }),
          ],
        },
      ),
    ],
  );
