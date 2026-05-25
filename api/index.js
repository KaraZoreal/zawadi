// Vercel serverless entrypoint — imports the full Express app
let app;
try {
  const mod = await import("../server/index.js");
  app = mod.default;
} catch (err) {
  // Crash-safe fallback: return the error so we can debug
  app = (req, res) => {
    res.status(500).json({
      error: "Server failed to start",
      message: err.message,
      stack: err.stack?.split("\n").slice(0, 3)
    });
  };
}

export default app;
