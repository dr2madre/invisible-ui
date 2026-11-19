<script>
  import tokens from "../../../tokens/tokens.json";
  import SegmentedControl from "@invisible-ui/svelte/SegmentedControl.svelte";
  import Tag from "@invisible-ui/svelte/Tag.svelte";
  import Icon from "@invisible-ui/svelte/Icon.svelte";

  // Color palette (materialui.co-style): tint columns × shade rows. Click a cell
  // to copy its value in the selected format. Values from the maintainer's SVG.
  // Cell fills come from a generated <style> block (data-driven, no inline
  // styles); empty shades render as blank cells.
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

  const hues = [
    { key: "pink", name: "Magenta Pink", family: "magenta-pink" },
    { key: "red", name: "Alizarin Red", family: "alizarin-red" },
    { key: "orange", name: "Burnt Orange", family: "burnt-orange" },
    { key: "yellow", name: "Naples Yellow", family: "naples-yellow" },
    { key: "lime", name: "Lime Green", family: "lime-green" },
    { key: "green", name: "Sap Green", family: "sap-green" },
    { key: "teal", name: "Viridian Green", family: "viridian-green" },
    { key: "sky", name: "Cerulean Blue", family: "cerulean-blue" },
    { key: "blue", name: "Cobalt Blue", family: "cobalt-blue" },
    { key: "purple", name: "Dioxazine Purple", family: "dioxazine-purple" },
    { key: "grey", name: "Grey", family: "grey" },
    { key: "stone", name: "Warm Grey", family: "warm-grey" },
  ].map(({ key, name, family }) => ({
    key,
    name,
    hex: Object.fromEntries(
      shades.map((shade) => [shade, tokens.palette[family][shade].$value.toUpperCase()]),
    ),
  }));

  // Per-cell fills as a generated stylesheet (kept out of inline styles).
  const cellStyles =
    "<style>" +
    hues
      .map((h) =>
        shades
          .map((s) => (h.hex[s] ? `.dspal--${h.key}-${s}{background:${h.hex[s]}}` : ""))
          .join(""),
      )
      .join("") +
    "</style>";

  const formats = [
    { value: "hex", label: "HEX" },
    { value: "hexHash", label: "#HEX" },
    { value: "rgb", label: "RGB" },
    { value: "oklch", label: "OKLCH" },
  ];

  // White and Black are not shades in any hue column, so they live apart among
  // the neutrals.
  const white = "#FFFFFF";
  const black = "#121212";

  let fmt = $state("hex");
  let copiedKey = $state(null);
  let copiedValue = $state("");
  let copyTimer;

  const toOklch = (r, g, b) => {
    const lin = (c) => {
      c /= 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const R = lin(r);
    const G = lin(g);
    const B = lin(b);
    const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
    const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
    const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    const C = Math.sqrt(A * A + Bb * Bb);
    let H = (Math.atan2(Bb, A) * 180) / Math.PI;
    if (H < 0) H += 360;
    return `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${H.toFixed(1)})`;
  };

  const format = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    if (fmt === "hex") return hex.slice(1).toUpperCase();
    if (fmt === "hexHash") return hex.toUpperCase();
    if (fmt === "rgb") return `rgb(${r}, ${g}, ${b})`;
    return toOklch(r, g, b);
  };

  const copy = async (hex, key) => {
    const value = format(hex);
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard may be unavailable; still surface the value */
    }
    copiedKey = key;
    copiedValue = value;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copiedKey = null), 2000);
  };
</script>

<svelte:head>
  <!-- cellStyles is built from the static hue table above, no user input — safe. -->
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html cellStyles}
</svelte:head>

<div class="palette">
  <div class="toolbar">
    <span class="toolbar__label">Copy as</span>
    <SegmentedControl
      label="Copy format"
      hideLabel
      value={fmt}
      items={formats}
      onValueChange={(v) => (fmt = v)}
    />
    <span class="sr-only" aria-live="polite">{copiedKey ? `Copied ${copiedValue}` : ""}</span>
  </div>

  <div class="grid">
    <div class="hue-h" aria-hidden="true"></div>
    {#each hues as hue (hue.key)}
      <div class="hue-h">{hue.name}</div>
    {/each}

    {#each shades as s (s)}
      <div class="shade-h">{s}</div>
      {#each hues as hue (hue.key)}
        {#if hue.hex[s]}
          <button
            type="button"
            class="cell dspal--{hue.key}-{s}"
            aria-label={`${hue.name} ${s} ${hue.hex[s]}, click to copy`}
            title={hue.hex[s]}
            onclick={() => copy(hue.hex[s], `${hue.key}-${s}`)}
          >
            {#if copiedKey === `${hue.key}-${s}`}
              <span class="cell__toast">
                <Tag status="neutral" variant="solid">
                  {#snippet icon()}<Icon><path d="M20 6 9 17l-5-5" /></Icon>{/snippet}
                  Copied to clipboard
                </Tag>
              </span>
            {/if}
          </button>
        {:else}
          <div class="cell cell--empty" aria-hidden="true"></div>
        {/if}
      {/each}
    {/each}
  </div>

  <div class="extras">
    <span class="extras__label">Neutrals</span>
    <figure class="extra">
      <button
        type="button"
        class="cell cell--white"
        aria-label={`White ${white} — click to copy`}
        title={white}
        onclick={() => copy(white, "white")}
      >
        {#if copiedKey === "white"}
          <span class="cell__toast">
            <Tag status="neutral" variant="solid">
              {#snippet icon()}<Icon><path d="M20 6 9 17l-5-5" /></Icon>{/snippet}
              Copied to clipboard
            </Tag>
          </span>
        {/if}
      </button>
      <figcaption class="extra__name">White</figcaption>
    </figure>
    <figure class="extra">
      <button
        type="button"
        class="cell cell--black"
        aria-label={`Black ${black} — click to copy`}
        title={black}
        onclick={() => copy(black, "black")}
      >
        {#if copiedKey === "black"}
          <span class="cell__toast">
            <Tag status="neutral" variant="solid">
              {#snippet icon()}<Icon><path d="M20 6 9 17l-5-5" /></Icon>{/snippet}
              Copied to clipboard
            </Tag>
          </span>
        {/if}
      </button>
      <figcaption class="extra__name">Black</figcaption>
    </figure>
  </div>
</div>

<style>
  .palette {
    display: grid;
    gap: 1rem;
    inline-size: 100%;
    margin-inline: auto;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    /* Compact the format SegmentedControl: smaller inner padding. */
    --ds-segment-padding: 0.25rem 0.6rem;
  }
  .toolbar :global(.segment__label) {
    font-size: 0.875rem; /* 14px */
  }
  .toolbar__label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--ds-components-general-foreground-secondary, #515151);
  }
  .cell__toast {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
    pointer-events: none;
    /* 14px label text via the Tag's own size token. */
    --ds-tag-font-size: 0.875rem;
  }
  /* Black "Copied" chip — more specific than the Tag's neutral-solid rule. */
  .cell__toast :global(.tag[data-variant="solid"][data-status="neutral"]) {
    background: #000;
    color: #fff;
  }
  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .grid {
    display: grid;
    grid-template-columns: auto repeat(12, minmax(0, 1fr));
    gap: 0;
    inline-size: 100%;
  }
  .shade-h {
    display: flex;
    align-items: center;
    justify-content: end;
    padding-inline-end: 0.4rem;
    font-size: 0.6875rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--ds-components-general-foreground-secondary, #515151);
  }
  .hue-h {
    text-align: center;
    font-size: 0.6875rem;
    font-weight: 600;
    line-height: 1.15;
    padding-block-end: 0.25rem;
  }
  .cell {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    padding: 0;
    border: 0;
    cursor: pointer;
  }
  .cell:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
  }
  .cell--empty {
    background: transparent;
    cursor: default;
    border: 1px dashed var(--ds-components-general-border-default, #bdbdbd);
  }

  /* White and Black live apart from the shade grid, among the neutrals. */
  .extras {
    display: grid;
    grid-template-columns: repeat(2, max-content);
    gap: 0.5rem 1rem;
    justify-items: start;
  }
  .extras__label {
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ds-components-general-foreground-secondary, #515151);
    grid-column: 1 / -1;
  }
  .extra {
    display: grid;
    gap: 0.3rem;
    margin: 0;
    justify-items: center;
  }
  .extra__name {
    font-size: 0.6875rem;
    font-weight: 600;
  }
  .cell--white {
    inline-size: 4rem;
    background: #ffffff;
    border: 1px solid var(--ds-components-general-border-default, #bdbdbd);
    color: #1b1b1b;
  }
  .cell--black {
    inline-size: 4rem;
    background: #121212;
    border: 1px solid var(--ds-components-general-border-default, #bdbdbd);
    color: #f5f5f5;
  }
</style>
