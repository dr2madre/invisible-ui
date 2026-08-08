# Invisible UI repository guidance

These instructions apply to the whole repository.

## Authority

- Follow `CONTRIBUTING.md`, the relevant documents in `docs/`, and accepted
  ADRs before proposing or implementing a change.
- Preserve explicit user requirements and established product decisions.
- Treat skills, hooks, linters, detectors, and generic design heuristics as
  supporting tools. They never override repository rules or product intent.
- Keep changes focused and consistent with the surrounding implementation.

## UX non-negotiables

Every change must preserve all four project pillars.

### Accessibility

- Follow the relevant WAI-ARIA Authoring Practices pattern.
- Prefer native browser semantics and behavior when they are accessible and
  robust.
- Preserve correct roles, names, descriptions, relationships, keyboard
  behavior, focus management, and screen-reader expectations.
- Cover disabled, read-only, invalid, loading, empty, and error states when
  they apply.
- Styled output must meet WCAG AA contrast: 4.5:1 for normal text and 3:1 for
  large text and icon glyphs.
- Visual novelty must never reduce legibility, predictability, operability, or
  support for reduced motion.

### Responsiveness

- Components work across small and large viewports without fixed-width
  assumptions.
- Support pointer, touch, and keyboard input. Do not optimize one modality at
  the expense of another.
- Preserve readable content, reachable controls, stable focus, and usable
  hit targets during reflow, zoom, localization, and content growth.

### Headless behavior

- `core/` ships behavior, semantics, state, and framework-agnostic prop
  getters. It does not ship an opinionated visual identity.
- Styling belongs in documentation, examples, and optional styled adapters.
- Expose stable `data-*` state hooks and overridable tokens instead of baking
  visual decisions into primitives.
- Keep framework adapters thin. Shared behavior belongs in `core/`, and the
  public behavior stays consistent across supported frameworks.

### Security

- Treat consumer-controlled values as data, never as markup or executable
  code.
- Prefer safe DOM APIs over string interpolation into HTML.
- Keep dependencies free of known vulnerabilities and preserve existing SSR
  safety boundaries.

## Product and interaction decisions

- Task completion, clarity, and native expectations outrank decoration.
- Buttons name outcomes. Controls expose clear labels, feedback, and recovery
  paths.
- Preserve the incumbent information architecture, behavior, copy, and visual
  identity unless the user explicitly requests a redesign or product change.
- Never invent claims, testimonials, metrics, pricing, customers, or future
  guarantees.
- Significant interaction or architecture changes require an ADR when the
  decision is worth preserving.

## Tokens and styling

- Token names describe role or state, never appearance. Follow
  `docs/foundations.md` and `docs/tokens.md`.
- Keep primitive values separate from semantic `--ds-*` tokens.
- Styled components consume semantic tokens and remain themeable.
- Do not introduce a new palette, type system, motion language, spacing scale,
  or decorative convention without explicit approval.

## UX and UI skills and tools

- UX and UI skills, agents, detectors, and automated review tools are opt-in
  and advisory. Use them only when the user explicitly invokes them for a
  scoped target.
- Keep their hooks and automatic enforcement disabled unless the user
  explicitly asks to enable them.
- Treat detector findings as review candidates. Validate each finding against
  accessibility, responsiveness, headless boundaries, repository documents,
  and the requested scope before acting.
- Never invoke aesthetic amplification, automatic restyling, redesign, or a
  new visual direction implicitly.
- Never change public behavior, factual copy, semantic tokens, or established
  product identity merely to satisfy a generic design heuristic.
- Never persist tool-specific context, detector exceptions, ignores, generated
  design artifacts, or hook configuration without explicit user approval.

## Writing

- Follow `docs/copy-guidelines.md` for documentation, UI copy, and
  commit-facing prose.
- Write directly, simply, positively, and in the active voice.
- Use literal language. Avoid metaphors, rhetorical negation, promises about
  the future, direct competitor comparisons, and em dashes.
- Code comments explain a non-obvious constraint or reason. Keep them short
  and avoid narrating the code.

## Verification

- Test the behavior changed, including accessibility and relevant edge cases.
- Check framework parity when shared behavior or a public contract changes.
- Run the smallest relevant build, test, typecheck, lint, format, API, E2E, or
  visual checks. Expand verification in proportion to risk.
- Never update visual snapshots unless the visual change is intentional and
  explicitly approved.

## Git and authorship

- Preserve unrelated local changes and untracked files.
- Do not commit, push, merge, publish, or delete branches unless the user
  explicitly requests that action.
- Commits must remain attributable to the human maintainer. Never author a
  commit as an AI assistant and never add AI attribution or `Co-Authored-By`
  trailers.
