<script>
  // Tokens page: colors grouped by FUNCTION (Brand / Functional / Neutrals).
  // Each row shows the color name plus the tokens that resolve to it — Base
  // token, and the semantic --iui-color-* per theme (a token appears in both
  // Light and Dark when it resolves to this color in both). Fills are static
  // classes (no inline styles). The full swatch (with HEX/OKLCH) lives in the
  // reusable ColorSwatch component.
  const groups = [
    {
      title: "Brand",
      colors: [
        // "secondary" is a function, not a colour: the secondary button is the
        // same Dioxazine Purple, inverted. So --iui-components-general-action-secondary-background-default(-hover) sit
        // under the primary purple — there is no distinct secondary colour.
        {
          cls: "brand-primary",
          varName: "--iui-colors-brand-primary-default",
          palette: "Dioxazine Purple 500",
          light: [
            "--iui-components-general-action-primary-background-default",
            "--iui-components-general-action-secondary-background-default",
            "--iui-components-general-selection-background-default",
          ],
          dark: [
            "--iui-components-general-action-primary-background-default",
            "--iui-components-general-action-secondary-background-default",
            "--iui-components-general-selection-background-default",
          ],
        },
        {
          cls: "brand-primary-hover",
          varName: "--iui-colors-brand-primary-hover",
          palette: "Dioxazine Purple 600",
          light: [
            "--iui-components-general-action-primary-background-hover",
            "--iui-components-general-action-secondary-background-hover",
          ],
          dark: [
            "--iui-components-general-action-primary-background-hover",
            "--iui-components-general-action-secondary-background-hover",
          ],
        },
        {
          cls: "brand-white",
          varName: "--iui-brand-white",
          palette: "White",
          light: [
            "--iui-components-general-background-default",
            "--iui-components-general-action-primary-foreground-default",
            "--iui-components-general-action-secondary-foreground-default",
            "--iui-components-general-feedback-solid-foreground-default",
            "--iui-components-page-background-default",
            "--iui-components-card-background-default",
            "--iui-components-dialog-background-default",
            "--iui-components-popover-background-default",
            "--iui-components-menu-background-default",
            "--iui-components-sidebar-background-default",
          ],
          dark: [
            "--iui-components-general-action-primary-foreground-default",
            "--iui-components-general-action-secondary-foreground-default",
            "--iui-components-general-feedback-solid-foreground-default",
          ],
        },
        {
          cls: "brand-black",
          varName: "--iui-brand-black",
          palette: "Black",
          light: [],
          dark: [
            "--iui-components-page-background-default",
            "--iui-components-sidebar-background-default",
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
          varName: "--iui-colors-feedback-info-default",
          palette: "Cobalt Blue 500",
          light: ["--iui-components-general-feedback-info-solid-background-default"],
          dark: ["--iui-components-general-feedback-info-solid-background-default"],
        },
        {
          cls: "success",
          varName: "--iui-colors-feedback-success-default",
          palette: "Sap Green 600",
          light: ["--iui-components-general-feedback-success-solid-background-default"],
          dark: ["--iui-components-general-feedback-success-solid-background-default"],
        },
        {
          cls: "warning",
          varName: "--iui-colors-feedback-warning-default",
          palette: "Burnt Orange 500",
          light: ["--iui-components-general-feedback-warning-solid-background-default"],
          dark: ["--iui-components-general-feedback-warning-solid-background-default"],
        },
        {
          cls: "danger",
          varName: "--iui-colors-feedback-danger-default",
          palette: "Alizarin Red 600",
          light: ["--iui-components-general-feedback-danger-solid-background-default"],
          dark: ["--iui-components-general-feedback-danger-solid-background-default"],
        },
        {
          cls: "danger-hover",
          varName: "--iui-colors-feedback-danger-hover",
          palette: "Alizarin Red 700",
          light: ["--iui-components-general-feedback-danger-solid-background-hover"],
          dark: ["--iui-components-general-feedback-danger-solid-background-hover"],
        },
      ],
    },
    {
      title: "Neutrals",
      colors: [
        {
          cls: "neutral-50",
          varName: "--iui-colors-palette-grey-50",
          palette: "Grey 50",
          light: [
            "--iui-components-general-feedback-neutral-background-default",
            "--iui-components-general-emphasis-foreground-default",
            "--iui-components-card-secondary-background-default",
            "--iui-components-code-block-background-default",
          ],
          dark: ["--iui-components-general-foreground-default"],
        },
        {
          cls: "neutral-100",
          varName: "--iui-colors-palette-grey-100",
          palette: "Grey 100",
          light: [
            "--iui-components-avatar-background-default",
            "--iui-components-switch-background-default",
          ],
          dark: ["--iui-components-general-emphasis-background-default"],
        },
        {
          cls: "neutral-200",
          varName: "--iui-colors-palette-grey-200",
          palette: "Grey 200",
          light: [
            "--iui-components-general-border-default",
            "--iui-components-general-background-disabled",
            "--iui-components-general-feedback-neutral-border-default",
          ],
          dark: ["--iui-components-general-feedback-neutral-foreground-default"],
        },
        {
          cls: "neutral-300",
          varName: "--iui-colors-palette-grey-300",
          palette: "Grey 300",
          light: [],
          dark: [
            "--iui-components-general-emphasis-border-default",
            "--iui-components-general-foreground-secondary",
          ],
        },
        {
          cls: "neutral-400",
          varName: "--iui-colors-palette-grey-400",
          palette: "Grey 400",
          light: ["--iui-components-general-foreground-disabled"],
          dark: [],
        },
        {
          cls: "neutral-500",
          varName: "--iui-colors-palette-grey-500",
          palette: "Grey 500",
          light: ["--iui-components-general-feedback-neutral-solid-background-default"],
          dark: ["--iui-components-general-feedback-neutral-solid-background-default"],
        },
        {
          cls: "neutral-600",
          varName: "--iui-colors-palette-grey-600",
          palette: "Grey 600",
          light: ["--iui-components-general-foreground-secondary"],
          dark: ["--iui-components-general-foreground-disabled"],
        },
        {
          cls: "neutral-700",
          varName: "--iui-colors-palette-grey-700",
          palette: "Grey 700",
          light: [
            "--iui-components-general-feedback-neutral-foreground-default",
            "--iui-components-general-emphasis-border-default",
          ],
          dark: [
            "--iui-components-general-border-default",
            "--iui-components-avatar-background-default",
            "--iui-components-general-feedback-neutral-border-default",
          ],
        },
        {
          cls: "neutral-800",
          varName: "--iui-colors-palette-grey-800",
          palette: "Grey 800",
          light: ["--iui-components-general-emphasis-background-default"],
          dark: [
            "--iui-components-general-background-disabled",
            "--iui-components-general-feedback-neutral-background-default",
          ],
        },
        {
          cls: "neutral-900",
          varName: "--iui-colors-palette-grey-900",
          palette: "Grey 900",
          light: [
            "--iui-components-general-foreground-default",
            "--iui-components-general-feedback-warning-solid-foreground-default",
          ],
          dark: [
            "--iui-components-general-background-default",
            "--iui-components-general-emphasis-foreground-default",
            "--iui-components-general-feedback-warning-solid-foreground-default",
            "--iui-components-card-secondary-background-default",
          ],
        },
        {
          cls: "neutral-950",
          varName: "--iui-colors-palette-grey-950",
          palette: "Grey 950",
          light: [],
          dark: [
            "--iui-components-card-background-default",
            "--iui-components-dialog-background-default",
            "--iui-components-popover-background-default",
            "--iui-components-menu-background-default",
            "--iui-components-code-block-background-default",
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
    border-block-end: 1px solid var(--iui-components-general-border-default, #bdbdbd);
  }
  .group__title {
    margin: 0;
    font-size: 1rem;
  }
  .group__note {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--iui-components-general-foreground-secondary, #515151);
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
    border-radius: var(--iui-metrics-radius-control, 0.5rem);
    border: 1px solid var(--iui-components-general-border-default, #bdbdbd);
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
    color: var(--iui-components-general-foreground-secondary, #515151);
  }
  .tokcol__empty {
    color: var(--iui-components-general-foreground-secondary, #515151);
    opacity: 0.5;
  }
  .token {
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
    border-radius: var(--iui-metrics-radius-control, 0.5rem);
    background: var(--iui-components-general-background-default, #e0e0e0);
    color: var(--iui-components-general-foreground-default, #272727);
    word-break: break-all;
  }

  /* Chip fills — one per color. */
  .swatch--brand-primary {
    background: var(--iui-colors-brand-primary-default);
  }
  .swatch--brand-primary-hover {
    background: var(--iui-colors-brand-primary-hover);
  }
  .swatch--brand-white {
    background: var(--iui-brand-white);
  }
  .swatch--brand-secondary {
    background: var(--iui-colors-brand-secondary-default);
  }
  .swatch--brand-secondary-hover {
    background: var(--iui-colors-brand-secondary-hover);
  }
  .swatch--info {
    background: var(--iui-colors-feedback-info-default);
  }
  .swatch--success {
    background: var(--iui-colors-feedback-success-default);
  }
  .swatch--warning {
    background: var(--iui-colors-feedback-warning-default);
  }
  .swatch--danger {
    background: var(--iui-colors-feedback-danger-default);
  }
  .swatch--danger-hover {
    background: var(--iui-colors-feedback-danger-hover);
  }
  .swatch--neutral-0 {
    background: var(--iui-colors-palette-grey-0);
  }
  .swatch--neutral-50 {
    background: var(--iui-colors-palette-grey-50);
  }
  .swatch--neutral-100 {
    background: var(--iui-colors-palette-grey-100);
  }
  .swatch--neutral-200 {
    background: var(--iui-colors-palette-grey-200);
  }
  .swatch--neutral-300 {
    background: var(--iui-colors-palette-grey-300);
  }
  .swatch--neutral-400 {
    background: var(--iui-colors-palette-grey-400);
  }
  .swatch--neutral-500 {
    background: var(--iui-colors-palette-grey-500);
  }
  .swatch--neutral-600 {
    background: var(--iui-colors-palette-grey-600);
  }
  .swatch--neutral-700 {
    background: var(--iui-colors-palette-grey-700);
  }
  .swatch--neutral-800 {
    background: var(--iui-colors-palette-grey-800);
  }
  .swatch--neutral-900 {
    background: var(--iui-colors-palette-grey-900);
  }
  .swatch--neutral-950 {
    background: var(--iui-colors-palette-grey-950);
  }
  .swatch--brand-black {
    background: var(--iui-brand-black);
  }
</style>
