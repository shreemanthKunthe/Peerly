import 'dotenv/config';
import { createServer } from './index';

const app = createServer();
const port = Number(process.env.PORT) || 8082;

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
