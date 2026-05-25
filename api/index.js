// Vercel serverless entrypoint — imports the full Express app
// All routes (API, auth, scholarships, documents, essays, admin, billing)
// are handled by the single Express app from server/index.js
import app from "../server/index.js";
export default app;
