import type { Request, Response } from 'express';

/** Placeholder weather tool endpoint for MCP / tool-calling labs. */
export function getWeather(req: Request, res: Response) {
  const city = String(req.query.city ?? 'Ho Chi Minh').trim();

  res.json({
    city,
    temperatureC: 31,
    condition: 'Partly cloudy',
    humidity: 72,
    source: 'mock',
    note: 'Replace with a real weather API during the course labs.',
  });
}
