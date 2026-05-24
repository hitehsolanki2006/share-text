import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false, // Disable Cloudflare plugin for Netlify deployment
  tanstackStart: {
    server: { entry: "server" },
  },
});
