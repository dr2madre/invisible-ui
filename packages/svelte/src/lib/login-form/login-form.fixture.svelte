<script lang="ts">
  import LoginForm from "./LoginForm.svelte";

  interface Props {
    providers?: { id: string; label: string }[];
    onSubmit?: (value: { email: string; password: string }) => void;
  }

  let { providers = [], onSubmit }: Props = $props();
</script>

<LoginForm heading="Sign in" subheading="Welcome back" {providers} {onSubmit} />
