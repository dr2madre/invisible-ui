import { Fragment } from "react";

/**
 * A keyboard-shortcut hint (internal), with the markup and classes of the
 * other adapters' Kbd: one `<kbd>` for a single key, or a chord of nested
 * keycaps joined by a separator hidden from assistive tech. `kbd.css` styles
 * it. It gives way to a public component when the React adapter ports Kbd.
 */
export function Kbd({ keys }: { keys: string | string[] }) {
  if (!Array.isArray(keys)) return <kbd className="kbd kbd__key">{keys}</kbd>;
  return (
    <kbd className="kbd kbd--chord">
      {/* A chord can repeat a key, so a key's position is its identity. */}
      {keys.map((key, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <span className="kbd__sep" aria-hidden="true">
              +
            </span>
          ) : null}
          <kbd className="kbd__key">{key}</kbd>
        </Fragment>
      ))}
    </kbd>
  );
}
