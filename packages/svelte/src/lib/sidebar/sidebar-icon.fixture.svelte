<script lang="ts">
  /** A destination's mark, for the tests: the rail needs every destination to
      show something once the labels are out of sight. */
  interface Props {
    size?: number;
  }

  let { size = 16 }: Props = $props();
</script>

<svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
  <circle cx="12" cy="12" r="8" fill="currentColor" />
</svg>
