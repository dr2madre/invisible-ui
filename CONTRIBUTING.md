# Contributing

Thanks for your interest in contributing to **Nozca-ui** (by nozcadesign) — a
headless, accessible, multi-framework component library.

> **Note:** The project is in an early stage. These guidelines describe the
> intended workflow and will evolve as tooling and packages are added.

## Ground rules

This library has three non-negotiable pillars. Every contribution is expected
to uphold them:

- **Accessibility** — follow the relevant
  [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) pattern.
  Correct roles/attributes, full keyboard support, and proper focus
  management are required. Any styled output (examples and the optional theme
  layer) must meet **WCAG AA** contrast: **4.5:1** for normal text and
  **3:1** for large text. The unstyled primitives carry no color, so this
  applies to styling, not to the primitives themselves.
- **Responsiveness** — components must be **responsive by default**: they
  work across viewport sizes and input modalities (pointer, touch, keyboard),
  and never assume a fixed width or a single input type.
- **Headless** — ship behavior and semantics only. Do not add opinionated
  visual styling. Recommended (overridable) visual defaults live separately in
  [`docs/foundations.md`](./docs/foundations.md).

## Branching workflow

1. Create a feature branch off `main`, named after the feature it delivers,
   using the `feature/<feature-name>` prefix (e.g. `feature/combobox`,
   `feature/token-architecture`). Use short, kebab-case names; avoid
   auto-generated or tool-style prefixes.
2. Keep changes focused; one logical change per pull request.
3. Open a pull request against `main` and request a review.

## Commit conventions

Use clear, descriptive commit messages. We recommend the
[Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): short summary

feat(react): add headless Combobox primitive
fix(core): correct roving tabindex in Menu
docs: document Dialog usage
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

## Authorship & human oversight

Every contribution requires **human review and oversight** before it is pushed.
Commits must be authored by a **human account**. Configure your git author name
and email to match your own (or your GitHub) identity before contributing:

```
git config user.name "Your Name"
git config user.email "you@example.com"
```

AI assistants may help draft changes, but they must **never** appear as the
author of a commit — neither as the **sole author** nor as a **co-author**. No
`Co-Authored-By` trailers for AI tools, and no automated or placeholder author
identities. An AI cannot accept responsibility for code, so it cannot be
credited as an author.

**Only the human who uses the AI is responsible for what gets pushed.** That
person must review, understand, and stand behind every change submitted under
their name.

## Token naming (headless)

Tokens are **headless**: a token name must express _role_ or _state_, never
visual style.

- ✅ Allowed — role/state names: `primary`, `danger`, `surface`,
  `text-secondary`, `disabled`, `state-hover`, `focus-ring`, `on-emphasis`,
  `elevation-2`, `radius-control`.
- ❌ Forbidden — style adjectives that describe appearance: `muted`, `soft`,
  `subtle`, `raised`. (A word like `mute` is fine only when it names a genuine
  _state_, e.g. a muted microphone — not when it describes a desaturated color.)
- Primitives hold the raw palette/scale; semantic tokens map them to roles and
  states.

See [`docs/foundations.md`](./docs/foundations.md) for the full naming rules.

## Proposing a new component

When proposing a new headless component, please include:

1. **The pattern** — which WAI-ARIA pattern it implements, and a link to it.
2. **Behavior spec** — interaction model, keyboard map, focus behavior, and
   the states it manages.
3. **Accessibility notes** — roles, ARIA attributes, and screen-reader
   expectations.
4. **Framework parity** — how the primitive maps across the supported
   frameworks. Shared behavior should live in `core/`, with thin
   framework-specific adapters; behavior must be consistent everywhere.
5. **Examples** — minimal usage demonstrating the unstyled primitive.

## Review process

- At least one maintainer review is required before merge.
- Reviews check the three pillars (accessibility, responsiveness, headless),
  cross-framework consistency, and code clarity.
- Address review feedback by pushing follow-up commits to the same branch.

## License

By contributing, you agree that your contributions will be licensed under the
[Apache License 2.0](./LICENSE).
