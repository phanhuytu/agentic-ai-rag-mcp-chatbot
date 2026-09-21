import 'dotenv/config';
import { createApp } from './app.js';

const app = createApp();

// On Vercel, api/index.ts exports the app — do not listen.
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}

export default app;
