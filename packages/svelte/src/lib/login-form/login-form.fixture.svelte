<script lang="ts">
  import LoginForm from "./LoginForm.svelte";

  export let providers: { id: string; label: string }[] = [];
  export let onSubmit: ((value: { email: string; password: string }) => void) | undefined =
    undefined;
</script>

<LoginForm heading="Sign in" subheading="Welcome back" {providers} {onSubmit} />
