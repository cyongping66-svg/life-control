import { describe, expect, it } from 'vitest';
import { EncryptionService } from '../src/core/encryption.service';
import { AiService } from '../src/modules/ai/ai.service';
import { MockModelProvider } from '../src/modules/ai/model-provider';
import { FilesService } from '../src/modules/files/files.service';
import { LifeService } from '../src/modules/life/life.service';

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

  it('拒绝修改不属于当前用户的数据', async () => {
    const prisma = { financeItem: { findFirst: async () => null } };
    const service = new LifeService(prisma as never, new EncryptionService());
    await expect(
      service.updateFinance('user-a', crypto.randomUUID(), { alias: '越权修改' }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('拒绝把可执行文件作为简历上传', async () => {
    const service = new FilesService({} as never);
    await expect(
      service.createUploadUrl('user-a', {
        purpose: 'resume',
        filename: 'resume.exe',
        mimeType: 'application/octet-stream',
        size: 100,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
