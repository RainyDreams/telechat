# LINKCONNECT

一个基于 **Vue 3 + Cloudflare Workers + Durable Objects + D1** 的临时隐私聊天项目。  
核心目标是：**不依赖账号体系，以设备为身份，默认端到端加密，尽量降低长期可识别数据存留**。

## 项目状态

- 可运行：前后端都可部署
- 场景定位：临时私密沟通、设备绑定联系人、可控的私聊限制
- 不适合：需要完整消息云端历史、企业级审计归档

## 功能总览

- 端到端加密消息
- 私聊（设备对设备）
- 群聊与邀请码/邀请卡
- 通讯录申请、同意、拒绝
- 通讯录迁移（新旧设备双向授权）
- 系统消息虚拟群（`system-notice`）
- 已读回执
- 设备单会话（同一设备新登录会踢旧连接）
- 首次设备注册自动推送新手引导卡（含按钮）

## 关键业务规则

- 身份以设备指纹为准，不依赖手机号/邮箱/账号密码
- 通讯录“同意”是双向建立；“移除”是单向移除
- 私聊限发规则：
  - 当你不在对方通讯录时：对方回复前，你只能先发一条
  - 对方回复后：该设备对进入自由私聊
  - 若你已在对方通讯录：无上述限制
- `system-notice` 是系统虚拟群，用户不能手动加入/拉人，仅用于系统引导和状态通知

## 安全模型（务必阅读）

- 聊天内容在客户端加密后再发送，服务端转发密文
- 服务端仍可看到必要元数据（如在线状态、群成员关系、时间戳、网络层信息）
- 设备绑定依赖本地持久化 `device token`；丢失本地存储会触发重新绑定
- 不配置 `INVITE_SIGNING_SECRET` 会退回默认签名密钥（生产环境不安全）

## 技术架构

- 前端：Vue 3 + Vite + TailwindCSS（`src/App.vue` 单页主逻辑）
- 后端：Cloudflare Worker + Durable Object（`backend/src/index.js`）
- 数据库：Cloudflare D1（通讯录与迁移码）
- 通信：WebSocket（`/ws`）+ 健康检查接口（`/api/check`）

## 目录结构

```text
.
├─ src/                     # 前端
├─ backend/
│  ├─ src/index.js          # Worker + Durable Object 主逻辑
│  ├─ d1/schema.sql         # D1 表结构
│  └─ wrangler.toml         # 后端部署配置
├─ wrangler.toml            # Pages 配置
└─ package.json
```

## 本地开发

### 1) 安装依赖

```bash
npm install
```

### 2) 启动前端

```bash
npm run dev
```

默认会尝试连接当前站点下的 `/ws`。  
若前后端不在同一 host，可通过 `VITE_WS_URL` 指向后端 WebSocket 地址（需自行确保后端的 Origin 校验策略满足你的开发域名）。

### 3) 一体化本地调试（项目内脚本）

```bash
npm run f:dev
```

## 部署指南（Cloudflare）

### 0) 前置条件

- 已安装并登录 Wrangler：`npx wrangler login`
- 已有 Cloudflare 账号与可用域名（若使用自定义路由）

### 1) 创建并初始化 D1

```bash
npx wrangler d1 create telechat-db
npx wrangler d1 execute telechat-db --file=backend/d1/schema.sql --remote
```

把创建得到的 `database_id` 写入 `backend/wrangler.toml`。

### 2) 配置后端

- 修改 `backend/wrangler.toml` 中的 `routes`、`zone_name`、`database_id`
- 生产环境设置邀请码签名密钥：

```bash
npx wrangler secret put INVITE_SIGNING_SECRET --config backend/wrangler.toml
```

### 3) 部署后端 Worker

```bash
npx wrangler deploy --config backend/wrangler.toml
```

### 4) 构建并部署前端 Pages

```bash
npm run build
npm run deploy
```

如果前端和后端不是同域，请在前端部署时提供 `VITE_WS_URL`。

## WebSocket 主要消息类型（简版）

- 连接与验证：`identity`、`solve_pow`、`pow_verified`
- 设备绑定：`set_device_fingerprint`、`device_bound`、`device_fingerprint_registered`
- 群与私聊：`join_group`、`direct_start`、`chat`、`sent_ack`
- 通讯录：`contacts_add`、`contacts_accept`、`contacts_decline`、`contacts_remove`、`contacts_list`
- 迁移：`contacts_migrate_init`、`contacts_migrate_approve`、`contacts_migrate_confirm`
- 系统消息：`system_notice`

## 推荐发布前检查

```bash
npm run build
node --check backend/src/index.js
```

## 常见问题

### 为什么刷新后会话看起来“丢了”？

这是设计行为。项目主打临时隐私会话，不做默认的长期历史恢复。需要长期可达请使用通讯录机制。

### 为什么我会被踢下线？

同一设备指纹只允许一个在线会话。新会话登录会踢掉旧会话，避免同指纹多开混淆。

### 为什么私聊只能先发一条？

你当前不在对方通讯录中。对方回复前你只能先发一条；对方回复后该设备对会解除限制。

## 贡献建议

- 提 PR 前请确保 `npm run build` 通过
- 对协议或安全相关改动，请在 PR 描述中写明威胁模型变化
- UI 改动请附截图或录屏
