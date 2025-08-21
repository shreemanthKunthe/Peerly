import { createServer } from "../server";
import serverless from "serverless-http";

// Wrap the Express app for Vercel and normalize the URL so Express routes match.
const app = createServer();
const handler = serverless(app);

export default function (req: any, res: any) {
  // In Vercel API routes, the function receives the path without the leading "/api".
  // Our Express app defines routes with the "/api/..." prefix.
  // If the incoming URL doesn't start with "/api", prefix it.
  if (typeof req.url === "string" && !req.url.startsWith("/api")) {
    req.url = req.url === "/" ? "/api" : `/api${req.url}`;
  }
  return handler(req, res);
}
