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
package depends on it. Each exception names one advisory, carries a review date by which it is
checked again, and is removed as soon as a patched release exists.

There are no exceptions at the moment.

| Advisory | Package | Reached through | Added | Review by | Remove when |
| --- | --- | --- | --- | --- | --- |

An exception lives in `pnpm.auditConfig.ignoreGhsas` in the root
`package.json`. `scripts/audit-exceptions.test.mjs` fails if that list holds
an advisory this table does not document, or if a shipped package
(`core`, `svelte`, `vue`, `react`, `elements`) depends on an excepted package.

## Patched dependencies

When an advisory has no upstream fix, the vulnerable code is fixed locally
with a pnpm patch instead of silencing the audit. Patches live in `patches/`
and are listed in `pnpm.patchedDependencies` in the root `package.json`. Each
patch is removed as soon as upstream publishes a release that fixes the issue.

| Package | Advisory | What the patch changes | Why | Added | Review by | Remove when |
| --- | --- | --- | --- | --- | --- | --- |
| `http-cache-semantics@4.3.0` | [GHSA-ch52-4w7c-c8xp](https://github.com/advisories/GHSA-ch52-4w7c-c8xp) | A client `max-stale` no longer serves a stored response whose freshness the library set to zero on purpose: not storable (`private` or `Authorization` in a shared cache, `no-store`), `no-cache`, `must-revalidate`, or, in a shared cache, `Set-Cookie` without `public` or `immutable`, or `proxy-revalidate`. Ordinary stale responses are still served. | Release 4.3.0 is outside the advisory's range but its `max-stale` code is unchanged from 4.2.0, so the leak remains. It is reached only through `astro`, which builds the documentation site. | 2026-10-13 | 2026-11-04 | Upstream publishes a release that fixes the `max-stale` path. Then delete the patch file, its `pnpm.patchedDependencies` entry, the `http-cache-semantics` override and this row. |

`scripts/http-cache-semantics-patch.test.mjs` checks the patched behaviour.
`scripts/audit-exceptions.test.mjs` fails if a `pnpm.patchedDependencies`
entry has no row in this table, or a row has no entry.
