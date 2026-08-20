import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Resolución nativa de los paths de tsconfig (@/* → src/*).
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    // e2e vive en /e2e y lo corre Playwright, no Vitest.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["./src/tests/setup.ts"],
  },
});
