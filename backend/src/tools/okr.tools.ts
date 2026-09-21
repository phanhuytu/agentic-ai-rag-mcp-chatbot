import { getKnowledgeSectionByTitle, listKnowledgeTitles } from '../services/rag.service.js';
import { callTool, listTools, registerTool } from '../mcp/tool-registry.js';

export type OkrValidationIssue = {
  code: string;
  message: string;
};

export type OkrValidationResult = {
  ok: boolean;
  issues: OkrValidationIssue[];
  summary: string;
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function validateOkrDraft(draft: string): OkrValidationResult {
  const text = draft.trim();
  const issues: OkrValidationIssue[] = [];

  if (!text) {
    return {
      ok: false,
      issues: [{ code: 'empty', message: 'Bản OKR trống.' }],
      summary: 'Cần dán nội dung OKR để kiểm tra.',
    };
  }

  const objectiveMatches = text.match(/(?:^|\n)\s*(?:O\d+|Objective\s*\d+|Mục tiêu\s*\d+)\s*[:.\-]/gi);
  const objectiveCount = objectiveMatches?.length ?? 0;
  if (objectiveCount === 0) {
    issues.push({
      code: 'missing_objectives',
      message: 'Chưa nhận diện được Objective (O1/O2…). Hãy đánh số rõ ràng.',
    });
  } else if (objectiveCount > 3) {
    issues.push({
      code: 'too_many_objectives',
      message: `Phát hiện ${objectiveCount} Objectives. FPT khuyến nghị tối đa 3 O.`,
    });
  }

  const krMatches = text.match(/(?:^|\n)\s*(?:KR\d+|Key Result\s*\d+|Kết quả then chốt\s*\d+)\s*[:.\-]/gi);
  const krCount = krMatches?.length ?? 0;
  if (krCount === 0) {
    issues.push({
      code: 'missing_krs',
      message: 'Chưa nhận diện được Key Results (KR1/KR2…).',
    });
  }

  const hasNumber = /\d/.test(text);
  if (!hasNumber) {
    issues.push({
      code: 'not_measurable',
      message: 'KR nên có số đo (baseline/target/%/số lượng).',
    });
  }

  const mentionsDeadline = /(deadline|hạn|trước|quý|tháng|q[1-4]|\d{1,2}\/\d{1,2})/i.test(text);
  if (!mentionsDeadline) {
    issues.push({
      code: 'missing_deadline',
      message: 'Thiếu thời hạn rõ (ngày/tháng/quý) — kiểm tra nguyên tắc 6 Rõ.',
    });
  }

  const mentionsOwner = /(owner|phụ trách|chịu trách nhiệm|pic)/i.test(text);
  if (!mentionsOwner) {
    issues.push({
      code: 'missing_owner',
      message: 'Nên ghi rõ Owner cho từng KR (6 Rõ: rõ người phụ trách).',
    });
  }

  const ok = issues.length === 0;
  return {
    ok,
    issues,
    summary: ok
      ? 'Bản nháp trông ổn theo checklist nhanh FPT. Vẫn nên review Align và 6 Rõ thủ công.'
      : `Phát hiện ${issues.length} điểm cần chỉnh trước khi nộp.`,
  };
}

let registered = false;

export function registerOkrTools(): void {
  if (registered) {
    return;
  }

  registerTool({
    name: 'validate_okr_draft',
    description: 'Validate an OKR draft against FPT quick checks (count, measurability, deadline, owner).',
    inputSchema: {
      type: 'object',
      properties: {
        draft: { type: 'string', description: 'Full OKR draft text' },
      },
      required: ['draft'],
    },
    handler: async (input) => validateOkrDraft(asString(input.draft)),
  });

  registerTool({
    name: 'list_okr_playbook_sections',
    description: 'List FPT OKR knowledge-base section titles.',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => ({ titles: await listKnowledgeTitles() }),
  });

  registerTool({
    name: 'get_okr_playbook_section',
    description: 'Fetch one OKR playbook section by title keyword.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Section title or keyword' },
      },
      required: ['title'],
    },
    handler: async (input) => {
      const section = await getKnowledgeSectionByTitle(asString(input.title));
      if (!section) {
        return { found: false, title: input.title };
      }
      return { found: true, title: section.title, body: section.body };
    },
  });

  registered = true;
}

export { callTool, listTools };
