export type OkrKeyResultJson = {
  content: string;
  type: string | null;
  criteria: string | null;
  start: number | null;
  target: number | null;
  unit: string | null;
  personInCharge: string | null;
  dueDate: string | null;
};

export type OkrObjectiveJson = {
  content: string;
  owner: string | null;
  frequency: string | null;
  keyResults: OkrKeyResultJson[];
};

export type OkrDraftJson = {
  objectives: OkrObjectiveJson[];
};

function fieldValue(block: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = block.match(new RegExp(`^\\s*-\\s*${escaped}\\s*:\\s*(.+?)\\s*$`, 'im'));
  return match?.[1]?.trim() || null;
}

function parseNumber(value: string | null): number | null {
  if (value == null || value === '') {
    return null;
  }
  const cleaned = value.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  if (!cleaned) {
    return null;
  }
  const n = Number(cleaned[0]);
  return Number.isFinite(n) ? n : null;
}

function parseKeyResult(block: string): OkrKeyResultJson {
  return {
    content: fieldValue(block, 'Content') ?? '',
    type: fieldValue(block, 'Type of KR'),
    criteria: fieldValue(block, 'Criteria'),
    start: parseNumber(fieldValue(block, 'Start')),
    target: parseNumber(fieldValue(block, 'Target')),
    unit: fieldValue(block, 'Unit'),
    personInCharge: fieldValue(block, 'Person in charge'),
    dueDate: fieldValue(block, 'Due date'),
  };
}

function parseObjective(block: string): OkrObjectiveJson {
  const krParts = block.split(/(?=^#{1,3}\s*Key Result\s*\d+)/im);
  const header = krParts[0] ?? '';
  const keyResults = krParts.slice(1).map(parseKeyResult);

  return {
    content: fieldValue(header, 'Content') ?? '',
    owner: fieldValue(header, 'Owner'),
    frequency: fieldValue(header, 'Frequency'),
    keyResults,
  };
}

/** Best-effort parse of F.OKR-shaped markdown into JSON for export. */
export function parseOkrDraftMarkdown(markdown: string): OkrDraftJson {
  const text = markdown.trim();
  if (!text) {
    return { objectives: [] };
  }

  const parts = text.split(/(?=^#{1,3}\s*Objective\s*\d+)/im).filter((p) => /Objective\s*\d+/i.test(p));
  if (parts.length === 0) {
    return { objectives: [] };
  }

  return { objectives: parts.map(parseObjective) };
}
