// Builds the CSS the catalog paints its specimens with. One rule per token,
// generated from the registry, and every rule reads the live custom property:
// no colour or size is ever written here, so a specimen cannot drift from the
// stylesheet that ships. The shape each token is drawn in comes from the
// registry too (`specimenKind`), so this file and the generator cannot disagree.

export type SpecimenKind = "color" | "radius" | "shadow" | "size" | "text";

export interface TokenEntry {
  name: string;
  id: string;
  tier: string;
  valueType: string;
  specimenKind: SpecimenKind | null;
  ownership: string;
  stability: string;
  replacedBy: string | null;
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

/**
 * The property each shape sets. `size` uses the logical inline size so it reads
 * the same in right-to-left text.
 */
const PROPERTY: Record<Exclude<SpecimenKind, "text">, string> = {
  color: "background-color",
  radius: "border-radius",
  shadow: "box-shadow",
  size: "inline-size",
};

/** Type tokens are drawn on real text, so each sets a different property. */
function textProperty(token: TokenEntry): string {
  if (token.valueType === "fontFamily") return "font-family";
  if (token.name.startsWith("--ds-font-size")) return "font-size";
  if (token.name.startsWith("--ds-line-height")) return "line-height";
  return "font-weight";
}

export function specimenCss(tokens: TokenEntry[]): string {
  return tokens
    .map((token) => {
      const kind = token.specimenKind;
      if (!kind) return null;
      const property = kind === "text" ? textProperty(token) : PROPERTY[kind];
      return `.tk-specimen[data-token="${token.id}"]{${property}:var(${token.name})}`;
    })
    .filter((rule): rule is string => rule !== null)
    .join("\n");
}
