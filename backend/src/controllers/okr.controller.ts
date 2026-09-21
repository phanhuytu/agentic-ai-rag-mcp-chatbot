import type { Request, Response } from 'express';
import { asyncHandler, HttpError } from '../http/async-handler.js';
import { callTool, listTools, registerOkrTools, validateOkrDraft } from '../tools/okr.tools.js';

registerOkrTools();

export const listOkrTools = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ tools: listTools() });
});

export const validateOkr = asyncHandler(async (req: Request, res: Response) => {
  const draft = typeof req.body?.draft === 'string' ? req.body.draft : '';
  res.json(validateOkrDraft(draft));
});

export const listPlaybookSections = asyncHandler(async (_req: Request, res: Response) => {
  const result = await callTool('list_okr_playbook_sections', {});
  res.json(result);
});

export const getPlaybookSection = asyncHandler(async (req: Request, res: Response) => {
  const title = String(req.query.title ?? req.params.title ?? '').trim();
  if (!title) {
    throw new HttpError(400, 'title is required');
  }
  const result = await callTool('get_okr_playbook_section', { title });
  res.json(result);
});

export const invokeTool = asyncHandler(async (req: Request, res: Response) => {
  const name = String(req.params.name ?? '').trim();
  const input =
    req.body && typeof req.body === 'object' && !Array.isArray(req.body)
      ? (req.body as Record<string, unknown>)
      : {};

  try {
    const result = await callTool(name, input);
    res.json({ name, result });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpError(400, 'Tool invocation failed', detail);
  }
});
