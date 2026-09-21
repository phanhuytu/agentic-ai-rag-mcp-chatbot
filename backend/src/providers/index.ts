import { GeminiProvider } from './gemini.provider.js';
import { OpenAIProvider } from './openai.provider.js';
import type { LlmProvider } from './types.js';

let geminiSingleton: GeminiProvider | null = null;

export function getLlmProvider(): LlmProvider {
  const selected = (process.env.LLM_PROVIDER ?? 'gemini').toLowerCase();

  if (selected === 'openai') {
    return new OpenAIProvider();
  }

  // Lazy-init so missing key only fails when Gemini is actually selected.
  if (!geminiSingleton) {
    geminiSingleton = new GeminiProvider();
  }

  return geminiSingleton;
}
