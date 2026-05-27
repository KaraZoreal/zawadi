import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

function standalonePublicPages() {
  return {
    name: "zawadi-standalone-public-pages",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const cleanUrl = req.url?.split("?")[0];
        const pageMap = {
          "/admin": "admin.html",
          "/faq": "faq.html",
          "/about": "about.html",
          "/contact": "contact.html",
          "/privacy": "privacy.html",
          "/terms": "terms.html"
        };
        const fileName = pageMap[cleanUrl];
        if (!fileName) return next();

        const filePath = path.resolve(process.cwd(), "public", fileName);
        if (!fs.existsSync(filePath)) return next();

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(fs.readFileSync(filePath));
      });
    }
  };
}

export default defineConfig({
  plugins: [standalonePublicPages(), react()],
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    // Proxy API calls to the backend Express server
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true
      }
    }
  }
});
