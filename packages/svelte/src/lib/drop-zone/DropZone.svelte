<script lang="ts">
  /**
   * DropZone — a drag-and-drop file area with a click-to-browse fallback.
   *
   * Built on a native `<input type="file">` so the browser owns file selection,
   * keyboard operation and form participation; the styled area is a `<label>` for
   * that input, so clicking or pressing Enter/Space on it opens the picker. A
   * `dragover` highlight gives drag feedback, and dropped files are forwarded
   * through the same `onFiles` callback as picked files.
   *
   * Themeable via `--ds-drop-zone-*`. The default prompt comes from the i18n
   * catalog (`dropZone.prompt` + the styled `dropZone.action` word); pass your
   * own content in the default slot to replace it entirely.
   */
  import { getI18n } from "../i18n/create-i18n";
  import Loading from "../loading/Loading.svelte";

  const { t } = getI18n();

  /** Accepted file types (the input's `accept` attribute), e.g. "image/*". */
  export let accept: string | undefined = undefined;
  /** Allow selecting/dropping more than one file. */
  export let multiple = false;
  export let disabled = false;
  /** Form field name (the underlying file input). */
  export let name: string | undefined = undefined;
  /** Optional grey caption under the text (e.g. accepted formats / max size). */
  export let caption: string | undefined = undefined;
  /** Called with the selected/dropped files. */
  export let onFiles: ((files: File[]) => void) | undefined = undefined;

  let dragging = false;
  let input: HTMLInputElement;

  // The native file dialog can take up to ~1s to appear (the OS builds the
  // panel). Per response-time UX (a wait past ~0.4–1s needs feedback), show a
  // loading indicator in that gap. The no-flash delay and the overlay live in
  // the shared Loading component (`delay` + `overlay`/`veil` options); here we
  // only own the trigger (the dialog opening) and the clear (the dialog closing
  // — window refocus — or a file being chosen/cancelled).
  let opening = false;

  function resolveOpen() {
    opening = false;
    if (typeof window !== "undefined") window.removeEventListener("focus", resolveOpen);
  }

  function onOpen() {
    if (disabled) return;
    opening = true;
    // `once` auto-removes it after the dialog closes (window refocus); the
    // change/cancel paths also clear it early. No lifecycle hook needed (keeps
    // the component SSR-safe).
    window.addEventListener("focus", resolveOpen, { once: true });
  }

  const emit = (list: FileList | null | undefined) => {
    if (!list || !list.length) return;
    onFiles?.(Array.from(list));
  };

  function onInput(event: Event) {
    resolveOpen();
    emit((event.currentTarget as HTMLInputElement).files);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    dragging = false;
    if (disabled) return;
    emit(event.dataTransfer?.files);
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault();
    if (!disabled) dragging = true;
  }

  function onDragLeave() {
    dragging = false;
  }
</script>

<label
  class="drop-zone"
  class:drop-zone--dragging={dragging}
  class:drop-zone--disabled={disabled}
  class:drop-zone--opening={opening}
  aria-busy={opening ? "true" : undefined}
  on:drop={onDrop}
  on:dragover={onDragOver}
  on:dragleave={onDragLeave}
>
  <input
    bind:this={input}
    class="drop-zone__input"
    type="file"
    {accept}
    {multiple}
    {disabled}
    {name}
    on:click={onOpen}
    on:cancel={resolveOpen}
    on:change={onInput}
  />
  <span class="drop-zone__icon" aria-hidden="true">
    <slot name="icon">
      <svg
        viewBox="0 0 24 24"
        width="2em"
        height="2em"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    </slot>
  </span>
  <span class="drop-zone__text">
    <slot>
      <!-- Link-like affordance only: the real interactive element is the label →
           file input, so the action word stays a non-semantic span. -->
      {$t("dropZone.prompt")} <span class="drop-zone__action">{$t("dropZone.action")}</span>
    </slot>
  </span>
  {#if caption}
    <span class="drop-zone__caption">{caption}</span>
  {/if}

  {#if opening}
    <!-- Reuse Loading's built-in delay (no flash on a fast open) + overlay;
         no veil — the OS dialog is already modal, so nothing to block here. -->
    <Loading variant="spinner" overlay veil={false} delay={150} decorative />
  {/if}
</label>

<style>
  .drop-zone {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: var(--ds-drop-zone-padding, 2rem 1.5rem);
    text-align: center;
    color: var(--ds-drop-zone-text, var(--ds-color-text-secondary, #57534e));
    background: var(--ds-drop-zone-bg, var(--ds-color-background, #fff));
    border: var(--ds-drop-zone-border-width, 2px) dashed
      var(--ds-drop-zone-border, var(--ds-color-border, #d6d3d1));
    border-radius: var(--ds-drop-zone-radius, var(--ds-radius-surface, 0.75rem));
    cursor: pointer;
    transition:
      border-color 120ms ease,
      background-color 120ms ease;
  }
  .drop-zone--dragging {
    border-color: var(--ds-color-secondary, #7b52cc);
    background: color-mix(
      in srgb,
      var(--ds-color-secondary, #7b52cc) 8%,
      var(--ds-color-background, #fff)
    );
  }
  .drop-zone--disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  /* The opening spinner is a Loading overlay (veil off); tint it and scale it
     up a little via the font-size it keys off. */
  .drop-zone--opening :global(.loading--overlay) {
    color: var(--ds-color-secondary, #7b52cc);
    font-size: 1.5rem;
  }
  .drop-zone__icon {
    /* Neutral (not the selection color) — the selection color is reserved for
       selected states; here a soft grey reads as a quiet affordance. */
    color: var(--ds-drop-zone-icon, var(--ds-color-text-secondary, #78716c));
  }
  .drop-zone__icon :global(svg) {
    inline-size: 2em;
    block-size: 2em;
  }
  /* The action word ("browse") reads as the clickable action (link-like, underlined). */
  .drop-zone__action {
    color: var(--ds-color-selected, #7b52cc);
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .drop-zone__caption {
    font-size: 0.8125rem;
    color: var(--ds-color-text-secondary, #78716c);
  }
  /* Visually hidden but focusable: focus lands on the input, ring on the label. */
  .drop-zone__input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .drop-zone:focus-within {
    border-style: solid;
    box-shadow: var(--ds-focus-ring-shadow, 0 0 0 2px var(--ds-color-focus-ring, #7b52cc));
  }
</style>
