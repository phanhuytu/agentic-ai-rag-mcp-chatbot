import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const knowledgePath = path.resolve(__dirname, '../../data/knowledge-base.md');

const DEFAULT_CHUNK_TITLES = [
  'Quy trình coaching để tạo OKR phù hợp',
  'Cách viết Objective tốt',
  'Cách viết Key Result tốt',
  'Checklist review bản OKR trước khi nộp',
];

const INTENT_BOOST: Array<{ pattern: RegExp; titles: string[] }> = [
  {
    pattern: /tạo|viết|đặt|xây\s*dựng|soạn|draft|create|write/i,
    titles: [
      'Quy trình coaching để tạo OKR phù hợp',
      'Cách viết Objective tốt',
      'Cách viết Key Result tốt',
      'Cấu trúc OKR chuẩn FPT',
    ],
  },
  {
    pattern: /6\s*rõ|sáu\s*rõ|6\s*ro/i,
    titles: ['Nguyên tắc 6 Rõ giai đoạn 2026-2028'],
  },
  {
    pattern: /bẫy|sai\s*lầm|lỗi|tránh|pitfall/i,
    titles: ['Sáu bẫy thường gặp khi đặt OKR', 'Năm tiêu chí đặt OKR đúng theo FPT'],
  },
  {
    pattern: /cfr|phản\s*hồi|ghi\s*nhận|check-?in|1-?on-?1/i,
    titles: ['CFR đồng hành cùng OKR'],
  },
  {
    pattern: /align|hướng\s*tâm|cấp\s*trên|liên\s*kết/i,
    titles: ['Alignment hướng tâm giữa các cấp'],
  },
  {
    pattern: /ví\s*dụ|mẫu|example|sample/i,
    titles: ['Ví dụ OKR mẫu theo vai trò'],
  },
  {
    pattern: /checklist|review|kiểm\s*tra|chấm/i,
    titles: ['Checklist review bản OKR trước khi nộp', 'Năm tiêu chí đặt OKR đúng theo FPT'],
  },
];

type Chunk = {
  title: string;
  body: string;
};

function parseChunks(raw: string): Chunk[] {
  return raw
    .split(/\n##\s+/)
    .map((part, index) => (index === 0 ? part : `## ${part}`))
    .map((part) => part.trim())
    .filter(Boolean)
    .map((body) => {
      const titleMatch = body.match(/^##\s+(.+)$/m);
      return {
        title: titleMatch?.[1]?.trim() ?? 'Overview',
        body,
      };
    });
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .normalize('NFC')
    .split(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+/i)
    .filter((term) => term.length > 1);
}

function scoreChunk(chunk: Chunk, terms: string[]): number {
  const haystack = `${chunk.title}\n${chunk.body}`.toLowerCase();
  let score = terms.reduce((sum, term) => (haystack.includes(term) ? sum + 1 : sum), 0);

  if (haystack.includes('okr')) {
    score += 0.5;
  }

  return score;
}

function pickByTitles(chunks: Chunk[], titles: string[]): Chunk[] {
  const selected: Chunk[] = [];
  for (const title of titles) {
    const found = chunks.find((chunk) => chunk.title === title);
    if (found && !selected.some((item) => item.title === found.title)) {
      selected.push(found);
    }
  }
  return selected;
}

/**
 * Keyword RAG over the FPT OKR knowledge base.
 * Returns the most relevant sections for coaching OKR creation.
 */
export async function buildRagContext(query: string): Promise<string> {
  const raw = await readFile(knowledgePath, 'utf8');
  const chunks = parseChunks(raw);
  const terms = tokenize(query);

  const ranked = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, terms) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const selected: Chunk[] = [];

  for (const rule of INTENT_BOOST) {
    if (rule.pattern.test(query)) {
      selected.push(...pickByTitles(chunks, rule.titles));
    }
  }

  for (const item of ranked) {
    if (selected.length >= 4) {
      break;
    }
    if (!selected.some((chunk) => chunk.title === item.chunk.title)) {
      selected.push(item.chunk);
    }
  }

  if (selected.length === 0) {
    selected.push(...pickByTitles(chunks, DEFAULT_CHUNK_TITLES));
  }

  return selected
    .slice(0, 4)
    .map((chunk) => chunk.body)
    .join('\n\n---\n\n');
}
