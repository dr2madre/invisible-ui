// The React visual page: one frame per component the React adapter has out of
// the Svelte visual set (button, checkbox, switch, text field, select), with
// the same data as the Svelte demos. e2e/visual-react.spec.ts screenshots each
// [data-visual] frame. Written without JSX, like the React harness, so the
// Vue example needs no React compiler plugin. The tree is static, so it is
// built once at module level.
import "./theme";
import "@design-system/react/styles.css";
import "./visual.css";
import { Button, Checkbox, Icon, Select, Switch, TextField } from "@design-system/react";
import { createElement as h, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

const frame = (name: string, ...children: ReactNode[]) =>
  h("section", { className: "visual-frame", "data-visual": name }, ...children);

const fruits = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry", disabled: true },
];

const payments = [
  { value: "card", label: "Credit card" },
  { value: "paypal", label: "PayPal" },
  { value: "transfer", label: "Bank transfer" },
];

const page = h(
  "main",
  { className: "visual-page" },
  frame(
    "button",
    h(
      "div",
      { className: "visual-row" },
      h(Button, null, "Default"),
      h(Button, { variant: "primary" }, "Primary"),
      h(Button, { variant: "secondary" }, "Secondary"),
      h(Button, { variant: "danger" }, "Destructive"),
      h(Button, { variant: "ghost" }, "Ghost"),
      h(Button, { disabled: true }, "Disabled"),
    ),
  ),
  frame(
    "checkbox",
    h(
      "div",
      { className: "visual-stack visual-stack--tight" },
      h(Checkbox, { label: "Accept terms", checked: true }),
      h(Checkbox, { label: "Subscribe to the newsletter" }),
      h(Checkbox, { label: "Select all", checked: "indeterminate" }),
    ),
  ),
  frame(
    "switch",
    h(
      "div",
      { className: "visual-stack visual-stack--tight" },
      h(Switch, { label: "Wi-Fi", checked: true }),
      h(Switch, { label: "Bluetooth" }),
      h(Switch, { label: "Airplane mode", disabled: true }),
      h(Switch, { label: "Notifications", onOff: true, checked: true }),
      h(Switch, { label: "Auto-update", onOff: true }),
    ),
  ),
  frame(
    "text-field",
    h(
      "div",
      { className: "visual-stack" },
      h(TextField, {
        label: "Email",
        type: "email",
        placeholder: "you@example.com",
        description: "We'll never share it.",
      }),
      h(TextField, {
        label: "Email",
        type: "email",
        placeholder: "you@example.com",
        left: h(
          Icon,
          null,
          h("rect", { x: 2, y: 4, width: 20, height: 16, rx: 2 }),
          h("path", { d: "m22 7-10 5L2 7" }),
        ),
      }),
      h(TextField, {
        label: "Email",
        type: "email",
        value: "not-an-email",
        error: "Enter a valid email address.",
      }),
      h(TextField, {
        label: "Username",
        type: "text",
        value: "ada_lovelace",
        success: "This username is available.",
      }),
    ),
  ),
  frame(
    "select",
    h(
      "div",
      { className: "visual-stack visual-stack--fill" },
      h(Select, { label: "Fruit", value: "banana", placeholder: "Select a fruit…", items: fruits }),
      h(Select, { label: "Team", width: "fill", placeholder: "Assign to…", items: fruits }),
      h(Select, {
        label: "Country",
        width: "fixed",
        placeholder: "Choose a country…",
        items: fruits,
      }),
      h(Select, {
        label: "Payment method",
        required: true,
        error: "Choose a payment method to continue",
        placeholder: "Choose…",
        items: payments,
      }),
    ),
  ),
);

createRoot(document.getElementById("app")!).render(page);
