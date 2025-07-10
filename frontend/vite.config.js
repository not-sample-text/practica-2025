import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
const proxy = "http://localhost:3000";
// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		proxy: {
			"/login": {
				target: proxy,
				changeOrigin: true
			}
		}
	}
});
