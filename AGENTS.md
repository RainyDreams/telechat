# AGENTS.md — AI 协作指南

本文档面向未来接手本项目的 AI 助手。**不涉及具体需求，只讲方法论。**

---

## 1. 项目概况

- **技术栈**: Vue 3 (Composition API) + Tailwind CSS + Vite + Cloudflare Pages
- **架构**: 单文件巨型应用 — 所有前端逻辑集中在 `src/App.vue`（12000+ 行）
- **后端**: Cloudflare Workers (D1 数据库), 位于 `backend/` 目录
- **核心特性**: 端到端加密群聊, WebRTC 信号中继, 设备级身份系统

### 1.1 不要被单文件吓到

`App.vue` 虽然是巨型文件，但有清晰的内部结构：

| 区域 | 大致行号 | 内容 |
|------|---------|------|
| `<template>` | 1–2700 | 所有 UI 模板 |
| `<script setup>` | 2700–11500 | 响应式状态 + 业务逻辑 |
| `<style scoped>` | 11500–末尾 | CSS 动画 + 工具类 |

Template 内按功能分区：
- **Header**: 移动端/桌面端页眉 (~275–360)
- **Sidebar (desktop)**: 左侧面板 (~130–270)
- **Mobile drawer**: 侧边抽屉 (~473–880)
- **Message list**: 消息列表 (~880–1500)
- **Dialogs**: 各种弹窗 (~1500–2700)
- **Footer**: 输入框 + 语音录制 (~2630–2950)

---

## 2. 工作流方法论

### 2.1 需求分析三步法

面对模糊需求时，按此流程推进：

```
Step 1: 学习历史 — 先看 git log，理解前人做了什么
Step 2: 定位代码 — grep 关键词，找到目标区域
Step 3: 小步迭代 — 每次只改一个可验证的点
```

**具体做法：**

1. **`git log --oneline -20`** — 看最近提交的变更意图
2. **`git diff <旧commit>..<新commit> --stat`** — 理解改了哪些文件
3. **`git show <commit> -- src/App.vue | head -300`** — 学习具体改法和风格
4. 从 diff 中提取**设计模式**，再应用到新需求

### 2.2 代码定位策略

在 12000 行的文件中找代码，不要逐行读，用 grep 精确定位：

```bash
# 找组件/功能
grep -n "关键词\|camelCase" src/App.vue

# 找 ref 定义
grep -n "const xxxRef\|const xxx = ref" src/App.vue

# 找事件处理
grep -n "@click=\"xxx\|handleXxx\|onXxx" src/App.vue

# 找 computed
grep -n "const isXxx\|computed" src/App.vue
```

**永远先 grep 再 read**，避免在 12K 行文件中迷路。

### 2.3 改动边界原则

| 可以直接改 | 需要谨慎 | 禁止乱改 |
|-----------|---------|---------|
| Template 结构 | CSS 类名 | JS 业务逻辑 |
| Tailwind 样式类 | ref/computed 定义 | WebSocket 协议 |
| 图标/SVG | 事件处理函数 | 加密相关代码 |
| 文案/提示文字 | 条件渲染逻辑 | 后端 API 调用 |

**核心原则：模板改动尽量不引入新的 JavaScript 状态，优先利用现有 ref/computed。**

### 2.4 响应式状态管理

项目使用 Vue 3 Composition API，所有状态集中在 `<script setup>` 中：

```js
// 简单状态 — 直接 ref
const showMobilePanel = ref(false);
const activeGroup = ref(SYSTEM_GROUP);

// 派生状态 — computed（只读）
const isChatListView = computed(() => activeGroup.value === SYSTEM_GROUP);
const pageHeaderTitle = computed(() => { ... });

// 复杂状态 — reactive 对象
const groupQuickMenu = ref({ open: false, groupId: '', x: 0, y: 0, mobile: false });
const leaveGroupDialog = ref({ open: false, groupId: '', name: '', ownerAction: 'inherit' });
```

**添加新状态时：**
1. 找到同类状态的区域（行号 ~3095–3200 是 ref 集中区）
2. 按照现有命名风格添加
3. 在 template 中通过 `v-if` / `:class` / `v-model` 绑定

---

## 3. UI 改造模式库

以下是本项目中反复使用的 UI 改造套路。遇到类似需求时直接套用。

### 3.1 弹窗微信化

微信风格弹窗的特征模板：

```html
<div v-if="dialogOpen" class="fixed inset-0 z-[60]">
  <button type="button" @click="close" class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></button>
  <div class="viewport-modal-scroll">
    <div class="viewport-modal-panel overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
         style="--dialog-max: 24rem;">
      <!-- 头部：标题 + 关闭/完成 -->
      <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <p class="text-sm font-semibold text-slate-800">标题</p>
        <button class="text-xs font-medium text-slate-500">完成</button>
      </div>
      <!-- 内容：divide-y 列表 -->
      <div class="divide-y divide-slate-100">
        <div class="flex items-center justify-between px-4 py-3">
          <p class="text-sm text-slate-800">设置项</p>
          <p class="text-[11px] text-slate-400">值</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

**关键规则：**
- `rounded-2xl`（不是 `[28px]` 或 `[30px]`）
- 头部简洁：标题 + 操作按钮，去掉 "p.text-xs.uppercase" 小标签
- 列表用 `divide-y divide-slate-100`，不用 `gap-2`
- 文字层级：`text-sm` 主文字 / `text-[11px]` 次要 / `text-slate-400` 弱化
- 按钮用 `text-xs font-medium text-sky-600`（文字按钮），减少 bordered 按钮

### 3.2 移动端抽屉

抽屉结构：

```html
<Transition name="mobile-drawer">
  <div v-if="showMobilePanel && mobileViewport" class="absolute inset-0 z-20">
    <button @click="showMobilePanel = false" class="mobile-panel-overlay ..."></button>
    <div class="pointer-events-none absolute inset-y-2 left-2 flex ...">
      <div class="mobile-side-drawer pointer-events-auto flex ... rounded-2xl ...">
        <!-- 内容 -->
      </div>
    </div>
  </div>
</Transition>
```

**多模式抽屉：** 用 `mobileDrawerMode` ref 区分 `'home' | 'group'`，在 drawer 内部用 `v-if` 切换内容。

### 3.3 功能性按钮卡片（快捷操作）

```html
<button class="mobile-panel-action flex min-h-[58px] flex-col items-start justify-center
               rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-slate-700">
  <div class="flex items-center gap-2">
    <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
      <!-- SVG icon -->
    </span>
    <span class="text-sm font-semibold text-slate-800">操作名</span>
  </div>
  <span class="mt-1 text-[10px] leading-4 text-slate-400">副标题</span>
</button>
```

### 3.4 Switch 开关

```html
<button role="switch" :aria-checked="value" @click="value = !value"
  class="relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors"
  :class="value ? 'bg-emerald-500' : 'bg-slate-200'">
  <span class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
    :class="value ? 'translate-x-5' : 'translate-x-1'"></span>
</button>
```

### 3.5 Avatar 头像

```html
<div class="avatar h-9 w-9 shrink-0 rounded-full text-[11px] font-semibold text-white"
     :style="{ background: avatarColor(id) }">
  {{ avatarInitial(name) }}
</div>
```

---

## 4. 移动端 vs 桌面端

项目使用 `mobileViewport` ref 区分视口。关键分支点：

| 功能 | 移动端 | 桌面端 |
|------|--------|--------|
| 侧边栏 | 抽屉式（Transition 动画） | 固定左侧面板 |
| Header | 紧凑单行 | 多按钮横排 |
| 底部导航 | 消息/通讯录/设置 Tab | 无 |
| 弹窗 | 底部弹出或全屏 | 居中模态框 |

**改动 UI 时，必须同时检查移动端和桌面端表现。** 用浏览器 DevTools 切换设备模式测试。

---

## 5. 常见坑

1. **不要删除 `<style scoped>` 中的 CSS** — 很多动画和工具类在 template 中被引用
2. **`sanitizeGroupId()` 是必须的** — 所有 activeGroup 操作前都要过这个函数
3. **z-index 层级** — 已有规范：banner=70, dialog=60-65, drawer=20, footer=10
4. **`SYSTEM_GROUP` = 首页** — 不是普通群组，`activeGroup === 'system'` 意味着在首页
5. **`isDirectGroupId()` 判断私聊** — 私聊和群聊的侧边栏逻辑不同
6. **mobileViewport 是 ref** — 在 template 中自动解包，在 script 中用 `.value`

---

## 6. 测试与验证

```bash
# 本地开发
npm install
npm run dev

# 构建检查
npm run build

# 部署到 Cloudflare Pages
npm run deploy
```

**没有自动化测试。** 改完后必须：
1. 在浏览器中打开，切换移动端/桌面端视口
2. 测试所有受影响的交互路径
3. 检查控制台无报错
4. 验证 WebSocket 连接正常

---

## 7. Git 协作流程

```
main ← feat/your-branch (从 main 切出)
```

1. 从 `main` 切分支：`git checkout -b feat/描述`
2. 小步提交，commit message 格式：`type: 简短描述`
   - `feat:` 新功能
   - `refactor:` 重构
   - `fix:` 修复
   - `style:` 样式调整
3. 推送到远程：`git push origin feat/分支名`
4. 创建 PR 到 main

---

## 8. 给未来 AI 的话

这个项目的核心挑战不是技术，而是**在 12000 行单文件中安全地做手术**。记住：

- **先理解再动手** — 花 10 分钟读代码比盲目改 1 小时更高效
- **模仿现有风格** — 项目有很强的设计一致性，不要引入新风格
- **每次只改一件事** — 多个不相关的改动混在一起会让 revert 变成噩梦
- **Template 改动是安全的** — JS 逻辑改动需要更谨慎
- **当你不确定时，grep** — 这个文件里几乎什么都能用 grep 找到
