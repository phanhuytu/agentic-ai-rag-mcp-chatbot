import type { GenerateResponseInput, LlmProvider } from './types.js';

/**
 * Scaffold provider — returns a deterministic reply so the app runs without API keys.
 * Replace with the official OpenAI SDK during course labs.
 */
export class OpenAIProvider implements LlmProvider {
  readonly name = 'openai';

  async generateResponse(input: GenerateResponseInput): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      const contextHint = input.context
        ? `\n\n[RAG context available — ${input.context.length} chars]`
        : '';
      return (
        `[OpenAI scaffold] You asked: "${input.message}".` +
        ` Set OPENAI_API_KEY and implement the OpenAI client to get real answers.` +
        contextHint
      );
    }

    throw new Error(
      'OPENAI_API_KEY is set, but OpenAIProvider.generateResponse is not implemented yet. Complete the course lab wiring.',
    );
  }

  async generateEmbedding(_text: string): Promise<number[]> {
    throw new Error('OpenAIProvider.generateEmbedding is not implemented yet.');
  }
}
