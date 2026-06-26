<script lang="ts">
  import { createLabel } from "./create-label";

  const { rootAction } = createLabel({ for: "email", id: "email-label" });
</script>

<label use:rootAction>Email</label>
<input id="email" type="email" />
