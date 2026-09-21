import { GoogleGenAI } from '@google/genai';
import { buildOkrSystemInstruction, sanitizeProviderError } from './prompt.js';
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
          systemInstruction: buildOkrSystemInstruction(input.context),
        },
      });

      const text = response.text?.trim();
      if (!text) {
        throw new Error('Gemini returned an empty response.');
      }

      return text;
    } catch (error) {
      throw new Error(`Gemini generateResponse failed: ${sanitizeProviderError(error)}`);
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
      throw new Error(`Gemini generateEmbedding failed: ${sanitizeProviderError(error)}`);
    }
  }
}
