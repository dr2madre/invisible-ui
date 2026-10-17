// End-to-end harness for the custom elements adapter, served by the same
// Vite app as the Vue harness. Everything here is post-mount wiring: the
// element upgrades from the declarative light-DOM markup.
import "@invisible-ui/elements/styles.css";
import "@invisible-ui/elements/define";
import type { DsMultiSelect } from "@invisible-ui/elements";

const host = document.querySelector("ds-multi-select") as DsMultiSelect;
const form = document.querySelector("form") as HTMLFormElement;
const valuesReadout = document.querySelector("[data-testid='values-readout']")!;
const eventsReadout = document.querySelector("[data-testid='events-readout']")!;
const submittedReadout = document.querySelector("[data-testid='skills-readout']")!;

const renderValues = () => {
  valuesReadout.textContent = `Values: ${host.values.join(", ") || "none"}`;
};

host.addEventListener("change", (event) => {
  const detail = (event as CustomEvent<{ values: string[] }>).detail;
  eventsReadout.textContent = `Events: ${Array.isArray(detail.values) ? detail.values.join(", ") || "empty" : "not-an-array"}`;
  renderValues();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submittedReadout.textContent = `Submitted: ${new FormData(form).getAll("skills").join(", ") || "none"}`;
});

// Post-mount property assignment: a controlled reflection, no event expected.
document.querySelector("[data-testid='reflect']")!.addEventListener("click", () => {
  host.values = ["elements", "svelte"];
  renderValues();
});

// The reset section (ADR 0012). Everything here is the consumer's side of the
// contract: the form's own reset event, and a count of what the controls say.
const resetForm = document.querySelector("[data-testid='reset-form']") as HTMLFormElement;
const resetReadout = document.querySelector("[data-testid='reset-readout']")!;
const resetPayload = document.querySelector("[data-testid='reset-payload']")!;
let resets = 0;
let reports = 0;

const renderResetReadout = () => {
  resetReadout.textContent = `Resets: ${resets}. Reports: ${reports}.`;
};

for (const type of ["change", "input"] as const) {
  resetForm.addEventListener(type, () => {
    reports += 1;
    renderResetReadout();
  });
}

resetForm.addEventListener("reset", () => {
  resets += 1;
  renderResetReadout();
});

resetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(resetForm);
  resetPayload.textContent = `Payload: ${[...data.keys()]
    .filter((key, index, keys) => keys.indexOf(key) === index)
    .map((key) => `${key}=${data.getAll(key).join("|")}`)
    .join(", ")}`;
});
