export type Orientation = "horizontal" | "vertical";

/** When selection happens during arrow navigation. */
export type ActivationMode = "automatic" | "manual";

/** A tab in a tab list. */
export interface TabItem {
  value: string;
  disabled?: boolean;
}

/** Internal, fully-resolved state of a tabs widget. */
export interface TabsState {
  /** The selected tab value, or `null`. */
  value: string | null;
  items: TabItem[];
  orientation: Orientation;
  activationMode: ActivationMode;
  /** Base id used to link tabs and panels. */
  id: string;
}

/** User-provided options when creating a tabs widget. */
export interface TabsContext {
  /** Initial / controlled selected value. Defaults to the first item. */
  value?: string | null;
  /** Ordered list of tabs. */
  items: TabItem[];
  /** Layout orientation (affects `aria-orientation` and arrow keys). */
  orientation?: Orientation;
  /**
   * `automatic` (default): arrow keys move focus and select. `manual`: arrow
   * keys move focus only; Enter/Space selects the focused tab.
   */
  activationMode?: ActivationMode;
  /** Base id used to link tabs to panels. Auto-generated when omitted. */
  id?: string;
  /** Called whenever the selected value changes. */
  onValueChange?: (value: string) => void;
}
