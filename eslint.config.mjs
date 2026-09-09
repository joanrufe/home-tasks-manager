import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescriptConfig from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "out/**"],
  },
  ...coreWebVitals,
  ...typescriptConfig,
  {
    rules: {
      // The workouts page synchronizes state from URL query params inside
      // effects (URL <-> state sync), which this new rule flags. Rewriting
      // that logic is out of scope; revisit when refactoring the page.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
