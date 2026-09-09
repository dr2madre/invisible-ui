// Read the module specifiers out of a source file, for the packaging checks.
// A regex over raw text answers wrongly twice: it finds imports that are
// commented out, and it misses the ones that share a line with something else,
// which is the ordinary shape in a `.svelte`, `.vue` or `.astro` file.

/** Remove comments, leaving strings (and the URLs inside them) alone. */
export const withoutComments = (text) => {
  let out = "";
  let index = 0;
  let quote = null;
  while (index < text.length) {
    const char = text[index];
    const next = text[index + 1];
    if (quote) {
      if (char === "\\") {
        out += char + (next ?? "");
        index += 2;
        continue;
      }
      if (char === quote) quote = null;
      out += char;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      out += char;
      index += 1;
      continue;
    }
    if (char === "/" && next === "/") {
      while (index < text.length && text[index] !== "\n") index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      index += 2;
      while (index < text.length && !(text[index] === "*" && text[index + 1] === "/")) index += 1;
      index += 2;
      continue;
    }
    if (char === "<" && text.startsWith("<!--", index)) {
      const end = text.indexOf("-->", index);
      index = end === -1 ? text.length : end + 3;
      continue;
    }
    out += char;
    index += 1;
  }
  return out;
};

const FROM = /\b(?:import|export)\s+([^;'"]*?)\bfrom\s*["']([^"']+)["']/g;
const SIDE_EFFECT = /\bimport\s*["']([^"']+)["']/g;
const DYNAMIC = /\bimport\s*\(\s*["']([^"']+)["']/g;
const REQUIRE = /\brequire\s*\(\s*["']([^"']+)["']/g;
const CSS_IMPORT = /@import\s+(?:url\(\s*)?["']([^"']+)["']/g;
/** `import(someVariable)` and `import(`${x}`)`: a specifier no reader can name. */
const COMPUTED = /\bimport\s*\(\s*[^"')\s]/g;

/** Drop Vite's query suffix: `x.svg?raw` and `x.css?url` are the same file. */
export const withoutQuery = (specifier) => specifier.split(/[?#]/)[0];

/**
 * Every specifier a file imports. `import type` is left out: it is erased
 * before anything runs, so it is not something a consumer must be able to
 * resolve. `computed` counts the dynamic imports whose target is not a literal.
 */
export const specifiersOf = (text) => {
  const source = withoutComments(text);
  const found = [];
  for (const [, clause, specifier] of source.matchAll(FROM)) {
    if (!/^type\b/.test(clause.trim())) found.push(specifier);
  }
  for (const pattern of [SIDE_EFFECT, DYNAMIC, REQUIRE, CSS_IMPORT]) {
    for (const [, specifier] of source.matchAll(pattern)) found.push(specifier);
  }
  return {
    specifiers: [...new Set(found)],
    computed: [...source.matchAll(COMPUTED)].length,
  };
};
