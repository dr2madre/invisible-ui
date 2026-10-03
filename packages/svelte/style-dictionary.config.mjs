// The token build: CSS variables for the web adapters and typed constants for
// the Flutter package, both from packages/tokens/tokens.json. Paths are
// relative to this package, where `tokens:build` runs.
import { DART_FORMAT, dartTokensFormat } from "../../scripts/tokens-dart-format.mjs";

export default {
  source: ["../tokens/tokens.json"],
  hooks: { formats: { [DART_FORMAT]: dartTokensFormat } },
  platforms: {
    css: {
      transformGroup: "css",
      prefix: "ds",
      buildPath: "dist/tokens/",
      files: [{ destination: "tokens.generated.css", format: "css/variables" }],
    },
    // Committed: a git consumer of packages/flutter runs no build step.
    // Values stay untransformed: the format converts them. Full-path names
    // only keep token names unique.
    dart: {
      transforms: ["name/camel"],
      buildPath: "../flutter/lib/src/tokens/",
      files: [{ destination: "tokens.g.dart", format: DART_FORMAT }],
    },
  },
};
