# Contributing

Thanks for your interest in contributing to **Invisible UI** (by
nozcadesign), a headless, accessible, multi-framework component library.

> **Note:** The project is in alpha. These guidelines describe the current
> workflow and evolve with the project.

## Ground rules

This library has three pillars. Every contribution upholds them:

- **Accessibility**: follow the relevant
  [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) pattern.
  Correct roles and attributes, full keyboard support and proper focus
  management are required. Any styled output (examples and the theme layer)
  must meet **WCAG AA** contrast: **4.5:1** for normal text and **3:1** for
  large text.
- **Responsiveness**: components are **responsive by default**. They work
  across viewport sizes and input modalities (pointer, touch, keyboard) and
  never assume a fixed width or a single input type.
- **Headless**: the core ships behavior and semantics only. Opinionated
  visual styling stays out of the primitives; the recommended (overridable)
  visual defaults live in [`docs/foundations.md`](./docs/foundations.md).

## Branching and merging

1. Create a branch off `main` with a short kebab-case name that describes
   the change, prefixed by its type: `feature/combobox`, `fix/link-tests`,
   `docs/why-page`, `chore/trim-gitignore`. Every name in this repository
   (branches, files, examples) describes its content; generated or
   placeholder names are rejected in review.
2. Keep changes focused; one logical change per pull request.
3. Open a pull request against `main`. Pull requests are **squash-merged**.
4. After the merge: update local `main` (`git fetch` + fast-forward) and
   delete the branch.

## Commit conventions

Use the [Conventional Commits](https://www.conventionalcommits.org/) format;
commitlint enforces it (header up to 100 characters, lowercase subject, body
lines up to 100 characters):

```
type(scope): short summary

feat(react): add headless Combobox primitive
fix(core): correct roving tabindex in Menu
docs: document Dialog usage
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

Commit messages and pull request descriptions describe the change and
nothing else: remove any footer, signature or link that a tool appends, in
the message and in the pull request body, before the merge.

## Authorship & human oversight

Every contribution requires **human review and oversight** before it is
pushed. Commits must be authored by a **human account**. Configure your git
author name and email to match your own (or your GitHub) identity before
contributing; commits from the maintainer are authored as `dr2madre
(48051639+dr2madre@users.noreply.github.com)`.

Signing commits is encouraged: the signature proves where a commit comes
from. The responsibility behind it is always a person's.

AI assistants may help draft changes, but they must **never** appear as the
author of a commit, neither as the sole author nor as a co-author. No
`Co-Authored-By` trailers for AI tools, and no automated or placeholder
author identities. An AI cannot accept responsibility for code, so it cannot
be credited as an author.

**Only the human who uses the AI is responsible for what gets pushed.** That
person must review, understand, and stand behind every change submitted
under their name.

## Writing

All prose (documentation, site copy, UI messages) follows
[`docs/copy-guidelines.md`](./docs/copy-guidelines.md): direct, simple,
active voice, positive statements, no em dashes, no metaphors, no promises
about the future. Translation and terminology notes live in
[`docs/translation-notes.md`](./docs/translation-notes.md).

## Token naming (headless)

Tokens are **headless**: a token name expresses _role_ or _state_, never
visual style.

- Allowed, role/state names: `primary`, `danger`, `surface`,
  `text-secondary`, `disabled`, `state-hover`, `focus-ring`, `on-emphasis`,
  `elevation-2`, `radius-control`.
- Forbidden, style adjectives that describe appearance: `muted`, `soft`,
  `subtle`, `raised`. (A word like `mute` is fine only when it names a
  genuine _state_, e.g. a muted microphone.)
- Primitives hold the raw palette and scales; semantic tokens map them to
  roles and states.

See [`docs/foundations.md`](./docs/foundations.md) for the full naming rules.

## Proposing a new component

When proposing a new headless component, please include:

1. **The pattern**: which WAI-ARIA pattern it implements, with a link.
2. **Behavior spec**: interaction model, keyboard map, focus behavior, and
   the states it manages.
3. **Accessibility notes**: roles, ARIA attributes, and screen-reader
   expectations.
4. **Framework parity**: how the primitive maps across the supported
   frameworks. Shared behavior lives in `core/`, with thin
   framework-specific adapters; behavior stays consistent everywhere.
5. **Examples**: minimal usage demonstrating the unstyled primitive.

## Decisions

Significant choices are recorded in [`docs/adr/`](./docs/adr/). Read the
existing records before changing an established pattern, and add a record
when a decision is worth remembering.

## Review process

- At least one maintainer review is required before merge.
- Reviews check the three pillars (accessibility, responsiveness, headless),
  cross-framework consistency, naming, and code clarity.
- Address review feedback by pushing follow-up commits to the same branch.

## License

By contributing, you agree that your contributions will be licensed under
the [European Union Public Licence v. 1.2](./LICENSE) (EUPL-1.2).
