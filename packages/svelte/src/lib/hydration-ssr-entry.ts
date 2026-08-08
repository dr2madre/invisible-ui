import { render } from "svelte/server";
import Fixture from "./hydration.fixture.svelte";

/**
 * Two renders from one long-lived module graph, as a production SSR process
 * serves many requests. The microtask between them lets the per-render id
 * scope reset; each response must come out identical.
 */
export async function renderTwice(): Promise<{ first: string; second: string }> {
  const first = render(Fixture).body;
  await Promise.resolve();
  const second = render(Fixture).body;
  return { first, second };
}
