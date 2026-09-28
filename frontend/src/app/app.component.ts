import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, NgZone, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from './models/chat-message';
import { AuthService } from './services/auth.service';
import { ChatService, ChatStreamEvent } from './services/chat.service';
import { OkrService, OkrValidationResult } from './services/okr.service';
import { parseOkrDraftMarkdown } from './utils/okr-draft-parser';

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
  private readonly zone = inject(NgZone);

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
    skillDev: false,
    skillDevNote: '',
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
      this.error = 'Cần ít nhất vai trò, ưu tiên, hoặc bật skill-dev để soạn OKR.';
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

    const historyForApi = this.messages.slice(0, -1).filter((message) => message.role !== 'system');
    const assistantIndex = this.messages.length;
    this.messages = [...this.messages, { role: 'assistant', content: '' }];

    let provider = '';
    let rag = false;
    let tools: string[] = [];
    let assembled = '';

    try {
      await this.chatService.streamMessage(text, historyForApi, this.useRag, (event) => {
        this.zone.run(() => this.applyStreamEvent(event, assistantIndex, (state) => {
          if (state.provider) {
            provider = state.provider;
          }
          if (state.rag !== undefined) {
            rag = state.rag;
          }
          if (state.tools) {
            tools = state.tools;
          }
          if (state.assembled !== undefined) {
            assembled = state.assembled;
          }
        }));
      });

      if (!assembled.trim()) {
        this.statusText = 'stream empty — fallback…';
        const fallback = await this.chatService.askOnce(text, historyForApi, this.useRag);
        assembled = fallback.reply;
        provider = fallback.provider;
        rag = fallback.ragContextUsed;
        tools = fallback.toolsUsed ?? [];
        this.patchAssistant(assistantIndex, assembled);
      }

      this.finalizeAssistant(assistantIndex, assembled, provider, rag, tools);
      this.statusText = '';
      this.persist();
    } catch (err: unknown) {
      try {
        this.statusText = 'retry without stream…';
        const fallback = await this.chatService.askOnce(text, historyForApi, this.useRag);
        this.finalizeAssistant(
          assistantIndex,
          fallback.reply,
          fallback.provider,
          fallback.ragContextUsed,
          fallback.toolsUsed ?? [],
        );
        this.error = '';
        this.statusText = '';
        this.persist();
      } catch {
        this.messages = this.messages.slice(0, -1);
        this.error = this.formatChatError(err);
        this.persist();
      }
    } finally {
      this.isSending = false;
      this.scrollToBottom();
    }
  }

  exportLastOkr(): void {
    const lastAssistant = [...this.messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant?.content.trim()) {
      this.error = 'Chưa có bản OKR để export.';
      return;
    }

    const stamp = Date.now();
    const body = lastAssistant.content.trim();
    const markdown = `# OKR draft\n\n${body}\n`;
    this.downloadBlob(`okr-draft-${stamp}.md`, markdown, 'text/markdown;charset=utf-8');

    const json = parseOkrDraftMarkdown(body);
    this.downloadBlob(
      `okr-draft-${stamp}.json`,
      `${JSON.stringify(json, null, 2)}\n`,
      'application/json;charset=utf-8',
    );
    this.error = '';
  }

  private downloadBlob(filename: string, content: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  validateLastOkr(): void {
    const lastAssistant = [...this.messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant?.content.trim()) {
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

  private applyStreamEvent(
    event: ChatStreamEvent,
    assistantIndex: number,
    sync: (state: {
      provider?: string;
      rag?: boolean;
      tools?: string[];
      assembled?: string;
    }) => void,
  ): void {
    if (event.type === 'status') {
      this.statusText = event.message;
      return;
    }

    if (event.type === 'tool') {
      this.statusText = `tool ${event.name}: ${event.ok ? 'ok' : 'fail'}`;
      return;
    }

    if (event.type === 'delta') {
      const current = this.messages[assistantIndex];
      if (!current) {
        return;
      }
      current.content += event.text;
      sync({ assembled: current.content });
      this.messages = [...this.messages];
      this.scrollToBottom();
      return;
    }

    if (event.type === 'done') {
      const reply = event.reply?.trim() || this.messages[assistantIndex]?.content || '';
      if (reply) {
        this.patchAssistant(assistantIndex, reply);
      }
      sync({
        provider: event.provider,
        rag: event.ragContextUsed,
        tools: event.toolsUsed ?? [],
        assembled: reply,
      });
      return;
    }

    if (event.type === 'error') {
      throw new Error(event.detail);
    }
  }

  private patchAssistant(index: number, content: string): void {
    const current = this.messages[index];
    if (!current) {
      return;
    }
    current.content = content;
    this.messages = [...this.messages];
  }

  private finalizeAssistant(
    index: number,
    reply: string,
    provider: string,
    rag: boolean,
    tools: string[],
  ): void {
    const bits = [
      provider || 'llm',
      rag ? 'RAG' : null,
      tools.length ? `tools:${tools.join(',')}` : null,
    ].filter(Boolean);

    this.patchAssistant(index, `${reply.trim()}\n\n— ${bits.join(' · ')}`);
  }

  private buildIntakePrompt(): string {
    const { role, unit, period, upperOkrs, priorities, skillDev, skillDevNote } = this.intake;
    if (!role.trim() && !priorities.trim() && !upperOkrs.trim() && !skillDev) {
      return '';
    }

    const lines = [
      'Hãy giúp tôi soạn OKR theo khung FPT (tối đa 3 O, mỗi O 2-4 KR, Align, 6 Rõ).',
      role.trim() ? `Vai trò: ${role.trim()}` : '',
      unit.trim() ? `Đơn vị: ${unit.trim()}` : '',
      period.trim() ? `Kỳ: ${period.trim()}` : '',
      priorities.trim() ? `Ưu tiên trong kỳ: ${priorities.trim()}` : '',
      upperOkrs.trim() ? `OKR cấp trên / chiến lược liên quan:\n${upperOkrs.trim()}` : '',
      'Trả về đúng mẫu form F.OKR (Edit OKR):',
      '## Objective N',
      '- Content / Owner / Frequency (Monthly hoặc Quarterly)',
      '### Key Result N',
      '- Content / Type of KR (Milestone|Currency|Numeric|Percentage) / Criteria (Higher is better|Lower is better)',
      '- Start / Target / Unit / Person in charge / Due date (DD-MMM-YYYY)',
      'Ưu tiên ý tưởng từ ngân hàng ý tưởng; đánh dấu số liệu cần xác nhận; kèm checklist ngắn.',
    ];

    if (skillDev) {
      lines.push(
        'Bật OKR phát triển kỹ năng: thêm tối đa 1 Objective học → ứng dụng (không chỉ hoàn thành khóa học).',
        skillDevNote.trim()
          ? `Ghi chú skill-dev: ${skillDevNote.trim()}`
          : 'Gợi ý mặc định: học một khóa AI/agentic và ship một app nhỏ (RAG/chatbot) để tăng kỹ năng làm việc.',
      );
    }

    return lines.filter(Boolean).join('\n');
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
