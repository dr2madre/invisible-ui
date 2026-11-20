# Invisible UI component pilot

This local Figma plugin creates editable component sets from the contracts and
CSS in the Invisible UI repository. It currently covers Button, Text Field,
and Card.

## Run it

Figma requires its desktop app for local plugin development.

1. Open the target design file in Figma Desktop.
2. Open **Plugins → Development → Import plugin from manifest**.
3. Select this directory's `manifest.json`.
4. Run **Invisible UI component pilot** from **Plugins → Development**.
5. Choose **Components only** or **Components and tokens**, then select **Update**.

Components only leaves token values unchanged and requires an existing
`Invisible UI` collection that already holds the `components/button/`
variables. Components and tokens creates or updates the collection and its
Light/Dark modes before generating the components.
Matching variable names retain their IDs and aliases. Unrelated variables and
modes remain in place, including variables from an export made before the
version-2 token names, such as `role/color-background`; delete those by hand.
Duplicate names or incompatible variable types stop the token update. If the component step fails after token success, the dialog
reports that tokens have already been updated.

Tokens are bundled directly from `packages/tokens/tokens.json` by
`pnpm components:figma`; the plugin does not fetch changes from GitHub.
Regenerate it after updating the local token source. If an older imported
manifest does not show the dialog, reimport `manifest.json` once.

The first run creates a board on the current page. Later runs update the generated
board on the current page, or the last generated page in the Pages list if the
current page has no generated board. Open the page you want to update before
running the plugin when your file contains several pilots.

Updates keep existing component and layer IDs. Instances remain connected to
their main components. Generated styles, text, and layout are refreshed from
the plugin; manual changes to those properties on the main components are
overwritten. Additional user layers remain in place. Renamed, missing, or
ambiguous generated layers stop the update before any existing node is changed.
This version updates matching structures; it does not migrate structural changes.

The plugin builds a hidden temporary board on the current page, validates the
existing structure, and then updates it without moving existing nodes or changing
pages. Only nodes created for that run are removed afterwards. Nested generated
boards are recognised. An update failure attempts
to restore the saved node properties and reports if Undo is needed.

## Source and generation

Run `pnpm components:figma` after changing the component or plugin sources.
`code.js` is generated from `plugin.js`, `sync.js`, `tokens.js`,
`button-colors.js`, and the CSS in `Card.svelte` and `Button.svelte`. The manifest continues to load
`code.js`. `pnpm components:figma:check` detects stale output, as does the script
test suite in the quality gate.

Button fills, borders, and text bind directly to the exported
`components/button/` token variables. Generation reads from `Button.svelte`
which token each variant and state uses; disabled keeps the resting colours and
applies the value of the disabled opacity token. Generation stops if the CSS
uses a colour that the token export does not create. The plugin creates no
colour variables of its own. Files built with an earlier version contain a `component/button` group of
derived variables: delete that group by hand once after updating.

The capture of the real Svelte Button rendered in Chromium
(`button-appearance.json`: five variants, default, hover, and disabled, Light
and Dark) is only a check, not a source of variables. The script tests and the
plugin compare the token values with the rendered background, text, border,
alpha, opacity, border width, and underline. Mixed colours are stored as 8-bit
hex, so a colour matches within one 8-bit step. Source changes invalidate the
capture. Install Chromium with `pnpm exec playwright install chromium` if it is
unavailable.

Run `pnpm components:figma:verify` to compare all 30 cases against the browser
again. Diagnostic screenshots are saved in `output/playwright/`. During import,
the plugin checks the generated Button paints and variable values for both
modes. A mismatch fails the update and triggers node-property rollback.
Variable updates are separate and are not rolled back with nodes.
These are property checks, not pixel comparisons with Figma. Geometry, the
Danger placeholder icon, focus and loading states, and consumer CSS overrides
are outside this check. Text Field and Card colours still use manual mappings.

Card owns the media layout rules: vertical media stretches with its flex
container; horizontal media uses `--ds-card-horizontal-media-size` (default
`8rem`) and stretches to the card height. The generator reads those rules and
the body padding and gap from the component's CSS AST. CSS custom property
defaults are resolved with a 16px root. Consumer overrides are not evaluated.
Unsupported layout values stop generation instead of silently exporting an old
value.

The 320px sample card width, 140px placeholder height, and 300px horizontal body
width are preview inputs, not component defaults. Real media content supplies
its own dimensions. Other component styling still uses the pilot's manual
mapping; this is not a general CSS-to-Figma converter.

## What it creates

- A Button component set with `Variant` and `State` properties. It contains
  five semantic variants and three representative states.
- A Text Field component set with a `State` property for default, focus, error,
  success, and disabled.
- A Card component set with `Variant` and `Orientation` properties for vertical
  media, horizontal media, and dashboard layouts.

The three sets contain 23 variants. They appear in the local Assets panel and
each instance exposes the relevant variant properties in Figma.

Colour fills, strokes, text, and corner radii use variables from the local
`Invisible UI` collection when the matching variable exists. Spacing is not
bound to variables yet: Card spacing comes from `Card.svelte`, and Button
padding is drawn at its default size.

Every generated component records its source Svelte file as plugin data. This
pilot keeps the repository as the source of truth. Shared token updates require
the Components and tokens option.
