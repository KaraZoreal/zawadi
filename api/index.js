// Vercel Serverless Entry Point
// Sets VERCEL flag so the Express app skips Vite dev server + local listen

process.env.VERCEL = "1";

import app from "../server/index.js";

export default app;
