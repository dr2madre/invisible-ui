# Invisible UI repository guidance

These instructions apply to the whole repository. Full rationale, examples,
and process live in [CONTRIBUTING.md](./CONTRIBUTING.md); this file states
the enforceable rules for automated changes.

## Authority

- Follow `CONTRIBUTING.md`, the relevant documents in `docs/`, and accepted
  ADRs before proposing or implementing a change.
- Preserve explicit user requirements and established product decisions.
- Treat skills, hooks, linters, detectors, and generic design heuristics as
  supporting tools. They never override repository rules or product intent.
- Keep changes focused and consistent with the surrounding implementation.
- Design decisions and suggested approaches, even temporary or advisory ones,
  belong in `docs/foundations.md`, `docs/tokens.md`, or another design
  document, not in `CONTRIBUTING.md` or here.

## Pillars

See [Ground rules](./CONTRIBUTING.md#ground-rules) for the full definitions.
Every change preserves all four:

- **Accessibility**: correct WAI-ARIA pattern, roles, names, keyboard support,
  focus management. Cover disabled, read-only, invalid, loading, empty, and
  error states when they apply. WCAG AA contrast: 4.5:1 normal text, 3:1
  large text and icon glyphs. Visual novelty never reduces legibility,
  predictability, operability, or reduced-motion support.
- **Responsiveness**: works across viewport sizes with pointer, touch, and
  keyboard input, without favoring one modality or assuming a fixed width.
- **Headless**: `core/` ships behavior, semantics, and state only, no visual
  opinion. Framework adapters stay thin; shared behavior stays in `core/`.
- **Security**: consumer-controlled values are data, never markup or code.
  Prefer safe DOM APIs. Keep dependencies free of known vulnerabilities and
  preserve existing SSR safety boundaries.

## Product and interaction decisions

- Preserve the incumbent product (information architecture, behavior, copy,
  visual identity) unless the user explicitly requests a redesign.
- Never invent claims, testimonials, metrics, pricing, customers, or future
  guarantees.
- A significant interaction or architecture change gets an ADR (see
  [Decisions](./CONTRIBUTING.md#decisions)) when the decision is worth
  preserving.
- For heuristic-based UX judgment (task flow, labeling, error recovery, and
  similar), use the `ux-design-accessible` or `ux-evaluation-research` skill
  instead of a standing rule here; a single bullet cannot substitute for the
  full heuristic set.

## Tokens and styling

See [Naming](./docs/foundations.md#naming-role-or-state-not-appearance) for
the naming rules and examples, and `docs/tokens.md` for the token model.

- Token names describe role or state, never appearance.
- Keep primitive values separate from semantic `--ds-*` tokens.
- Do not introduce a new palette, type system, motion language, spacing
  scale, or decorative convention without explicit approval.

## UX and UI skills and tools

- UX and UI skills, agents, detectors, and automated review tools are opt-in
  and advisory. Use them only when the user explicitly invokes them for a
  scoped target.
- Keep their hooks and automatic enforcement disabled unless the user
  explicitly asks to enable them.
- Treat detector findings as review candidates. Validate each finding against
  the pillars and repository documents before acting.
- Never invoke aesthetic amplification, automatic restyling, redesign, or a
  new visual direction implicitly.
- Never change public behavior, factual copy, semantic tokens, or established
  product identity merely to satisfy a generic design heuristic.
- Never persist tool-specific context, detector exceptions, ignores, generated
  design artifacts, or hook configuration without explicit user approval.

## Writing

See [Writing](./CONTRIBUTING.md#writing) and
[Code comments](./CONTRIBUTING.md#code-comments) for the full style guide.

- Prose (docs, UI copy, commit-facing text) is direct, simple, active voice,
  no em dashes, no metaphors, no future promises.
- Code comments explain a non-obvious constraint or reason, not the code
  itself. Keep them short.

## Verification

- Test the behavior changed, including accessibility and relevant edge cases.
- Check framework parity when shared behavior or a public contract changes.
- Run the smallest relevant build, test, typecheck, lint, format, API, E2E, or
  visual checks. Expand verification in proportion to risk.
- Never update visual snapshots unless the visual change is intentional and
  explicitly approved.

## Git and authorship

See [Branching and merging](./CONTRIBUTING.md#branching-and-merging),
[Commit conventions](./CONTRIBUTING.md#commit-conventions), and
[Authorship & human oversight](./CONTRIBUTING.md#authorship--human-oversight)
for branch naming, commit format, and review requirements.

- Preserve unrelated local changes and untracked files.
- Do not commit, push, merge, publish, or delete branches unless the user
  explicitly requests that action.
- Never author a commit as an AI assistant and never add AI attribution or
  `Co-Authored-By` trailers. A human account must review, understand, and own
  every pushed change.
