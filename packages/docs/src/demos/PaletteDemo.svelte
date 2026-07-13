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
        // same Dioxazine Purple, inverted. So --ds-color-secondary(-hover) sit
        // under the primary purple — there is no distinct secondary colour.
        {
          cls: "brand-primary",
          varName: "--ds-brand-primary",
          palette: "Dioxazine Purple 500",
          light: ["--ds-color-primary", "--ds-color-secondary", "--ds-color-selected"],
          dark: ["--ds-color-primary", "--ds-color-secondary", "--ds-color-selected"],
        },
        {
          cls: "brand-primary-hover",
          varName: "--ds-brand-primary-hover",
          palette: "Dioxazine Purple 600",
          light: ["--ds-color-primary-hover", "--ds-color-secondary-hover"],
          dark: ["--ds-color-primary-hover", "--ds-color-secondary-hover"],
        },
        {
          cls: "brand-white",
          varName: "--ds-brand-white",
          palette: "White",
          light: [
            "--ds-color-background",
            "--ds-color-on-primary",
            "--ds-color-on-secondary",
            "--ds-color-on-status",
          ],
          dark: ["--ds-color-on-primary", "--ds-color-on-secondary", "--ds-color-on-status"],
        },
        {
          cls: "brand-black",
          varName: "--ds-brand-black",
          palette: "Warm Grey 950",
          light: [],
          dark: [],
        },
      ],
    },
    {
      title: "Functional",
      note: "Feedback surfaces are the tinted backgrounds derived from each feedback hue via color-mix.",
      colors: [
        {
          cls: "info",
          varName: "--ds-feedback-info",
          palette: "Cobalt Blue 500",
          light: ["--ds-color-info"],
          dark: ["--ds-color-info"],
        },
        {
          cls: "success",
          varName: "--ds-feedback-success",
          palette: "Sap Green 600",
          light: ["--ds-color-success"],
          dark: ["--ds-color-success"],
        },
        {
          cls: "warning",
          varName: "--ds-feedback-warning",
          palette: "Burnt Orange 500",
          light: ["--ds-color-warning"],
          dark: ["--ds-color-warning"],
        },
        {
          cls: "danger",
          varName: "--ds-feedback-danger",
          palette: "Alizarin Red 600",
          light: ["--ds-color-danger"],
          dark: ["--ds-color-danger"],
        },
        {
          cls: "danger-hover",
          varName: "--ds-feedback-danger-hover",
          palette: "Alizarin Red 700",
          light: ["--ds-color-danger-hover"],
          dark: ["--ds-color-danger-hover"],
        },
      ],
    },
    {
      title: "Neutrals",
      colors: [
        {
          cls: "neutral-50",
          varName: "--ds-neutral-50",
          palette: "Warm Grey 50",
          light: ["--ds-color-neutral-surface", "--ds-color-on-emphasis"],
          dark: ["--ds-color-text"],
        },
        {
          cls: "neutral-100",
          varName: "--ds-neutral-100",
          palette: "Warm Grey 100",
          light: ["--ds-color-surface"],
          dark: ["--ds-color-emphasis-surface"],
        },
        {
          cls: "neutral-200",
          varName: "--ds-neutral-200",
          palette: "Warm Grey 200",
          light: [
            "--ds-color-border",
            "--ds-color-surface-hover",
            "--ds-color-disabled",
            "--ds-color-neutral-border",
          ],
          dark: ["--ds-color-neutral-text"],
        },
        {
          cls: "neutral-300",
          varName: "--ds-neutral-300",
          palette: "Warm Grey 300",
          light: [],
          dark: ["--ds-color-emphasis-border"],
        },
        {
          cls: "neutral-400",
          varName: "--ds-neutral-400",
          palette: "Warm Grey 400",
          light: ["--ds-color-text-disabled"],
          dark: ["--ds-color-text-secondary"],
        },
        {
          cls: "neutral-500",
          varName: "--ds-neutral-500",
          palette: "Warm Grey 500",
          light: ["--ds-color-neutral"],
          dark: ["--ds-color-neutral"],
        },
        {
          cls: "neutral-600",
          varName: "--ds-neutral-600",
          palette: "Warm Grey 600",
          light: ["--ds-color-text-secondary"],
          dark: ["--ds-color-text-disabled", "--ds-color-surface-hover"],
        },
        {
          cls: "neutral-700",
          varName: "--ds-neutral-700",
          palette: "Warm Grey 700",
          light: ["--ds-color-neutral-text", "--ds-color-emphasis-border"],
          dark: ["--ds-color-border", "--ds-color-surface", "--ds-color-neutral-border"],
        },
        {
          cls: "neutral-800",
          varName: "--ds-neutral-800",
          palette: "Warm Grey 800",
          light: ["--ds-color-emphasis-surface"],
          dark: ["--ds-color-disabled", "--ds-color-neutral-surface"],
        },
        {
          cls: "neutral-900",
          varName: "--ds-neutral-900",
          palette: "Warm Grey 900",
          light: ["--ds-color-text", "--ds-color-on-warning"],
          dark: ["--ds-color-background", "--ds-color-on-emphasis", "--ds-color-on-warning"],
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
    border-block-end: 1px solid var(--ds-color-border, #e2e8f0);
  }
  .group__title {
    margin: 0;
    font-size: 1rem;
  }
  .group__note {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--ds-color-text-secondary, #64748b);
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
    border-radius: var(--ds-radius-control, 0.5rem);
    border: 1px solid var(--ds-color-border, #cbd5e1);
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
    color: var(--ds-color-text-secondary, #64748b);
  }
  .tokcol__empty {
    color: var(--ds-color-text-secondary, #64748b);
    opacity: 0.5;
  }
  .token {
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
    border-radius: var(--ds-radius-control, 0.375rem);
    background: var(--ds-color-surface, #f1f5f9);
    color: var(--ds-color-text, #1c1917);
    word-break: break-all;
  }

  /* Chip fills — one per color. */
  .swatch--brand-primary {
    background: var(--ds-brand-primary);
  }
  .swatch--brand-primary-hover {
    background: var(--ds-brand-primary-hover);
  }
  .swatch--brand-white {
    background: var(--ds-brand-white);
  }
  .swatch--brand-secondary {
    background: var(--ds-brand-secondary);
  }
  .swatch--brand-secondary-hover {
    background: var(--ds-brand-secondary-hover);
  }
  .swatch--info {
    background: var(--ds-feedback-info);
  }
  .swatch--success {
    background: var(--ds-feedback-success);
  }
  .swatch--warning {
    background: var(--ds-feedback-warning);
  }
  .swatch--danger {
    background: var(--ds-feedback-danger);
  }
  .swatch--danger-hover {
    background: var(--ds-feedback-danger-hover);
  }
  .swatch--neutral-0 {
    background: var(--ds-neutral-0);
  }
  .swatch--neutral-50 {
    background: var(--ds-neutral-50);
  }
  .swatch--neutral-100 {
    background: var(--ds-neutral-100);
  }
  .swatch--neutral-200 {
    background: var(--ds-neutral-200);
  }
  .swatch--neutral-300 {
    background: var(--ds-neutral-300);
  }
  .swatch--neutral-400 {
    background: var(--ds-neutral-400);
  }
  .swatch--neutral-500 {
    background: var(--ds-neutral-500);
  }
  .swatch--neutral-600 {
    background: var(--ds-neutral-600);
  }
  .swatch--neutral-700 {
    background: var(--ds-neutral-700);
  }
  .swatch--neutral-800 {
    background: var(--ds-neutral-800);
  }
  .swatch--neutral-900 {
    background: var(--ds-neutral-900);
  }
  .swatch--brand-black {
    background: var(--ds-brand-black);
  }
</style>
