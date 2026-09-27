<script lang="ts">
  import FeedbackIcon from "./FeedbackIcon.svelte";

  interface Props {
    status?: "info" | "success" | "warning" | "danger" | "neutral";
  }

  let { status = "info" }: Props = $props();
</script>

<FeedbackIcon {status} label="Custom">
  <svg data-testid="custom-icon" viewBox="0 0 24 24"></svg>
</FeedbackIcon>
