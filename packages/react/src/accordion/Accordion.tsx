import type { ReactNode } from "react";
import { ChevronEndGlyph, Icon } from "../icon/Icon";
import { useAccordion, type AccordionItem, type AccordionType } from "./use-accordion";

/** A heading level for the item headers, so they fit the page outline. */
export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

/**
 * An item, with an optional header `label` (falls back to `value`), its panel
 * `content`, and a `headingLevel` that wins over the accordion's own.
 */
export type AccordionEntry = AccordionItem & {
  label?: string;
  content?: ReactNode;
  headingLevel?: AccordionHeadingLevel;
};

export interface AccordionProps {
  items: AccordionEntry[];
  /** Initial (uncontrolled) or current (controlled) expanded values. */
  value?: string[];
  /** `single` (default): one open at a time. `multiple`: many. */
  type?: AccordionType;
  /** For `single`: allow collapsing the open item. */
  collapsible?: boolean;
  disabled?: boolean;
  /** Level of every item header, 2 to 6; an item's own `headingLevel` wins. */
  headingLevel?: AccordionHeadingLevel;
  /** Called whenever the expanded set changes. */
  onValueChange?: (value: string[]) => void;
}

const NONE: string[] = [];

/** A level from 2 to 6, else 3. */
const level = (value: number | undefined): AccordionHeadingLevel =>
  value !== undefined && Number.isInteger(value) && value >= 2 && value <= 6
    ? (value as AccordionHeadingLevel)
    : 3;

/**
 * Accordion: the styled accordion (WAI-ARIA accordion pattern): single or
 * multiple expansion, arrow-key movement between headers. Behaviour and
 * accessibility come from the headless accordion (`@design-system/core`);
 * this layer adds bordered items and a rotating chevron.
 *
 * Each item supplies a header `label` (falling back to `value`) and its panel
 * `content`, which may be any markup. Each header is a heading at
 * `headingLevel` (3 by default) so the items take their place in the page
 * outline. Colors are themeable CSS custom properties (`--ds-accordion-*`).
 */
export function Accordion({
  items,
  value = NONE,
  type = "single",
  collapsible = true,
  disabled = false,
  headingLevel = 3,
  onValueChange,
}: AccordionProps) {
  const api = useAccordion({
    items,
    value,
    type,
    collapsible,
    disabled,
    onValueChange,
  });

  return (
    <div className="accordion" {...api.rootProps}>
      {items.map((item) => {
        const Heading = `h${level(item.headingLevel ?? headingLevel)}` as const;
        return (
          <div key={item.value} className="accordion__item" {...api.getItemProps(item.value)}>
            <Heading className="accordion__heading">
              <button className="accordion__trigger" {...api.getTriggerProps(item.value)}>
                <span>{item.label ?? item.value}</span>
                <span className="accordion__icon" aria-hidden="true">
                  <Icon size="var(--ds-accordion-icon-size, 1.1em)">
                    <ChevronEndGlyph />
                  </Icon>
                </span>
              </button>
            </Heading>
            <div className="accordion__panel" {...api.getPanelProps(item.value)}>
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
