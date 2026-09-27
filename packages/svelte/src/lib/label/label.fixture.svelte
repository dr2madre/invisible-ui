<script lang="ts">
  import { createLabel } from "./create-label";

  const { rootAction } = createLabel({ for: "email", id: "email-label" });
</script>

<!-- rootAction applies the `for` attribute at runtime. -->
<!-- svelte-ignore a11y_label_has_associated_control -->
<label use:rootAction>Email</label>
<input id="email" type="email" />
