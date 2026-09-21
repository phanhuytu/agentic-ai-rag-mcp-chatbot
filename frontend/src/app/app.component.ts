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

  readonly title = 'Agentic AI Chat';
  draft = '';
  useRag = true;
  isSending = false;
  error = '';
  messages: ChatMessage[] = [
    {
      role: 'assistant',
      content:
        'Scaffold ready. Ask about RAG, MCP, shipping, or returns. Wire API keys later for real LLM answers.',
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
        this.error =
          err instanceof Error
            ? err.message
            : 'Failed to reach backend. Is it running on http://localhost:3000?';
        this.scrollToBottom();
      },
    });
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
