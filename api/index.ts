import { createApp } from '../backend/dist/app.js';

// Root package.json must use "type": "module" so Vercel loads this as ESM
// (backend/dist is ESM). Otherwise you get FUNCTION_INVOCATION_FAILED.
const app = createApp();

export default app;

export const config = {
  maxDuration: 60,
};
