import type { Request, Response } from 'express';
import { asyncHandler, HttpError } from '../http/async-handler.js';
import { getLlmProvider } from '../providers/index.js';
import { buildRagContext } from '../services/rag.service.js';
import type { ChatRequestBody, ChatResponseBody } from '../types/chat.js';

export const handleChat = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as ChatRequestBody;
  const message = body.message?.trim();

  if (!message) {
    throw new HttpError(400, 'message is required');
  }

  const useRag = body.useRag !== false;
  const provider = getLlmProvider();
  const ragContext = useRag ? await buildRagContext(message, provider) : '';

  const reply = await provider.generateResponse({
    message,
    history: body.history ?? [],
    context: ragContext,
  });

  const response: ChatResponseBody = {
    reply,
    provider: provider.name,
    ragContextUsed: Boolean(ragContext),
  };

  res.json(response);
});
