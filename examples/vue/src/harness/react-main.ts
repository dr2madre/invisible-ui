// End-to-end harness for the React adapter, served by the same Vite app as
// the Vue harness. Written without JSX so the Vue example needs no React
// compiler plugin.
import "@design-system/react/styles.css";
import { Checkbox, Combobox, Dialog, MultiSelect, Select, Switch } from "@design-system/react";
import { createElement as h, useState, type ReactElement } from "react";
import { createRoot } from "react-dom/client";

const items = [
  { value: "svelte", label: "Svelte" },
  { value: "vue", label: "Vue" },
  { value: "react", label: "React", disabled: true },
  { value: "elements", label: "Elements" },
];

const fruit = [
  { value: "apple", label: "Apple" },
  { value: "pear", label: "Pear" },
];

/**
 * The reset section (ADR 0012). The page holds its own copy of every value and
 * echoes each report straight back, which is how a React consumer writes it,
 * and counts what it is told.
 */
function ResetForm(): ReactElement {
  const [subscribe, setSubscribe] = useState(true);
  const [notify, setNotify] = useState(true);
  const [fruitValue, setFruitValue] = useState<string | null>("pear");
  const [city, setCity] = useState<string | null>("milan");
  const [langs, setLangs] = useState<string[]>(["it"]);
  const [resets, setResets] = useState(0);
  const [reports, setReports] = useState(0);
  const told =
    <T>(apply: (next: T) => void) =>
    (next: T) => {
      apply(next);
      setReports((count) => count + 1);
    };

  return h(
    "form",
    { "data-testid": "reset-form", onReset: () => setResets((count) => count + 1) },
    h(Checkbox, {
      label: "Subscribe",
      name: "resetSubscribe",
      checked: subscribe,
      onCheckedChange: told<unknown>((next) => setSubscribe(next === true)),
    }),
    h(Switch, {
      label: "Notifications",
      name: "resetNotify",
      checked: notify,
      onCheckedChange: told<boolean>(setNotify),
    }),
    h(Select, {
      label: "Fruit",
      name: "resetFruit",
      items: fruit,
      value: fruitValue,
      onValueChange: told<string>(setFruitValue),
    }),
    h(Combobox, {
      label: "City",
      name: "resetCity",
      items: [
        { value: "london", label: "London" },
        { value: "milan", label: "Milan" },
      ],
      value: city,
      onValueChange: told<string | null>(setCity),
    }),
    h(MultiSelect, {
      label: "Languages",
      name: "resetLangs",
      items: [
        { value: "en", label: "English" },
        { value: "it", label: "Italian" },
      ],
      values: langs,
      onValuesChange: told<string[]>(setLangs),
    }),
    h("button", { type: "reset" }, "Reset the form"),
    // The page choosing values of its own, which is a new default rather than
    // an echo of anything the user did.
    h(
      "button",
      {
        type: "button",
        onClick: () => {
          setSubscribe(false);
          setNotify(false);
          setFruitValue("apple");
        },
      },
      "Choose for me",
    ),
    h("p", { "data-testid": "reset-readout" }, `Resets: ${resets}. Reports: ${reports}.`),
  );
}

function Harness(): ReactElement {
  const [values, setValues] = useState<string[]>(["vue"]);
  const [submitted, setSubmitted] = useState("none");

  return h(
    "main",
    { style: { display: "grid", gap: "1rem", justifyItems: "start", padding: "2rem" } },
    h("h1", null, "React adapter harness"),
    h(
      "form",
      {
        "data-testid": "skills-form",
        onSubmit: (event: { preventDefault(): void; currentTarget: HTMLFormElement }) => {
          event.preventDefault();
          setSubmitted(new FormData(event.currentTarget).getAll("skills").join(", ") || "none");
        },
      },
      h(MultiSelect, {
        label: "Skills",
        items,
        values,
        name: "skills",
        removeOnBackspace: true,
        onValuesChange: setValues,
      }),
      h("button", { type: "submit" }, "Submit skills"),
      h("p", { "data-testid": "skills-readout" }, `Submitted: ${submitted}`),
    ),
    // Controlled reflection: the parent overwrites the selection directly.
    h(
      "button",
      { type: "button", onClick: () => setValues(["elements", "svelte"]) },
      "Reflect selection",
    ),
    h("p", { "data-testid": "values-readout" }, `Values: ${values.join(", ") || "none"}`),
    h(ResetForm),
    h(DialogScene),
  );
}

/**
 * A control inside a modal dialog. The dialog paints in the top layer and
 * makes the rest of the page inert, so a list portalled to the body shows
 * through and cannot be clicked: the browser test picks the option.
 */
function DialogScene(): ReactElement {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  return h(
    "section",
    { "data-testid": "dialog-scene" },
    h("button", { type: "button", onClick: () => setOpen(true) }, "Open the picker"),
    h(
      Dialog,
      { open, title: "Pick a framework", onOpenChange: setOpen },
      h(Combobox, {
        label: "Framework",
        items,
        value: picked,
        onValueChange: setPicked,
      }),
    ),
    h("p", { "data-testid": "dialog-readout" }, `Picked: ${picked ?? "none"}`),
  );
}

createRoot(document.getElementById("app")!).render(h(Harness));
