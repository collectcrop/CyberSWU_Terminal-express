/* eslint-disable */

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    plugins: { js },
    extends: ["js/recommended"],
    // globals: {env: 'readonly'},
    rules: {
      "space-before-function-paren": ["error", "always"],
      "space-before-blocks": ["error", "always"],
      "semi": ["error", "never"],
      "indent": ["error", 2],
      "comma-spacing": ["error", { "before": false, "after": true }],
      "quotes": ["error", "single"]
    }
  },
  { 
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: { globals: globals.node } 
  },
  tseslint.configs.recommended,
]);