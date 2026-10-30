import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Cada archivo levanta su propia instancia de MongoDB en memoria.
    // Se ejecutan en serie para evitar descargas y arranques simultáneos.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 180_000
  }
});
