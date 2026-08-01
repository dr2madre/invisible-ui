# 9. The project is licensed under MIT

- **Status:** Accepted
- **Date:** 2026-08-01

## Context

The project started under the EUPL-1.2, a copyleft license from the European
Commission: modified versions must stay open. That protects against closed
paid forks, and it costs adoption, because legal teams approve unfamiliar
licenses slowly or never.

The component libraries this project measures itself against (shadcn/ui,
Radix, Headless UI) are MIT-licensed, and their reach comes in part from the
zero-friction license: everyone recognizes it, nobody has to read it.

## Decision

The whole repository moves to the **MIT License**. Copyright holder:
nozcadesign (dr2madre). All package manifests, the README and the
contributing guide reference MIT.

The trade-off is accepted knowingly: MIT permits closed and commercial
derivatives. Distribution and adoption take priority; the project's identity
is protected by its name and by this public record, and the maintainer's
income does not depend on the code staying open.

Contributions arrive under MIT (see CONTRIBUTING.md). MIT grants every reuse
right in advance, so a contributor license agreement is unnecessary.

## Consequences

- Anyone can use, modify, sell and re-license copies, in open or closed
  form, keeping the copyright notice.
- Corporate adoption has zero license friction.
- Relicensing later stays possible only for code the maintainer owns;
  external contributions would keep their MIT grant.
