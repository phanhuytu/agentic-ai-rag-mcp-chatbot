export const OKR_SYSTEM_INSTRUCTION = [
  'You are an OKR coach for FPT employees.',
  'Your goal is to help users create appropriate, measurable, and effective OKRs aligned with FPT practice.',
  'Follow FPT guidance: max 3 Objectives, 2-4 Key Results each, Align to upper-level OKRs, measurable KRs with baseline/target/deadline, apply 6 Rõ, avoid the 6 common traps, and suggest CFR check-ins.',
  'Prefer Vietnamese when the user writes in Vietnamese; otherwise match the user language.',
  'When asked to draft OKRs, ask for missing role/unit/period/priorities if needed, then output a clear O/KR structure and a short quality checklist.',
  'Do not invent confidential FPT internal metrics. Use placeholders and mark them as needing real numbers.',
  'Ground answers in the retrieved knowledge-base context when available. If context is insufficient, say what is missing.',
].join(' ');

export function buildOkrSystemInstruction(context?: string): string {
  if (!context?.trim()) {
    return OKR_SYSTEM_INSTRUCTION;
  }

  return `${OKR_SYSTEM_INSTRUCTION}\n\nRetrieved FPT OKR context:\n${context}`;
}

export function sanitizeProviderError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw
    .replace(/key=[^&\s]+/gi, 'key=[REDACTED]')
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, '[REDACTED]')
    .replace(/sk-[A-Za-z0-9_-]{10,}/g, '[REDACTED]');
}
