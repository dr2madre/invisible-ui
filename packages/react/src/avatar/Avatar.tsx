import { useState } from "react";
import { avatar } from "@design-system/core";

export interface AvatarProps {
  /** Required: the accessible name and the source of the initials. */
  name: string;
  /** Image URL. When absent or it fails to load, the initials show. */
  src?: string;
  /** Accessible name; defaults to `name`. */
  alt?: string;
  size?: "sm" | "md" | "lg";
  shape?: "circle" | "square";
}

/**
 * Up to two initials from a name (first and last word), counted in
 * user-perceived characters. The logic lives in `@design-system/core`.
 */
export function initialsOf(name: string): string {
  return avatar.initialsOf(name);
}

/**
 * Avatar: a small account image that falls back to the account's initials
 * when no image is set or the image fails to load.
 *
 * `name` is required: it gives both the accessible name and the initials. The
 * whole avatar is one image to assistive tech (`role="img"` and
 * `aria-label`), so it reads the same with the photo or the initials. Size,
 * shape and colours are themeable (`--ds-avatar-*`).
 */
export function Avatar({ name, src, alt, size = "md", shape = "circle" }: AvatarProps) {
  // The source that failed: a new `src` no longer matches, so it is tried.
  const [failedSrc, setFailedSrc] = useState<string>();
  const showImage = Boolean(src) && failedSrc !== src;
  return (
    <span
      className="avatar"
      data-size={size}
      data-shape={shape}
      role="img"
      aria-label={alt ?? name}
    >
      {showImage ? (
        <img className="avatar__img" src={src} alt="" onError={() => setFailedSrc(src)} />
      ) : (
        <span className="avatar__initials" aria-hidden="true">
          {initialsOf(name)}
        </span>
      )}
    </span>
  );
}
