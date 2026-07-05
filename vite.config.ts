import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base path is the repo name for GitHub Pages production builds,
// but "/" during local dev so the preview server serves at the root.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/interview-proctor-ai/" : "/",
}));
