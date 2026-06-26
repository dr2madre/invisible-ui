import { stepper as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type Orientation = core.Orientation;
export type StepStatus = core.StepStatus;
export type StepperApi = core.StepperApi;
export type StepperState = core.StepperState;
export type StepperContext = core.StepperContext;

export interface CreateStepper {
  /** Reactive resolved state. */
  state: Readable<StepperState>;
  /** Reactive connected API. */
  api: Readable<StepperApi>;
  /** Current step (0-based). */
  current: Readable<number>;
  /** Advance to the next step. */
  next: () => void;
  /** Go back to the previous step. */
  prev: () => void;
  /** Jump to a step (ignored when unreachable). */
  goTo: (index: number) => void;
  /** Svelte action for the container: `<nav use:rootAction>`. */
  rootAction: Action<HTMLElement>;
  /** Svelte action for the ordered list: `<ol use:listAction>`. */
  listAction: Action<HTMLElement>;
  /** Svelte action for a step trigger: `<button use:stepAction={index}>`. */
  stepAction: Action<HTMLElement, number>;
}

/**
 * Create a headless stepper: ordered progress through a sequence of steps with
 * `next`/`prev`/`goTo`, linear gating, and the conventional accessible markup
 * (a labelled `<nav>` + `<ol>`, current step `aria-current="step"`). The status
 * and reachability logic live in `@design-system/core`; this adapter wires state
 * to Svelte stores and applies the connected props via actions.
 */
export function createStepper(context: StepperContext): CreateStepper {
  const state = writable<StepperState>(core.initialState(context));

  const setStep = (step: number) => {
    state.update((current) => {
      if (current.current === step) return current;
      context.onStepChange?.(step);
      return { ...current, current: step };
    });
  };

  const api = derived(state, ($state) =>
    core.connect({ state: $state, setStep, normalize: normalizeProps }),
  );

  const rootAction = createPropsAction(api, (a) => a.rootProps);
  const listAction = createPropsAction(api, (a) => a.getListProps());

  const stepAction: Action<HTMLElement, number> = (node, index) => {
    const stepApi = derived(api, (a) => a.getStepProps(index as number));
    const handle = createPropsAction(stepApi, (props) => props)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  return {
    state,
    api,
    current: derived(state, ($state) => $state.current),
    next: () => get(api).next(),
    prev: () => get(api).prev(),
    goTo: (index: number) => get(api).goTo(index),
    rootAction,
    listAction,
    stepAction,
  };
}
