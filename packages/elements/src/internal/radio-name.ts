/**
 * Radios group by a shared `name`: without one, arrow keys stop moving
 * between them and more than one can be checked. When the page gives no
 * `name`, a radio-based element generates one, and a generated name is not a
 * form value. The radios then point their `form` attribute at an id no
 * element carries: they belong to no form, so nothing is submitted, and they
 * still form one group, since radios group by name among those with the same
 * form owner.
 */
const NO_FORM = "ds-no-form";

/** Keep a radio out of form submission while its name is a generated one. */
export function syncRadioForm(input: HTMLInputElement, named: boolean): void {
  if (named) {
    if (input.getAttribute("form") === NO_FORM) input.removeAttribute("form");
  } else if (input.getAttribute("form") !== NO_FORM) {
    input.setAttribute("form", NO_FORM);
  }
}

type Anchored = Element & { form: HTMLFormElement | null };

/**
 * The anchor a form reset follows (see `watchFormReset`): the radio itself,
 * or, while it belongs to no form, the host standing in with the form around
 * it. A nameless group submits nothing, yet a reset still restores it.
 */
export function radioResetAnchor(
  host: HTMLElement,
  input: HTMLInputElement | null,
): Anchored | null {
  if (!input) return null;
  if (input.getAttribute("form") !== NO_FORM) return input;
  // The reset listener reads only `form`.
  return { form: host.closest("form") } as unknown as Anchored;
}
