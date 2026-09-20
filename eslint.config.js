import js from "@eslint/js";
import ts from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default ts.config(
  {
    ignores: [
      "**/dist/**",
      "**/.turbo/**",
      "**/.astro/**",
      "**/build/**",
      "**/storybook-static/**",
      "**/node_modules/**",
      "**/*.config.{js,ts,cjs,mjs}",
      // Agent tooling is advisory and not project source. Shared skills may be
      // committed, while tool-specific state remains local.
      ".agents/**",
      ".claude/**",
      ".github/agents/**",
      ".github/hooks/**",
      ".github/skills/**",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs["flat/recommended"],
  prettier,
  ...svelte.configs["flat/prettier"],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: { parser: ts.parser },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
