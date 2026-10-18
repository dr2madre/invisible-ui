<script>
  import Textarea from "@invisible-ui/svelte/Textarea.svelte";
</script>

<!-- A native <textarea>: multi-line and user-resizable (drag the bottom-right
     handle). `rows` sets the initial height. -->
<Textarea
  label="Bio"
  name="bio"
  autocomplete="off"
  rows={4}
  placeholder="Tell us about yourself…"
  description="Drag the corner to resize."
  success="Your bio is ready to submit."
/>
