import { createServer } from "../server";

// Export the Express app directly; Vercel supports Express apps as default exports
const app = createServer();
export default app;
