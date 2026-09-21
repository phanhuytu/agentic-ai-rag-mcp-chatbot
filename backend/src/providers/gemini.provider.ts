import { GoogleGenAI } from '@google/genai';
import type { ChatMessage } from '../types/chat.js';
import type { GenerateResponseInput, LlmProvider } from './types.js';

type ContentRole = 'user' | 'model';

type GeminiContent = {
  role: ContentRole;
  parts: Array<{ text: string }>;
};

function toGeminiRole(role: ChatMessage['role']): ContentRole | null {
  if (role === 'user') {
    return 'user';
  }
  if (role === 'assistant') {
    return 'model';
  }
  return null;
}

function buildContents(input: GenerateResponseInput): GeminiContent[] {
  const contents: GeminiContent[] = [];

  for (const message of input.history) {
    const role = toGeminiRole(message.role);
    if (!role || !message.content.trim()) {
      continue;
    }
    contents.push({
      role,
      parts: [{ text: message.content }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: input.message }],
  });

  return contents;
}

function buildSystemInstruction(context?: string): string {
  const base = [
    'You are an OKR coach for FPT employees.',
    'Your goal is to help users create appropriate, measurable, and effective OKRs aligned with FPT practice.',
    'Follow FPT guidance: max 3 Objectives, 2-4 Key Results each, Align to upper-level OKRs, measurable KRs with baseline/target/deadline, apply 6 Rõ, avoid the 6 common traps, and suggest CFR check-ins.',
    'Prefer Vietnamese when the user writes in Vietnamese; otherwise match the user language.',
    'When asked to draft OKRs, ask for missing role/unit/period/priorities if needed, then output a clear O/KR structure and a short quality checklist.',
    'Do not invent confidential FPT internal metrics. Use placeholders and mark them as needing real numbers.',
    'Ground answers in the retrieved knowledge-base context when available. If context is insufficient, say what is missing.',
  ].join(' ');

  if (!context?.trim()) {
    return base;
  }

  return `${base}\n\nRetrieved FPT OKR context:\n${context}`;
}

function sanitizeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  // Never echo secrets if an SDK/network error embeds query params or headers.
  return raw.replace(/key=[^&\s]+/gi, 'key=[REDACTED]').replace(/AIza[0-9A-Za-z_-]{10,}/g, '[REDACTED]');
}

export class GeminiProvider implements LlmProvider {
  readonly name = 'gemini';
  private readonly client: GoogleGenAI;
  private readonly model: string;
  private readonly embeddingModel: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is missing. Add it to backend/.env (see README). Never commit or paste the key into chat.',
      );
    }

    this.client = new GoogleGenAI({ apiKey });
    this.model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.6-flash';
    this.embeddingModel =
      process.env.GEMINI_EMBEDDING_MODEL?.trim() || 'text-embedding-004';
  }

  async generateResponse(input: GenerateResponseInput): Promise<string> {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: buildContents(input),
        config: {
          systemInstruction: buildSystemInstruction(input.context),
        },
      });

      const text = response.text?.trim();
      if (!text) {
        throw new Error('Gemini returned an empty response.');
      }

      return text;
    } catch (error) {
      throw new Error(`Gemini generateResponse failed: ${sanitizeErrorMessage(error)}`);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.models.embedContent({
        model: this.embeddingModel,
        contents: text,
      });

      const values = response.embeddings?.[0]?.values;
      if (!values?.length) {
        throw new Error('Gemini returned an empty embedding.');
      }

      return values;
    } catch (error) {
      throw new Error(`Gemini generateEmbedding failed: ${sanitizeErrorMessage(error)}`);
    }
  }
}
