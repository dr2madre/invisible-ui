import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";

export type LinkVariant = "primary" | "subtle";

export interface LinkProps extends Omit<
  ComponentPropsWithoutRef<"a">,
  "href" | "children" | "className"
> {
  /** Destination URL, used as given. */
  href: string;
  /** Open in a new tab: adds `target` and a safe `rel`, and a trailing arrow. */
  external?: boolean;
  /** `subtle` takes the surrounding text colour (still underlined on hover). */
  variant?: LinkVariant;
  /** The link text. */
  children?: ReactNode;
}

const EXTERNAL_GLYPH = (
  <svg
    className="link__external"
    viewBox="0 0 24 24"
    width="0.85em"
    height="0.85em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </svg>
);

/**
 * Link: an inline text link in a semantic `<a>`, underlined, with a clear
 * hover and focus treatment. `external` opens it in a new tab, adds a safe
 * `rel` and marks it with a decorative arrow.
 *
 * `href` is required: a link navigates. An anchor without a destination takes
 * no focus and has no link semantics, so an in-page action belongs to Button.
 * Every other anchor attribute reaches the `<a>`, `onClick` included, for the
 * work that goes with a navigation, such as analytics.
 *
 * Themeable via `--ds-link-*`.
 */
export const Link = /* @__PURE__ */ forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, external = false, variant = "primary", children, ...rest },
  ref,
) {
  // A new tab always gets a safe `rel`, also when the target comes in as a
  // plain attribute; both are set after the spread so nothing overrides them.
  const target = external ? "_blank" : rest.target;
  const rel =
    target === "_blank" ? [rest.rel, "noopener noreferrer"].filter(Boolean).join(" ") : rest.rel;
  return (
    <a
      {...rest}
      ref={ref}
      className="link"
      data-variant={variant}
      href={href}
      target={target}
      rel={rel}
    >
      {children}
      {external ? EXTERNAL_GLYPH : null}
    </a>
  );
});
