import { defineComponent, h } from "vue";
import { Button } from "./button/Button";
import { Calendar } from "./calendar/Calendar";
import { Checkbox } from "./checkbox/Checkbox";
import { Combobox } from "./combobox/Combobox";
import { Dialog } from "./dialog/Dialog";
import { LocaleProvider } from "./i18n/i18n";

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
            ]),
        },
      );
  },
});
