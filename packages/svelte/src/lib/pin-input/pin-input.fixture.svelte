<script lang="ts">
  import { createPinInput, type PinInputType } from "./create-pin-input";

  export let value = "";
  export let length = 4;
  export let type: PinInputType = "numeric";
  export let disabled = false;
  export let onValueChange: ((value: string) => void) | undefined = undefined;
  export let onComplete: ((value: string) => void) | undefined = undefined;

  const { rootAction, inputAction, values } = createPinInput({
    value,
    length,
    type,
    disabled,
    onValueChange,
    onComplete,
  });

  const cells = Array.from({ length }, (_, i) => i);
</script>

<div use:rootAction aria-label="Verification code">
  {#each cells as i (i)}
    <input data-testid={`cell-${i}`} value={$values[i]} use:inputAction={i} />
  {/each}
</div>
