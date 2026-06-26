/** A rendered pagination item: a page number or an ellipsis gap. */
export type PageItem = number | "ellipsis";

/** Internal, fully-resolved state of a pagination control. */
export interface PaginationState {
  /** Current page (1-based). */
  page: number;
  /** Total number of pages. */
  pageCount: number;
  /** Pages shown on each side of the current page. */
  siblingCount: number;
  /** Pages always shown at the start and end. */
  boundaryCount: number;
  /** Whether the whole control is disabled. */
  disabled: boolean;
  /** Base id (styling/labelling hook). */
  id: string;
}

/** User-provided options when creating a pagination control. */
export interface PaginationContext {
  /** Current page (1-based). Defaults to `1`. */
  page?: number;
  /** Total number of pages. */
  pageCount: number;
  /** Pages shown on each side of the current page. Defaults to `1`. */
  siblingCount?: number;
  /** Pages always shown at the start and end. Defaults to `1`. */
  boundaryCount?: number;
  /** Whether the control is disabled. Defaults to `false`. */
  disabled?: boolean;
  /** Base id. Auto-generated when omitted. */
  id?: string;
  /** Called whenever the page changes. */
  onPageChange?: (page: number) => void;
}
