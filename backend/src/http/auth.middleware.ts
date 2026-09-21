import type { NextFunction, Request, Response } from 'express';

/**
 * Simple demo auth: when API_ACCESS_TOKEN is set, require Bearer token.
 * When unset, all requests are allowed (local demo mode).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.API_ACCESS_TOKEN?.trim();
  if (!expected) {
    next();
    return;
  }

  const header = req.header('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const token = match?.[1]?.trim();

  if (token && token === expected) {
    next();
    return;
  }

  res.status(401).json({
    error: 'Unauthorized',
    detail: 'Missing or invalid Bearer token. Set the same value as API_ACCESS_TOKEN.',
  });
}

export function isAuthEnabled(): boolean {
  return Boolean(process.env.API_ACCESS_TOKEN?.trim());
}
