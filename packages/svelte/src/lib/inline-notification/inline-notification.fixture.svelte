<script lang="ts">
  import InlineNotification from "./InlineNotification.svelte";

  interface Props {
    status?: "info" | "success" | "warning" | "danger" | "neutral";
    title?: string;
    description?: string;
    href?: string;
    linkText?: string;
    closable?: boolean;
    snack?: boolean;
    open?: boolean;
    role?: "status" | "alert" | "region";
    onclose?: () => void;
    actions?: Array<{
      label: string;
      variant?: "default" | "primary" | "ghost" | "danger";
      onClick?: () => void;
    }>;
  }

  let {
    status = "info",
    title = "Heads up",
    description = "Something happened you should know about.",
    href,
    linkText,
    closable = false,
    snack = false,
    open = $bindable(true),
    role = "status",
    onclose,
    actions,
  }: Props = $props();
</script>

<InlineNotification
  {status}
  {title}
  {description}
  {href}
  {linkText}
  {closable}
  {snack}
  bind:open
  {role}
  {actions}
  {onclose}
/>
