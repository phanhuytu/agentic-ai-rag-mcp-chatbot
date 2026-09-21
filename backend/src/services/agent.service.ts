import { getLlmProvider } from '../providers/index.js';
import { callTool } from '../mcp/tool-registry.js';
import { buildRagContext } from './rag.service.js';
import type { ChatMessage } from '../types/chat.js';
import { registerOkrTools } from '../tools/okr.tools.js';

registerOkrTools();

export type AgentEvent =
  | { type: 'status'; message: string }
  | { type: 'tool'; name: string; ok: boolean }
  | { type: 'delta'; text: string }
  | { type: 'done'; provider: string; ragContextUsed: boolean; toolsUsed: string[] }
  | { type: 'error'; detail: string };

export type AgentInput = {
  message: string;
  history?: ChatMessage[];
  useRag?: boolean;
};

export type AgentResult = {
  reply: string;
  provider: string;
  ragContextUsed: boolean;
  toolsUsed: string[];
};

function extractCandidateDraft(message: string, history: ChatMessage[]): string {
  const fenced = message.match(/```([\s\S]*?)```/);
  if (fenced?.[1]?.trim()) {
    return fenced[1].trim();
  }

  if (/(?:O\d+|Objective|Mục tiêu|KR\d+)/i.test(message) && message.length > 60) {
    return message;
  }

  const lastAssistant = [...history].reverse().find((item) => item.role === 'assistant');
  return lastAssistant?.content ?? message;
}

function wantsValidation(message: string): boolean {
  return /(validate|kiểm\s*tra|review|chấm|đánh\s*giá\s*okr|check\s*okr)/i.test(message);
}

function wantsPlaybook(message: string): boolean {
  return /(playbook|6\s*rõ|sáu\s*rõ|mục\s*okr|knowledge|section|tiêu\s*chí|bẫy|cfr)/i.test(
    message,
  );
}

function pickSectionQuery(message: string): string {
  if (/6\s*rõ|sáu\s*rõ/i.test(message)) {
    return '6 Rõ';
  }
  if (/bẫy|sai\s*lầm/i.test(message)) {
    return 'bẫy';
  }
  if (/cfr/i.test(message)) {
    return 'CFR';
  }
  if (/tiêu\s*chí/i.test(message)) {
    return 'tiêu chí';
  }
  if (/checklist/i.test(message)) {
    return 'Checklist';
  }
  if (/align|hướng\s*tâm/i.test(message)) {
    return 'Alignment';
  }
  return 'Quy trình coaching';
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Chunk a full reply for simple SSE demo streaming. */
export async function* chunkText(text: string, size = 36): AsyncGenerator<string> {
  for (let i = 0; i < text.length; i += size) {
    yield text.slice(i, i + size);
    await sleep(12);
  }
}

/**
 * Lightweight demo agent: RAG + heuristic tool calls + one LLM answer.
 * Not a full planner — enough to show tool-use in chat.
 */
export async function runAgent(
  input: AgentInput,
  onEvent?: (event: AgentEvent) => void | Promise<void>,
): Promise<AgentResult> {
  const message = input.message.trim();
  const history = input.history ?? [];
  const useRag = input.useRag !== false;
  const provider = getLlmProvider();
  const toolsUsed: string[] = [];
  const toolBlocks: string[] = [];

  try {
    let ragContext = '';
    if (useRag) {
      await onEvent?.({ type: 'status', message: 'retrieving' });
      ragContext = await buildRagContext(message, provider);
    }

    if (wantsValidation(message)) {
      await onEvent?.({ type: 'status', message: 'tool:validate_okr_draft' });
      const draft = extractCandidateDraft(message, history);
      try {
        const result = await callTool('validate_okr_draft', { draft });
        toolsUsed.push('validate_okr_draft');
        toolBlocks.push(`Tool validate_okr_draft result:\n${JSON.stringify(result, null, 2)}`);
        await onEvent?.({ type: 'tool', name: 'validate_okr_draft', ok: true });
      } catch {
        await onEvent?.({ type: 'tool', name: 'validate_okr_draft', ok: false });
      }
    }

    if (wantsPlaybook(message)) {
      const title = pickSectionQuery(message);
      await onEvent?.({ type: 'status', message: `tool:get_okr_playbook_section` });
      try {
        const result = await callTool('get_okr_playbook_section', { title });
        toolsUsed.push('get_okr_playbook_section');
        toolBlocks.push(`Tool get_okr_playbook_section(${title}) result:\n${JSON.stringify(result, null, 2)}`);
        await onEvent?.({ type: 'tool', name: 'get_okr_playbook_section', ok: true });
      } catch {
        await onEvent?.({ type: 'tool', name: 'get_okr_playbook_section', ok: false });
      }
    }

    const contextParts = [ragContext, ...toolBlocks].filter(Boolean);
    const context = contextParts.join('\n\n---\n\n');

    await onEvent?.({ type: 'status', message: 'generating' });
    const reply = await provider.generateResponse({
      message,
      history,
      context,
    });

    return {
      reply,
      provider: provider.name,
      ragContextUsed: Boolean(ragContext),
      toolsUsed,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Agent failed';
    await onEvent?.({ type: 'error', detail });
    throw error;
  }
}
