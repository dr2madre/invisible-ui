import { useId, useRef, useState } from "react";
import { useI18n } from "../i18n/i18n";
import { Icon } from "../icon/Icon";
import { cx } from "../internal/cx";
import { useRatingGroup } from "./use-rating-group";

export interface RatingGroupProps {
  /** Accessible name for the rating group (required). */
  label: string;
  /** Number of stars. */
  max?: number;
  /** Selected rating (1..max), or null. */
  value?: number | null;
  disabled?: boolean;
  /** Form field name; the rating is submitted under it. */
  name?: string;
  /** Called whenever the rating changes. */
  onValueChange?: (value: number) => void;
}

const STAR = (
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
);

/**
 * RatingGroup — a star rating built on native `<input type="radio">` stars
 * sharing a `name`. The browser provides single selection, roving tabindex,
 * arrow-key navigation, focus and form participation; this layer renders the
 * stars and adds a pointer-hover preview.
 *
 * The group needs an accessible name via `label`; each star is a radio
 * labelled "N star(s)" from the catalog. Themeable via `--ds-rating-*`.
 */
export function RatingGroup({
  label,
  max = 5,
  value = null,
  disabled = false,
  name,
  onValueChange,
}: RatingGroupProps) {
  const labelId = `ds-rating-${useId()}-label`;
  const rootRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  const {
    items,
    api,
    value: rating,
  } = useRatingGroup({
    max,
    value,
    disabled,
    name,
    onValueChange,
    rootRef,
  });
  // While hovering, stars up to `hovered` show a grey preview; otherwise the
  // selected stars show the selection color.
  const [hovered, setHovered] = useState(0);

  return (
    <div className="rating-field">
      <span className="rating__label" id={labelId}>
        {label}
      </span>
      <div
        ref={rootRef}
        {...api.rootProps}
        className={cx("rating", disabled && "rating--disabled")}
        aria-labelledby={labelId}
        onPointerLeave={() => setHovered(0)}
      >
        {items.map((item) => (
          <label
            key={item.value}
            className={cx(
              "rating__star",
              !hovered && item.position <= (rating ?? 0) && "rating__star--filled",
              hovered > 0 && item.position <= hovered && "rating__star--preview",
            )}
            onPointerEnter={() => {
              if (!disabled) setHovered(item.position);
            }}
          >
            <input
              {...api.getItemProps(item.value)}
              className="rating__input"
              aria-label={t("rating.stars", { count: item.position })}
            />
            <Icon size="var(--ds-rating-size, 1.5rem)">{STAR}</Icon>
          </label>
        ))}
      </div>
    </div>
  );
}
