export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ChatRequestBody = {
  message: string;
  history?: ChatMessage[];
  useRag?: boolean;
};

export type ChatResponseBody = {
  reply: string;
  provider: string;
  ragContextUsed: boolean;
};
