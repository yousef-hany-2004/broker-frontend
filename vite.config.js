import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://broker-system-api.runasp.net",
        changeOrigin: true,
        secure: true,
      },
      "/hubs": {
        target: "https://broker-system-api.runasp.net",
        changeOrigin: true,
        secure: true,
        ws: true, // ✅ critical — enables WebSocket proxying
      },
    },
  },
});

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// });

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       "/api": {
//         target: "http://brokersystem.runasp.net",
//         changeOrigin: true,
//       },
//     },
//   },
// });

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       "/api": {
//         target: "http://brokersystem.runasp.net",
//         changeOrigin: true,
//       },
//       "/hubs": {
//         target: "http://brokersystem.runasp.net",
//         changeOrigin: true,
//         ws: true, // enables WebSocket proxying
//       },
//     },
//   },
// });
