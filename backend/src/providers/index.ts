import { GeminiProvider } from './gemini.provider.js';
import { OpenAIProvider } from './openai.provider.js';
import type { LlmProvider } from './types.js';

export function getLlmProvider(): LlmProvider {
  const selected = (process.env.LLM_PROVIDER ?? 'gemini').toLowerCase();

  if (selected === 'openai') {
    return new OpenAIProvider();
  }

  return new GeminiProvider();
}
