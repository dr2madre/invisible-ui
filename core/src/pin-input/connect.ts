import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { sanitizeChar } from "./state";
import type { PinInputState } from "./types";

/** The public, framework-agnostic API for a connected PIN input. */
export interface PinInputApi {
  /** One value per cell. */
  values: string[];
  /** The combined value. */
  value: string;
  /** Props for the group container (`role="group"`). */
  rootProps: ElementProps;
  /** Props for a single cell `<input>`, by index. */
  getInputProps(index: number): ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: PinInputState;
  /** Request a new per-cell values array; the adapter owns how state updates. */
  setValues: (values: string[]) => void;
  /** Move DOM focus to the cell at the given index (adapter-provided). */
  focus?: (index: number) => void;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect PIN-input state to prop getters: a row of single-character cells (an
 * OTP / verification-code input). Typing a valid character fills the cell and
 * advances; Backspace clears and steps back; arrows move between cells; paste
 * is distributed across cells. Cells reject characters outside the input type.
 */
export function connect({
  state,
  setValues,
  focus,
  normalize = identityNormalize,
}: ConnectOptions): PinInputApi {
  const { values, length, type, mask, disabled } = state;

  const commit = (next: string[]) => {
    if (disabled) return;
    setValues(next);
  };

  return {
    values,
    value: values.join(""),
    rootProps: normalize({
      role: "group",
      "data-disabled": disabled ? "" : undefined,
    }),
    getInputProps: (index: number) =>
      normalize({
        inputmode: type === "numeric" ? "numeric" : "text",
        autocomplete: index === 0 ? "one-time-code" : "off",
        maxlength: 1,
        "aria-label": `Character ${index + 1} of ${length}`,
        disabled: disabled || undefined,
        "data-index": index,
        "data-disabled": disabled ? "" : undefined,
        "data-mask": mask ? "" : undefined,
        onInput: (event: Event) => {
          const target = event.target as HTMLInputElement;
          const char = sanitizeChar(target.value.slice(-1), type);
          if (!char) {
            target.value = values[index] ?? "";
            return;
          }
          target.value = char;
          const next = [...values];
          next[index] = char;
          commit(next);
          if (index < length - 1) focus?.(index + 1);
        },
        onKeyDown: (event: Event) => {
          const e = event as KeyboardEvent;
          switch (e.key) {
            case "Backspace":
              if (values[index]) {
                const next = [...values];
                next[index] = "";
                commit(next);
              } else if (index > 0) {
                const next = [...values];
                next[index - 1] = "";
                commit(next);
                focus?.(index - 1);
              }
              break;
            case "ArrowLeft":
              e.preventDefault();
              if (index > 0) focus?.(index - 1);
              break;
            case "ArrowRight":
              e.preventDefault();
              if (index < length - 1) focus?.(index + 1);
              break;
            case "Home":
              e.preventDefault();
              focus?.(0);
              break;
            case "End":
              e.preventDefault();
              focus?.(length - 1);
              break;
          }
        },
        onPaste: (event: Event) => {
          const e = event as ClipboardEvent;
          e.preventDefault();
          const text = e.clipboardData?.getData("text") ?? "";
          const chars = text
            .split("")
            .map((c) => sanitizeChar(c, type))
            .filter(Boolean);
          if (!chars.length) return;
          const next = [...values];
          let i = index;
          for (const c of chars) {
            if (i >= length) break;
            next[i] = c;
            i++;
          }
          commit(next);
          focus?.(Math.min(i, length - 1));
        },
        onFocus: (event: Event) => {
          (event.target as HTMLInputElement).select?.();
        },
      }),
  };
}
