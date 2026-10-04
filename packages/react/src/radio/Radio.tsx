import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cx } from "../internal/cx";

export interface RadioProps {
  /** The value submitted / reported when this radio is chosen. */
  value: string;
  /** Group name; radios sharing a name are mutually exclusive. */
  name: string;
  /** Whether this radio is selected. */
  checked?: boolean;
  disabled?: boolean;
  /** Label text, used when no `children` is given. */
  label?: string;
  /** Called with this radio's value when it becomes selected. */
  onChange?: (value: string) => void;
  /** Rich label content, in place of `label`. */
  children?: ReactNode;
}

/**
 * Radio — a single styled radio button paired with its label. Built on a
 * native `<input type="radio">`, so several `Radio`s sharing the same `name`
 * form one group automatically (native keyboard, focus and form semantics);
 * use this when you lay the radios out yourself. For a managed group use
 * `RadioGroup`.
 *
 * The element is the whole state: the radios of one name live in separate
 * components, and only the browser sees all of them, so the input is left
 * uncontrolled and a changed `checked` is written to it. Colors are themeable
 * via `--ds-radio-*`.
 */
export function Radio({
  value,
  name,
  checked = false,
  disabled = false,
  label,
  onChange,
  children,
}: RadioProps) {
  const id = `ds-radio-${useId()}`;
  const ref = useRef<HTMLInputElement>(null);
  // The first render carries the default in markup; later ones go through the
  // effect below, so React never moves the attribute on its own.
  const [initial] = useState(checked);

  // A changed prop is reflected into the element. The reset default follows
  // it, except a give-back of what the element already shows: that is the
  // page echoing the user's choice, and an echo is not a new default
  // (ADR 0012). The `checked` attribute alone carries the reset; there is
  // nothing else to put back.
  useEffect(() => {
    const node = ref.current;
    if (!node || node.checked === checked) return;
    node.defaultChecked = checked;
    node.checked = checked;
  }, [checked]);

  return (
    <label className={cx("radio", disabled && "radio--disabled")} htmlFor={id}>
      <input
        ref={ref}
        id={id}
        className="radio__input"
        type="radio"
        name={name}
        value={value}
        defaultChecked={initial}
        disabled={disabled}
        onChange={() => onChange?.(value)}
      />
      <span className="radio__dot" aria-hidden="true" />
      <span className="radio__label">{children ?? label}</span>
    </label>
  );
}
