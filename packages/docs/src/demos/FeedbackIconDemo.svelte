<script>
  import FeedbackIcon from "@design-system/svelte/FeedbackIcon.svelte";
</script>

<div style="display: flex; flex-direction: column; gap: 1.25rem;">
  <!-- Default rounded-square boxes -->
  <div style="display: flex; gap: 0.75rem; align-items: center;">
    <FeedbackIcon status="info" label="info" />
    <FeedbackIcon status="success" label="success" />
    <FeedbackIcon status="warning" label="warning" />
    <FeedbackIcon status="danger" label="danger" />
    <FeedbackIcon status="neutral" label="neutral" />
  </div>

  <!-- Fully-round boxes (same colors), via the radius token -->
  <div
    style="display: flex; gap: 0.75rem; align-items: center; --ds-feedback-icon-radius: var(--ds-radius-pill, 999px);"
  >
    <FeedbackIcon status="info" label="info" />
    <FeedbackIcon status="success" label="success" />
    <FeedbackIcon status="warning" label="warning" />
    <FeedbackIcon status="danger" label="danger" />
    <FeedbackIcon status="neutral" label="neutral" />
  </div>
</div>
