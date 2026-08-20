# 人生浪费指南

人生值得浪费在更重要的事上。在这里托管琐事、理清问题，并保留自己的生活节奏。

这是一个微信小程序优先的个人生活管理 MVP，包含：

- 带可核验来源的 AI 问答；
- 卡包、支付账号、贷款与信用事项管理；
- 职业目标、简历版本和副业项目管理；
- 联系人、班级、生日、照片与提醒管理；
- 官方资料和用户举报管理后台。

## 无服务器小程序预览

已有小程序 AppID 时，不部署后端也能直接在开发者工具和手机上体验：

```bash
pnpm install
pnpm --filter @life-control/miniprogram configure wx你的AppID
pnpm --filter @life-control/miniprogram build
```

然后用微信开发者工具导入 `apps/miniprogram` 并点击“预览”。默认数据只保存在当前设备；完整步骤及限制见[小程序预览指南](docs/guides/miniprogram-preview.md)。

## 安全边界

本项目不保存完整银行卡号、支付密码、短信验证码等凭据。在线模式下联系方式使用字段级加密，简历和照片通过短时签名地址上传到对象存储；预览模式的数据保存在微信本地沙箱，不会上传。外部内容首版只使用人工核验的官方链接或合法开放接口，不抓取抖音、小红书正文和视频。

## 本地启动

要求 Node.js 22+、pnpm 11+ 和 Docker。

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm --filter @life-control/api prisma:generate
pnpm --filter @life-control/api prisma:migrate
pnpm --filter @life-control/api prisma:seed
pnpm dev
```

- API 文档：`http://localhost:3000/docs`
- 管理后台：`http://localhost:5173`
- 小程序：用微信开发者工具导入 `apps/miniprogram`，编译输出位于 `dist/`

开发环境若未配置微信 AppID，会自动使用显式的本地体验登录；生产环境没有此回退。

## 常用命令

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

详细内容见 [开发指南](docs/guides/development.md)、[MVP 范围](docs/product/mvp.md)、[架构说明](docs/architecture/README.md) 和 [隐私设计](docs/security/privacy.md)。
