# Security Policy

## Supported versions

This project is pre-1.0; only the latest release receives fixes.

## Reporting a vulnerability

Please **do not** open a public issue for security reports. Instead, use GitHub's
private vulnerability reporting (the repository's **Security → Report a
vulnerability** tab), or contact the maintainer directly.

We aim to acknowledge reports within a few days and to ship a fix or mitigation
as soon as is practical, crediting the reporter unless they prefer otherwise.

## Dependency audit exceptions

`pnpm audit` runs in the gate and fails on any advisory. An exception is
granted only when no patched release exists, the vulnerable package is
reached only through development or documentation tooling, and no shipped
package depends on it. Each exception names one advisory, and it is removed
as soon as a patched release exists.

| Advisory | Package | Reached through | Added | Remove when |
| --- | --- | --- | --- | --- |
| [GHSA-ch52-4w7c-c8xp](https://github.com/advisories/GHSA-ch52-4w7c-c8xp) | `http-cache-semantics` (all releases up to 4.2.0, the latest) | `astro`, used only to build the documentation site (`@design-system/docs`, private); Astro calls it only to cache remote images during the build | 2026-10-04 | A patched `http-cache-semantics` is released, or Astro drops the dependency. Then delete the entry from `pnpm.auditConfig.ignoreGhsas` in `package.json` and this row. |

The exception lives in `pnpm.auditConfig.ignoreGhsas` in the root
`package.json`. `scripts/audit-exceptions.test.mjs` fails if that list holds
an advisory this table does not document, or if a shipped package
(`core`, `svelte`, `vue`, `react`, `elements`) depends on an excepted package.
