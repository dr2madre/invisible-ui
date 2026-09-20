// vitest-axe 0.1 declares its matcher on the `Vi` namespace of Vitest 0.x.
// Vitest 4 reads custom matchers from its own `Matchers` interface, so the
// same matcher is declared there. Test layer only: tsconfig.tests.json
// includes this file.
import type { AxeMatchers } from "vitest-axe/matchers";

declare module "vitest" {
  // Extending with no members is how a module augmentation adds matchers.
  // The merged declarations must name the same type parameter; Vitest's own
  // carries the default, so this one carries none.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface Matchers<T> extends AxeMatchers {}
}
