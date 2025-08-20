export default function handler(req: any, res: any) {
  const ping = process.env.PING_MESSAGE ?? "ping pong";
  const envSummary = {
    projectId: process.env.FIREBASE_PROJECT_ID ?? null,
    hasServiceAccountBase64: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64),
    hasServiceAccountJSON: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
    nodeEnv: process.env.NODE_ENV ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
  };
  res.setHeader('Content-Type', 'application/json');
  res.status(200).end(JSON.stringify({ message: ping, env: envSummary }));
}
