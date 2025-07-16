import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
const proxy = "http://localhost:3000";
// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		host: "0.0.0.0",
		port: 5173,
		proxy: {
			"/login": {
				target: proxy,
				changeOrigin: true
			},
			"/logout": {
				target: proxy,
				changeOrigin: true
			},
			"/ws": {
				target: "ws://localhost:3000",
				ws: true,
				changeOrigin: true
			}
		}
	}
});
