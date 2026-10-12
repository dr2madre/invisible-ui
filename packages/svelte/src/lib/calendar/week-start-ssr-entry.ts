import { render } from "svelte/server";
import Fixture from "./calendar-week-start.fixture.svelte";
import type { WeekStart } from "./create-calendar";

/**
 * Server render of the week-start fixture, loaded through a Vite SSR module
 * graph by calendar-week-start-ssr.test.ts, so the components compile for the
 * server and the provider's context reaches the calendar as in production.
 */
export function renderWeekStart(props: { locale: string; weekStartsOn?: WeekStart }): string {
  return render(Fixture, { props }).body;
}
