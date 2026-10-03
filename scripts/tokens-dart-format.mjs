// The Dart token format for Style Dictionary. The token build in
// packages/svelte/style-dictionary.config.mjs registers it for its `dart`
// platform, and scripts/check-flutter-tokens.mjs compares the committed output
// with it.
//
// The output is written already formatted the way `dart format` writes it,
// so the check needs no Flutter.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const DART_FORMAT = "invisible-ui/dart";

const ROOT_REM_PX = 16;

const camel = (text) =>
  text
    .replace(/[-.]([a-z0-9])/gi, (_, letter) => letter.toUpperCase())
    .replace(/^\w/, (c) => c.toLowerCase());

/** `color-text-secondary` → `textSecondary`; `state-hover` stays `stateHover`. */
const roleName = (name) => camel(name.replace(/^color-/, ""));

const hex2 = (n) => Math.round(n).toString(16).padStart(2, "0").toUpperCase();

/** A DTCG colour, a hex string or a colour object, as a Dart `Color(0xAARRGGBB)`. */
function dartColor(value) {
  if (value === "transparent") return "Color(0x00000000)";
  if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value))
    return `Color(0xFF${value.slice(1).toUpperCase()})`;
  if (value && typeof value === "object" && typeof value.hex === "string") {
    const alpha = value.alpha ?? 1;
    return `Color(0x${hex2(alpha * 255)}${value.hex.slice(1).toUpperCase()})`;
  }
  throw new Error(`Unsupported colour value: ${JSON.stringify(value)}`);
}

/** A DTCG number, or a dimension in logical pixels from a 16px root size. */
function dartDouble(value) {
  if (typeof value === "number") return doubleLiteral(value);
  const match = /^(-?[\d.]+)(px|rem)$/.exec(String(value));
  if (!match) throw new Error(`Unsupported dimension: ${JSON.stringify(value)}`);
  const px = Number(match[1]) * (match[2] === "rem" ? ROOT_REM_PX : 1);
  return doubleLiteral(px);
}

const doubleLiteral = (number) => (Number.isInteger(number) ? `${number}.0` : `${number}`);

/** A one-paragraph dartdoc, wrapped to the 80-column page `dart format` uses. */
function doc(text, indent) {
  const width = 80 - indent.length - 4;
  const lines = [];
  let line = "";
  for (const word of text.replace(/\s+/g, " ").trim().split(" ")) {
    if (line && line.length + word.length + 1 > width) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines.map((row) => `${indent}/// ${row}`).join("\n");
}

const children = (group) => Object.entries(group).filter(([key]) => !key.startsWith("$"));
const isToken = (node) => node && typeof node === "object" && "$value" in node;

/** Every token under a group, depth first, with its path below the group. */
function leaves(group, path = []) {
  return children(group).flatMap(([key, node]) =>
    isToken(node) ? [{ path: [...path, key], token: node }] : leaves(node, [...path, key]),
  );
}

const MIX = "com.invisible-ui.mix";

/**
 * The Style Dictionary format. It reads the resolved token tree and writes
 * one Dart library: constants for the palette, the style tier, the radii, the
 * focus ring, the type scale and the density levels, and the colour roles as a
 * light and a dark `InvisibleColors`.
 */
export function dartTokensFormat({ dictionary }) {
  // Style Dictionary resolves the references inside $extensions as well, but
  // drops group descriptions: those come from the source file itself.
  const tree = dictionary.tokens;
  const source = JSON.parse(readFileSync(resolve(dictionary.allTokens[0].filePath), "utf8"));

  const out = [];
  const push = (...rows) => out.push(...rows);

  push(
    "// Generated from packages/tokens/tokens.json with the format in",
    "// scripts/tokens-dart-format.mjs. Do not edit: run `pnpm tokens:build`.",
    "// `pnpm tokens:check` fails when this file differs from what the source",
    "// produces.",
    "",
    "// Each constant is named after its token path.",
    "// ignore_for_file: public_member_api_docs",
    "",
    "import 'dart:ui';",
    "",
  );

  const constantsClass = (name, description, entries) => {
    push(doc(description, ""), `abstract final class ${name} {`);
    entries.forEach(({ field, type, value, description: note }, index) => {
      if (note) {
        if (index > 0) push("");
        push(doc(note, "  "));
      }
      push(`  static const ${type} ${field} = ${value};`);
    });
    push("}", "");
  };

  constantsClass(
    "InvisiblePalette",
    "The primitive palette. Components read the roles in [InvisibleColors], never these.",
    leaves(tree.palette).map(({ path, token }) => ({
      field: camel(path.join("-")),
      type: "Color",
      value: dartColor(token.$value),
    })),
  );

  constantsClass(
    "InvisibleStyleColors",
    "The semantic style tier: brand and feedback colours.",
    leaves(tree.style).map(({ path, token }) => ({
      field: camel(path.join("-")),
      type: "Color",
      value: dartColor(token.$value),
      description: token.$description,
    })),
  );

  constantsClass(
    "InvisibleRadiusTokens",
    "Corner radii, in logical pixels.",
    leaves(tree.radius).map(({ path, token }) => ({
      field: camel(path.join("-")),
      type: "double",
      value: dartDouble(token.$value),
    })),
  );

  constantsClass(
    "InvisibleFocusTokens",
    source.focus.$description + " Sizes in logical pixels.",
    leaves(tree.focus).map(({ path, token }) => ({
      field: camel(path.join("-")),
      type: "double",
      value: dartDouble(token.$value),
    })),
  );

  constantsClass(
    "InvisibleTypographyTokens",
    source.typography.$description + " Font sizes in logical pixels.",
    leaves(tree.typography).map(({ path, token }) =>
      token.$type === "fontWeight"
        ? { field: camel(path.join("-")), type: "FontWeight", value: `FontWeight.w${token.$value}` }
        : { field: camel(path.join("-")), type: "double", value: dartDouble(token.$value) },
    ),
  );

  // Density: one instance per level. A size a level leaves undefined in the
  // source is null here, never filled in.
  const levels = children(tree.density);
  const fields = [...new Set(levels.flatMap(([, level]) => children(level).map(([key]) => key)))];
  const always = fields.filter((key) => levels.every(([, level]) => isToken(level[key])));
  push(
    doc(source.density.$description, ""),
    "///",
    doc("A size that the source leaves undefined for a level is null.", ""),
    "final class InvisibleDensityTokens {",
    "  const InvisibleDensityTokens._({",
    ...fields.map((key) => `    ${always.includes(key) ? "required " : ""}this.${camel(key)},`),
    "  });",
    "",
  );
  for (const [levelName, level] of levels) {
    const args = children(level).map(
      ([key, token]) => `${camel(key)}: ${dartDouble(token.$value)}`,
    );
    const single = `  static const ${camel(levelName)} = InvisibleDensityTokens._(${args.join(", ")});`;
    if (single.length <= 80) push(single);
    else
      push(
        `  static const ${camel(levelName)} = InvisibleDensityTokens._(`,
        ...args.map((arg) => `    ${arg},`),
        "  );",
      );
  }
  push("");
  fields.forEach((key, index) => {
    if (index > 0) push("");
    push(`  final double${always.includes(key) ? "" : "?"} ${camel(key)};`);
  });
  push("}", "");

  // Mixed colours keep the recipe beside the resolved value.
  push(
    doc(
      "How a mixed colour role is made: [base] mixed with [mixWith] in sRGB, " +
        "[amount] of [base], as CSS `color-mix()` computes it. [value] is the " +
        "resolved colour the role holds.",
      "",
    ),
    "final class InvisibleColorMix {",
    "  const InvisibleColorMix({",
    "    required this.base,",
    "    required this.amount,",
    "    required this.mixWith,",
    "    required this.value,",
    "  });",
    "",
    "  final Color base;",
    "",
    "  final double amount;",
    "",
    "  final Color mixWith;",
    "",
    "  final Color value;",
    "",
    "  /// Computes the mix again, with premultiplied alpha as CSS does.",
    "  Color resolve() {",
    "    final a = base.a * amount + mixWith.a * (1 - amount);",
    "    if (a == 0) return const Color(0x00000000);",
    "    double channel(double b, double w) =>",
    "        (b * base.a * amount + w * mixWith.a * (1 - amount)) / a;",
    "    return Color.from(",
    "      alpha: a,",
    "      red: channel(base.r, mixWith.r),",
    "      green: channel(base.g, mixWith.g),",
    "      blue: channel(base.b, mixWith.b),",
    "    );",
    "  }",
    "}",
    "",
  );

  // Roles: one class, a light and a dark instance.
  const themes = children(tree.role);
  const roleKeys = children(themes[0][1]).map(([key]) => key);
  for (const [theme, group] of themes) {
    const keys = children(group).map(([key]) => key);
    if (keys.join() !== roleKeys.join())
      throw new Error(`role.${theme} does not list the same roles as role.${themes[0][0]}`);
  }
  push(
    doc(
      "The colour roles the components read, per theme. Mixed roles hold the " +
        "resolved value; [InvisibleColorMixes] keeps their recipes.",
      "",
    ),
    "final class InvisibleColors {",
    "  const InvisibleColors({",
    ...roleKeys.map((key) => `    required this.${roleName(key)},`),
    "  });",
    "",
  );
  for (const [theme, group] of themes) {
    push(
      `  static const InvisibleColors ${camel(theme)} = InvisibleColors(`,
      ...children(group).map(([key, token]) => `    ${roleName(key)}: ${dartColor(token.$value)},`),
      "  );",
      "",
    );
  }
  roleKeys.forEach((key) => {
    push(`  /// \`${key}\`.`, `  final Color ${roleName(key)};`, "");
  });
  push(
    "  /// A copy with the given roles replaced.",
    "  InvisibleColors copyWith({",
    ...roleKeys.map((key) => `    Color? ${roleName(key)},`),
    "  }) {",
    "    return InvisibleColors(",
    ...roleKeys.map((key) => `      ${roleName(key)}: ${roleName(key)} ?? this.${roleName(key)},`),
    "    );",
    "  }",
    "",
    "  List<Color> get _values => [",
    ...roleKeys.map((key) => `    ${roleName(key)},`),
    "  ];",
    "",
    "  @override",
    "  bool operator ==(Object other) {",
    "    if (identical(this, other)) return true;",
    "    if (other is! InvisibleColors) return false;",
    "    final mine = _values;",
    "    final theirs = other._values;",
    "    for (var i = 0; i < mine.length; i++) {",
    "      if (mine[i] != theirs[i]) return false;",
    "    }",
    "    return true;",
    "  }",
    "",
    "  @override",
    "  int get hashCode => Object.hashAll(_values);",
    "}",
    "",
  );

  push(
    doc("The recipes of the mixed colour roles, by [InvisibleColors] field name.", ""),
    "abstract final class InvisibleColorMixes {",
  );
  themes.forEach(([theme, group], index) => {
    if (index > 0) push("");
    push(`  static const Map<String, InvisibleColorMix> ${camel(theme)} = {`);
    for (const [key, token] of children(group)) {
      const mix = token.$extensions?.[MIX];
      if (!mix) continue;
      if (mix.space !== "srgb") throw new Error(`Unsupported mix space ${mix.space}`);
      push(
        `    '${roleName(key)}': InvisibleColorMix(`,
        `      base: ${dartColor(mix.base)},`,
        `      amount: ${doubleLiteral(mix.amount)},`,
        `      mixWith: ${dartColor(mix.with)},`,
        `      value: ${dartColor(token.$value)},`,
        "    ),",
      );
    }
    push("  };");
  });
  push("}");

  return out.join("\n") + "\n";
}
