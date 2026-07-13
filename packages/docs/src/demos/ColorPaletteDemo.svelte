<script>
  import SegmentedControl from "@design-system/svelte/SegmentedControl.svelte";
  import Tag from "@design-system/svelte/Tag.svelte";
  import Icon from "@design-system/svelte/Icon.svelte";

  // Color palette (materialui.co-style): tint columns × shade rows. Click a cell
  // to copy its value in the selected format. Values from the maintainer's SVG.
  // Cell fills come from a generated <style> block (data-driven, no inline
  // styles); empty shades render as blank cells.
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

  const hues = [
    {
      key: "pink",
      name: "Magenta Pink",
      hex: {
        50: "#FAECF5",
        100: "#EFC7E2",
        200: "#E5A1CE",
        300: "#E67FC4",
        400: "#E65CB8",
        500: "#D54DA8",
        600: "#BE3B92",
        700: "#AB2E82",
        800: "#881A63",
        900: "#6A0F4C",
        950: "#500537",
      },
    },
    {
      key: "red",
      name: "Alizarin Red",
      hex: {
        50: "#FAECEE",
        100: "#EFC7CD",
        200: "#E5A1AC",
        300: "#E67F90",
        400: "#E65C73",
        500: "#D54D63",
        600: "#BE3B50",
        700: "#AB2E42",
        800: "#881A2B",
        900: "#6A0F1D",
        950: "#4E0410",
      },
    },
    {
      key: "orange",
      name: "Burnt Orange",
      hex: {
        50: "#FAEBE1",
        100: "#F7DDCC",
        200: "#EEBB99",
        300: "#E7A071",
        400: "#DD7734",
        500: "#C96422",
        600: "#BC5716",
        700: "#A4460A",
        800: "#873602",
        900: "#582200",
        950: "#3E1800",
      },
    },
    {
      key: "yellow",
      name: "Naples Yellow",
      hex: {
        50: "#FFFAE7",
        100: "#FEF0B6",
        200: "#FEE285",
        300: "#F9D574",
        400: "#E8BA4F",
        500: "#DFA124",
        600: "#C8830C",
        700: "#AD6B08",
        800: "#915200",
        900: "#633501",
        950: "#432400",
      },
    },
    {
      key: "lime",
      name: "Lime Green",
      hex: {
        50: "#F9FBE7",
        100: "#F0F4C3",
        200: "#E6EE9C",
        300: "#DCE775",
        400: "#C8D547",
        500: "#ADBB23",
        600: "#8A9613",
        700: "#6F790B",
        800: "#545C05",
        900: "#363D02",
        950: "#262B00",
      },
    },
    {
      key: "green",
      name: "Sap Green",
      hex: {
        50: "#EAF5E4",
        100: "#C6E3B7",
        200: "#AAD693",
        300: "#94C37D",
        400: "#73A958",
        500: "#508B32",
        600: "#3E7523",
        700: "#306217",
        800: "#224D0C",
        900: "#143404",
        950: "#0D2301",
      },
    },
    {
      key: "teal",
      name: "Viridian Green",
      hex: {
        50: "#E6F5F3",
        100: "#B3E0DC",
        200: "#80CBC4",
        300: "#4DB6AC",
        400: "#26A69A",
        500: "#00897B",
        600: "#007265",
        700: "#005D50",
        800: "#014439",
        900: "#00352C",
        950: "#00241E",
      },
    },
    {
      key: "sky",
      name: "Cerulean Blue",
      hex: {
        50: "#E1F5FE",
        100: "#B2DEF2",
        200: "#8ACCEA",
        300: "#63B9E1",
        400: "#3DA4D4",
        500: "#2790C1",
        600: "#197AA7",
        700: "#0E668F",
        800: "#054664",
        900: "#033349",
        950: "#00202E",
      },
    },
    {
      key: "blue",
      name: "Cobalt Blue",
      hex: {
        50: "#E9EEFA",
        100: "#BCCDF1",
        200: "#8FACE8",
        300: "#6B8FD7",
        400: "#527ACC",
        500: "#4067B6",
        600: "#3A5CA0",
        700: "#324D83",
        800: "#273B65",
        900: "#1D2D4D",
        950: "#0F1B34",
      },
    },
    {
      key: "purple",
      name: "Dioxazine Purple",
      hex: {
        50: "#F1ECFA",
        100: "#D4C7EF",
        200: "#B8A1E6",
        300: "#A284DD",
        400: "#8D6AD4",
        500: "#7A52CC",
        600: "#6840B7",
        700: "#563795",
        800: "#442780",
        900: "#34186E",
        950: "#230A56",
      },
    },
    {
      key: "grey",
      name: "Grey",
      hex: {
        50: "#F5F5F5",
        100: "#E0E0E0",
        200: "#BDBDBD",
        300: "#9E9E9E",
        400: "#757575",
        500: "#616161",
        600: "#515151",
        700: "#414141",
        800: "#323232",
        900: "#272727",
        950: "#1B1B1B",
      },
    },
    {
      key: "stone",
      name: "Warm Grey",
      hex: {
        50: "#F4F2EF",
        100: "#E6E0D8",
        200: "#C7C1B7",
        300: "#A8A297",
        400: "#757067",
        500: "#5E5951",
        600: "#524C44",
        700: "#413C36",
        800: "#332F2A",
        900: "#282420",
        950: "#1C1915",
      },
    },
  ];

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

  // White is not a shade in any hue column, so it lives apart among the neutrals.
  const white = "#FFFFFF";

  let fmt = "hex";
  let copiedKey = null;
  let copiedValue = "";
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

  const isLight = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b > 150;
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
    {#each hues as hue (hue.key)}
      <div class="hue-h">{hue.name}</div>
    {/each}

    {#each shades as s (s)}
      {#each hues as hue (hue.key)}
        {#if hue.hex[s]}
          <button
            type="button"
            class="cell dspal--{hue.key}-{s}"
            class:cell--ondark={!isLight(hue.hex[s])}
            aria-label={`${hue.name} ${s} ${hue.hex[s]} — click to copy`}
            title={hue.hex[s]}
            on:click={() => copy(hue.hex[s], `${hue.key}-${s}`)}
          >
            <span class="cell__n">{s}</span>
            {#if copiedKey === `${hue.key}-${s}`}
              <span class="cell__toast">
                <Tag status="neutral" variant="solid">
                  <Icon slot="icon"><path d="M20 6 9 17l-5-5" /></Icon>
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
        on:click={() => copy(white, "white")}
      >
        {#if copiedKey === "white"}
          <span class="cell__toast">
            <Tag status="neutral" variant="solid">
              <Icon slot="icon"><path d="M20 6 9 17l-5-5" /></Icon>
              Copied to clipboard
            </Tag>
          </span>
        {/if}
      </button>
      <figcaption class="extra__name">White</figcaption>
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
    color: var(--ds-color-text-secondary, #64748b);
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
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 0;
    inline-size: 100%;
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
    color: #1c1917;
  }
  .cell--ondark {
    color: #ffffff;
  }
  .cell__n {
    font-size: 0.6875rem;
    font-weight: 600;
  }
  .cell:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
  }
  .cell--empty {
    background: transparent;
    cursor: default;
    border: 1px dashed var(--ds-color-border, #e2e8f0);
  }

  /* White lives apart from the shade grid, among the neutrals. */
  .extras {
    display: grid;
    gap: 0.5rem;
    justify-items: start;
  }
  .extras__label {
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ds-color-text-secondary, #64748b);
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
    border: 1px solid var(--ds-color-border, #e2e8f0);
    color: #1c1917;
  }
</style>
