export type PreviewSource = {
  id: string;
  platform: 'official';
  title: string;
  summary: string;
  url: string;
};

export type PreviewAnswer = {
  id: string;
  question: string;
  answer: string;
  category: 'finance' | 'career' | 'social' | 'general';
  disclaimer: string;
  sources: PreviewSource[];
  createdAt: string;
};

const officialSources = [
  {
    id: 'official-social-security',
    platform: 'official' as const,
    title: '国家社会保险公共服务平台',
    summary: '查询个人社保参保证明、待遇资格认证等全国性社会保险服务。',
    url: 'https://si.12333.gov.cn/',
    keywords: ['社保', '养老', '参保'],
  },
  {
    id: 'official-housing-fund',
    platform: 'official' as const,
    title: '全国住房公积金公共服务小程序',
    summary: '住房公积金信息查询及全国转移接续等官方服务入口说明。',
    url: 'https://www.gov.cn/fuwu/2021-10/15/content_5642750.htm',
    keywords: ['公积金'],
  },
  {
    id: 'official-medical-insurance',
    platform: 'official' as const,
    title: '国家医保服务平台',
    summary: '医保查询、异地备案和医保电子凭证等官方服务。',
    url: 'https://fuwu.nhsa.gov.cn/',
    keywords: ['医保', '医疗'],
  },
];

export function classifyPreviewQuestion(question: string): PreviewAnswer['category'] {
  if (/社保|公积金|医保|银行卡|贷款|信用|预算|理财|账单/.test(question)) return 'finance';
  if (/工作|职业|简历|面试|升职|副业|离职/.test(question)) return 'career';
  if (/朋友|同学|生日|社交|联系人|关系/.test(question)) return 'social';
  return 'general';
}

export function buildPreviewAnswer(question: string, id: string): PreviewAnswer {
  const category = classifyPreviewQuestion(question);
  const sources = officialSources
    .filter((source) => source.keywords.some((keyword) => question.includes(keyword)))
    .map(({ keywords: _keywords, ...source }) => source);
  const answer = answerFor(question, category, sources.length > 0);
  return {
    id,
    question,
    answer,
    category,
    disclaimer:
      '这是离线预览回答，不代表实时 AI 或专业意见。政策和办理要求请以来源机构最新信息为准。',
    sources,
    createdAt: new Date().toISOString(),
  };
}

function answerFor(question: string, category: PreviewAnswer['category'], hasSources: boolean) {
  if (/社保|公积金/.test(question)) {
    return [
      '可以按下面顺序查询：',
      '1. 先打开下方国家官方入口，使用本人实名信息登录。',
      '2. 社保重点查看参保地、缴费记录和当前参保状态；公积金重点查看缴存地、账户余额和贷款状态。',
      '3. 如果全国入口没有数据，再查询参保地的人社或公积金中心官方渠道。',
      '4. 不要把验证码、身份证照片或账户密码交给非官方人员。',
    ].join('\n');
  }
  const guidance: Record<PreviewAnswer['category'], string> = {
    finance: '先写清金额、期限和风险，再核对官方账单或合同。不要在这里填写完整卡号、密码或验证码。',
    career:
      '把目标拆成“目标岗位、当前差距、本周行动”三项。本周只选择一个可验证动作，例如修改一版简历或联系一位从业者。',
    social:
      '先明确你想维护的关系和合适的联系频率。记录信息前尊重对方意愿，用一个自然、没有压力的行动开始联系。',
    general: '可以把问题拆成“现状、目标、限制、下一步”四部分，再选择一个今天能完成的小动作。',
  };
  return `${guidance[category]}${hasSources ? ' 下方已附可核验的官方资料。' : ''}`;
}
