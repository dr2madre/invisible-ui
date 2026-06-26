/** Internal, fully-resolved state of a collapsible. */
export interface CollapsibleState {
  /** Whether the content is expanded. */
  open: boolean;
  /** Whether the collapsible is disabled. */
  disabled: boolean;
  /** Base id used to link the trigger to the content. */
  id: string;
}

/** User-provided options when creating a collapsible. */
export interface CollapsibleContext {
  /** Initially open. Defaults to `false`. */
  open?: boolean;
  /** Whether the collapsible is disabled. Defaults to `false`. */
  disabled?: boolean;
  /** Base id used to link the trigger to the content. Auto-generated when omitted. */
  id?: string;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
}
