import { numberField as core } from "@design-system/core";
import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { useControlledDefault, useFormReset } from "../internal/form-reset";
import { useIsomorphicLayoutEffect } from "../internal/layout-effect";
import { normalizeProps } from "../normalize";

export type NumberFieldError = core.NumberFieldError;

export interface UseNumberFieldOptions {
  /** Initial (uncontrolled) or current (controlled) value, or `null` when empty. */
  value?: number | null;
  /** Explicit base id; a stable one is generated when omitted. */
  id?: string;
  /** BCP-47 locale for parsing and display. Defaults to `"en"`. */
  locale?: string;
  min?: number;
  max?: number;
  /** Step for the spin actions; typed values are validated against it. */
  step?: number;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  /** Opt in to wheel stepping while the input is focused and hovered. */
  changeOnWheel?: boolean;
  /** Domain-level invalid state supplied by the consumer. */
  invalid?: boolean;
  /** Ids of visible description/error elements. */
  describedBy?: string;
  messages?: Partial<core.NumberFieldMessages>;
  /** Called when the canonical value changes while editing. */
  onValueChange?: (value: number | null) => void;
  /** Called at commit boundaries: blur, Enter, and spin actions. */
  onValueCommit?: (value: number | null) => void;
  /**
   * The text input. Given it, the spin buttons keep focus on it, the wheel
   * steps it, and a reset of its form puts the value and its text back,
   * silently (ADR 0012).
   */
  controlRef?: RefObject<HTMLInputElement | null>;
}

/**
 * Connect the headless number field to React. Parsing, stepping, commit
 * boundaries and the spinbutton semantics live in the core; this hook owns the
 * value, the committed value and the draft text, mirrors an externally
 * controlled value without reporting, and keeps a focused draft untouched by
 * that reflection. `inputProps` is ready to spread: it carries the draft as
 * `value` and its own `onChange`.
 */
export function useNumberField({
  value: valueProp = null,
  id: idProp,
  locale: localeProp,
  min,
  max,
  step,
  disabled,
  readOnly,
  required,
  changeOnWheel,
  invalid,
  describedBy,
  messages,
  onValueChange,
  onValueCommit,
  controlRef,
}: UseNumberFieldOptions = {}): core.NumberFieldApi {
  const generatedId = `ds-number-field-${useId()}`;
  const config = core.initialState({
    value: valueProp,
    locale: localeProp,
    min,
    max,
    step,
    disabled,
    readOnly,
    required,
    changeOnWheel,
    id: idProp ?? generatedId,
  });
  const { locale } = config;
  const incoming = config.value;

  const [value, setValue] = useState(incoming);
  const [committed, setCommitted] = useState(incoming);
  const [text, setText] = useState(config.inputValue);
  const [focused, setFocused] = useState(false);

  // A changed prop reflects silently, and rewrites the text only while the
  // input is not being edited. A give-back of the value just reported changes
  // nothing, and is no new reset default (ADR 0012).
  const defaultValue = useControlledDefault(incoming, value, (next) => {
    setValue(next);
    setCommitted(next);
    if (!focused) setText(core.formatNumber(next, locale));
  });

  // A locale change reformats an idle display, but only when it shows the
  // committed value: a focused draft or a kept invalid draft is user data.
  const [lastLocale, setLastLocale] = useState(locale);
  if (locale !== lastLocale) {
    setLastLocale(locale);
    if (!focused && text === core.formatNumber(committed, lastLocale)) {
      setText(core.formatNumber(committed, locale));
    }
  }

  const own = useRef<HTMLInputElement | null>(null);
  const input = controlRef ?? own;
  // The value and its text go back together, reporting nothing (ADR 0012).
  useFormReset(input, () => {
    setValue(defaultValue);
    setCommitted(defaultValue);
    setText(core.formatNumber(defaultValue, locale));
  });

  const api = core.connect({
    state: { ...config, value, committedValue: committed, inputValue: text },
    setInputValue: setText,
    setValue: (next) => {
      setValue(next);
      onValueChange?.(next);
    },
    commitValue: (next) => {
      setCommitted(next);
      onValueCommit?.(next);
    },
    focus: () => document.getElementById(core.inputId(config.id))?.focus(),
    invalid,
    describedBy,
    messages,
    normalize: normalizeProps,
  });
  // The wheel is answered by a listener of its own below: React listens for
  // it passively, where stepping could not keep the page from scrolling.
  const { onWheel, onBlur, ...inputProps } = api.inputProps as typeof api.inputProps & {
    onWheel: (event: Event) => void;
    onBlur: () => void;
  };

  const wheel = useRef(onWheel);
  useIsomorphicLayoutEffect(() => {
    wheel.current = onWheel;
  });
  const { changeOnWheel: stepsOnWheel } = config;
  useEffect(() => {
    const node = input.current;
    if (!stepsOnWheel || !node) return;
    const listener = (event: WheelEvent) => wheel.current(event);
    node.addEventListener("wheel", listener, { passive: false });
    return () => node.removeEventListener("wheel", listener);
  }, [stepsOnWheel, input]);

  return {
    ...api,
    inputProps: {
      ...inputProps,
      value: text,
      onChange: (event: { currentTarget: HTMLInputElement }) =>
        api.setDraft(event.currentTarget.value),
      onFocus: () => setFocused(true),
      onBlur: () => {
        setFocused(false);
        onBlur();
      },
    },
  };
}
