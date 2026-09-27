import { untrack } from "svelte";

export interface ControllableOptions<T> {
  /** Reads the prop. */
  get: () => T;
  /**
   * Writes the prop. The component's own copy changes, and the parent's too
   * when it binds the prop. Omitted where the component never writes it.
   */
  set?: (value: T) => void;
  /**
   * Pushes a prop the parent changed into the machine, without reporting.
   * Omitted where the prop is the whole state.
   */
  reflect?: (value: T) => void;
  /**
   * True when a changed prop only gives back what the control holds now: the
   * reset default then stays where it was (ADR 0012). Omitted, every change
   * the parent makes moves the default, which is right when the component's
   * own writes go through `write`.
   */
  isGiveBack?: (value: T) => boolean;
}

export interface Controllable<T> {
  /** The value a form reset restores (ADR 0012). */
  readonly defaultValue: T;
  /**
   * Writes the component's own value to the prop. The mirror records it as
   * seen, so it is neither pushed back into the machine nor taken as a new
   * default.
   */
  write(value: T): void;
  /**
   * Puts the prop and the machine back to the default, reporting nothing
   * (ADR 0012).
   */
  restore(): void;
}

/**
 * The controllable mirror of ADR 0011, in runes mode. Call it while the
 * component initialises.
 *
 * The prop is compared against the last value seen, never against the
 * machine: an uncontrolled consumer whose prop never changes keeps what the
 * user did, and an effect that runs again with the same value does nothing.
 * A reflection never reports a change. The effect is `$effect.pre`, so the
 * machine is updated before the DOM, as the legacy `$:` statement did.
 */
export function controllable<T>(options: ControllableOptions<T>): Controllable<T> {
  const { get, set, reflect, isGiveBack } = options;
  let last = untrack(get);
  // Raw: the default is replaced, never mutated, and a consumer's array must
  // reach the template as the consumer passed it.
  let defaultValue = $state.raw(last);

  $effect.pre(() => {
    const next = get();
    untrack(() => {
      if (Object.is(next, last)) return;
      last = next;
      // The give-back test reads the machine before the reflection moves it.
      if (!isGiveBack?.(next)) defaultValue = next;
      reflect?.(next);
    });
  });

  const write = (value: T) => {
    set?.(value);
    // Read back what the prop now holds: a bindable prop, or a parent's
    // state, may hand back a proxy of the value written.
    last = untrack(get);
  };

  return {
    get defaultValue() {
      return defaultValue;
    },
    write,
    restore() {
      const value = defaultValue;
      write(value);
      reflect?.(value);
    },
  };
}
