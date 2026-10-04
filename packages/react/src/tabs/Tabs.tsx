import type { ReactNode } from "react";
import { Icon } from "../icon/Icon";
import { cx } from "../internal/cx";
import { useTabs, type ActivationMode, type TabItem } from "./use-tabs";

/**
 * A tab, with an optional display `label` (falls back to `value`) and its
 * panel `content`. May also carry a `count` (a trailing badge, read as part of
 * the tab's name), a leading `icon` (an SVG path `d` string), and `iconOnly`
 * to render just the icon (the label becomes the accessible name).
 */
export type TabsItem = TabItem & {
  label?: string;
  content?: ReactNode;
  count?: number;
  icon?: string;
  iconOnly?: boolean;
};

export interface TabsProps {
  items: TabsItem[];
  /** Initial (uncontrolled) or current (controlled) selected tab. */
  value?: string | null;
  /** `automatic` (default): arrows select while moving. `manual`: Enter or Space selects. */
  activationMode?: ActivationMode;
  /** Accessible name for the tab list (announced by screen readers). */
  label: string;
  /** Called whenever the selected tab changes. */
  onValueChange?: (value: string) => void;
  /** Rich content of one panel, rendered once per tab; wins over `content`. */
  renderPanel?: (item: TabsItem) => ReactNode;
}

/**
 * Tabs: the styled tabs widget (WAI-ARIA tabs pattern): roving tabindex,
 * arrow/Home/End navigation, automatic or manual activation. Behaviour and
 * accessibility come from the headless tabs (`@design-system/core`); this
 * layer adds the underline indicator and panels.
 *
 * Each item supplies a tab `label` (falling back to `value`) and its panel
 * `content`; `renderPanel` renders a panel from its item instead. For a strip
 * placed apart from its panels, use `useTabs`. Colors are themeable CSS
 * custom properties (`--ds-tabs-*`).
 */
export function Tabs({
  items,
  value = null,
  activationMode = "automatic",
  label,
  onValueChange,
  renderPanel,
}: TabsProps) {
  const { api } = useTabs({ items, value, activationMode, onValueChange });

  return (
    <div className="tabs">
      <div className="tabs__list" {...api.rootProps} aria-label={label}>
        {items.map((item) => {
          const name = item.label ?? item.value;
          const counted = item.count != null;
          return (
            <button
              key={item.value}
              type="button"
              className={cx("tabs__tab", item.iconOnly && "tabs__tab--icon-only")}
              {...api.getTabProps(item.value)}
              // The count is part of the name; the badge itself stays hidden
              // so it is not read as a separate word.
              aria-label={item.iconOnly ? (counted ? `${name} (${item.count})` : name) : undefined}
            >
              {item.icon ? (
                <span className="tabs__tab-icon" aria-hidden="true">
                  <Icon size="100%">
                    <path d={item.icon} />
                  </Icon>
                </span>
              ) : null}
              {item.iconOnly ? null : <span className="tabs__tab-label">{name}</span>}
              {counted ? (
                <span className="tabs__tab-count" aria-hidden="true">
                  {item.count}
                </span>
              ) : null}
              {counted && !item.iconOnly ? (
                <span className="tabs__sr">{` (${item.count})`}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div key={item.value} className="tabs__panel" {...api.getPanelProps(item.value)}>
          {renderPanel ? renderPanel(item) : item.content}
        </div>
      ))}
    </div>
  );
}
