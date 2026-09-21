export type KnowledgeChunk = {
  id: string;
  title: string;
  body: string;
};

export function parseKnowledgeChunks(raw: string): KnowledgeChunk[] {
  return raw
    .split(/\n##\s+/)
    .map((part, index) => (index === 0 ? part : `## ${part}`))
    .map((part) => part.trim())
    .filter(Boolean)
    .map((body, index) => {
      const titleMatch = body.match(/^##\s+(.+)$/m);
      const title = titleMatch?.[1]?.trim() ?? (index === 0 ? 'Overview' : `Section ${index}`);
      return {
        id: `chunk-${index}`,
        title,
        body,
      };
    })
    .filter((chunk) => chunk.title !== 'Overview' || chunk.body.includes('##'));
}
