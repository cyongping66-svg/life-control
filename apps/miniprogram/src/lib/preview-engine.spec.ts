import { describe, expect, it } from 'vitest';
import { buildPreviewAnswer, classifyPreviewQuestion } from './preview-engine';

describe('本地预览问答', () => {
  it.each([
    ['社保和公积金怎么查？', 'finance'],
    ['简历怎么优化？', 'career'],
    ['如何维护同学关系？', 'social'],
    ['我下一步应该做什么？', 'general'],
  ])('将“%s”归类为 %s', (question, category) => {
    expect(classifyPreviewQuestion(question)).toBe(category);
  });

  it('为社保公积金问题关联两个官方来源', () => {
    const answer = buildPreviewAnswer('社保和公积金怎么查？', 'answer-1');
    expect(answer.sources).toHaveLength(2);
    expect(answer.sources.every((source) => source.platform === 'official')).toBe(true);
    expect(answer.disclaimer).toContain('离线预览');
    expect(answer.answer).toContain('国家官方入口');
  });
});
