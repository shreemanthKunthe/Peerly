export default function handler(req: any, res: any) {
  const ping = process.env.PING_MESSAGE ?? "ping pong";
  res.setHeader('Content-Type', 'application/json');
  res.status(200).end(JSON.stringify({ message: ping }));
}
