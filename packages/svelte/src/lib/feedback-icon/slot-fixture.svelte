<script lang="ts">
  import FeedbackIcon from "./FeedbackIcon.svelte";
  export let status: "info" | "success" | "warning" | "danger" | "neutral" = "info";
</script>

<FeedbackIcon {status} label="Custom">
  <svg data-testid="custom-icon" viewBox="0 0 24 24"></svg>
</FeedbackIcon>
