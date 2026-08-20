import { identityNormalize, type ElementProps, type Normalize } from "../types";
import {
  canonicalString,
  decrementId,
  formatNumber,
  incrementId,
  inputId,
  labelId,
  readValue,
  snapToStep,
} from "./state";
import type { NumberFieldError, NumberFieldState, NumberInputStatus } from "./types";

export interface NumberFieldMessages {
  /** Accessible name of the increment button. */
  increment: string;
  /** Accessible name of the decrement button. */
  decrement: string;
}

/** The public, framework-agnostic API for a connected number field. */
export interface NumberFieldApi {
  /** The canonical value, or `null`. */
  value: number | null;
  /** The current editing string. */
  inputValue: string;
  /** How the editing string reads right now. */
  status: NumberInputStatus;
  validationError: NumberFieldError | null;
  /** Canonical ASCII value for form submission (`""` when empty). */
  formValue: string;
  /** Localized display text of the canonical value (`""` when empty). */
  formattedValue: string;
  canIncrement: boolean;
  canDecrement: boolean;
  /** Replace the draft as the user types; the canonical value follows. */
  setDraft(text: string): void;
  /** Commit the draft (blur / Enter): reformat when it parses, keep it when it does not. */
  commit(): void;
  /** Restore the last committed value into the draft (Escape). */
  revert(): void;
  /** Spin by one step: snap to the grid, clamp to the bounds, commit. */
  stepBy(direction: 1 | -1): void;
  labelProps: ElementProps;
  /** Props for the visible text input (`role="spinbutton"`). */
  inputProps: ElementProps;
  incrementProps: ElementProps;
  decrementProps: ElementProps;
  /** Props for the hidden input that carries the form value. */
  hiddenInputProps: ElementProps;
}

export interface ConnectOptions {
  state: NumberFieldState;
  /** Replace the editing string (never emits a callback by itself). */
  setInputValue: (text: string) => void;
  /** Apply a new canonical value; the adapter owns `onValueChange`. */
  setValue: (value: number | null) => void;
  /** Record a commit boundary; the adapter owns `onValueCommit`. */
  commitValue: (value: number | null) => void;
  /** Move DOM focus to the input (adapter-provided). */
  focus?: () => void;
  /** Domain-level invalid state supplied by the consumer. */
  invalid?: boolean;
  /** Ids of visible description/error elements. */
  describedBy?: string;
  messages?: Partial<NumberFieldMessages>;
  normalize?: Normalize;
}

const DEFAULT_MESSAGES: NumberFieldMessages = {
  increment: "Increase",
  decrement: "Decrease",
};

/**
 * Connect number-field state to prop getters, following the WAI-ARIA
 * spinbutton pattern on a text input: the input owns keyboard stepping, the
 * spin buttons stay out of the tab order, and the ARIA value attributes
 * always describe the canonical value, never the draft.
 */
export function connect({
  state,
  setInputValue,
  setValue,
  commitValue,
  focus,
  invalid = false,
  describedBy,
  messages: messageOverrides,
  normalize = identityNormalize,
}: ConnectOptions): NumberFieldApi {
  const {
    value,
    inputValue,
    committedValue,
    locale,
    min,
    max,
    step,
    disabled,
    readOnly,
    required,
    changeOnWheel,
    id,
  } = state;
  const messages = { ...DEFAULT_MESSAGES, ...messageOverrides };

  const read = readValue(inputValue, locale, min, max, step);
  const status = read.status;
  const validationError = read.error;
  const isInvalid = invalid || status === "invalid";
  const formattedValue = formatNumber(value, locale);

  // The number a spin action starts from: the draft when it expresses one,
  // otherwise the canonical value.
  const spinBase = read.value ?? value;
  const editable = !disabled && !readOnly;
  const canIncrement = editable && (max == null || spinBase == null || spinBase < max);
  const canDecrement = editable && (min == null || spinBase == null || spinBase > min);

  const applyValue = (next: number | null, boundary: boolean) => {
    const text = formatNumber(next, locale);
    if (text !== inputValue) setInputValue(text);
    if (!Object.is(next, value)) setValue(next);
    if (boundary && !Object.is(next, committedValue)) commitValue(next);
  };

  const setDraft = (text: string) => {
    if (!editable || text === inputValue) return;
    setInputValue(text);
    const next = readValue(text, locale, min, max, step).value;
    if (!Object.is(next, value)) setValue(next);
  };

  const commit = () => {
    if (!editable) return;
    // A draft that does not parse stays as typed: committing it would lose
    // what the user wrote. Range and step violations still commit, because
    // the value is real and the validity report carries the error.
    if (read.error === "parse") return;
    applyValue(read.value, true);
  };

  const revert = () => {
    if (!editable) return;
    const text = formatNumber(committedValue, locale);
    if (text !== inputValue) setInputValue(text);
    if (!Object.is(committedValue, value)) setValue(committedValue);
  };

  const stepBy = (direction: 1 | -1) => {
    if (!editable) return;
    if (direction === 1 && !canIncrement) return;
    if (direction === -1 && !canDecrement) return;
    applyValue(snapToStep(spinBase, direction, min, max, step), true);
  };

  const goToBound = (target: number) => {
    if (!editable) return;
    applyValue(target, true);
  };

  const onKeyDown = (event: Event) => {
    if (disabled) return;
    const e = event as KeyboardEvent;
    switch (e.key) {
      case "ArrowUp":
        if (readOnly) break;
        e.preventDefault();
        stepBy(1);
        break;
      case "ArrowDown":
        if (readOnly) break;
        e.preventDefault();
        stepBy(-1);
        break;
      case "Home":
        if (readOnly || min == null || max == null) break;
        e.preventDefault();
        goToBound(min);
        break;
      case "End":
        if (readOnly || min == null || max == null) break;
        e.preventDefault();
        goToBound(max);
        break;
      case "Enter":
        // No preventDefault: native form submission must proceed.
        commit();
        break;
      case "Escape":
        // Only when there is a draft to undo, so an outer dialog still
        // closes on the next Escape.
        if (inputValue !== formatNumber(committedValue, locale)) {
          e.preventDefault();
          e.stopPropagation();
          revert();
        }
        break;
    }
  };

  const onWheel = (event: Event) => {
    if (!changeOnWheel || !editable) return;
    const e = event as WheelEvent;
    const target = e.currentTarget as HTMLElement | null;
    // Focus plus hover: a hovered but unfocused input keeps the page scrolling.
    if (!target || target.ownerDocument.activeElement !== target) return;
    e.preventDefault();
    if (e.deltaY === 0) return;
    stepBy(e.deltaY < 0 ? 1 : -1);
  };

  const spinButtonProps = (direction: 1 | -1): ElementProps => {
    const enabled = direction === 1 ? canIncrement : canDecrement;
    return normalize({
      id: direction === 1 ? incrementId(id) : decrementId(id),
      type: "button",
      tabindex: -1,
      disabled: !enabled || undefined,
      "aria-label": direction === 1 ? messages.increment : messages.decrement,
      "aria-controls": inputId(id),
      "data-disabled": !enabled ? "" : undefined,
      onClick: () => stepBy(direction),
      // Keep DOM focus on the input while the button is pressed.
      onPointerDown: (event: Event) => {
        event.preventDefault();
        focus?.();
      },
    });
  };

  return {
    value,
    inputValue,
    status,
    validationError,
    formValue: canonicalString(value),
    formattedValue,
    canIncrement,
    canDecrement,
    setDraft,
    commit,
    revert,
    stepBy,
    labelProps: normalize({
      id: labelId(id),
      for: inputId(id),
      "data-disabled": disabled ? "" : undefined,
    }),
    inputProps: normalize({
      id: inputId(id),
      type: "text",
      inputmode: "decimal",
      autocomplete: "off",
      autocorrect: "off",
      spellcheck: false,
      role: "spinbutton",
      disabled: disabled || undefined,
      readonly: readOnly || undefined,
      "aria-invalid": isInvalid || undefined,
      "aria-required": required || undefined,
      "aria-describedby": describedBy,
      "aria-valuemin": min ?? undefined,
      "aria-valuemax": max ?? undefined,
      "aria-valuenow": value ?? undefined,
      "aria-valuetext": value == null ? undefined : formattedValue,
      "data-state": status,
      "data-disabled": disabled ? "" : undefined,
      "data-readonly": readOnly ? "" : undefined,
      "data-invalid": isInvalid ? "" : undefined,
      onKeyDown,
      onBlur: () => commit(),
      onWheel,
    }),
    incrementProps: spinButtonProps(1),
    decrementProps: spinButtonProps(-1),
    hiddenInputProps: normalize({
      type: "hidden",
      value: canonicalString(value),
      disabled: disabled || undefined,
    }),
  };
}
