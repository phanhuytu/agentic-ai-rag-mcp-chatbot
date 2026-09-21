export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatApiResponse {
  reply: string;
  provider: string;
  ragContextUsed: boolean;
  toolsUsed?: string[];
}
