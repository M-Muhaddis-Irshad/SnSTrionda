import nextConfig from "eslint-config-next";

// Fallback safety to find the right Next.js configuration object path
const nextRules = nextConfig?.configs?.["core-web-vitals"]?.rules || nextConfig?.rules || {};

export default [
  // Global file ignores
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts"
    ]
  },
  // Apply standard project structural configurations safely
  {
    plugins: {
      "next": nextConfig
    },
    rules: {
      ...nextRules,
      "react/display-name": "off" // Bypasses the initial plugin method error
    }
  }
];
