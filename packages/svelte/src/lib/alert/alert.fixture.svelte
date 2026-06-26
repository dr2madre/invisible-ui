<script lang="ts">
  import Alert from "./Alert.svelte";

  export let status: "info" | "success" | "warning" | "danger" | "neutral" = "info";
  export let title = "Heads up";
  export let description = "Something happened you should know about.";
  export let href: string | undefined = undefined;
  export let linkText = "Learn more";
  export let closable = false;
  export let role: "status" | "alert" | "region" = "status";
  export let onclose: (() => void) | undefined = undefined;
  export let actions:
    | Array<{
        label: string;
        variant?: "default" | "primary" | "ghost" | "danger";
        onClick?: () => void;
      }>
    | undefined = undefined;
</script>

<Alert {status} {title} {description} {href} {linkText} {closable} {role} {actions} {onclose} />
