import type { ReactNode } from "react";
import { useI18n } from "../i18n/i18n";
import { ChevronGlyph, Icon } from "../icon/Icon";
import { useCollapsible } from "./use-collapsible";

export interface CollapsibleProps {
  /** Initial (uncontrolled) or current (controlled) open state. */
  open?: boolean;
  /** Whether the collapsible is disabled. */
  disabled?: boolean;
  /** Trigger text, used when `trigger` is not given. */
  label?: string;
  /** The trigger's content. Defaults to `label`, then the catalog's "Toggle". */
  trigger?: ReactNode;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** The collapsible content. */
  children?: ReactNode;
}

/**
 * Collapsible: a styled, single-item disclosure (WAI-ARIA disclosure
 * pattern): one trigger button toggling one content region. Behaviour and
 * accessibility (`aria-expanded`/`aria-controls` wiring, disabled handling)
 * come from the headless collapsible (`@design-system/core`); this layer adds
 * a trigger row with a rotating chevron and a content area.
 *
 * Colors, radius and spacing are themeable via `--ds-collapsible-*`.
 */
export function Collapsible({
  open = false,
  disabled = false,
  label,
  trigger,
  onOpenChange,
  children,
}: CollapsibleProps) {
  const { t } = useI18n();
  const api = useCollapsible({ open, disabled, onOpenChange });
  return (
    <div className="collapsible" {...api.rootProps}>
      <button className="collapsible__trigger" {...api.triggerProps}>
        <span className="collapsible__label">{trigger ?? label ?? t("collapsible.toggle")}</span>
        <span className="collapsible__icon" aria-hidden="true">
          <Icon size="var(--ds-collapsible-icon-size, 1.1em)">
            <ChevronGlyph />
          </Icon>
        </span>
      </button>
      <div className="collapsible__content" {...api.contentProps}>
        {children}
      </div>
    </div>
  );
}
