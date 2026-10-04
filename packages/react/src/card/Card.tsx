import { useId, type ReactNode } from "react";
import { cx } from "../internal/cx";

export interface CardProps {
  /** `media` (default): media, text and actions. `dashboard`: a metric tile. */
  variant?: "media" | "dashboard";
  /** Media card layout. Defaults to `vertical`. */
  orientation?: "vertical" | "horizontal";
  /** Surface hierarchy. `secondary` uses the quieter secondary card surface. */
  surface?: "default" | "secondary";
  /** Image URL for the media area, used as given (ignored with `icon` or `media`). */
  imageSrc?: string;
  /** Alt text for the image. Empty by default (decorative). */
  imageAlt?: string;
  /**
   * Card title. A string renders as a heading and names the card; other
   * markup replaces the heading.
   */
  title?: ReactNode;
  /** Heading level for a string title (2 to 6). Defaults to `3`. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Body description: text or markup. */
  description?: ReactNode;
  /** Dashboard: the large metric value. */
  value?: string | number;
  /** Dashboard: the smaller change shown beside the value. */
  change?: string;
  /** Dashboard: direction of the change, for its colour. */
  trend?: "up" | "down" | "neutral";
  /** Decorative icon in the media area (media) or beside the title (dashboard). */
  icon?: ReactNode;
  /** Custom media, in place of the image or the icon. */
  media?: ReactNode;
  /** Tags shown with the title. */
  tags?: ReactNode;
  /** Dashboard: extra content after the value and the change. */
  metric?: ReactNode;
  /** Actions at the end of the card. */
  actions?: ReactNode;
  /** Extra body content below the description. */
  children?: ReactNode;
}

/**
 * Card: a presentational container in three shapes.
 *
 * - `variant="media"`, `orientation="vertical"` (default): media on top, then
 *   tags, title, description and the actions.
 * - `variant="media"`, `orientation="horizontal"`: media at the start, the
 *   title with its tags and the description, actions at the end.
 * - `variant="dashboard"`: an icon over a title, a large value with a
 *   smaller change beside it (a metric tile).
 *
 * The media area holds `imageSrc`, or `icon` in its place, or your own
 * `media`. Tags and actions are markup, to compose with `Tag` and `Button`.
 *
 * Accessibility: an `<article>`; a string `title` is a heading at
 * `headingLevel` and names the card (`aria-labelledby`). Themeable via
 * `--ds-card-*`.
 */
export function Card({
  variant = "media",
  orientation = "vertical",
  surface = "default",
  imageSrc,
  imageAlt = "",
  title,
  headingLevel = 3,
  description,
  value,
  change,
  trend = "neutral",
  icon,
  media,
  tags,
  metric,
  actions,
  children,
}: CardProps) {
  const titleId = `ds-card-${useId()}`;
  const named = typeof title === "string" && title !== "";
  const labelledBy = named ? titleId : undefined;
  const Heading = `h${headingLevel}` as const;
  const heading = named ? (
    <Heading className="card__title" id={titleId}>
      {title}
    </Heading>
  ) : (
    title
  );
  const iconNode = icon ? (
    <span className="card__icon" aria-hidden="true">
      {icon}
    </span>
  ) : null;

  if (variant === "dashboard") {
    return (
      <article className="card card--dashboard" data-surface={surface} aria-labelledby={labelledBy}>
        <div className="card__dash-head">
          {iconNode}
          {heading}
        </div>
        <div className="card__metric">
          {value != null ? <span className="card__value">{value}</span> : null}
          {change ? (
            <span className="card__change" data-trend={trend}>
              {change}
            </span>
          ) : null}
          {metric}
        </div>
      </article>
    );
  }

  const hasMedia = Boolean(imageSrc || iconNode || media);
  return (
    <article
      className="card card--media"
      data-orientation={orientation}
      data-surface={surface}
      aria-labelledby={labelledBy}
    >
      {hasMedia ? (
        <div
          className={cx(
            "card__media",
            !imageSrc && !media && iconNode !== null && "card__media--icon",
          )}
        >
          {media
            ? media
            : (iconNode ?? <img className="card__image" src={imageSrc} alt={imageAlt} />)}
        </div>
      ) : null}
      <div className="card__body">
        <div className="card__head">
          {heading}
          {tags ? <div className="card__tags">{tags}</div> : null}
        </div>
        {description ? <div className="card__description">{description}</div> : null}
        {children ? <div className="card__content">{children}</div> : null}
      </div>
      {actions ? <div className="card__actions">{actions}</div> : null}
    </article>
  );
}
