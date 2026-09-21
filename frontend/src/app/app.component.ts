import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from './models/chat-message';
import { ChatService } from './services/chat.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly chatService = inject(ChatService);

  @ViewChild('messageList') private messageList?: ElementRef<HTMLDivElement>;

  readonly title = 'FPT OKR Coach';
  draft = '';
  useRag = true;
  isSending = false;
  error = '';
  messages: ChatMessage[] = [
    {
      role: 'assistant',
      content:
        'Xin chào! Tôi là trợ lý OKR theo khung FPT (Align, 5 tiêu chí, 6 Rõ, CFR).\n\n' +
        'Bạn có thể hỏi cách viết O/KR, nhờ review bản nháp, hoặc nói vai trò + ưu tiên quý này để tôi giúp soạn OKR.',
    },
  ];

  sendMessage(): void {
    const text = this.draft.trim();
    if (!text || this.isSending) {
      return;
    }

    this.error = '';
    this.messages = [...this.messages, { role: 'user', content: text }];
    this.draft = '';
    this.isSending = true;
    this.scrollToBottom();

    const history = this.messages.filter((message) => message.role !== 'system');

    this.chatService.sendMessage(text, history.slice(0, -1), this.useRag).subscribe({
      next: (response) => {
        const suffix = response.ragContextUsed ? ' (RAG)' : '';
        this.messages = [
          ...this.messages,
          {
            role: 'assistant',
            content: `${response.reply}\n\n— ${response.provider}${suffix}`,
          },
        ];
        this.isSending = false;
        this.scrollToBottom();
      },
      error: (err: unknown) => {
        this.isSending = false;
        this.error = this.formatChatError(err);
        this.scrollToBottom();
      },
    });
  }

  private formatChatError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { detail?: string; error?: string } | string | null;
      if (body && typeof body === 'object') {
        return body.detail || body.error || `Backend error (${err.status})`;
      }
      if (err.status === 0) {
        return 'Failed to reach backend. Is it running on http://localhost:3000?';
      }
      return err.message || `Backend error (${err.status})`;
    }

    if (err instanceof Error) {
      return err.message;
    }

    return 'Failed to reach backend. Is it running on http://localhost:3000?';
  }

  private scrollToBottom(): void {
    queueMicrotask(() => {
      const el = this.messageList?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }
}
