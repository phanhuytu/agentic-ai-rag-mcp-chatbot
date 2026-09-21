import { GeminiProvider } from './gemini.provider.js';
import { OpenAIProvider } from './openai.provider.js';
import type { LlmProvider } from './types.js';

let geminiSingleton: GeminiProvider | null = null;
let openaiSingleton: OpenAIProvider | null = null;

export function getLlmProvider(): LlmProvider {
  const selected = (process.env.LLM_PROVIDER ?? 'gemini').toLowerCase();

  if (selected === 'openai') {
    if (!openaiSingleton) {
      openaiSingleton = new OpenAIProvider();
    }
    return openaiSingleton;
  }

  if (!geminiSingleton) {
    geminiSingleton = new GeminiProvider();
  }

  return geminiSingleton;
}
