<script lang="ts">
  /**
   * The error message a value control renders under itself: the hazard glyph
   * of the text field and the text, announced as an alert. Renders nothing
   * while `error` is empty. The control points at `id` through
   * `aria-describedby`.
   */
  import Icon from "../icon/Icon.svelte";

  interface Props {
    id: string;
    error?: string;
  }

  let { id, error }: Props = $props();
</script>

{#if error}
  <p {id} class="field__error field__message" role="alert">
    <span class="field__msg-icon" aria-hidden="true">
      <Icon size="1em">
        <path
          d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12" y2="17" />
      </Icon>
    </span>
    {error}
  </p>
{/if}

<style>
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
</style>
