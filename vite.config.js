import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the build works on any GitHub Pages project URL
// (https://<user>.github.io/<repo>/) without editing this file.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
