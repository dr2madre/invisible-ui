/**
 * The one pending open or close of an element that opens on hover: starting
 * a new one replaces whatever was waiting.
 */
export class HoverDelay {
  #timer: ReturnType<typeof setTimeout> | undefined;

  /** Run `action` once `delay` ms have passed. */
  schedule(delay: number, action: () => void): void {
    this.cancel();
    this.#timer = setTimeout(action, delay);
  }

  /** Like `schedule`, but a delay of zero or less runs `action` at once. */
  run(delay: number, action: () => void): void {
    if (delay > 0) {
      this.schedule(delay, action);
    } else {
      this.cancel();
      action();
    }
  }

  cancel(): void {
    clearTimeout(this.#timer);
  }
}
