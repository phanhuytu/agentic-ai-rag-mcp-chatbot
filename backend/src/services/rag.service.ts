import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LlmProvider } from '../providers/types.js';
import { parseKnowledgeChunks, type KnowledgeChunk } from './knowledge-loader.js';
import { cosineSimilarity } from './similarity.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const knowledgePath = path.resolve(__dirname, '../../data/knowledge-base.md');

const TOP_K = Number(process.env.RAG_TOP_K ?? 4);
const MIN_SCORE = Number(process.env.RAG_MIN_SCORE ?? 0.35);

type IndexedChunk = KnowledgeChunk & {
  embedding: number[];
};

type EmbeddingIndex = {
  providerName: string;
  chunks: IndexedChunk[];
};

let embeddingIndex: EmbeddingIndex | null = null;
let indexPromise: Promise<EmbeddingIndex> | null = null;

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .normalize('NFC')
    .split(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+/i)
    .filter((term) => term.length > 1);
}

function keywordFallback(chunks: KnowledgeChunk[], query: string): string {
  const terms = tokenize(query);
  const ranked = chunks
    .map((chunk) => {
      const haystack = `${chunk.title}\n${chunk.body}`.toLowerCase();
      const score = terms.reduce((sum, term) => (haystack.includes(term) ? sum + 1 : sum), 0);
      return { chunk, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K)
    .map((item) => item.chunk.body);

  if (ranked.length > 0) {
    return ranked.join('\n\n---\n\n');
  }

  // Default coaching sections when nothing matches.
  const defaults = [
    'Quy trình coaching để tạo OKR phù hợp',
    'Cách viết Objective tốt',
    'Cách viết Key Result tốt',
    'Checklist review bản OKR trước khi nộp',
  ];
  return chunks
    .filter((chunk) => defaults.includes(chunk.title))
    .map((chunk) => chunk.body)
    .join('\n\n---\n\n');
}

async function loadChunks(): Promise<KnowledgeChunk[]> {
  const raw = await readFile(knowledgePath, 'utf8');
  return parseKnowledgeChunks(raw);
}

async function ensureEmbeddingIndex(provider: LlmProvider): Promise<EmbeddingIndex> {
  if (embeddingIndex && embeddingIndex.providerName === provider.name) {
    return embeddingIndex;
  }

  if (!provider.generateEmbedding) {
    throw new Error(`Provider ${provider.name} does not support embeddings.`);
  }

  if (!indexPromise) {
    indexPromise = (async () => {
      const chunks = await loadChunks();
      const indexed: IndexedChunk[] = [];

      for (const chunk of chunks) {
        const embedding = await provider.generateEmbedding!(`${chunk.title}\n${chunk.body}`);
        indexed.push({ ...chunk, embedding });
      }

      const built: EmbeddingIndex = {
        providerName: provider.name,
        chunks: indexed,
      };
      embeddingIndex = built;
      return built;
    })().finally(() => {
      indexPromise = null;
    });
  }

  return indexPromise;
}

/**
 * Embedding RAG with cosine similarity ranking.
 * Falls back to keyword retrieval if embeddings fail.
 */
export async function buildRagContext(query: string, provider: LlmProvider): Promise<string> {
  const chunks = await loadChunks();

  try {
    if (!provider.generateEmbedding) {
      return keywordFallback(chunks, query);
    }

    const index = await ensureEmbeddingIndex(provider);
    const queryEmbedding = await provider.generateEmbedding(query);

    const ranked = index.chunks
      .map((chunk) => ({
        chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding),
      }))
      .sort((a, b) => b.score - a.score);

    const selected = ranked.filter((item) => item.score >= MIN_SCORE).slice(0, TOP_K);
    const finalSelection = selected.length > 0 ? selected : ranked.slice(0, TOP_K);

    return finalSelection.map((item) => item.chunk.body).join('\n\n---\n\n');
  } catch (error) {
    console.warn(
      '[rag] Embedding retrieval failed, using keyword fallback:',
      error instanceof Error ? error.message : error,
    );
    return keywordFallback(chunks, query);
  }
}

/** Test helper / MCP tool: list playbook section titles. */
export async function listKnowledgeTitles(): Promise<string[]> {
  const chunks = await loadChunks();
  return chunks.map((chunk) => chunk.title);
}

/** Test helper / MCP tool: get one section by title (case-insensitive contains). */
export async function getKnowledgeSectionByTitle(titleQuery: string): Promise<KnowledgeChunk | null> {
  const chunks = await loadChunks();
  const needle = titleQuery.trim().toLowerCase();
  return (
    chunks.find((chunk) => chunk.title.toLowerCase() === needle) ??
    chunks.find((chunk) => chunk.title.toLowerCase().includes(needle)) ??
    null
  );
}
