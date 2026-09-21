import OpenAI from 'openai';
import { buildOkrSystemInstruction, sanitizeProviderError } from './prompt.js';
import type { GenerateResponseInput, LlmProvider } from './types.js';

export class OpenAIProvider implements LlmProvider {
  readonly name = 'openai';
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly embeddingModel: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is missing. Add it to backend/.env to use LLM_PROVIDER=openai.',
      );
    }

    this.client = new OpenAI({ apiKey });
    this.model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
    this.embeddingModel =
      process.env.OPENAI_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small';
  }

  async generateResponse(input: GenerateResponseInput): Promise<string> {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: buildOkrSystemInstruction(input.context),
        },
      ];

      for (const message of input.history) {
        if (message.role === 'system' || !message.content.trim()) {
          continue;
        }
        messages.push({
          role: message.role === 'assistant' ? 'assistant' : 'user',
          content: message.content,
        });
      }

      messages.push({ role: 'user', content: input.message });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
      });

      const text = response.choices[0]?.message?.content?.trim();
      if (!text) {
        throw new Error('OpenAI returned an empty response.');
      }

      return text;
    } catch (error) {
      throw new Error(`OpenAI generateResponse failed: ${sanitizeProviderError(error)}`);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });

      const values = response.data[0]?.embedding;
      if (!values?.length) {
        throw new Error('OpenAI returned an empty embedding.');
      }

      return values;
    } catch (error) {
      throw new Error(`OpenAI generateEmbedding failed: ${sanitizeProviderError(error)}`);
    }
  }
}
