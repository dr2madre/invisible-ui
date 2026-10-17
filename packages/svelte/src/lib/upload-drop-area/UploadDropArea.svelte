<script lang="ts">
  /**
   * UploadDropArea — a drag-and-drop file area with a click-to-browse fallback.
   *
   * Built on a native `<input type="file">` so the browser owns file selection,
   * keyboard operation and form participation; the styled area is a `<label>` for
   * that input, so clicking or pressing Enter/Space on it opens the picker. A
   * `dragover` highlight gives drag feedback, and dropped files are forwarded
   * through the same `onFiles` callback as picked files. Both go through the
   * same `accept` filter; the files it leaves out are named in an alert under
   * the area and reported to `onRejected`.
   *
   * Themeable via `--ds-upload-drop-area-*`. The default prompt comes from the i18n
   * catalog (`uploadDropArea.prompt` + the styled `uploadDropArea.action` word); pass your
   * own content as the `children` snippet to replace it entirely.
   */
  import { uploadDropArea } from "@invisible-ui/core";
  import type { Snippet } from "svelte";
  import type { Action } from "svelte/action";
  import { dropArea } from "../drop-area/drop-area";
  import { getI18n } from "../i18n/create-i18n";
  import Icon from "../icon/Icon.svelte";
  import { stableId } from "../internal/stable-id";
  import Loading from "../loading/Loading.svelte";

  type UploadRejection = uploadDropArea.UploadRejection;

  const { t } = getI18n();

  interface Props {
    /**
     * Accepted file types (the input's `accept` attribute), e.g. "image/*".
     * Picked and dropped files go through the same filter; the files it
     * leaves out are named in a message under the area and reported to
     * `onRejected`. The filter is a convenience: the app still validates the
     * files it receives.
     */
    accept?: string;
    /** Allow selecting/dropping more than one file. */
    multiple?: boolean;
    disabled?: boolean;
    /** Form field name (the underlying file input). */
    name?: string;
    /** Optional grey caption under the text (e.g. accepted formats / max size). */
    caption?: string;
    /** Called with the selected or dropped files the area takes. */
    onFiles?: (files: File[]) => void;
    /**
     * Called with the files the area left out: a type `accept` does not name,
     * or a file beyond the first in an area without `multiple`.
     */
    onRejected?: (rejected: UploadRejection[]) => void;
    /** Replaces the default prompt text. */
    children?: Snippet;
    /** Replaces the built-in upload icon. */
    icon?: Snippet;
  }

  let {
    accept,
    multiple = false,
    disabled = false,
    name,
    caption,
    onFiles,
    onRejected,
    children,
    icon,
  }: Props = $props();

  const rejectedId = `${stableId("ds-upload-drop-area")}-rejected`;
  // Each batch gets its own key, so the same rejection twice is a new alert.
  let rejection = $state.raw<{ batch: number; files: UploadRejection[] }>({ batch: 0, files: [] });

  let input: HTMLInputElement | undefined;

  // The native file dialog can take up to ~1s to appear (the OS builds the
  // panel). Per response-time UX (a wait past ~0.4–1s needs feedback), show a
  // loading indicator in that gap. The no-flash delay and the overlay live in
  // the shared Loading component (`delay` + `overlay`/`veil` options); here we
  // only own the trigger (the dialog opening) and the clear (the dialog closing
  // — window refocus — or a file being chosen/cancelled).
  let opening = $state(false);

  function resolveOpen() {
    opening = false;
    if (typeof window !== "undefined") window.removeEventListener("focus", resolveOpen);
  }

  function onOpen() {
    if (disabled) return;
    opening = true;
    // `once` removes it when the window is focused again, and the
    // change/cancel paths clear it early: neither happens if the component
    // goes away while the picker is still open, so unmounting clears it too.
    window.addEventListener("focus", resolveOpen, { once: true });
  }

  // An action (not a lifecycle hook) keeps this client-only and SSR-safe: a
  // picker left open when the area goes away drops its listener here.
  const dropListener: Action = () => ({ destroy: resolveOpen });

  // Picked and dropped files go through the same filter. The input holds the
  // files the area takes, so they submit and a form reset clears them; a drop
  // with none to take leaves the input as it was.
  const take = (files: File[], dropped: boolean) => {
    const { accepted, rejected } = uploadDropArea.splitFiles(files, { accept, multiple });
    if (input && (dropped ? accepted.length > 0 : rejected.length > 0)) {
      if (accepted.length === 0) input.value = "";
      else if (typeof DataTransfer !== "undefined") {
        const transfer = new DataTransfer();
        for (const file of accepted) transfer.items.add(file);
        input.files = transfer.files;
      }
    }
    rejection = { batch: rejection.batch + 1, files: rejected };
    if (rejected.length > 0) onRejected?.(rejected);
    if (accepted.length > 0) onFiles?.(accepted);
  };

  function onInput(event: Event) {
    resolveOpen();
    const files = Array.from((event.currentTarget as HTMLInputElement).files ?? []);
    if (files.length > 0) take(files, false);
  }
</script>

<!-- The drag target is the generic dropArea action (shared, Tree-ready); this
     component adds the upload business: the file input and its picker. -->
<label
  use:dropListener
  class={[
    "upload-drop-area",
    disabled && "upload-drop-area--disabled",
    opening && "upload-drop-area--opening",
  ]}
  aria-busy={opening ? "true" : undefined}
  use:dropArea={{ disabled, onDrop: (data) => take(Array.from(data.files), true) }}
>
  <input
    bind:this={input}
    class="upload-drop-area__input"
    type="file"
    {accept}
    {multiple}
    {disabled}
    {name}
    aria-describedby={rejection.files.length > 0 ? rejectedId : undefined}
    onclick={onOpen}
    oncancel={resolveOpen}
    onchange={onInput}
  />
  <span class="upload-drop-area__icon" aria-hidden="true">
    {#if icon}
      {@render icon()}
    {:else}
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
    {/if}
  </span>
  <span class="upload-drop-area__text">
    {#if children}
      {@render children()}
    {:else}
      <!-- Link-like affordance only: the real interactive element is the label →
           file input, so the action word stays a non-semantic span. -->
      {$t("uploadDropArea.prompt")}
      <span class="upload-drop-area__action">{$t("uploadDropArea.action")}</span>
    {/if}
  </span>
  {#if caption}
    <span class="upload-drop-area__caption">{caption}</span>
  {/if}

  {#if opening}
    <!-- Reuse Loading's built-in delay (no flash on a fast open) + overlay;
         no veil — the OS dialog is already modal, so nothing to block here. -->
    <Loading variant="spinner" overlay veil={false} delay={150} decorative />
  {/if}
</label>
{#key rejection.batch}
  {#if rejection.files.length > 0}
    <!-- Outside the label, so it never joins the input's name; announced when
         it appears, with the hazard glyph so it never relies on color. -->
    <div id={rejectedId} class="upload-drop-area__rejected" role="alert">
      {#each rejection.files as { file, reason }, index (index)}
        <p class="field__error field__message">
          <span class="field__msg-icon" aria-hidden="true">
            <Icon size="1em">
              <path
                d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12" y2="17" />
            </Icon>
          </span>
          {$t(reason === "type" ? "uploadDropArea.rejectedType" : "uploadDropArea.rejectedCount", {
            name: file.name,
          })}
        </p>
      {/each}
    </div>
  {/if}
{/key}

<style>
  .upload-drop-area {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: var(--ds-upload-drop-area-padding, 2rem 1.5rem);
    text-align: center;
    color: var(--ds-upload-drop-area-text, var(--ds-color-text-secondary, #515151));
    background: var(--ds-upload-drop-area-bg, var(--ds-color-background, #fff));
    border: var(--ds-upload-drop-area-border-width, 2px) dashed
      var(--ds-upload-drop-area-border, var(--ds-color-control-border, #757575));
    border-radius: var(--ds-upload-drop-area-radius, var(--ds-radius-surface, 0.75rem));
    cursor: pointer;
    transition:
      border-color 120ms ease,
      background-color 120ms ease;
  }
  .upload-drop-area:global([data-dragover]) {
    border-color: var(--ds-color-secondary, #7a52cc);
    background: color-mix(
      in srgb,
      var(--ds-color-secondary, #7a52cc) 8%,
      var(--ds-color-background, #fff)
    );
  }
  .upload-drop-area--disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  /* The opening spinner is a Loading overlay (veil off); tint it and scale it
     up a little via the font-size it keys off. */
  .upload-drop-area--opening :global(.loading--overlay) {
    color: var(--ds-color-secondary, #7a52cc);
    font-size: 1.5rem;
  }
  .upload-drop-area__icon {
    /* Neutral (not the selection color) — the selection color is reserved for
       selected states; here a soft grey reads as a quiet affordance. */
    color: var(--ds-upload-drop-area-icon, var(--ds-color-text-secondary, #515151));
  }
  .upload-drop-area__icon :global(svg) {
    inline-size: 2em;
    block-size: 2em;
  }
  /* The action word ("browse") reads as the clickable action (link-like, underlined). */
  .upload-drop-area__action {
    color: var(--ds-color-secondary-body-text, #7a52cc);
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  /* The text field's error look: the hazard glyph beside the message. */
  .field__message {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin: 0.25rem 0 0;
    color: var(--ds-field-error-color, var(--ds-color-danger-body-text, #be3b50));
  }
  .field__msg-icon {
    display: inline-flex;
    flex: none;
  }
  .upload-drop-area__caption {
    font-size: 0.8125rem;
    color: var(--ds-color-text-secondary, #515151);
  }
  /* Visually hidden but focusable: focus lands on the input, ring on the label. */
  .upload-drop-area__input {
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
  .upload-drop-area:focus-within {
    border-style: solid;
    box-shadow: var(--ds-focus-ring-shadow, 0 0 0 2px var(--ds-color-focus-ring, #8e6cd4));
  }
  /* Forced colors: the focus sits on the hidden file input, and shadows
     are dropped, so the visible area carries the ring itself. */
  @media (forced-colors: active) {
    .upload-drop-area:focus-within {
      outline: var(--ds-focus-ring-width, 2px) solid Highlight;
      outline-offset: 2px;
    }
  }
</style>
