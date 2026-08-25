import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["hooks/**/*.{ts,tsx}"],
      exclude: ["hooks/**/*.test.{ts,tsx}"],
      thresholds: {
        lines: 90,
        branches: 90,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "@delegolabs/ui": path.resolve(__dirname, "../../packages/ui/src/index.ts"),
      "@delegolabs/types": path.resolve(__dirname, "../../packages/types/index.d.ts"),
    },
  },
});
