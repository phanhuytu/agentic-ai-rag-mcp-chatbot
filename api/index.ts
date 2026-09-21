import { createApp } from '../backend/dist/app.js';

const app = createApp();

export default app;

export const config = {
  maxDuration: 60,
};
