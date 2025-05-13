import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default [
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/ban-ts-comment": ["off"],
      "@typescript-eslint/no-explicit-any": ["off"],
      "@typescript-eslint/no-non-null-assertion": ["off"],
      "@typescript-eslint/no-empty-function": ["off"],
      "@typescript-eslint/no-var-requires": ["off"],
      "@typescript-eslint/no-unused-vars": ["off"],
      "no-prototype-builtins": ["off"],
      "linebreak-style": ["error", "unix"],
      quotes: ["error", "single"],
      semi: ["error", "always"],
      indent: ["off", 2],
    },
  },
  {
    ignores: ["dist/**", "docs/**"],
  },
  eslintPluginPrettierRecommended,
  eslintConfigPrettier,
];
