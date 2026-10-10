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

/**
 * Up to two initials from a name: the first character of the first and the
 * last word, or the first two characters of a single word, in upper case. A
 * blank name gives "?".
 */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return firstGraphemes(parts[0]!, 2).toUpperCase();
  return (firstGraphemes(parts[0]!, 1) + firstGraphemes(parts[parts.length - 1]!, 1)).toUpperCase();
}
