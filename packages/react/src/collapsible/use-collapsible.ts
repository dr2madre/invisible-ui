import { collapsible as core } from "@design-system/core";
import { useId, useMemo } from "react";
import { useControllable } from "../internal/controllable";
import { normalizeProps } from "../normalize";

export interface UseCollapsibleOptions {
  /** Initial (uncontrolled) or current (controlled) open state. */
  open?: boolean;
  disabled?: boolean;
  /** Called whenever the user opens or closes the content. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Connect the headless collapsible (WAI-ARIA disclosure pattern) to React: one
 * trigger button (`aria-expanded`, `aria-controls`) showing or hiding one
 * content region. `open` is a controllable mirror (ADR 0011).
 */
export function useCollapsible({
  open: openProp = false,
  disabled = false,
  onOpenChange,
}: UseCollapsibleOptions = {}): core.CollapsibleApi {
  const id = `ds-collapsible-${useId()}`;
  const [open, setOpen] = useControllable(openProp, onOpenChange);
  return useMemo(
    () => core.connect({ state: { open, disabled, id }, setOpen, normalize: normalizeProps }),
    [open, disabled, id, setOpen],
  );
}
