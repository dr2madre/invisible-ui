// End-to-end harness for the React adapter, served by the same Vite app as
// the Vue harness. Written without JSX so the Vue example needs no React
// compiler plugin.
import "@design-system/react/styles.css";
import { MultiSelect } from "@design-system/react";
import { createElement as h, useState, type ReactElement } from "react";
import { createRoot } from "react-dom/client";

const items = [
  { value: "svelte", label: "Svelte" },
  { value: "vue", label: "Vue" },
  { value: "react", label: "React", disabled: true },
  { value: "elements", label: "Elements" },
];

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
  );
}

createRoot(document.getElementById("app")!).render(h(Harness));
