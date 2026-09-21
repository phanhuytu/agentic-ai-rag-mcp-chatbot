import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from './models/chat-message';
import { AuthService } from './services/auth.service';
import { ChatService } from './services/chat.service';
import { OkrService, OkrValidationResult } from './services/okr.service';

const STORAGE_KEY = 'fpt-okr-coach-messages';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private readonly chatService = inject(ChatService);
  private readonly okrService = inject(OkrService);
  private readonly authService = inject(AuthService);

  @ViewChild('messageList') private messageList?: ElementRef<HTMLDivElement>;

  readonly title = 'FPT OKR Coach';
  draft = '';
  useRag = true;
  isSending = false;
  error = '';
  statusText = '';
  accessToken = '';
  validation: OkrValidationResult | null = null;

  intake = {
    role: '',
    unit: '',
    period: 'Q1',
    upperOkrs: '',
    priorities: '',
  };

  messages: ChatMessage[] = [];

  private readonly welcome: ChatMessage = {
    role: 'assistant',
    content:
      'Xin chào! Demo RAG + agent tools + streaming.\n\n' +
      'Điền form rồi “Soạn OKR”, hoặc hỏi “6 Rõ là gì?”, “kiểm tra OKR …” để agent tự gọi tool.',
  };

  ngOnInit(): void {
    this.accessToken = this.authService.getToken();
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.messages = parsed;
          return;
        }
      } catch {
        // ignore corrupt cache
      }
    }
    this.messages = [this.welcome];
  }

  saveToken(): void {
    this.authService.setToken(this.accessToken);
    this.error = '';
    this.statusText = this.accessToken.trim() ? 'Đã lưu access token (session).' : 'Đã xóa token.';
  }

  generateFromIntake(): void {
    const prompt = this.buildIntakePrompt();
    if (!prompt) {
      this.error = 'Cần ít nhất vai trò hoặc ưu tiên để soạn OKR.';
      return;
    }
    this.draft = prompt;
    void this.sendMessage();
  }

  async sendMessage(): Promise<void> {
    const text = this.draft.trim();
    if (!text || this.isSending) {
      return;
    }

    this.error = '';
    this.statusText = '';
    this.validation = null;
    this.messages = [...this.messages, { role: 'user', content: text }];
    this.draft = '';
    this.isSending = true;
    this.persist();
    this.scrollToBottom();

    const history = this.messages.filter((message) => message.role !== 'system');
    const assistantIndex = this.messages.length;
    this.messages = [...this.messages, { role: 'assistant', content: '' }];

    try {
      let provider = '';
      let rag = false;
      let tools: string[] = [];

      await this.chatService.streamMessage(text, history.slice(0, -1), this.useRag, (event) => {
        if (event.type === 'status') {
          this.statusText = event.message;
        } else if (event.type === 'tool') {
          this.statusText = `tool ${event.name}: ${event.ok ? 'ok' : 'fail'}`;
        } else if (event.type === 'delta') {
          const current = this.messages[assistantIndex];
          if (current) {
            current.content += event.text;
            this.messages = [...this.messages];
            this.scrollToBottom();
          }
        } else if (event.type === 'done') {
          provider = event.provider;
          rag = event.ragContextUsed;
          tools = event.toolsUsed ?? [];
        } else if (event.type === 'error') {
          throw new Error(event.detail);
        }
      });

      const current = this.messages[assistantIndex];
      if (current) {
        const bits = [
          provider || 'llm',
          rag ? 'RAG' : null,
          tools.length ? `tools:${tools.join(',')}` : null,
        ].filter(Boolean);
        current.content = `${current.content.trim()}\n\n— ${bits.join(' · ')}`;
        this.messages = [...this.messages];
      }

      this.statusText = '';
      this.persist();
    } catch (err: unknown) {
      this.messages = this.messages.slice(0, -1);
      this.error = this.formatChatError(err);
      this.persist();
    } finally {
      this.isSending = false;
      this.scrollToBottom();
    }
  }

  exportLastOkr(): void {
    const lastAssistant = [...this.messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant) {
      this.error = 'Chưa có bản OKR để export.';
      return;
    }

    const markdown = `# OKR draft\n\n${lastAssistant.content}\n`;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `okr-draft-${Date.now()}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  validateLastOkr(): void {
    const lastAssistant = [...this.messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant) {
      this.error = 'Chưa có bản OKR để validate.';
      return;
    }

    this.okrService.validateDraft(lastAssistant.content).subscribe({
      next: (result) => {
        this.validation = result;
        this.error = '';
      },
      error: (err: unknown) => {
        this.error = this.formatChatError(err);
      },
    });
  }

  clearHistory(): void {
    this.messages = [this.welcome];
    this.validation = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  private buildIntakePrompt(): string {
    const { role, unit, period, upperOkrs, priorities } = this.intake;
    if (!role.trim() && !priorities.trim() && !upperOkrs.trim()) {
      return '';
    }

    return [
      'Hãy giúp tôi soạn OKR theo khung FPT (tối đa 3 O, mỗi O 2-4 KR, Align, 6 Rõ, checklist).',
      role.trim() ? `Vai trò: ${role.trim()}` : '',
      unit.trim() ? `Đơn vị: ${unit.trim()}` : '',
      period.trim() ? `Kỳ: ${period.trim()}` : '',
      priorities.trim() ? `Ưu tiên trong kỳ: ${priorities.trim()}` : '',
      upperOkrs.trim() ? `OKR cấp trên / chiến lược liên quan:\n${upperOkrs.trim()}` : '',
      'Trả về bản O/KR rõ ràng, đánh dấu số liệu cần xác nhận, và checklist ngắn.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.messages));
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
