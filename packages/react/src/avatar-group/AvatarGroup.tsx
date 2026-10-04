import type { CSSProperties } from "react";
import { Avatar } from "../avatar/Avatar";
import { useI18n } from "../i18n/i18n";

export interface AvatarGroupItem {
  /** Required: the accessible name and the source of the initials. */
  name: string;
  /** Image URL; falls back to the initials when absent or it fails to load. */
  src?: string;
  /** Accessible name override; defaults to `name`. */
  alt?: string;
  /** Optional background for the initials avatar (any CSS colour). */
  color?: string;
}

export interface AvatarGroupProps {
  /** The people in the group. */
  items: AvatarGroupItem[];
  /** Maximum avatars to show before the rest collapse into a "+N" chip. */
  max?: number;
  size?: "sm" | "md" | "lg";
  shape?: "circle" | "square";
  /** Accessible name for the group. */
  label: string;
}

const UNSAFE_COLOR = /[;{}]/;

// The colour is data, so it is one value only: anything that could close the
// declaration and start another is dropped, as in the other adapters.
const colorStyle = (color: string | undefined): CSSProperties | undefined =>
  color && !UNSAFE_COLOR.test(color) ? ({ "--ds-avatar-bg": color } as CSSProperties) : undefined;

/**
 * AvatarGroup: a row of overlapping avatars (a team, attendees,
 * collaborators). Shows at most `max` and collapses the rest into a "+N"
 * chip.
 *
 * Accessibility: the row is a labelled group, each avatar keeps its own name,
 * and the chip is named from the catalog ("N more").
 *
 * Overlap, ring, size and shape are themeable (`--ds-avatar-group-*`),
 * inheriting the `Avatar` tokens.
 */
export function AvatarGroup({
  items,
  max = 4,
  size = "md",
  shape = "circle",
  label,
}: AvatarGroupProps) {
  const { t } = useI18n();
  const visible = items.slice(0, max);
  const overflow = items.length - visible.length;
  return (
    <div
      className="avatar-group"
      data-size={size}
      data-shape={shape}
      role="group"
      aria-label={label}
    >
      {visible.map((item, index) => (
        // Items carry no id and two people may share a name, so the position
        // is part of the key; the name remounts the avatar when the person
        // changes.
        <span
          key={`${index}:${item.name}`}
          className="avatar-group__item"
          // The shared sheet reads the tint from this custom property.
          style={colorStyle(item.color)}
        >
          <Avatar name={item.name} src={item.src} alt={item.alt} size={size} shape={shape} />
        </span>
      ))}
      {overflow > 0 ? (
        <span
          className="avatar-group__item avatar-group__overflow"
          data-size={size}
          data-shape={shape}
          role="img"
          aria-label={t("avatarGroup.more", { count: overflow })}
        >
          <span aria-hidden="true">+{overflow}</span>
        </span>
      ) : null}
    </div>
  );
}
