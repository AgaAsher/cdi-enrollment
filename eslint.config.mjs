import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The hydration mount pattern (useEffect(() => setMounted(true), []))
      // is the canonical Next.js / next-themes pattern; the React Compiler
      // rule flags it but it is correct.
      "react-hooks/set-state-in-effect": "off",
      // React Hook Form's watch() is intentionally a non-stable function.
      "react-hooks/incompatible-library": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
