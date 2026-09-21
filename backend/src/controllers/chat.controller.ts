import type { Request, Response } from 'express';
import { getLlmProvider } from '../providers/index.js';
import { buildRagContext } from '../services/rag.service.js';
import type { ChatRequestBody, ChatResponseBody } from '../types/chat.js';

export async function handleChat(req: Request, res: Response) {
  try {
    const body = req.body as ChatRequestBody;
    const message = body.message?.trim();

    if (!message) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const useRag = body.useRag !== false;
    const ragContext = useRag ? await buildRagContext(message) : '';
    const provider = getLlmProvider();

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
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'Unknown error';
    const detail = raw
      .replace(/key=[^&\s]+/gi, 'key=[REDACTED]')
      .replace(/AIza[0-9A-Za-z_-]{10,}/g, '[REDACTED]');
    res.status(500).json({ error: 'Chat failed', detail });
  }
}
