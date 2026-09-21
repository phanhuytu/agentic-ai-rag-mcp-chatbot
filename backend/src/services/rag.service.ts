import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const knowledgePath = path.resolve(__dirname, '../../data/knowledge-base.md');

/**
 * Minimal keyword RAG for the scaffold.
 * Course labs will replace this with embeddings + cosine similarity ranking.
 */
export async function buildRagContext(query: string): Promise<string> {
  const raw = await readFile(knowledgePath, 'utf8');
  const chunks = raw
    .split(/\n##\s+/)
    .map((chunk, index) => (index === 0 ? chunk : `## ${chunk}`))
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+/i)
    .filter((term) => term.length > 2);

  const ranked = chunks
    .map((chunk) => {
      const lower = chunk.toLowerCase();
      const score = terms.reduce((sum, term) => (lower.includes(term) ? sum + 1 : sum), 0);
      return { chunk, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.chunk);

  return ranked.join('\n\n---\n\n');
}
