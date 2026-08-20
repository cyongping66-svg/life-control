import { ContentPlatform, PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const officialSources = [
  {
    platform: ContentPlatform.OFFICIAL,
    title: '国家社会保险公共服务平台',
    summary: '查询个人社保参保证明、待遇资格认证等全国性社会保险服务。',
    author: '人力资源和社会保障部',
    url: 'https://si.12333.gov.cn/',
    tags: ['社保', '养老'],
  },
  {
    platform: ContentPlatform.OFFICIAL,
    title: '全国住房公积金公共服务小程序',
    summary: '住房公积金信息查询及全国转移接续等官方服务入口说明。',
    author: '住房和城乡建设部',
    url: 'https://www.gov.cn/fuwu/2021-10/15/content_5642750.htm',
    tags: ['公积金'],
  },
  {
    platform: ContentPlatform.OFFICIAL,
    title: '国家医保服务平台',
    summary: '医保查询、异地备案和医保电子凭证等官方服务。',
    author: '国家医疗保障局',
    url: 'https://fuwu.nhsa.gov.cn/',
    tags: ['医保', '社保'],
  },
];

async function main() {
  for (const source of officialSources) {
    await prisma.externalContent.upsert({
      where: { url: source.url },
      update: { ...source, verifiedAt: new Date() },
      create: source,
    });
  }
  if (process.env.NODE_ENV !== 'production') {
    await prisma.user.upsert({
      where: { wechatOpenId: 'development-user' },
      update: {},
      create: {
        wechatOpenId: 'development-user',
        displayName: '本地体验用户',
        role: UserRole.ADMIN,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
