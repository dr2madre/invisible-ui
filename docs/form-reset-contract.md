# The form reset contract

A decision memo. It records what `form.reset()` does to Invisible UI controls
today, what the HTML standard says it should do, and the four contracts the
project could adopt. It ends with one recommendation. Nothing here is
implemented: the contract is not decided until a maintainer decides it.

Investigated on 9 September 2026 against `main` at `544cd34`, in Chromium,
Firefox and WebKit. Every finding marked as reproduced was identical in all
three engines.

## Method, and what it is worth

A real `<form>` in a real browser, holding eighteen Invisible UI controls
(nineteen payload names), mounted with non-default values and reset by clicking
a real `<button type="reset">`. Beside it, two native reference forms: one whose
values were written as **attributes**, one with identical controls whose values
were written as **DOM properties only**. Recorded per control: the payload
before and after, the visible state after, which callbacks fired, and the DOM
facts (`value` attribute against `.value` against `.defaultValue`, `checked`
against `defaultChecked`, per-option `selected`).

**Verified by execution**: Svelte and Vue, client render, all three engines; the
native reference forms; the Svelte SSR output through the package's own SSR
harness, served as static markup and reset in Chromium.

**Not verified**: React and Elements in a browser; Vue SSR; SSR followed by
hydration end to end. Where this memo says anything about those, it says so and
marks it as read from the source, not observed.

## What the native reference forms settle first

No framework in the page at all:

| values written as | payload before reset | payload after reset |
|---|---|---|
| **attributes** | `name=Ada, bio=Hello, sub=yes, country=fr, vol=30, plan=pro` | **identical** |
| **properties only** | `name=Ada, bio=Hello, sub=yes, country=fr, vol=30` | `name=""`, `bio=""`, `sub` dropped, `country=it`, `vol=50` |

That second row is the Svelte adapter's failure signature, produced with no
framework present. So the losses below are not a jsdom artefact and not a
framework bug: they are the specified consequence of writing values as
properties without also writing defaults.

## What the standard says

HTML section 4.10.23, resetting a form: firing `reset` at the form, and if it is
not cancelled, invoking the reset algorithm of each resettable element. Then, in
the standard's own words:

> Changes made to form controls as part of these algorithms do not count as
> changes caused by the user (and thus, e.g., do not cause `input` events to
> fire).

The per-element algorithms restore **defaults**, not state: an `input` takes the
value of its `value` content attribute (empty string if absent) and its
checkedness from the presence of the `checked` attribute; a `textarea` takes its
**child text content**; a `select` sets each option's selectedness from that
option's `selected` **attribute**, then runs the selectedness setting algorithm,
which for a single-line select with nothing selected picks the first option
**that is not disabled**.

Two `value` IDL modes matter. In mode **"value"** (text, range) the setter
writes only the property. In mode **"default"** (hidden) the setter writes the
content attribute, which is also the default. That difference explains the whole
split below.

## What happens today

`OK` means it matches the native reference.

| Control | Submitted element | Native reference | Svelte today | Vue today |
|---|---|---|---|---|
| TextField | `input[type=text]` | restores the `value` attribute | **becomes empty** | **no-op**: its default drifts with typing |
| Textarea | `textarea` | restores the child text | **becomes empty** | **becomes empty** |
| Checkbox | `input[type=checkbox]` | restores the `checked` attribute | **dropped** | OK until edited, then no-op |
| Switch | `input[type=checkbox]` | restores the `checked` attribute | **dropped** | OK until edited, then no-op |
| ToggleButton | `input[type=checkbox]` | restores the `checked` attribute | **dropped** | OK until edited, then no-op |
| Radio | `input[type=radio]` | restores the `checked` attribute | **dropped** (read from source) | not probed |
| RadioGroup | `input[type=radio]` xN | restores the `checked` attribute | **dropped** | OK until edited, then no-op |
| CheckboxGroup | `input[type=checkbox]` xN | restores the `checked` attributes | **dropped** | OK until edited, then no-op |
| SegmentedControl | `input[type=radio]` xN | restores the `checked` attribute | **dropped** | OK until edited, then no-op |
| RatingGroup | `input[type=radio]` xN | restores the `checked` attribute | **dropped** | OK until edited, then no-op |
| Slider | `input[type=range]` | restores the `value` attribute | **jumps to the midpoint** | OK until moved, then no-op |
| Select | `select` | restores the `selected` attributes | **jumps to the first real option** | **jumps to the first real option** |
| Combobox | hidden + visible text | not native | payload kept, field cleared | payload kept, field cleared |
| MultiSelect | hidden xN | not native | payload kept | payload kept |
| PinInput | hidden + boxes | not native | payload kept, boxes cleared | payload kept, boxes cleared |
| TimeField | hidden + visible | not native | payload kept, field cleared | payload kept, field cleared |
| DatePicker | hidden + visible | not native | payload kept, field cleared | payload kept, field cleared |
| DateRangePicker | hidden x2 + visible | not native | payload kept, field cleared | payload kept, field cleared |
| **NumberField** | hidden + visible | not native | **restores, silently** | **restores, silently** |
| UploadDropArea | `input[type=file]` | empties the file list | payload OK, component state stale | not probed |
| *any control* | | fires no `input` or `change` | fires nothing | fires nothing |

Three consequences are worth stating plainly.

**No callback fires on a reset, in either adapter, for any control.** The
visible state and the payload can disagree, and a controlled parent is never
told.

**The select case is worse than an empty control.** Neither adapter ever sets an
option's `selected` attribute: Svelte writes `option.selected`, a property, and
Vue passes the value to the `<select>` and never touches the options. After a
reset no option has selectedness, the placeholder is `disabled` and therefore
skipped, and the first real option wins. The user is shown, and submits, a
plausible selection they never made.

**The hidden-input families keep a payload their visible surface no longer
shows.** A Combobox with an empty-looking field still submits `fruit=pear`; a
PinInput with four blank boxes still submits `pin=1234`. Type `9876` into the
pin first and the boxes go blank while the payload becomes `pin=9876`. This is
not a bug in the reset algorithm but its correct outcome: for `type=hidden` the
property write already wrote the default, so there is nothing for a reset to
change, while the visible `type=text` input beside it clears.

### Vue is not correct, it only looks correct until you type

The brief recorded Vue as behaving correctly. It does not. Field `name`, user
types `Grace`:

| | at mount | after typing | after reset |
|---|---|---|---|
| native | attr `Ada` / value `Ada` / default `Ada` | attr `Ada` / value `Grace` / default `Ada` | attr `Ada` / value **`Ada`** |
| Svelte | attr absent / value `Ada` / default empty | attr absent / value `Grace` / default empty | attr absent / value **empty** |
| Vue | attr `Ada` / value `Ada` / default `Ada` | attr **`Grace`** / value `Grace` / default **`Grace`** | attr `Grace` / value **`Grace`** |

Vue's DOM patching writes `value`, `checked` and `selected` as property *and*
attribute, which is why Vue passes a mount-only test. But the Vue TextField
renders its own internal state rather than the prop, so every keystroke
rewrites the `value` attribute and drags the **default** along with it. Verified
on the full form: edit `name` to `Grace`, reset, payload is `name=Grace`.

So the honest framing is that **no adapter implements form reset for any control
except NumberField**. Svelte forgets the default; Vue overwrites it. Two
mechanisms, one outcome.

### Why nobody noticed: the docs site cannot show this

Server-rendering the Svelte form emits every default (`value="Ada"`, the
textarea's child text, `checked=""`, `<option value="fr" selected="">`,
`value="30"`), and a reset of that static markup leaves the payload unchanged.
SSR even fixes the select case. The docs site is server-rendered and then
hydrated, and Svelte's client setters only write properties, never remove
attributes, so the demos keep their SSR defaults.

**A test written against the docs site passes with the defect fully present.**
Only a client-only render shows it. (The "still correct after hydration" step is
inferred from the verified SSR output and the verified setter behaviour, not
observed end to end.)

### The precedent already in the tree

Searching for a reset listener across `core/` and every adapter finds exactly
one implementation: **NumberField**, in both Svelte and Vue, with the same
comment in both, "Form reset restores the mount value and display without
callbacks." About ten lines per adapter, plus a no-notify `reset(value)` on the
machine. The project has already made this decision once, silently, for one
control out of twenty.

## The four contracts

### (a) Restore, and report through the existing change callback

Breaks ADR 0011 twice: reflection never emits and only a user action reports (a
reset is definitionally not a user change), and one action means one callback
(one reset click would emit one callback per control). It also fires those
callbacks while the browser is still walking the form's control list, so a
controlled parent's update lands in the middle of the algorithm. Matches no
native behaviour: the standard says explicitly that no `input` event fires.

### (b) Restore, and report through a separate `onReset`

Honest about being a different event, so one action one callback survives in
spirit, and a controlled parent gets what it needs where it needs it. But it is
still N per-control notifications standing in for one form-level event the
consumer already receives, and it grows the public prop vocabulary on every form
control, which ADR 0011 deliberately fixes. The most code of the four: a prop,
wiring and documentation per control per adapter, across four adapters.

### (c) Restore silently; the consumer reads the form

Matches native exactly and ADR 0011 exactly, with no public API growth. The
consumer's hook is the native `reset` event on the `<form>`: cancelable, so they
can prevent it and replace the whole native restore with their own, and
bubbling, so one handler covers every control.

The timing of that hook matters, and it is the standard's, verified here in
Chromium, Firefox and WebKit, for `form.reset()` and for a real press on a
reset button alike. **The event is delivered before the browser runs the
restore.** Inside the handler every control still holds its pre-reset value,
and a `FormData` built there carries the pre-reset payload. So the handler is
the right place to restore the consumer's own state, which is theirs and needs
no reading, and the wrong place to read the form: a consumer who wants the
restored values must defer the read to a later task, after the native
algorithm has finished.

The consequence that must be documented: a controlled parent holding the value
in its own state goes stale, its state still saying `Grace` while the control
shows `Ada`. That is precisely native's consequence too, and the idiomatic
answer in React and Vue is the same one, handle the form's reset and reset your
own state there.

### (d) No participation; consumers re-key the form

Zero code, and not a fix. It leaves `form.reset()`, `<button type="reset">` and
every native reset path permanently wrong. Re-keying destroys focus, scroll
position and uncommitted drafts in unrelated fields, which is an accessibility
regression. And it does nothing about the dangerous case: a combobox showing an
empty field that submits a value.

## Recommendation: (c), restore silently

Four things decide it.

1. **The standard already answered the notification question** in one sentence:
   reset changes do not count as changes caused by the user and do not fire
   `input` events. ADR 0011 says only a user action reports. Options (a) and (b)
   contradict both documents at once; (c) satisfies both without amending
   either.
2. **The notification consumers need already exists, and is better than
   anything a control could add**: one event, on the form, bubbling and
   cancelable. (a) and (b) add N duplicates of it.
3. **The project already chose (c)** for NumberField, in both adapters, with the
   rule written into the code comment. Choosing (c) makes nineteen controls
   consistent with the one that works, instead of making the one that works
   inconsistent with a new convention.
4. **It is the only option with no public API growth**, which matters while
   ADR 0011 declares the callback contract part of the public API and breaking
   it a breaking change whatever the version number says.

So the answer to "should a reset notify the consumer" is **no**: not through the
change callback, and not through a new per-control callback either. The form
already tells them, once.

### What (c) still requires, in two layers

**Layer 1, emit real DOM defaults.** This fixes the text, checkbox, radio,
slider and select families by letting the browser's own algorithm work. Pair
`defaultValue` and `defaultChecked` with `value` and `checked` in Svelte (5.56
ships setters for exactly this); set the `selected` attribute on the chosen
option in both adapters; render the textarea's content as child text, not a
`value` attribute, in Vue; and in Vue stop letting the rendered value drag the
attribute, so the attribute comes from the prop and the property from the state.

**Layer 2, tell the component.** This fixes the silent-disagreement cases and
the hidden-input families, whose payload lives in an element the reset algorithm
cannot help while their visible surface lives in another. Each stateful control
listens for `reset` on its form owner and restores its internal state without
emitting: NumberField's pattern, generalized. Put the listener in `core/` as one
shared helper that returns its teardown, so adapters stay thin, and give each
machine a `reset(value)` beside its existing no-notify `syncX` functions.

**One rule to get right in both layers**: what a reset restores is the
**current default**, and the current default is the last value the consumer
passed through the public prop, which Layer 1 reflects into the DOM default.
It is never the value the user has edited, and never a snapshot taken at
mount. Native behaves the same way: it restores the current `value` content
attribute, which an author may change at any time. Both adapters freeze a
mount snapshot today, so on a controlled form whose prop has moved since
mount, a reset would install a value the parent never held. (For an
uncontrolled control the prop was passed once, so its last value is the mount
value; the rule changes nothing there, only where it comes from.)

### What consumers would have to do

Uncontrolled consumers: nothing, reset simply starts working. Controlled
consumers: add one `reset` handler on the `<form>` restoring their own state,
the same line they would already need around native controls. Their own state
they can set right there, in the handler; the form's restored values they can
only read later, in a task queued past the native algorithm, because the event
arrives before the restore runs. Because (c) deliberately does not tell them,
this has to be documented once in the forms guidance and linked from every
control page, never left implicit. It ships as a
documented behaviour change with a changeset: anyone who worked around the
current behaviour sees a difference, and alpha is the right time.

### How it would be tested

- **Core**: per machine, `reset(value)` writes state and emits nothing.
- **Adapters** (jsdom is adequate): one composed form, `form.reset()`, assert
  the whole payload equals the mount payload, names and order, plus zero
  callbacks.
- **Browser, against a client-only render.** This is the layer that cannot be
  skipped, because the docs site is server-rendered and a docs-based test passes
  with the defect present. Assert the payload before, the payload after, and the
  visible state after, for every control, with a native control group on the
  same page as the reference. One engine is enough: every finding here was
  identical across the three.

## Separable defects

These stand on their own and do not depend on which contract is chosen, except
where noted.

1. **The Vue Textarea loses its value on a reset even when untouched.**
   `value` is not a content attribute of `textarea`, whose default value is its
   child text content, so `<textarea value="Hello">` sets a property with no
   default behind it. Fix: render the text as the element's child, as Svelte's
   SSR already does. (Anticipates Layer 1 of the recommendation, so it waits on
   the decision.)
2. **Neither adapter's Select ever emits `selected`**, which is what sends a
   reset to the first real option. Adding the attribute is a pure output change:
   no API, no notification question, no reset listener. (Also Layer 1.)
3. **The Svelte and Vue reset tests assert nothing.** In both
   `form-composition.test.ts` files, the test that names reset ends by asserting
   the payload is unchanged after `form.reset()`, and it passes because the
   typed value was never committed, so the hidden input never changed. Not
   because a reset restored anything. Committing before resetting turns a false
   positive into real coverage, and would then fail, which is the point.
4. **UploadDropArea is never told about a reset.** The file input empties itself
   correctly, but the component's visible file list does not, so after a reset it
   lists files the form will not submit. Nothing to restore, only something to
   clear.
5. **NumberField restores the mount value, not the current default**, in both
   adapters. One line each, and independent of the wider decision, since
   NumberField already restores silently.
