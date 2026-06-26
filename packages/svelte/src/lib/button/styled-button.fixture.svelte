<script lang="ts">
  import Button from "./Button.svelte";
  import type { ButtonVariant } from "./create-button";

  export let variant: ButtonVariant = "default";
  export let disabled = false;
  export let leftIcon: boolean | undefined = undefined;
  export let rightIcon = false;
  export let onpress: ((event: Event) => void) | undefined = undefined;
</script>

<Button {variant} {disabled} {leftIcon} {rightIcon} {onpress}>Delete</Button>
