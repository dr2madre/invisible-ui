/** Internal, fully-resolved state of a label. */
export interface LabelState {
  /** Id of the control this labels (drives the `for` attribute), or `null`. */
  for: string | null;
  /** Id for the label itself (for `aria-labelledby` on the control), or `null`. */
  id: string | null;
}

/** User-provided options when creating a label. */
export interface LabelContext {
  /** Id of the control to associate with (`for`). */
  for?: string;
  /** Id for the label element itself. */
  id?: string;
}
