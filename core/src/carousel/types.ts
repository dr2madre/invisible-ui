export type Orientation = "horizontal" | "vertical";

/** Internal, fully-resolved state of a carousel. */
export interface CarouselState {
  /** Current slide index (0-based). */
  index: number;
  /** Total number of slides. */
  count: number;
  /** Whether navigation wraps around at the ends. */
  loop: boolean;
  orientation: Orientation;
  /** Base id used to scope generated ids. */
  id: string;
}

/** User-provided options when creating a carousel. */
export interface CarouselContext {
  /** Total number of slides. */
  count: number;
  /** Initial slide index (0-based). Defaults to `0`. */
  index?: number;
  /** Whether navigation wraps around at the ends. Defaults to `false`. */
  loop?: boolean;
  /** Scroll axis. Defaults to `horizontal`. */
  orientation?: Orientation;
  /** Base id. Auto-generated when omitted. */
  id?: string;
  /** Called whenever the current slide changes. */
  onIndexChange?: (index: number) => void;
}
