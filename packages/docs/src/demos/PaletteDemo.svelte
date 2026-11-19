<script>
  // Tokens page: colors grouped by FUNCTION (Brand / Functional / Neutrals).
  // Each row shows the color name plus the tokens that resolve to it — Base
  // token, and the semantic --ds-color-* per theme (a token appears in both
  // Light and Dark when it resolves to this color in both). Fills are static
  // classes (no inline styles). The full swatch (with HEX/OKLCH) lives in the
  // reusable ColorSwatch component.
  const groups = [
    {
      title: "Brand",
      colors: [
        // "secondary" is a function, not a colour: the secondary button is the
        // same Dioxazine Purple, inverted. So --ds-components-general-action-secondary-background-default(-hover) sit
        // under the primary purple — there is no distinct secondary colour.
        {
          cls: "brand-primary",
          varName: "--ds-brand-primary-default",
          palette: "Dioxazine Purple 500",
          light: [
            "--ds-components-general-action-primary-background-default",
            "--ds-components-general-action-secondary-background-default",
            "--ds-components-general-selection-background-default",
          ],
          dark: [
            "--ds-components-general-action-primary-background-default",
            "--ds-components-general-action-secondary-background-default",
            "--ds-components-general-selection-background-default",
          ],
        },
        {
          cls: "brand-primary-hover",
          varName: "--ds-brand-primary-hover",
          palette: "Dioxazine Purple 600",
          light: [
            "--ds-components-general-action-primary-background-hover",
            "--ds-components-general-action-secondary-background-hover",
          ],
          dark: [
            "--ds-components-general-action-primary-background-hover",
            "--ds-components-general-action-secondary-background-hover",
          ],
        },
        {
          cls: "brand-white",
          varName: "--ds-brand-white",
          palette: "White",
          light: [
            "--ds-components-general-background-default",
            "--ds-components-general-action-primary-foreground-default",
            "--ds-components-general-action-secondary-foreground-default",
            "--ds-components-general-feedback-solid-foreground-default",
            "--ds-components-page-background-default",
            "--ds-components-card-background-default",
            "--ds-components-dialog-background-default",
            "--ds-components-popover-background-default",
            "--ds-components-menu-background-default",
            "--ds-components-sidebar-background-default",
          ],
          dark: [
            "--ds-components-general-action-primary-foreground-default",
            "--ds-components-general-action-secondary-foreground-default",
            "--ds-components-general-feedback-solid-foreground-default",
          ],
        },
        {
          cls: "brand-black",
          varName: "--ds-brand-black",
          palette: "Black",
          light: [],
          dark: [
            "--ds-components-page-background-default",
            "--ds-components-sidebar-background-default",
          ],
        },
      ],
    },
    {
      title: "Functional",
      note: "Feedback surfaces are the tinted backgrounds derived from each feedback hue via color-mix.",
      colors: [
        {
          cls: "info",
          varName: "--ds-feedback-info-default",
          palette: "Cobalt Blue 500",
          light: ["--ds-components-general-feedback-info-solid-background-default"],
          dark: ["--ds-components-general-feedback-info-solid-background-default"],
        },
        {
          cls: "success",
          varName: "--ds-feedback-success-default",
          palette: "Sap Green 600",
          light: ["--ds-components-general-feedback-success-solid-background-default"],
          dark: ["--ds-components-general-feedback-success-solid-background-default"],
        },
        {
          cls: "warning",
          varName: "--ds-feedback-warning-default",
          palette: "Burnt Orange 500",
          light: ["--ds-components-general-feedback-warning-solid-background-default"],
          dark: ["--ds-components-general-feedback-warning-solid-background-default"],
        },
        {
          cls: "danger",
          varName: "--ds-feedback-danger-default",
          palette: "Alizarin Red 600",
          light: ["--ds-components-general-feedback-danger-solid-background-default"],
          dark: ["--ds-components-general-feedback-danger-solid-background-default"],
        },
        {
          cls: "danger-hover",
          varName: "--ds-feedback-danger-hover",
          palette: "Alizarin Red 700",
          light: ["--ds-components-general-feedback-danger-solid-background-hover"],
          dark: ["--ds-components-general-feedback-danger-solid-background-hover"],
        },
      ],
    },
    {
      title: "Neutrals",
      colors: [
        {
          cls: "neutral-50",
          varName: "--ds-palette-grey-50",
          palette: "Grey 50",
          light: [
            "--ds-components-general-feedback-neutral-background-default",
            "--ds-components-general-emphasis-foreground-default",
            "--ds-components-card-secondary-background-default",
            "--ds-components-code-block-background-default",
          ],
          dark: ["--ds-components-general-foreground-default"],
        },
        {
          cls: "neutral-100",
          varName: "--ds-palette-grey-100",
          palette: "Grey 100",
          light: [
            "--ds-components-avatar-background-default",
            "--ds-components-switch-background-default",
          ],
          dark: ["--ds-components-general-emphasis-background-default"],
        },
        {
          cls: "neutral-200",
          varName: "--ds-palette-grey-200",
          palette: "Grey 200",
          light: [
            "--ds-components-general-border-default",
            "--ds-components-general-background-disabled",
            "--ds-components-general-feedback-neutral-border-default",
          ],
          dark: ["--ds-components-general-feedback-neutral-foreground-default"],
        },
        {
          cls: "neutral-300",
          varName: "--ds-palette-grey-300",
          palette: "Grey 300",
          light: [],
          dark: [
            "--ds-components-general-emphasis-border-default",
            "--ds-components-general-foreground-secondary",
          ],
        },
        {
          cls: "neutral-400",
          varName: "--ds-palette-grey-400",
          palette: "Grey 400",
          light: ["--ds-components-general-foreground-disabled"],
          dark: [],
        },
        {
          cls: "neutral-500",
          varName: "--ds-palette-grey-500",
          palette: "Grey 500",
          light: ["--ds-components-general-feedback-neutral-solid-background-default"],
          dark: ["--ds-components-general-feedback-neutral-solid-background-default"],
        },
        {
          cls: "neutral-600",
          varName: "--ds-palette-grey-600",
          palette: "Grey 600",
          light: ["--ds-components-general-foreground-secondary"],
          dark: ["--ds-components-general-foreground-disabled"],
        },
        {
          cls: "neutral-700",
          varName: "--ds-palette-grey-700",
          palette: "Grey 700",
          light: [
            "--ds-components-general-feedback-neutral-foreground-default",
            "--ds-components-general-emphasis-border-default",
          ],
          dark: [
            "--ds-components-general-border-default",
            "--ds-components-avatar-background-default",
            "--ds-components-general-feedback-neutral-border-default",
          ],
        },
        {
          cls: "neutral-800",
          varName: "--ds-palette-grey-800",
          palette: "Grey 800",
          light: ["--ds-components-general-emphasis-background-default"],
          dark: [
            "--ds-components-general-background-disabled",
            "--ds-components-general-feedback-neutral-background-default",
          ],
        },
        {
          cls: "neutral-900",
          varName: "--ds-palette-grey-900",
          palette: "Grey 900",
          light: [
            "--ds-components-general-foreground-default",
            "--ds-components-general-feedback-warning-solid-foreground-default",
          ],
          dark: [
            "--ds-components-general-background-default",
            "--ds-components-general-emphasis-foreground-default",
            "--ds-components-general-feedback-warning-solid-foreground-default",
            "--ds-components-card-secondary-background-default",
          ],
        },
        {
          cls: "neutral-950",
          varName: "--ds-palette-grey-950",
          palette: "Grey 950",
          light: [],
          dark: [
            "--ds-components-card-background-default",
            "--ds-components-dialog-background-default",
            "--ds-components-popover-background-default",
            "--ds-components-menu-background-default",
            "--ds-components-code-block-background-default",
          ],
        },
      ],
    },
  ];
</script>

<div class="palette">
  {#each groups as group (group.title)}
    <section class="group">
      <h3 class="group__title">{group.title}</h3>
      {#if group.note}<p class="group__note">{group.note}</p>{/if}
      <div class="rows">
        {#each group.colors as color (color.varName)}
          <div class="color">
            <figure class="swatch">
              <div class="swatch__chip swatch--{color.cls}"></div>
              <figcaption class="swatch__name">{color.palette}</figcaption>
            </figure>

            <div class="tokcols">
              <div class="tokcol">
                <span class="tokcol__h">Base token</span>
                <code class="token">{color.varName}</code>
              </div>
              <div class="tokcol">
                <span class="tokcol__h">Light</span>
                {#each color.light as t (t)}<code class="token">{t}</code>{:else}<span
                    class="tokcol__empty">—</span
                  >{/each}
              </div>
              <div class="tokcol">
                <span class="tokcol__h">Dark</span>
                {#each color.dark as t (t)}<code class="token">{t}</code>{:else}<span
                    class="tokcol__empty">—</span
                  >{/each}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
  .palette {
    display: grid;
    gap: 2rem;
  }
  .group {
    display: grid;
    gap: 0.75rem;
  }
  .group:not(:last-child) {
    padding-block-end: 1rem;
    border-block-end: 1px solid var(--ds-components-general-border-default, #bdbdbd);
  }
  .group__title {
    margin: 0;
    font-size: 1rem;
  }
  .group__note {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--ds-components-general-foreground-secondary, #515151);
  }
  .rows {
    display: grid;
    gap: 1rem;
  }
  /* swatch | token columns */
  .color {
    display: grid;
    grid-template-columns: 4.5rem 1fr;
    gap: 1.5rem;
    align-items: start;
  }
  .swatch {
    display: grid;
    gap: 0.4rem;
    margin: 0;
    align-content: start;
  }
  .swatch__chip {
    aspect-ratio: 1;
    border-radius: var(--ds-metrics-radius-control, 0.5rem);
    border: 1px solid var(--ds-components-general-border-default, #bdbdbd);
  }
  .swatch__name {
    font-size: 0.8125rem;
    font-weight: 600;
  }
  .tokcols {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }
  .tokcol {
    display: grid;
    gap: 0.3rem;
    align-content: start;
    min-inline-size: 0;
  }
  .tokcol__h {
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ds-components-general-foreground-secondary, #515151);
  }
  .tokcol__empty {
    color: var(--ds-components-general-foreground-secondary, #515151);
    opacity: 0.5;
  }
  .token {
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
    border-radius: var(--ds-metrics-radius-control, 0.5rem);
    background: var(--ds-components-general-background-default, #e0e0e0);
    color: var(--ds-components-general-foreground-default, #272727);
    word-break: break-all;
  }

  /* Chip fills — one per color. */
  .swatch--brand-primary {
    background: var(--ds-brand-primary-default);
  }
  .swatch--brand-primary-hover {
    background: var(--ds-brand-primary-hover);
  }
  .swatch--brand-white {
    background: var(--ds-brand-white);
  }
  .swatch--brand-secondary {
    background: var(--ds-brand-secondary-default);
  }
  .swatch--brand-secondary-hover {
    background: var(--ds-brand-secondary-hover);
  }
  .swatch--info {
    background: var(--ds-feedback-info-default);
  }
  .swatch--success {
    background: var(--ds-feedback-success-default);
  }
  .swatch--warning {
    background: var(--ds-feedback-warning-default);
  }
  .swatch--danger {
    background: var(--ds-feedback-danger-default);
  }
  .swatch--danger-hover {
    background: var(--ds-feedback-danger-hover);
  }
  .swatch--neutral-0 {
    background: var(--ds-palette-grey-0);
  }
  .swatch--neutral-50 {
    background: var(--ds-palette-grey-50);
  }
  .swatch--neutral-100 {
    background: var(--ds-palette-grey-100);
  }
  .swatch--neutral-200 {
    background: var(--ds-palette-grey-200);
  }
  .swatch--neutral-300 {
    background: var(--ds-palette-grey-300);
  }
  .swatch--neutral-400 {
    background: var(--ds-palette-grey-400);
  }
  .swatch--neutral-500 {
    background: var(--ds-palette-grey-500);
  }
  .swatch--neutral-600 {
    background: var(--ds-palette-grey-600);
  }
  .swatch--neutral-700 {
    background: var(--ds-palette-grey-700);
  }
  .swatch--neutral-800 {
    background: var(--ds-palette-grey-800);
  }
  .swatch--neutral-900 {
    background: var(--ds-palette-grey-900);
  }
  .swatch--neutral-950 {
    background: var(--ds-palette-grey-950);
  }
  .swatch--brand-black {
    background: var(--ds-brand-black);
  }
</style>
