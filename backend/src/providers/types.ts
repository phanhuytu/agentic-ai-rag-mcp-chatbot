import type { ChatMessage } from '../types/chat.js';

export type GenerateResponseInput = {
  message: string;
  history: ChatMessage[];
  context?: string;
};

export interface LlmProvider {
  readonly name: string;
  generateResponse(input: GenerateResponseInput): Promise<string>;
  generateEmbedding(text: string): Promise<number[]>;
}
