// Mixed token colours are stored as 8-bit hex, while the browser renders the
// exact mix: a token matches the capture when it is within one 8-bit step.
export const COLOR_TOLERANCE = 1 / 255;

/** The exported token variable a Button paint binds to. */
export function buttonTokenName(variant, state, property, styles) {
  const name = styles.paints[variant.toLowerCase()]?.[state.toLowerCase()]?.[property];
  if (!name) throw new Error(`No Button token for ${variant}/${state}/${property}`);
  return name;
}

export function buttonPaint(variant, state, property, styles, variables, bind) {
  const name = buttonTokenName(variant, state, property, styles);
  const variable = variables.get(name);
  if (!variable)
    throw new Error(`Missing token variable ${name}. Run the update with Components and tokens.`);
  // The bound variable supplies the colour; this placeholder is replaced on binding.
  return bind({ type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", variable);
}

export function verifyButtonColors(board, appearance, variables, collection, styles) {
  const byId = new Map([...variables.values()].map((variable) => [variable.id, variable]));
  const components = board.findAll(
    (node) =>
      node.type === "COMPONENT" &&
      node.getPluginData("invisible-ui-source") === "packages/svelte/src/lib/button/Button.svelte",
  );
  const names = new Set();
  let checked = 0;
  const same = (actual, expected, context, tolerance = 0.00001) => {
    if (typeof actual !== "number" || Math.abs(actual - expected) > tolerance)
      throw new Error(`Button colour verification failed: ${context}`);
  };
  function paintColor(paints, modeId, token) {
    if (paints.length !== 1 || paints[0].type !== "SOLID" || paints[0].visible === false)
      throw new Error("Button requires one visible solid paint per property");
    const paint = paints[0];
    if (byId.get(paint.boundVariables?.color?.id)?.name !== token)
      throw new Error(`Button paint is not bound to ${token}`);
    let value = byId.get(paint.boundVariables.color.id).valuesByMode[modeId];
    const seen = new Set();
    while (value?.type === "VARIABLE_ALIAS") {
      if (seen.has(value.id)) throw new Error("Circular Button colour alias");
      seen.add(value.id);
      value = byId.get(value.id)?.valuesByMode[modeId];
    }
    if (!value) throw new Error("Unresolved Button colour");
    // The bound RGBA variable owns alpha; the paint may expose that same alpha.
    return { ...value, a: value.a ?? 1 };
  }
  for (const component of components) {
    const match = /^Variant=([^,]+), State=(.+)$/.exec(component.name);
    if (!match || names.has(component.name))
      throw new Error("Unexpected or duplicate Button variant");
    names.add(component.name);
    const variant = match[1].toLowerCase();
    const state = match[2].toLowerCase();
    const label = component.children.find((node) => node.name === "Label" && node.type === "TEXT");
    if (!label) throw new Error("Missing Button label");
    for (const theme of ["light", "dark"]) {
      const expected = appearance.themes[theme][variant]?.[state];
      if (!expected) throw new Error(`Unexpected Button state: ${variant}/${state}`);
      const mode = collection.modes.find((item) => item.name.toLowerCase() === theme);
      if (!mode) throw new Error(`Missing ${theme} mode for Button verification`);
      const properties = [
        [component.fills, "background"],
        [component.strokes, "border"],
        [label.fills, "foreground"],
      ];
      const icon = component.children.find((node) => node.name === "Icon");
      if (icon) properties.push([icon.fills, "foreground"]);
      for (const [paints, property] of properties) {
        const actual = paintColor(
          paints,
          mode.modeId,
          buttonTokenName(variant, state, property, styles),
        );
        for (const channel of ["r", "g", "b", "a"])
          same(
            actual[channel],
            expected[property][channel],
            `${variant}/${state}/${theme}/${property}/${channel}`,
            COLOR_TOLERANCE,
          );
      }
      same(component.opacity, expected.opacity, `${variant}/${state}/opacity`);
      same(component.strokeWeight, expected.borderWidth, `${variant}/${state}/border width`);
      if (label.textDecoration !== (expected.underline ? "UNDERLINE" : "NONE"))
        throw new Error(`Button text decoration differs: ${variant}/${state}`);
      checked++;
    }
  }
  if (checked !== 30) throw new Error(`Expected 30 Button colour cases, verified ${checked}`);
  return checked;
}
