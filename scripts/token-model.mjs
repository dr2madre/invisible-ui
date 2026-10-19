// Shared token traversal and mode resolution. Modes are repository metadata,
// not segments of a public token name.
export const MODES = "com.invisible-ui.modes";
export const MIX = "com.invisible-ui.mix";

export function tokenEntries(tree, path = [], inheritedType) {
  const type = tree.$type ?? inheritedType;
  if (Object.hasOwn(tree, "$value")) return [[path.join("."), { ...tree, $type: type }]];
  return Object.entries(tree).flatMap(([key, child]) =>
    key.startsWith("$") ? [] : tokenEntries(child, [...path, key], type),
  );
}

export function setToken(tree, path, token) {
  const parts = path.split(".");
  let parent = tree;
  for (const key of parts.slice(0, -1)) {
    if (["__proto__", "prototype", "constructor"].includes(key))
      throw new Error(`Unsafe path ${path}`);
    parent = parent[key] ??= {};
    if (Object.hasOwn(parent, "$value")) throw new Error(`Token/group collision: ${path}`);
  }
  const key = parts.at(-1);
  if (["__proto__", "prototype", "constructor"].includes(key))
    throw new Error(`Unsafe path ${path}`);
  if (Object.hasOwn(parent, key)) throw new Error(`Duplicate token: ${path}`);
  parent[key] = token;
}

export function modeTokens(tree, mode = "light") {
  if (!["light", "dark"].includes(mode)) throw new Error(`Unknown mode: ${mode}`);
  return new Map(
    tokenEntries(tree).map(([path, token]) => {
      const override = token.$extensions?.[MODES]?.[mode];
      const extensions = { ...token.$extensions };
      delete extensions[MODES];
      if (override) {
        delete extensions[MIX];
        Object.assign(extensions, override.$extensions);
      }
      return [path, { ...token, ...override, $extensions: extensions }];
    }),
  );
}

export const cssName = (path) => `--ds-${path.replaceAll(".", "-")}`;

export function resolveTokens(tree, { mode = "light", overrides = {} } = {}) {
  validateTokenModel(tree);
  const tokens = modeTokens(tree, mode);
  for (const [path, value] of Object.entries(overrides)) {
    const token = tokens.get(path);
    if (!token) throw new Error(`Unknown override: ${path}`);
    if (path.startsWith("colors.palette.")) throw new Error(`Palette is immutable: ${path}`);
    const extensions = { ...token.$extensions };
    delete extensions[MIX];
    tokens.set(path, { ...token, $value: value, $extensions: extensions });
  }
  const resolved = new Map();
  function valueOf(value, type, stack) {
    const ref = typeof value === "string" && /^\{([^{}]+)\}$/.exec(value);
    if (!ref) return value;
    if (tokens.get(ref[1])?.$type !== type)
      throw new Error(`Missing or incompatible reference: ${ref[1]}`);
    return visit(ref[1], stack);
  }
  function visit(path, stack = []) {
    if (stack.includes(path)) throw new Error(`Token cycle: ${[...stack, path].join(" -> ")}`);
    if (resolved.has(path)) return resolved.get(path);
    const token = tokens.get(path);
    if (!token) throw new Error(`Missing token: ${path}`);
    const next = [...stack, path];
    const recipe = token.$extensions?.[MIX];
    let value;
    if (recipe) {
      const base = rgba(valueOf(recipe.base, "color", next));
      const other = rgba(valueOf(recipe.with, "color", next));
      const a = base.alpha * recipe.amount + other.alpha * (1 - recipe.amount);
      const components = base.components.map((channel, i) =>
        a === 0
          ? 0
          : (channel * base.alpha * recipe.amount +
              other.components[i] * other.alpha * (1 - recipe.amount)) /
            a,
      );
      value = {
        colorSpace: "srgb",
        components,
        alpha: a,
        hex: `#${components.map((c) => channelByte(c).toString(16).padStart(2, "0")).join("")}`,
      };
    } else value = valueOf(token.$value, token.$type, next);
    if (token.$type === "color") rgba(value);
    else if (
      ["number", "fontWeight"].includes(token.$type) &&
      (typeof value !== "number" || !Number.isFinite(value))
    )
      throw new Error(`Invalid number: ${path}`);
    else if (
      token.$type === "dimension" &&
      !(typeof value === "string" && /^-?(?:\d+(?:\.\d+)?)(?:px|rem)$/.test(value))
    )
      throw new Error(`Invalid dimension: ${path}`);
    resolved.set(path, value);
    return value;
  }
  for (const path of tokens.keys()) visit(path);
  return resolved;
}

export function rgba(value) {
  if (value === "transparent") return { components: [0, 0, 0], alpha: 0 };
  if (typeof value === "string" && /^#[a-f\d]{6}$/i.test(value))
    return {
      components: [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255),
      alpha: 1,
    };
  if (
    value &&
    value.colorSpace === "srgb" &&
    Array.isArray(value.components) &&
    value.components.length === 3 &&
    value.components.every(
      (c) => typeof c === "number" && Number.isFinite(c) && c >= 0 && c <= 1,
    ) &&
    typeof (value.alpha ?? 1) === "number" &&
    (value.alpha ?? 1) >= 0 &&
    (value.alpha ?? 1) <= 1
  )
    return { components: value.components, alpha: value.alpha ?? 1 };
  throw new Error(`Invalid colour: ${JSON.stringify(value)}`);
}

// Exact half-byte mixes must not round down due to binary floating-point noise.
export const channelByte = (channel) => Math.round(channel * 255 + 1e-10);

export function validateTokenModel(tree) {
  const entries = tokenEntries(tree);
  const names = new Set();
  for (const [path, token] of entries) {
    if (!/^(colors|metrics|typography|components)\./.test(path))
      throw new Error(`Invalid group: ${path}`);
    if (!path.split(".").every((part) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(part)))
      throw new Error(`Invalid path: ${path}`);
    if (!token.$type) throw new Error(`Missing type: ${path}`);
    if (names.has(cssName(path))) throw new Error(`CSS collision: ${path}`);
    names.add(cssName(path));
  }
  for (const mode of ["light", "dark"]) {
    const tokens = modeTokens(tree, mode);
    const done = new Set();
    function visit(path, stack = new Set()) {
      if (stack.has(path)) throw new Error(`Token cycle: ${[...stack, path].join(" -> ")}`);
      if (done.has(path)) return;
      const token = tokens.get(path);
      if (!token) throw new Error(`Missing token: ${path}`);
      const next = new Set([...stack, path]);
      const mix = token.$extensions?.[MIX];
      if (
        mix &&
        (mix.space !== "srgb" || !Number.isFinite(mix.amount) || mix.amount < 0 || mix.amount > 1)
      )
        throw new Error(`Invalid mix: ${path}`);
      for (const value of [token.$value, mix?.base, mix?.with]) {
        const ref = typeof value === "string" && /^\{([^{}]+)\}$/.exec(value);
        if (!ref) continue;
        const dependency = tokens.get(ref[1]);
        if (!dependency) throw new Error(`Missing token: ${ref[1]} from ${path}`);
        if (dependency.$type !== token.$type)
          throw new Error(`Type mismatch: ${path} -> ${ref[1]}`);
        if (
          path.startsWith("colors.palette.") ||
          (path.startsWith("colors.") && !ref[1].startsWith("colors.")) ||
          (path.startsWith("components.general.") &&
            ref[1].startsWith("components.") &&
            !ref[1].startsWith("components.general."))
        )
          throw new Error(`Invalid dependency: ${path} -> ${ref[1]}`);
        visit(ref[1], next);
      }
      done.add(path);
    }
    for (const path of tokens.keys()) visit(path);
  }
  return entries.length;
}
