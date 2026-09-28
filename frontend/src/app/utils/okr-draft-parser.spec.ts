import { parseOkrDraftMarkdown } from './okr-draft-parser';

describe('parseOkrDraftMarkdown', () => {
  it('returns empty objectives for blank input', () => {
    expect(parseOkrDraftMarkdown('')).toEqual({ objectives: [] });
    expect(parseOkrDraftMarkdown('   ')).toEqual({ objectives: [] });
  });

  it('parses one Objective and one Key Result with F.OKR fields', () => {
    const md = `
## Objective 1
- Content: Đảm bảo tiến độ và chất lượng bàn giao Backend Q4.
- Owner: Phan Huy Tự (TuPH3)
- Frequency: Monthly

### Key Result 1
- Content: Đạt On-time Delivery 100% cho mọi Sprint trong Q4
- Type of KR: Percentage
- Criteria: Higher is better
- Start: 0
- Target: 100
- Unit: %
- Person in charge: Phan Huy Tự (TuPH3)
- Due date: 31-Dec-2026
`.trim();

    const result = parseOkrDraftMarkdown(md);
    expect(result.objectives.length).toBe(1);
    expect(result.objectives[0].content).toContain('Backend Q4');
    expect(result.objectives[0].owner).toBe('Phan Huy Tự (TuPH3)');
    expect(result.objectives[0].frequency).toBe('Monthly');
    expect(result.objectives[0].keyResults.length).toBe(1);
    const kr = result.objectives[0].keyResults[0];
    expect(kr.type).toBe('Percentage');
    expect(kr.criteria).toBe('Higher is better');
    expect(kr.start).toBe(0);
    expect(kr.target).toBe(100);
    expect(kr.unit).toBe('%');
    expect(kr.personInCharge).toBe('Phan Huy Tự (TuPH3)');
    expect(kr.dueDate).toBe('31-Dec-2026');
  });
});
