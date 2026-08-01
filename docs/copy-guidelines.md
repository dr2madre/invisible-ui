# Copy guidelines (internal)

How to write every text in this project: documentation, marketing pages, UI
messages, commit-facing prose. These rules sit beside the button-copy
guideline already recorded in ADR 0005 ("buttons name outcomes").

## Voice

Direct, open, simple, synthetic, **active**. Short sentences. Say the thing.

## State things positively

Rhetorical negation is banned. If a sentence stands without its negative half,
delete the negative half.

| Banned form | Write instead |
| --- | --- |
| "It is not X — it is Y." | "It is Y." |
| "Not only X, but also Y." | "X and Y." |
| "Rather than X, we do Y." / "Instead of X, Y." | "We do Y." |
| A negative preamble, then the point. | The point. |

Before / after, from our own pages:

- ~~"Usability is not a layer applied on top of these components — it is what
  they are made of."~~ → "Usability is what these components are made of."
- ~~"Accessible by default, not by afterthought."~~ → "Accessible by default."
- ~~"Your brand, not ours."~~ → "Your brand."

**Allowed:** factual absence claims where the absence *is* the benefit: "no
build step", "zero dependencies", "the core needed zero changes". Those state
a measurement.

## The name stays out of promises

Never use the name "Invisible" inside a sentence as a slogan that promises
things. Slogan-built marketing phrases read badly and box the copy in.
Explain the name once, factually, with the terms of the UX field. Then move
on.

- ~~"Invisible to your users. Invisible to your stack. Invisible as a
  brand."~~ → explain what the components do, in plain sentences.
- ~~"One name, three promises."~~ → delete.

## No promises about the future

State present facts and measurements. The project's future is unknowable, so
sentences that guarantee it are claims we cannot keep. Emphatic phrasing is
always a mistake.

- ~~"made to outlive the trends"~~ → "tested deeply" (a present fact).
- ~~"will always work"~~ → "works today in Svelte, React, Python and plain
  HTML" (a measurement).

## No em dashes

The em dash (—) is high-register documentation punctuation; people write
with commas, colons, periods and parentheses. Use those. Hyphens inside
compound words ("framework-agnostic", "first-class") stay: that is spelling,
not punctuation.

- ~~"The hard parts — keyboard behaviour, focus — live in one shared
  core."~~ → "The hard parts (keyboard behaviour, focus) live in one shared
  core."

## Assume intelligent readers

The audience is developers and IT leads who already care about user
experience. State requirements and facts; skip the lectures about why they
should care.

A special case of this rule: never frame design and development as camps —
never mention the split, **not even to deny it**. Sentences like "designers
and developers together" or "it is not a layer on top" evoke the split they
try to dismiss. List the qualities; drop the framing.

## Plain language

No unexplained jargon: if a technical term must appear for search or
precision, give it a one-line plain explanation the first time (as the why
page does with W3C). Technical keywords people search for stay in English in
every locale (see `docs/translation-notes.md`).
