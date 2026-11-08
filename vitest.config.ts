import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Same "@/…" alias as tsconfig.json, so tests import modules the way the app does.
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
});
