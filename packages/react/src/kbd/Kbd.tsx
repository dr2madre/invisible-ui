import { Fragment, type ReactNode } from "react";

export interface KbdProps {
  /** A chord: each key renders as its own keycap, joined by `separator`. */
  keys?: string[];
  /** Separator shown between chord keys. Defaults to "+". */
  separator?: string;
  /** A single key, used when `keys` is empty. */
  children?: ReactNode;
}

/**
 * Kbd: a keyboard shortcut hint in the semantic `<kbd>` element.
 *
 * Pass one key as children (`<Kbd>Esc</Kbd>`) or a chord as `keys`
 * (`keys={["⌘", "K"]}`): each key gets its own nested `<kbd>` and a visible
 * separator, hidden from assistive tech, joins them.
 *
 * Presentational only. Themeable via `--ds-kbd-*`.
 */
export function Kbd({ keys, separator = "+", children }: KbdProps) {
  if (!keys?.length) return <kbd className="kbd kbd__key">{children}</kbd>;
  return (
    <kbd className="kbd kbd--chord">
      {/* A chord can repeat a key, so a key's position is its identity. */}
      {keys.map((key, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <span className="kbd__sep" aria-hidden="true">
              {separator}
            </span>
          ) : null}
          <kbd className="kbd__key">{key}</kbd>
        </Fragment>
      ))}
    </kbd>
  );
}
