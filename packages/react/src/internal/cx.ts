/** Join the class names that apply, skipping the ones that do not. */
export const cx = (...names: (string | false | null | undefined)[]): string =>
  names.filter(Boolean).join(" ");
