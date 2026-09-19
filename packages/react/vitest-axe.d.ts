// vitest-axe 0.1 declares its matcher on the `Vi` namespace of Vitest 0.x.
// Vitest 4 reads the `vitest` module's own interfaces, so the same matcher
// is declared there. Test layer only: tsconfig.tests.json includes this file.
import type { AxeMatchers } from "vitest-axe/matchers";

declare module "vitest" {
  // Extending with no members is how a module augmentation adds matchers.
  /* eslint-disable @typescript-eslint/no-empty-object-type */
  interface Assertion extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
  /* eslint-enable @typescript-eslint/no-empty-object-type */
}
