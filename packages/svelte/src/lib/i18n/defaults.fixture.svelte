<script lang="ts">
  import LocaleProvider from "./LocaleProvider.svelte";
  import Dialog from "../dialog/Dialog.svelte";
  import Collapsible from "../collapsible/Collapsible.svelte";
  import LoginForm from "../login-form/LoginForm.svelte";

  const messages = {
    "dialog.trigger": "Apri",
    "collapsible.toggle": "Mostra",
    "loginForm.heading": "Accedi",
  };
</script>

<LocaleProvider locale="it" {messages}>
  <Dialog title="Condividi">Contenuto</Dialog>
  <Collapsible>Dettagli</Collapsible>
  <LoginForm />
</LocaleProvider>
