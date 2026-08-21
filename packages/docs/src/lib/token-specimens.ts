// Builds the CSS the catalog paints its specimens with. One rule per token,
// generated from the registry, and every rule reads the live custom property:
// no colour or size is ever copied here, so a specimen cannot drift from the
// stylesheet that ships.

export interface TokenEntry {
  name: string;
  id: string;
  tier: string;
  valueType: string;
  ownership: string;
  stability: string;
  hasAlpha: boolean;
  purpose: string | null;
  group: string | null;
  aliasChain: string[];
  adapters: string[];
  resolved: { light: string | null; dark: string | null };
  expressions: {
    light: string | null;
    darkMedia: string | null;
    darkAttr: string | null;
    fallbackLight: string | null;
    fallbackDark: string | null;
  };
  source: { file: string; line: number; dtcg: string | null };
}

/** Which specimen shape shows this kind of value best. */
export function specimenKind(
  token: TokenEntry,
): "color" | "radius" | "shadow" | "size" | "text" | "value" {
  if (token.valueType === "color") return "color";
  if (token.name.startsWith("--ds-radius-")) return "radius";
  if (token.valueType === "shadow") return "shadow";
  if (token.valueType === "dimension") return "size";
  if (token.valueType === "fontFamily" || token.valueType === "typography") return "text";
  return "value";
}

/**
 * The property each specimen shape sets. `size` uses the logical inline size so
 * it reads the same in right-to-left text.
 */
const PROPERTY: Record<string, string> = {
  color: "background-color",
  radius: "border-radius",
  shadow: "box-shadow",
  size: "inline-size",
};

export function specimenCss(tokens: TokenEntry[]): string {
  const rules: string[] = [];
  for (const token of tokens) {
    const kind = specimenKind(token);
    const property = PROPERTY[kind];
    if (property) {
      rules.push(`.tk-specimen[data-token="${token.id}"]{${property}:var(${token.name})}`);
      continue;
    }
    if (kind !== "text") continue;
    if (token.valueType === "fontFamily") {
      rules.push(`.tk-specimen[data-token="${token.id}"]{font-family:var(${token.name})}`);
    } else if (token.name.startsWith("--ds-font-size")) {
      rules.push(`.tk-specimen[data-token="${token.id}"]{font-size:var(${token.name})}`);
    } else if (token.name.startsWith("--ds-line-height")) {
      rules.push(`.tk-specimen[data-token="${token.id}"]{line-height:var(${token.name})}`);
    } else {
      rules.push(`.tk-specimen[data-token="${token.id}"]{font-weight:var(${token.name})}`);
    }
  }
  return rules.join("\n");
}
