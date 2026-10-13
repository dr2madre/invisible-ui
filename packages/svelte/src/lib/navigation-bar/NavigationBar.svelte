<script lang="ts" module>
  import type { NavigationBadge, NavigationDestination } from "./types";

  // eslint-disable-next-line no-import-assign -- false positive: TS type re-export
  export type { NavigationBadge, NavigationDestination };
</script>

<script lang="ts">
  /**
   * NavigationBar — primary navigation between a few top-level sections: a
   * `<nav>` landmark around a list of destinations, each an icon above a
   * visible label (docs/navigation-bar-spec.md). A destination with an `href`
   * is a link the browser or the router follows; one without is a button
   * that reports `onSelect`, again when it is already current. The current
   * destination is the application's `value`, marked with
   * `aria-current="page"`, a shape behind the icon and a heavier label.
   *
   * Every destination is a tab stop; the left and right arrows move between
   * them as well, mirrored under right to left, without wrapping. An
   * unavailable destination stays focusable with its reason read as its
   * description and shown on hover, focus and a long press. A badge's text is
   * part of the destination's name, and a badge that appears or changes is
   * announced politely once (`announce: false` silences it); while a modal
   * dialog is open the announcement waits for it to close (ADR 0016).
   *
   * The component reads no screen size: whether and where the bar shows is
   * the application's, and so are its width, position, radius, shadow and
   * safe-area padding. Themeable via `--ds-navigation-bar-*`.
   *
   *   <NavigationBar {destinations} value={section} onSelect={go} />
   */
  import type { Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import { navigationBar as core, type ElementProps } from "@design-system/core";
  import Icon from "../icon/Icon.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import { hasOpenModal, onModalChange } from "../internal/modal-stack";
  import { stableId } from "../internal/stable-id";

  const { t } = getI18n();

  interface Props {
    /** The destinations, in reading order. */
    destinations: NavigationDestination[];
    /** The current destination's value. The application owns it. */
    value?: string | null;
    /** Accessible name for the landmark. Defaults to the catalog's "Main". */
    label?: string;
    /** Called with a button destination's value on every activation. */
    onSelect?: (value: string) => void;
    /** Replaces the lock glyph that marks an unavailable destination. */
    unavailableIcon?: Snippet;
  }

  let { destinations, value = null, label, onSelect, unavailableIcon }: Props = $props();

  const id = stableId("ds-navigation-bar");

  const api = $derived(
    core.connect({
      destinations,
      value,
      label: label ?? $t("navigationBar.label"),
      id,
      // Read at activation time, so a replaced callback is the one called.
      onSelect: (selected) => onSelect?.(selected),
    }),
  );

  /** Svelte names DOM events in lower case: `onClick` becomes `onclick`. */
  const toSvelte = (props: ElementProps) =>
    Object.fromEntries(
      Object.entries(props)
        .filter(([, prop]) => prop !== undefined)
        .map(([key, prop]) => [/^on[A-Z]/.test(key) ? key.toLowerCase() : key, prop]),
    );

  // The badges as they were last seen, and the announcements waiting for the
  // last modal dialog to close. Neither is shown, so neither is state.
  let seen: core.NavigationTarget[] | null = null;
  let held: core.BadgeAnnouncement[] = [];
  // What the live region says now.
  let spoken = $state.raw<core.BadgeAnnouncement[]>([]);
  let live: HTMLElement | undefined;

  // A badge that appears or changes is announced once; nothing on mount.
  $effect(() => {
    const next = destinations.map(({ value, label, badge }) => ({
      value,
      label,
      badge: badge && { ...badge },
    }));
    const announcements = core.badgeAnnouncements(seen, next, { translate: $t });
    seen = next;
    if (announcements.length === 0) return;
    if (live && hasOpenModal(live.ownerDocument)) {
      held = core.holdAnnouncements(held, announcements);
    } else {
      spoken = announcements;
    }
  });

  // What waited while a modal dialog was open is made once the last one closes.
  const followModals: Attachment<HTMLElement> = (node) => {
    const doc = node.ownerDocument;
    return onModalChange(doc, () => {
      if (held.length === 0 || hasOpenModal(doc)) return;
      spoken = held;
      held = [];
    });
  };
</script>

<nav class="navigation-bar" {...toSvelte(api.getRootProps())} {@attach followModals}>
  <ul class="navigation-bar__list" {...toSvelte(api.getListProps())}>
    {#each destinations as destination (destination.value)}
      <li class="navigation-bar__item">
        <svelte:element
          this={destination.href === undefined ? "button" : "a"}
          class="navigation-bar__destination"
          {...toSvelte(api.getDestinationProps(destination.value))}
        >
          <span class="navigation-bar__indicator" aria-hidden="true">
            <span class="navigation-bar__icon"><destination.icon /></span>
            {#if destination.badge}
              <span
                class={[
                  "navigation-bar__badge",
                  destination.badge.content === undefined && "navigation-bar__badge--dot",
                ]}>{destination.badge.content ?? ""}</span
              >
            {/if}
            {#if destination.unavailable}
              <span class="navigation-bar__status">
                {#if unavailableIcon}
                  {@render unavailableIcon()}
                {:else}
                  <Icon size="1em">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </Icon>
                {/if}
              </span>
            {/if}
          </span>
          <span class="navigation-bar__label" data-label={destination.label}>
            <span class="navigation-bar__label-text"
              >{destination.label}{#if destination.badge}<span class="navigation-bar__hidden"
                  >, {destination.badge.label}</span
                >{/if}</span
            >
          </span>
        </svelte:element>
        {#if destination.unavailable}
          <span class="navigation-bar__reason" {...toSvelte(api.getReasonProps(destination.value))}>
            {destination.unavailable.reason}
          </span>
        {/if}
      </li>
    {/each}
  </ul>
  <div class="navigation-bar__live" aria-live="polite" bind:this={live}>
    {#each spoken as announcement (announcement.value)}<span>{announcement.text}</span>{/each}
  </div>
</nav>

<style>
  .navigation-bar {
    color: var(--ds-navigation-bar-item-text, var(--ds-color-text-secondary, #524c44));
    background: var(--ds-navigation-bar-surface, var(--ds-color-surface, #e6e0d8));
  }

  /* Each destination takes an equal share of the width, from the inline
     start, so the first destination sits on the right under right to left. */
  .navigation-bar__list {
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    gap: var(--ds-navigation-bar-gap, 0.25rem);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .navigation-bar__item {
    position: relative;
    display: flex;
    min-inline-size: 0;
  }

  .navigation-bar__destination {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    box-sizing: border-box;
    inline-size: 100%;
    min-inline-size: var(--ds-min-target-size, 24px);
    min-block-size: var(--ds-min-target-size, 24px);
    padding: var(--ds-navigation-bar-item-padding, 0.5rem 0.25rem);
    font: inherit;
    font-size: 0.75rem;
    line-height: var(--ds-line-height-tight, 1.2);
    color: inherit;
    text-align: center;
    text-decoration: none;
    background: none;
    border: 0;
    border-radius: var(--ds-radius-control, 0.5rem);
    cursor: pointer;
    -webkit-touch-callout: none;
  }

  @media (pointer: coarse) {
    .navigation-bar__destination {
      min-inline-size: var(--ds-min-target-size-touch, 44px);
      min-block-size: var(--ds-min-target-size-touch, 44px);
    }
  }

  @media (hover: hover) {
    .navigation-bar__destination:hover {
      background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
    }
  }

  /* The ring surrounds the whole destination, so it never depends on the
     current mark. */
  .navigation-bar__destination:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow, 0 0 0 2px var(--ds-color-focus-ring, #8e6cd4));
  }

  /* The shape behind the icon: the current mark, never colour alone. It
     carries the badge and the status glyph at its corners. */
  .navigation-bar__indicator {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 3.5rem;
    max-inline-size: 100%;
    block-size: 2rem;
    border-radius: var(--ds-radius-pill, 999px);
  }

  .navigation-bar__icon {
    display: inline-flex;
    font-size: 1.5rem;
  }

  .navigation-bar__destination[data-current] {
    color: var(--ds-navigation-bar-item-current-text, var(--ds-color-text, #282420));
  }

  .navigation-bar__destination[data-current] .navigation-bar__indicator {
    background: var(--ds-navigation-bar-current-indicator, #8763d1);
  }

  /* The label wraps and never truncates; the bar grows taller. A hidden copy
     at the current weight shares its grid cell, so the weight change never
     reflows the bar. */
  .navigation-bar__label {
    display: grid;
    max-inline-size: 100%;
    overflow-wrap: anywhere;
  }

  .navigation-bar__label::after {
    content: attr(data-label);
    grid-area: 1 / 1;
    font-weight: 600;
    visibility: hidden;
  }

  .navigation-bar__label-text {
    grid-area: 1 / 1;
  }

  .navigation-bar__destination[data-current] .navigation-bar__label-text {
    font-weight: 600;
  }

  .navigation-bar__badge {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: calc(50% + 0.375rem);
    box-sizing: border-box;
    min-inline-size: 1rem;
    block-size: 1rem;
    padding-inline: 0.25rem;
    font-size: 0.6875rem;
    font-weight: 600;
    line-height: 1rem;
    color: var(--ds-navigation-bar-badge-text, var(--ds-color-on-status, #fff));
    white-space: nowrap;
    background: var(--ds-navigation-bar-badge-surface, var(--ds-color-danger, #be3b50));
    border-radius: var(--ds-radius-pill, 999px);
  }

  .navigation-bar__badge--dot {
    inset-block-start: 0.25rem;
    min-inline-size: 0;
    inline-size: 0.5rem;
    block-size: 0.5rem;
    padding: 0;
  }

  .navigation-bar__destination[data-unavailable] {
    color: var(--ds-color-text-disabled, #757067);
    cursor: default;
  }

  .navigation-bar__status {
    position: absolute;
    inset-block-end: 0;
    inset-inline-start: calc(50% + 0.375rem);
    display: inline-flex;
    font-size: 0.875rem;
  }

  /* The reason shows on hover, keyboard focus and a long press, and Escape
     hides it until focus or the pointer leaves (WCAG 1.4.13). It stays in
     the page for `aria-describedby` while hidden. */
  .navigation-bar__reason {
    position: absolute;
    inset-block-end: calc(100% + 0.25rem);
    inset-inline: 0;
    z-index: var(--ds-tooltip-z-index, 60);
    display: none;
    inline-size: max-content;
    max-inline-size: 12rem;
    margin-inline: auto;
    padding: var(--ds-tooltip-padding, 0.3rem 0.5rem);
    font-size: var(--ds-tooltip-font-size, 0.8125rem);
    line-height: var(--ds-line-height, 1.4);
    color: var(--ds-tooltip-color, var(--ds-color-on-emphasis, #f4f2ef));
    background: var(--ds-tooltip-bg, var(--ds-color-emphasis-surface, #332f2a));
    border-radius: var(--ds-tooltip-radius, var(--ds-radius-control, 0.5rem));
  }

  .navigation-bar__destination:focus-visible + .navigation-bar__reason,
  .navigation-bar__destination[data-reason-shown] + .navigation-bar__reason {
    display: block;
  }

  @media (hover: hover) {
    .navigation-bar__item:hover > .navigation-bar__reason {
      display: block;
    }
  }

  .navigation-bar__destination[data-reason-dismissed] + .navigation-bar__reason {
    display: none;
  }

  .navigation-bar__hidden,
  .navigation-bar__live {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* Forced colors drop backgrounds: the current mark becomes an outline, and
     the badge keeps a border so a dot stays visible. */
  @media (forced-colors: active) {
    .navigation-bar__destination[data-current] .navigation-bar__indicator {
      outline: 2px solid CanvasText;
      outline-offset: -2px;
    }

    .navigation-bar__badge {
      border: 1px solid CanvasText;
    }

    .navigation-bar__reason {
      border: 1px solid CanvasText;
    }
  }
</style>
