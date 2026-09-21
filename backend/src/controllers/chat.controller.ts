import type { Request, Response } from 'express';
import { asyncHandler, HttpError } from '../http/async-handler.js';
import { chunkText, runAgent, type AgentEvent } from '../services/agent.service.js';
import type { ChatRequestBody, ChatResponseBody } from '../types/chat.js';

function writeSse(res: Response, event: AgentEvent | { type: string; [key: string]: unknown }) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export const handleChat = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as ChatRequestBody;
  const message = body.message?.trim();

  if (!message) {
    throw new HttpError(400, 'message is required');
  }

  const result = await runAgent({
    message,
    history: body.history ?? [],
    useRag: body.useRag !== false,
  });

  const response: ChatResponseBody = {
    reply: result.reply,
    provider: result.provider,
    ragContextUsed: result.ragContextUsed,
    toolsUsed: result.toolsUsed,
  };

  res.json(response);
});

/** Demo SSE stream: status/tool events, then chunked final answer. */
export const handleChatStream = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as ChatRequestBody;
  const message = body.message?.trim();

  if (!message) {
    throw new HttpError(400, 'message is required');
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const result = await runAgent(
      {
        message,
        history: body.history ?? [],
        useRag: body.useRag !== false,
      },
      async (event) => {
        writeSse(res, event);
      },
    );

    for await (const text of chunkText(result.reply)) {
      writeSse(res, { type: 'delta', text });
    }

    writeSse(res, {
      type: 'done',
      provider: result.provider,
      ragContextUsed: result.ragContextUsed,
      toolsUsed: result.toolsUsed,
    });
    res.end();
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Stream failed';
    writeSse(res, { type: 'error', detail });
    res.end();
  }
});
