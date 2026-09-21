import type { GenerateResponseInput, LlmProvider } from './types.js';

/**
 * Scaffold provider — returns a deterministic reply so the app runs without API keys.
 * Replace generateResponse / generateEmbedding with real Gemini SDK calls in course labs.
 */
export class GeminiProvider implements LlmProvider {
  readonly name = 'gemini';

  async generateResponse(input: GenerateResponseInput): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      const contextHint = input.context
        ? `\n\n[RAG context available — ${input.context.length} chars]`
        : '';
      return (
        `[Gemini scaffold] You asked: "${input.message}".` +
        ` Set GEMINI_API_KEY and implement the Gemini API client to get real answers.` +
        contextHint
      );
    }

    throw new Error(
      'GEMINI_API_KEY is set, but GeminiProvider.generateResponse is not implemented yet. Complete the course lab wiring.',
    );
  }

  async generateEmbedding(_text: string): Promise<number[]> {
    throw new Error('GeminiProvider.generateEmbedding is not implemented yet.');
  }
}
