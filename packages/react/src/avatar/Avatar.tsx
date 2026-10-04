import { useState } from "react";

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

// A user-perceived character, not a UTF-16 code unit: an emoji or a combined
// character counts as one initial. Falls back to code units where the runtime
// has no segmenter. One segmenter serves every avatar: it keeps no state.
let segmenter: Intl.Segmenter | null | undefined;

function firstGraphemes(text: string, count: number): string {
  segmenter ??=
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
      : null;
  if (!segmenter) return text.slice(0, count);
  let out = "";
  let taken = 0;
  for (const { segment } of segmenter.segment(text)) {
    out += segment;
    if (++taken === count) break;
  }
  return out;
}

/** Derive up to two initials from a name (first and last word). */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return firstGraphemes(parts[0]!, 2).toUpperCase();
  return (firstGraphemes(parts[0]!, 1) + firstGraphemes(parts[parts.length - 1]!, 1)).toUpperCase();
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
