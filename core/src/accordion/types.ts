export type AccordionType = "single" | "multiple";
export type Orientation = "horizontal" | "vertical";

/** An item in an accordion. */
export interface AccordionItem {
  value: string;
  disabled?: boolean;
}

/** Internal, fully-resolved state of an accordion. */
export interface AccordionState {
  /** Currently expanded item values. */
  value: string[];
  items: AccordionItem[];
  type: AccordionType;
  /** For `single`: whether the open item can be collapsed. */
  collapsible: boolean;
  /** Whether the whole accordion is disabled. */
  disabled: boolean;
  orientation: Orientation;
  /** Base id used to link triggers and panels. */
  id: string;
}

/** User-provided options when creating an accordion. */
export interface AccordionContext {
  /** Initially expanded values. Defaults to none. */
  value?: string[];
  /** Ordered list of items. */
  items: AccordionItem[];
  /** `single` (default): one open at a time. `multiple`: many. */
  type?: AccordionType;
  /** For `single`: allow collapsing the open item. Defaults to `true`. */
  collapsible?: boolean;
  /** Whether the whole accordion is disabled. Defaults to `false`. */
  disabled?: boolean;
  /** Arrow-key axis for moving between headers. Defaults to `vertical`. */
  orientation?: Orientation;
  /** Base id used to link triggers to panels. Auto-generated when omitted. */
  id?: string;
  /** Called whenever the expanded set changes. */
  onValueChange?: (value: string[]) => void;
}
