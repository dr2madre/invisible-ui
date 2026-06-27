<script>
  import Textarea from "@design-system/svelte/Textarea.svelte";
</script>

<!-- A native <textarea>: multi-line and user-resizable (drag the bottom-right
     handle). `rows` sets the initial height. -->
<Textarea
  label="Bio"
  rows={4}
  placeholder="Tell us about yourself…"
  description="Drag the corner to resize."
/>
