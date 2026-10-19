export function buttonColorTokens(appearance) {
  const output = { Light: {}, Dark: {} };
  for (const [theme, variants] of Object.entries(appearance.themes)) {
    for (const [variant, states] of Object.entries(variants)) {
      for (const [state, style] of Object.entries(states)) {
        for (const property of ["background", "foreground", "border"]) {
          output[theme === "light" ? "Light" : "Dark"][
            `component/button/${variant}/${state}/${property}`
          ] = { type: "COLOR", value: style[property] };
        }
      }
    }
  }
  return output;
}

export function buttonPaint(variant, state, property, appearance, variables, bind) {
  const name = `component/button/${variant.toLowerCase()}/${state.toLowerCase()}/${property}`;
  const variable = variables.get(name);
  if (!variable) throw new Error(`Missing generated Button colour: ${name}`);
  const { r, g, b } = appearance.themes.light[variant.toLowerCase()][state.toLowerCase()][property];
  return bind({ type: "SOLID", color: { r, g, b } }, "color", variable);
}

export function verifyButtonColors(board, appearance, variables, collection) {
  const byId = new Map([...variables.values()].map((variable) => [variable.id, variable]));
  const components = board.findAll(
    (node) =>
      node.type === "COMPONENT" &&
      node.getPluginData("invisible-ui-source") === "packages/svelte/src/lib/button/Button.svelte",
  );
  const names = new Set();
  let checked = 0;
  const same = (actual, expected, context) => {
    if (typeof actual !== "number" || Math.abs(actual - expected) > 0.00001)
      throw new Error(`Button colour verification failed: ${context}`);
  };
  function paintColor(paints, modeId) {
    if (paints.length !== 1 || paints[0].type !== "SOLID" || paints[0].visible === false)
      throw new Error("Button requires one visible solid paint per property");
    const paint = paints[0];
    let value = paint.boundVariables?.color
      ? byId.get(paint.boundVariables.color.id)?.valuesByMode[modeId]
      : paint.color;
    const seen = new Set();
    while (value?.type === "VARIABLE_ALIAS") {
      if (seen.has(value.id)) throw new Error("Circular Button colour alias");
      seen.add(value.id);
      value = byId.get(value.id)?.valuesByMode[modeId];
    }
    if (!value) throw new Error("Unresolved Button colour");
    // The bound RGBA variable owns alpha; the paint may expose that same alpha.
    return { ...value, a: paint.boundVariables?.color ? (value.a ?? 1) : (paint.opacity ?? 1) };
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
        const actual = paintColor(paints, mode.modeId);
        for (const channel of ["r", "g", "b", "a"])
          same(
            actual[channel],
            expected[property][channel],
            `${variant}/${state}/${theme}/${property}/${channel}`,
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
