# 微信小程序直接预览

当前默认使用“本机预览模式”，不需要服务器、数据库、域名或 AppSecret。问答、财务、职业、联系人、照片、简历和应用内提醒都保存在当前微信的小程序本地空间。

## 准备

1. 安装 Node.js 22、pnpm 11 和微信开发者工具稳定版。
2. 用已加入该小程序开发成员的微信账号登录开发者工具。
3. 在小程序后台复制 AppID。AppSecret 不用于本机预览，不要写进代码或发送给其他人。

## 生成可预览版本

在项目根目录运行：

```bash
pnpm install
pnpm --filter @life-control/miniprogram configure wx你的AppID
pnpm --filter @life-control/miniprogram build
```

`configure` 会把 AppID 写入被 Git 忽略的 `project.private.config.json`，不会污染仓库。

## 开发者工具和手机预览

1. 打开微信开发者工具，选择“导入项目”。
2. 项目目录选择仓库中的 `apps/miniprogram`。
3. 确认 AppID 正确后点击“编译”。
4. 点击工具栏“预览”，用有开发权限的微信扫码。
5. 在手机上依次验证问答、财务、职业、社交和提醒中心。

继续修改代码时可运行：

```bash
pnpm --filter @life-control/miniprogram dev
```

开发者工具会在源码重新编译后刷新。

## 预览模式限制

- 数据只存在当前设备，清除微信缓存、删除小程序或点击“清空本机预览数据”后不可恢复。
- 离线问答是产品流程演示，只内置少量已核验官方来源，不是真实在线 AI。
- 应用内提醒只在下次打开小程序时提示，不能在小程序关闭时主动推送。
- 数据不会跨设备同步，微信订阅消息、真实登录、在线 AI 和管理后台需要部署后端后才能启用。
- 预览二维码有有效期且仅限开发成员使用；面向普通用户仍需后端、隐私协议、备案和微信审核。

## 切换在线模式

后端部署完成后，在构建环境中设置：

```text
TARO_APP_DATA_MODE=online
TARO_APP_API_BASE=https://你的合法域名/api/v1
```

同时在微信公众平台配置 request 合法域名。生产环境不得关闭域名校验。
