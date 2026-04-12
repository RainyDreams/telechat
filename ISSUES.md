# Pending Issues — Apr 12, 2026

## ✅ 已完成 (在 `fix/all-issues-apr12` 分支)

### #1 修复群邀请和个人身份二维码不正确
- **问题**: QR 码生成器是假的实现，Version 1 (21x21) 矩阵只能编码 ~17 字节，设备 ID 和邀请 URL 远超此限制，生成的二维码不可扫描
- **修复**: 实现完整 QR Code 编码（ISO/IEC 18004），支持 Version 1-10，Reed-Solomon 纠错（M 级别），8 种掩码模式自动选优
- **文件**: `src/lib/qrcode.js` 全部重写
- **Commit**: `4d53ee8`

### #11 语音消息 padding 太大
- **问题**: 语音消息气泡 `px-3 py-3` + 播放按钮 `h-10 w-10` + 波形 `h-10`，整体偏大，与紧凑设计不匹配
- **修复**: 缩小 padding (`px-2.5 py-2`)、播放按钮 (`h-8 w-8`)、波形高度 (`h-8`, 条宽 3px)、间距 (`gap-2`)
- **文件**: `src/App.vue` template + CSS
- **Commit**: `e465992`

---

### #10 没有成功发送的消息，点击叹号重发 ✅
- **修复**: 将叹号从 `<span>` 改为 `<button>`，绑定 `@click.stop="retryMessage(msg)"`，添加 `cursor-pointer` 和 hover 效果
- **文件**: `src/App.vue` — template
- **Commit**: (待推送)

---

## ❌ 待处理

### #2 对于所有群聊，取消"对方不在线我就不能发消息"的限制
- **现状**: 群聊发送时如果对方不在线或没有公钥，消息无法发出（`sendEncryptedPayload` 在 `!allRecipients.length` 时虽然已发空 keys 到服务端，但前端体验仍有阻断提示）
- **期望**: 像主流 IM 一样，对面离线也可以发消息，存到服务器队列。去掉所有"对方不在线"的提示，消息直接显示为已发送，服务端负责离线推送
- **涉及文件**: `src/App.vue` — `sendEncryptedPayload()`, `sendDirectEncryptedPayload()`, `pushSendBlockedTip` 调用处
- **后端**: `backend/src/index.js` — 确认 Durable Object 有离线消息队列机制

### #3 刷新聊天记录丢失
- **现状**: 消息存在内存 `messages` ref 中，刷新页面后丢失
- **期望**: 刷新后保留聊天记录。方案可选：
  - A) `localStorage` 持久化（适合小量数据）
  - B) 刷新时从服务端重新拉取最近消息
  - C) IndexedDB 存储
- **涉及文件**: `src/App.vue` — `messages` ref, 消息收发逻辑, `onMounted` 初始化
- **后端**: 可能需要添加 `history_fetch` 或 `sync` 类型的 WebSocket 消息

### #4 完善移动端和PC端个人名片 → 分享 → 添加好友 → 好友申请（可写描述语）→ 批准/拒绝 → 通讯录好友 完整链路
- **现状**: 添加好友弹窗 (`addFriendDialog`) 只有输入 ID 和扫码两种模式；好友申请没有描述语字段；PC 和移动端体验不一致
- **期望**: 完整链路
  1. 个人名片页面（带二维码、昵称、ID）
  2. 分享个人名片（生成可分享卡片）
  3. 添加好友时可写验证描述语
  4. 好友申请列表显示描述语
  5. 批准/拒绝操作
  6. 添加为通讯录好友
- **涉及文件**: `src/App.vue` — `addFriendDialog`, `contactRequests`, `contactRequestCards`, `contactsOpen` 弹窗, 移动端通讯录页
- **后端**: `backend/src/index.js` — `contacts_add`, `contacts_accept`, `contacts_decline` 协议需增加 `description` 字段

### #5 设置可以设多个二级页面
- **现状**: 设置页面（`isRootSettingsPage` 和 `settingsOpen`）是一个长列表，昵称、身份与安全、通用设置、设备信息全堆在一起
- **期望**: 拆分为多个二级页面入口，点击进入子页面：
  - 账号与昵称
  - 身份与安全（助记词、导入凭证）
  - 通用设置（通知、声音、界面大小、陌生人私聊）
  - 关于（版本、调试信息）
- **涉及文件**: `src/App.vue` — `isRootSettingsPage` 区域, `settingsOpen` 弹窗区域, 需新增 `settingsSubPage` ref

### #6 通讯录 PC 移动体验不一致，PC 向移动端靠拢
- **现状**: 移动端通讯录 (`isRootContactsPage`) 是简洁卡片列表；PC 端 (`contactsOpen` 弹窗) 是复杂网格布局，包含设备迁移功能
- **期望**: PC 端通讯录改为类似移动端的简洁卡片风格，包含：
  - "新的朋友" 入口（待处理请求 badge）
  - "添加好友" 入口
  - 好友列表（已成为好友的联系人）
- **涉及文件**: `src/App.vue` — `contactsOpen` 弹窗区域（~4200-4500行）

### #7 PC 通讯录设备迁移功能融入设置中身份与安全模块
- **现状**: 设备迁移在 `contactsOpen` 弹窗底部（通讯录弹窗中）
- **期望**: 将设备迁移移到设置 → 身份与安全中，通讯录不设此功能
- **涉及文件**: `src/App.vue` — `contactsOpen` 弹窗中的迁移区域, `settingsOpen`/`isRootSettingsPage` 的身份与安全区域
- **关联**: Issue #5（设置二级页面）和 Issue #6（通讯录改造）

### #8 PC 群聊 header 上方去掉与群聊无关的功能，移动到侧边
- **现状**: PC 端 header 有 "通讯录"、"通知"、"邀请新人"、"加入通讯录"、"群设置" 等多个按钮
- **期望**:
  - PC 端侧边栏变为三级结构：第一级：聊天/通讯录/设置 | 第二级：会话列表 | 第三级：聊天内容
  - header 只保留群名称和连接状态
  - 通讯录、通知、邀请新人等移到侧边栏或设置中
- **涉及文件**: `src/App.vue` — PC 端 `<aside>` 区域, `<header>` 桌面端区域

### #9 系统通知变成和正常聊天一样的对话框而不是弹窗
- **现状**: 系统通知通过 `systemNoticeOpen` 侧滑面板显示，是一个独立的弹窗/面板
- **期望**: 系统通知像正常消息一样显示在 `SYSTEM_NOTICE_GROUP` 的聊天窗口中，用户点击"系统消息"群组即可看到，不需要额外弹窗
- **涉及文件**: `src/App.vue` — `systemNoticeOpen`, `systemNoticeMessages` computed, `openSystemNoticePanel` 函数, header 中通知按钮

### #10 没有成功发送的消息，点击叹号重发
- **已完成** — 见上方 ✅ 列表

---

## PR 信息

**分支**: `fix/all-issues-apr12`
**已推送**: ✅
**PR 链接**: https://github.com/RainyDreams/telechat/pull/new/fix/all-issues-apr12

已提交 2 个 fix（#1, #11），剩余 #2-#10 待逐个修复提交到同一分支。
