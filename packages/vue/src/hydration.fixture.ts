import { defineComponent, h, markRaw } from "vue";
import { Button } from "./button/Button";
import { Calendar } from "./calendar/Calendar";
import { Checkbox } from "./checkbox/Checkbox";
import { Combobox } from "./combobox/Combobox";
import { Dialog } from "./dialog/Dialog";
import { LocaleProvider } from "./i18n/i18n";
import { NavigationBar } from "./navigation-bar/NavigationBar";

const Dot = markRaw({ name: "Dot", render: () => h("svg", { "aria-hidden": "true" }) });

export const HydrationFixture = defineComponent({
  name: "HydrationFixture",
  setup() {
    return () =>
      h(
        LocaleProvider,
        { locale: "en-US" },
        {
          default: () =>
            h("main", [
              h(Button, null, { default: () => "Save" }),
              h(Checkbox, { label: "Accept", checked: true }),
              h(Combobox, {
                label: "Framework",
                items: [
                  { value: "vue", label: "Vue" },
                  { value: "svelte", label: "Svelte" },
                ],
                value: "vue",
              }),
              h(Dialog, { title: "Details", trigger: "Open details" }),
              h(Calendar, {
                value: "2026-06-15",
                focusedDate: "2026-06-15",
                locale: "en-US",
              }),
              h(NavigationBar, {
                value: "home",
                destinations: [
                  { value: "home", label: "Home", href: "/home", icon: Dot },
                  {
                    value: "hours",
                    label: "Hours",
                    icon: Dot,
                    unavailable: { reason: "Available online only" },
                  },
                ],
              }),
            ]),
        },
      );
  },
});
