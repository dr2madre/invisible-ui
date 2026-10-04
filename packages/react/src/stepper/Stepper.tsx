import { useI18n } from "../i18n/i18n";
import { useStepper, type StepperOrientation } from "./use-stepper";

/** A step's display content. */
export interface StepDescriptor {
  /** Short title. */
  label: string;
  /** Optional secondary line. */
  description?: string;
}

export interface StepperProps {
  steps: StepDescriptor[];
  /** Initial (uncontrolled) or current (controlled) step, 0-based. */
  current?: number;
  /** Linear mode: upcoming steps cannot be picked. */
  linear?: boolean;
  orientation?: StepperOrientation;
  disabled?: boolean;
  /** Accessible name for the progress nav. Defaults to the catalog's "Progress". */
  label?: string;
  /** Called whenever the current step changes. */
  onStepChange?: (current: number) => void;
}

const CHECK = (
  <svg viewBox="0 0 16 16" width="1em" height="1em" focusable="false">
    <path
      d="M3.5 8.5l3 3 6-6.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Stepper: the styled progress stepper, an ordered sequence of steps showing
 * what is complete, current and upcoming. Behaviour (status, linear gating,
 * navigation) comes from the headless stepper in `@design-system/core`; the
 * markup is a labelled `<nav>` around an `<ol>`, with the current step marked
 * `aria-current="step"`.
 *
 * In linear mode (default) upcoming steps are not clickable; set
 * `linear={false}` to allow jumping to any step. A completed step shows a
 * decorative check and says "Completed" after its label, so its name reads
 * "label, status, description". Themed via `--ds-step-*`.
 */
export function Stepper({
  steps,
  current = 0,
  linear = true,
  orientation = "horizontal",
  disabled = false,
  label,
  onStepChange,
}: StepperProps) {
  const { t } = useI18n();
  const api = useStepper({
    count: steps.length,
    current,
    linear,
    orientation,
    disabled,
    onStepChange,
  });

  return (
    <nav className="stepper" {...api.rootProps} aria-label={label ?? t("stepper.label")}>
      <ol className="stepper__list" {...api.getListProps()}>
        {steps.map((step, index) => {
          const status = api.status(index);
          return (
            // Steps are positional: two may share a label.
            <li key={index} className="stepper__step" data-status={status}>
              {index > 0 ? <span className="stepper__connector" aria-hidden="true" /> : null}
              <button className="stepper__trigger" {...api.getStepProps(index)}>
                <span className="stepper__indicator" aria-hidden="true">
                  {status === "complete" ? CHECK : index + 1}
                </span>
                {/* Spaces keep the parts apart in the accessible name. */}
                <span className="stepper__text">
                  <span className="stepper__label">{step.label}</span>
                  {status === "complete" ? (
                    <>
                      {" "}
                      <span className="stepper__status">{t("stepper.completed")}</span>
                    </>
                  ) : null}
                  {step.description ? (
                    <>
                      {" "}
                      <span className="stepper__description">{step.description}</span>
                    </>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
