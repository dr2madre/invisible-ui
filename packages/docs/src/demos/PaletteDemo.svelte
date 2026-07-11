<script>
  import { onMount } from "svelte";

  // Unique colors (one row each), with the tokens that resolve to them grouped
  // on the right. Fills come from classes in <style> (no inline styles); the
  // hex/rgb/hsl/raw values are read live from the rendered swatch on mount, so
  // they always match the actual theme.
  const groups = [
    {
      title: "Brand & azione",
      colors: [
        {
          cls: "brand-primary",
          varName: "--ds-brand-primary",
          name: "Green",
          tokens: ["--ds-brand-primary"],
        },
        {
          cls: "brand-secondary",
          varName: "--ds-brand-secondary",
          name: "Violet",
          tokens: [
            "--ds-brand-secondary",
            "--ds-color-primary",
            "--ds-color-secondary",
            "--ds-color-selected",
          ],
        },
        {
          cls: "brand-secondary-hover",
          varName: "--ds-brand-secondary-hover",
          name: "Violet hover",
          tokens: [
            "--ds-brand-secondary-hover",
            "--ds-color-primary-hover",
            "--ds-color-secondary-hover",
          ],
        },
      ],
    },
    {
      title: "Feedback",
      colors: [
        {
          cls: "info",
          varName: "--ds-feedback-info",
          name: "Info",
          tokens: ["--ds-feedback-info", "--ds-color-info"],
        },
        {
          cls: "success",
          varName: "--ds-feedback-success",
          name: "Success",
          tokens: ["--ds-feedback-success", "--ds-color-success"],
        },
        {
          cls: "warning",
          varName: "--ds-feedback-warning",
          name: "Warning",
          tokens: ["--ds-feedback-warning", "--ds-color-warning"],
        },
        {
          cls: "danger",
          varName: "--ds-feedback-danger",
          name: "Danger",
          tokens: ["--ds-feedback-danger", "--ds-color-danger"],
        },
        {
          cls: "danger-hover",
          varName: "--ds-feedback-danger-hover",
          name: "Danger hover",
          tokens: ["--ds-feedback-danger-hover", "--ds-color-danger-hover"],
        },
      ],
    },
    {
      title: "Interfaccia (neutrals — mapping tema chiaro)",
      colors: [
        {
          cls: "neutral-0",
          varName: "--ds-neutral-0",
          name: "Neutral 0",
          tokens: [
            "--ds-neutral-0",
            "--ds-color-background",
            "--ds-color-on-primary",
            "--ds-color-on-secondary",
            "--ds-color-on-status",
          ],
        },
        {
          cls: "neutral-50",
          varName: "--ds-neutral-50",
          name: "Neutral 50",
          tokens: ["--ds-neutral-50", "--ds-color-neutral-surface"],
        },
        {
          cls: "neutral-100",
          varName: "--ds-neutral-100",
          name: "Neutral 100",
          tokens: ["--ds-neutral-100", "--ds-color-surface"],
        },
        {
          cls: "neutral-200",
          varName: "--ds-neutral-200",
          name: "Neutral 200",
          tokens: [
            "--ds-neutral-200",
            "--ds-color-border",
            "--ds-color-surface-hover",
            "--ds-color-disabled",
            "--ds-color-neutral-border",
          ],
        },
        {
          cls: "neutral-300",
          varName: "--ds-neutral-300",
          name: "Neutral 300",
          tokens: ["--ds-neutral-300"],
        },
        {
          cls: "neutral-400",
          varName: "--ds-neutral-400",
          name: "Neutral 400",
          tokens: ["--ds-neutral-400", "--ds-color-text-disabled"],
        },
        {
          cls: "neutral-500",
          varName: "--ds-neutral-500",
          name: "Neutral 500",
          tokens: ["--ds-neutral-500", "--ds-color-neutral"],
        },
        {
          cls: "neutral-600",
          varName: "--ds-neutral-600",
          name: "Neutral 600",
          tokens: ["--ds-neutral-600", "--ds-color-text-secondary"],
        },
        {
          cls: "neutral-700",
          varName: "--ds-neutral-700",
          name: "Neutral 700",
          tokens: ["--ds-neutral-700"],
        },
        {
          cls: "neutral-800",
          varName: "--ds-neutral-800",
          name: "Neutral 800",
          tokens: ["--ds-neutral-800"],
        },
        {
          cls: "neutral-900",
          varName: "--ds-neutral-900",
          name: "Neutral 900",
          tokens: ["--ds-neutral-900", "--ds-color-text"],
        },
        {
          cls: "neutral-950",
          varName: "--ds-neutral-950",
          name: "Neutral 950",
          tokens: ["--ds-neutral-950"],
        },
      ],
    },
  ];

  let container;
  let info = {};

  const toHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  const fromComputed = (bg) => {
    const m = bg.match(/rgba?\(([^)]+)\)/);
    if (!m) return { hex: bg, rgb: bg, hsl: "" };
    const parts = m[1].split(/[ ,/]+/).map(Number);
    const [r, g, b] = parts;
    const a = parts[3];
    const hex =
      "#" +
      [r, g, b]
        .map((n) => Math.round(n).toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
    const rgb = a != null && a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
    return { hex, rgb, hsl: toHsl(r, g, b) };
  };

  onMount(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    const next = {};
    for (const chip of container.querySelectorAll(".swatch__chip")) {
      const v = chip.dataset.var;
      next[v] = {
        ...fromComputed(getComputedStyle(chip).backgroundColor),
        raw: rootStyle.getPropertyValue(v).trim(),
      };
    }
    info = next;
  });
</script>

<div class="palette" bind:this={container}>
  {#each groups as group (group.title)}
    <section class="group">
      <h3 class="group__title">{group.title}</h3>
      <div class="rows">
        {#each group.colors as color (color.varName)}
          <div class="color">
            <div
              class="color__chip swatch__chip swatch--{color.cls}"
              data-var={color.varName}
            ></div>

            <dl class="reps">
              <div class="reps__row">
                <dt>HEX</dt>
                <dd><code>{info[color.varName]?.hex ?? "—"}</code></dd>
              </div>
              <div class="reps__row">
                <dt>RGB</dt>
                <dd><code>{info[color.varName]?.rgb ?? "—"}</code></dd>
              </div>
              <div class="reps__row">
                <dt>HSL</dt>
                <dd><code>{info[color.varName]?.hsl ?? "—"}</code></dd>
              </div>
              <div class="reps__row">
                <dt>Raw</dt>
                <dd><code>{info[color.varName]?.raw ?? "—"}</code></dd>
              </div>
            </dl>

            <div class="tokens">
              {#each color.tokens as t (t)}
                <code class="token">{t}</code>
              {/each}
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
  .group__title {
    margin: 0;
    font-size: 1rem;
  }
  .rows {
    display: grid;
    gap: 0.75rem;
  }
  /* color | representations | tokens */
  .color {
    display: grid;
    grid-template-columns: 3.5rem minmax(12rem, 1fr) minmax(14rem, 1.2fr);
    gap: 1rem;
    align-items: start;
    padding-block-end: 0.75rem;
    border-block-end: 1px solid var(--ds-color-border, #e2e8f0);
  }
  .color__chip {
    block-size: 3.5rem;
    inline-size: 3.5rem;
    border-radius: var(--ds-radius-control, 0.5rem);
    border: 1px solid var(--ds-color-border, #cbd5e1);
  }
  .reps {
    display: grid;
    gap: 0.2rem;
    margin: 0;
  }
  .reps__row {
    display: grid;
    grid-template-columns: 2.5rem 1fr;
    gap: 0.5rem;
    align-items: baseline;
  }
  .reps dt {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--ds-color-text-secondary, #64748b);
  }
  .reps dd {
    margin: 0;
    min-inline-size: 0;
  }
  .reps code {
    font-size: 0.75rem;
    word-break: break-all;
  }
  .tokens {
    display: flex;
    flex-wrap: wrap;
    align-content: start;
    gap: 0.3rem;
  }
  .token {
    font-size: 0.75rem;
    padding: 0.1rem 0.4rem;
    border-radius: var(--ds-radius-control, 0.375rem);
    background: var(--ds-color-surface, #f1f5f9);
    color: var(--ds-color-text-secondary, #64748b);
  }

  /* Chip fills — one per color. */
  .swatch--brand-primary {
    background: var(--ds-brand-primary);
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
  .swatch--neutral-950 {
    background: var(--ds-neutral-950);
  }
</style>
