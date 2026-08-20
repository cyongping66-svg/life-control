# 开发指南

## 环境

使用 Node.js 22+、pnpm 11+、Docker 和微信开发者工具。复制 `.env.example` 为 `.env`，生成字段加密密钥：

```bash
openssl rand -base64 32
```

将结果写入 `FIELD_ENCRYPTION_KEY`。生产环境不得使用示例密钥。

## 启动顺序

```bash
docker compose up -d
pnpm install
pnpm --filter @life-control/api prisma:generate
pnpm --filter @life-control/api prisma:migrate
pnpm --filter @life-control/api prisma:seed
pnpm --filter @life-control/api dev
pnpm --filter @life-control/admin dev
pnpm --filter @life-control/miniprogram dev
```

在微信开发者工具导入 `apps/miniprogram`。真实设备调试时，将 `TARO_APP_API_BASE` 配置为已加入微信 request 合法域名的 HTTPS 地址，不能使用 localhost。

## AI 配置

默认 `AI_PROVIDER=mock`，无需联网即可走通流程。接入支持 OpenAI Chat Completions 协议的服务时设置：

```text
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://provider.example/v1
AI_API_KEY=...
AI_MODEL=...
```

新增供应商必须实现 `ModelProvider`，不得把 SDK 调用散落在业务模块中。

## 微信提醒

小程序端和 API 端须配置同一个订阅消息模板 ID。当前发送字段为 `thing1`（提醒标题）和 `time2`（提醒时间），正式模板必须与之匹配。用户拒绝授权时只创建应用内提醒。

## 变更规则

- 数据库改动必须生成 Prisma migration，不直接修改生产数据库；
- API 输入输出变化先更新 `packages/contracts`，并保留兼容性或明确版本升级；
- 架构、数据边界或外部平台策略变化先新增 ADR；
- 提交前运行 `pnpm check`；
- 不提交 `.env`、密钥、真实用户数据或上传文件。
