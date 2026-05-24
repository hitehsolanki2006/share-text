// app.config.ts
import { createApp } from "vinxi";
import { TanStackStartServer, TanStackStartClient } from "@tanstack/start/vinxi";
import viteTsConfigPaths from "vite-tsconfig-paths";
var app_config_default = createApp({
  routers: [
    TanStackStartServer(),
    TanStackStartClient({
      plugins: [
        viteTsConfigPaths({
          projects: ["./tsconfig.json"]
        })
      ]
    })
  ]
});
export {
  app_config_default as default
};
