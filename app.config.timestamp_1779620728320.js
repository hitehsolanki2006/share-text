// app.config.ts
import { defineConfig } from "vinxi/config";
import { TanStackStartServer, TanStackStartClient } from "@tanstack/start/vinxi";
import viteTsConfigPaths from "vite-tsconfig-paths";
var app_config_default = defineConfig({
  server: TanStackStartServer(),
  client: TanStackStartClient({
    plugins: [
      viteTsConfigPaths({
        projects: ["./tsconfig.json"]
      })
    ]
  })
});
export {
  app_config_default as default
};
