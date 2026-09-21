import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChatApiResponse, ChatMessage } from '../models/chat-message';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly chatUrl = `${environment.apiBaseUrl}/api/chat`;

  sendMessage(message: string, history: ChatMessage[], useRag = true): Observable<ChatApiResponse> {
    return this.http.post<ChatApiResponse>(this.chatUrl, {
      message,
      history,
      useRag,
    });
  }
}
