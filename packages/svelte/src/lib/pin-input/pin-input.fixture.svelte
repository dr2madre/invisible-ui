<script lang="ts">
  import { untrack } from "svelte";
  import { createPinInput, type PinInputType } from "./create-pin-input";

  interface Props {
    value?: string;
    length?: number;
    type?: PinInputType;
    disabled?: boolean;
    onValueChange?: (value: string) => void;
    onComplete?: (value: string) => void;
  }

  let {
    value = "",
    length = 4,
    type = "numeric",
    disabled = false,
    onValueChange,
    onComplete,
  }: Props = $props();

  const { rootAction, inputAction, values } = untrack(() =>
    createPinInput({ value, length, type, disabled, onValueChange, onComplete }),
  );

  const cells = untrack(() => Array.from({ length }, (_, i) => i));
</script>

<div use:rootAction aria-label="Verification code">
  {#each cells as i (i)}
    <input data-testid={`cell-${i}`} value={$values[i]} use:inputAction={i} />
  {/each}
</div>
