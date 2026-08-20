export type LifeCategory = 'finance' | 'career' | 'social' | 'general';

export type GroundedSource = {
  title: string;
  summary: string;
  url: string;
};

export type GenerateInput = {
  question: string;
  category: LifeCategory;
  sources: GroundedSource[];
};

export interface ModelProvider {
  generate(input: GenerateInput): Promise<string>;
}

export const MODEL_PROVIDER = Symbol('MODEL_PROVIDER');

export class MockModelProvider implements ModelProvider {
  async generate(input: GenerateInput) {
    const sourceHint =
      input.sources.length > 0
        ? `我为你找到了 ${input.sources.length} 条已核验资料，请结合下方来源卡片操作。`
        : '目前没有找到可核验的外部资料，建议通过对应机构官方渠道进一步确认。';
    const guidance: Record<LifeCategory, string> = {
      finance: '先确认所在地和办理机构，再核对官方入口、所需身份信息与更新时间。',
      career: '先写下目标、现状和期限，再拆成一个本周可以完成的小步骤。',
      social: '先明确你希望维护的关系和联系频率，并尊重对方的隐私与边界。',
      general: '可以先把问题拆成“现状、目标、限制、下一步”四部分。',
    };
    return `${guidance[input.category]} ${sourceHint}`;
  }
}

export class OpenAiCompatibleProvider implements ModelProvider {
  async generate(input: GenerateInput) {
    const baseUrl = process.env.AI_BASE_URL;
    const apiKey = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL;
    if (!baseUrl || !apiKey || !model) throw new Error('AI 服务配置不完整');
    const sources = input.sources
      .map((source, index) => `[${index + 1}] ${source.title}: ${source.summary} ${source.url}`)
      .join('\n');
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              '你是人生规划助手。仅依据提供的资料回答事实性问题；资料不足时明确说明。不得编造链接、政策、作者或互动量。不要索取密码、验证码、完整银行卡号。',
          },
          { role: 'user', content: `问题：${input.question}\n已核验资料：\n${sources || '无'}` },
        ],
      }),
    });
    if (!response.ok) throw new Error(`AI 服务请求失败：${response.status}`);
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const answer = payload.choices?.[0]?.message?.content;
    if (!answer) throw new Error('AI 服务未返回有效回答');
    return answer;
  }
}
