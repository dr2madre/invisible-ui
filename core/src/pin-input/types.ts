export type PinInputType = "numeric" | "alphanumeric";

/** Internal, fully-resolved state of a PIN input. */
export interface PinInputState {
  /** One entry per cell (empty string when blank). */
  values: string[];
  /** Number of cells. */
  length: number;
  /** Allowed characters. */
  type: PinInputType;
  /** Render cells masked (like a password). */
  mask: boolean;
  /** Whether the whole input is disabled. */
  disabled: boolean;
  /** Base id (styling/labelling hook). */
  id: string;
}

/** User-provided options when creating a PIN input. */
export interface PinInputContext {
  /** Initial value; spread across the cells. */
  value?: string;
  /** Number of cells. Defaults to `6`. */
  length?: number;
  /** Allowed characters. Defaults to `numeric`. */
  type?: PinInputType;
  /** Render cells masked. Defaults to `false`. */
  mask?: boolean;
  /** Whether the input is disabled. Defaults to `false`. */
  disabled?: boolean;
  /** Base id. Auto-generated when omitted. */
  id?: string;
  /** Called whenever the combined value changes. */
  onValueChange?: (value: string) => void;
  /** Called once all cells are filled. */
  onComplete?: (value: string) => void;
}
