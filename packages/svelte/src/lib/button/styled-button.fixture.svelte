<script lang="ts">
  import Button from "./Button.svelte";
  import type { ButtonVariant } from "./create-button";

  interface Props {
    variant?: ButtonVariant;
    disabled?: boolean;
    loading?: boolean;
    loadingStatus?: string;
    leftIcon?: boolean;
    rightIcon?: boolean;
    onpress?: (event: Event) => void;
  }

  let {
    variant = "default",
    disabled = false,
    loading = false,
    loadingStatus,
    leftIcon,
    rightIcon = false,
    onpress,
  }: Props = $props();
</script>

<Button {variant} {disabled} {loading} {loadingStatus} {leftIcon} {rightIcon} {onpress}>
  Delete
</Button>
