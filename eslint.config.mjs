import nextCoreWebVitals from "eslint-config-next/core-web-vitals"

export default [
  { ignores: [".next/**", "node_modules/**", "artifacts/**"] },
  ...nextCoreWebVitals,
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: {
      "react/no-unescaped-entities": "off",
      "react-hooks/immutability": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
]
