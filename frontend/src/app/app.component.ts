import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from './models/chat-message';
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

  @ViewChild('messageList') private messageList?: ElementRef<HTMLDivElement>;

  readonly title = 'FPT OKR Coach';
  draft = '';
  useRag = true;
  isSending = false;
  error = '';
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
      'Xin chào! Điền form bên trái (vai trò / đơn vị / quý / OKR cấp trên) rồi bấm “Soạn OKR”, hoặc chat tự do để hỏi về 6 Rõ, Align, CFR.',
  };

  ngOnInit(): void {
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

  generateFromIntake(): void {
    const prompt = this.buildIntakePrompt();
    if (!prompt) {
      this.error = 'Cần ít nhất vai trò hoặc ưu tiên để soạn OKR.';
      return;
    }
    this.draft = prompt;
    this.sendMessage();
  }

  sendMessage(): void {
    const text = this.draft.trim();
    if (!text || this.isSending) {
      return;
    }

    this.error = '';
    this.validation = null;
    this.messages = [...this.messages, { role: 'user', content: text }];
    this.draft = '';
    this.isSending = true;
    this.persist();
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
        this.persist();
        this.scrollToBottom();
      },
      error: (err: unknown) => {
        this.isSending = false;
        this.error = this.formatChatError(err);
        this.scrollToBottom();
      },
    });
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
