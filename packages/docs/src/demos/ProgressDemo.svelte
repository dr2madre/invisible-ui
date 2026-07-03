<script>
  import Progress from "@design-system/svelte/Progress.svelte";
</script>

<div style="max-width: 22rem; display: flex; flex-direction: column; gap: 1rem;">
  <Progress value={62} label="Uploading" />
  <Progress value={null} label="Working" />

  <!-- Download composition: the bar plus file count and bytes. -->
  <div>
    <Progress value={38} label="Downloading files" />
    <p
      style="margin: 0.375rem 0 0; display: flex; justify-content: space-between; font-size: 0.8125rem; color: var(--ds-color-text-secondary); font-variant-numeric: tabular-nums;"
    >
      <span>3 of 8 files</span>
      <span>48 MB of 128 MB</span>
    </p>
  </div>

  <!-- Circle: determinate ring for uploads/exports (the spinner's determinate
       counterpart), with the percentage inside. -->
  <div style="display: flex; gap: 1rem; align-items: center;">
    <Progress shape="circle" value={68} showValue label="Exporting" />
    <Progress shape="circle" value={25} label="Uploading photo" />
    <Progress shape="circle" value={null} label="Working" />
  </div>
</div>
