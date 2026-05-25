// Vercel serverless entrypoint — imports the full Express app
let app;
try {
  const mod = await import("../server/index.js");
  app = mod.default;
} catch (err) {
  // Crash-safe fallback: return the error for debugging
  console.error("SERVER CRASH:", err.message, err.stack);
  const { default: express } = await import("express");
  app = express();
  app.all("*", (_req, res) => {
    res.status(500).json({
      error: "Server failed to start",
      message: err.message,
      code: err.code,
      stack: err.stack?.split("\n").slice(0, 5).map(s => s.trim())
    });
  });
}

export default app;
