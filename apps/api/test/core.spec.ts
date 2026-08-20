import { describe, expect, it } from 'vitest';
import { EncryptionService } from '../src/core/encryption.service';
import { AiService } from '../src/modules/ai/ai.service';
import { MockModelProvider } from '../src/modules/ai/model-provider';

describe('核心安全与问答规则', () => {
  it('加密联系人手机号且可正确解密', () => {
    const service = new EncryptionService();
    const encrypted = service.encrypt('13800138000');
    expect(encrypted).not.toContain('13800138000');
    expect(service.decrypt(encrypted)).toBe('13800138000');
  });

  it.each([
    ['社保和公积金怎么查？', 'finance'],
    ['怎么优化求职简历？', 'career'],
    ['如何记住同学生日？', 'social'],
    ['我下一步该做什么？', 'general'],
  ])('将“%s”分类为 %s', (question, expected) => {
    const service = new AiService({} as never, {} as never, new MockModelProvider());
    expect(service.classify(question)).toBe(expected);
  });

  it('模拟模型明确提示来源情况', async () => {
    const provider = new MockModelProvider();
    const answer = await provider.generate({
      question: '社保怎么查',
      category: 'finance',
      sources: [{ title: '官方平台', summary: '官方查询入口', url: 'https://example.com' }],
    });
    expect(answer).toContain('已核验资料');
  });
});
