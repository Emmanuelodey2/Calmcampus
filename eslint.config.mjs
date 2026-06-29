import globals from "globals";
import reactPlugin from "./node_modules/eslint-config-next/node_modules/eslint-plugin-react/index.js";
import reactHooksPlugin from "./node_modules/eslint-config-next/node_modules/eslint-plugin-react-hooks/index.js";
import jsxA11yPlugin from "./node_modules/eslint-config-next/node_modules/eslint-plugin-jsx-a11y/lib/index.js";
import nextPlugin from "./node_modules/@next/eslint-plugin-next/dist/index.js";
import tseslint from "./node_modules/eslint-config-next/node_modules/typescript-eslint/dist/index.js";

const browserAndNodeGlobals = {
  ...globals.browser,
  ...globals.node,
};

export default [
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: browserAndNodeGlobals,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "jsx-a11y": jsxA11yPlugin,
      "@next/next": nextPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unknown-property": "off",
      "react/jsx-no-target-blank": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-unused-vars": "warn",
      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/anchor-has-content": "warn",
      "jsx-a11y/heading-has-content": "warn",
    },
  },
];
