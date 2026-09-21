import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChatApiResponse, ChatMessage } from '../models/chat-message';
import { AuthService } from './auth.service';

export type ChatStreamEvent =
  | { type: 'status'; message: string }
  | { type: 'tool'; name: string; ok: boolean }
  | { type: 'delta'; text: string }
  | { type: 'done'; provider: string; ragContextUsed: boolean; toolsUsed: string[] }
  | { type: 'error'; detail: string };

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly chatUrl = `${environment.apiBaseUrl}/api/chat`;
  private readonly streamUrl = `${environment.apiBaseUrl}/api/chat/stream`;

  sendMessage(message: string, history: ChatMessage[], useRag = true): Observable<ChatApiResponse> {
    return this.http.post<ChatApiResponse>(this.chatUrl, {
      message,
      history,
      useRag,
    });
  }

  async streamMessage(
    message: string,
    history: ChatMessage[],
    useRag: boolean,
    onEvent: (event: ChatStreamEvent) => void,
  ): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = this.auth.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(this.streamUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, history, useRag }),
    });

    if (!response.ok) {
      let detail = `Backend error (${response.status})`;
      try {
        const body = (await response.json()) as { detail?: string; error?: string };
        detail = body.detail || body.error || detail;
      } catch {
        // ignore
      }
      throw new Error(detail);
    }

    if (!response.body) {
      throw new Error('Streaming is not supported by this browser/response.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const line = part
          .split('\n')
          .map((item) => item.trim())
          .find((item) => item.startsWith('data:'));
        if (!line) {
          continue;
        }
        const json = line.replace(/^data:\s*/, '');
        try {
          onEvent(JSON.parse(json) as ChatStreamEvent);
        } catch {
          // ignore malformed chunk
        }
      }
    }
  }
}
