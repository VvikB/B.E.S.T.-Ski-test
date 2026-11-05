import { defineConfig } from "vite";
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        onlyExplicitManualChunks: true,
        manualChunks(id) {
          if (
            /\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(
              id,
            )
          )
            return "react-core";
          if (
            /\/node_modules\/(three|@react-three\/fiber|@react-three\/drei|three-stdlib)\//.test(
              id,
            )
          )
            return "three-engine";
        },
      },
    },
  },
  server: { host: "0.0.0.0" },
});
