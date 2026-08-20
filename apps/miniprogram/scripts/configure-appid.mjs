import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const appId = process.argv[2];
if (!appId || !/^wx[a-zA-Z0-9]{16}$/.test(appId)) {
  console.error('用法：pnpm --filter @life-control/miniprogram configure <你的AppID>');
  console.error('AppID 应以 wx 开头，后跟 16 位字母或数字。');
  process.exit(1);
}

const config = {
  appid: appId,
  projectname: '人生浪费指南',
  setting: {
    urlCheck: false,
    compileHotReLoad: true,
  },
};

await writeFile(
  resolve(import.meta.dirname, '../project.private.config.json'),
  `${JSON.stringify(config, null, 2)}\n`,
);
console.log('AppID 已写入 project.private.config.json（该文件不会提交到 Git）。');
