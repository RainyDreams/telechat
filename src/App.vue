<template>
  <div class="h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-slate-100 text-slate-900 antialiased">
    <div
      v-if="isInsecureBrowser"
      class="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4"
    >
      <div class="w-full max-w-xl rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur">
        <p class="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">Security Notice</p>
        <h2 class="text-2xl font-semibold text-slate-900">当前浏览器环境受限</h2>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          检测到你正在使用受限制浏览器。为了端到端加密与隐私安全，
          请复制下方链接并使用系统浏览器（Safari / Chrome）打开。
        </p>

        <div class="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p class="break-all font-mono text-xs text-slate-700">{{ currentUrl }}</p>
        </div>

        <button
          type="button"
          @click="copyUrl"
          class="mt-5 inline-flex items-center justify-center rounded-xl bg-sky-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-600 active:scale-[0.98]"
        >
          {{ copyText }}
        </button>
      </div>
    </div>

    <div v-else class="flex h-full w-full">
      <div
        v-if="lastToast.text"
        class="fixed left-1/2 top-4 z-50 w-[min(92vw,560px)] -translate-x-1/2 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur transition"
        :class="
          lastToast.kind === 'error'
            ? 'border-rose-200 bg-rose-50/90 text-rose-700'
            : 'border-slate-200 bg-white/85 text-slate-700'
        "
      >
        {{ lastToast.text }}
      </div>
      <div
        v-if="banner.open"
        class="fixed left-1/2 top-16 z-40 w-[min(94vw,640px)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur"
      >
        <button type="button" class="w-full text-left px-4 py-3" @click="openBannerChat">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">新消息</p>
          <p class="mt-1 truncate text-sm font-semibold text-slate-800">{{ banner.title }}</p>
          <p class="mt-1 clamp-2 text-xs text-slate-500">{{ banner.text }}</p>
        </button>
        <div class="flex items-center justify-between px-4 py-3">
          <button
            v-if="banner.canEnableNotify"
            type="button"
            @click="toggleSystemNotify"
            class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
          >
            开启系统通知
          </button>
          <button
            type="button"
            @click="openBannerChat"
            class="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
          >
            进入聊天
          </button>
        </div>
      </div>
      <div v-if="deviceKicked.open" class="fixed inset-0 z-50">
        <button
          type="button"
          class="absolute inset-0 bg-slate-900/40"
          @click="dismissDeviceKicked"
          aria-label="Close kicked notice"
        ></button>
        <div class="absolute inset-x-4 top-24 mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
          <p class="text-xs font-semibold uppercase tracking-wide text-rose-400">已下线</p>
          <h3 class="mt-1 text-lg font-semibold text-slate-800">你的账号在同一设备被重新登录</h3>
          <p class="mt-2 text-sm text-slate-600">
            为保证“一台设备一个用户”，本窗口已断开连接。
            {{ deviceKicked.reason ? `原因：${deviceKicked.reason}` : '' }}
          </p>
          <div class="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              @click="dismissDeviceKicked"
            >
              保持离线
            </button>
            <button
              type="button"
              class="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
              @click="reconnectAfterKick"
            >
              重新连接
            </button>
          </div>
        </div>
      </div>
      <aside
        class="hidden w-72 shrink-0 border-r border-slate-200/80 bg-white/85 p-4 backdrop-blur md:flex md:flex-col"
      >
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <div class="relative">
                <div class="h-10 w-10 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500"></div>
                <span class="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"></span>
              </div>
              <div class="min-w-0">
                <p class="text-xs uppercase tracking-wide text-slate-400">My ID</p>
                <p
                  class="cursor-pointer text-sm font-medium text-slate-800"
                  :class="isIdentityExpanded('self-id-desktop') ? 'whitespace-normal break-all' : 'truncate'"
                  @click="toggleIdentityExpanded('self-id-desktop')"
                >
                  {{ formatIdentityDisplay(myUid || 'Connecting...', 'self-id-desktop', 10, 10) }}
                </p>
              </div>
            </div>
            <button
              type="button"
              @click="settingsOpen = true"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
              aria-label="Settings"
            >
              <svg viewBox="0 0 48 48" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M18.2838 43.1713C14.9327 42.1736 11.9498 40.3213 9.58787 37.867C10.469 36.8227 11 35.4734 11 34.0001C11 30.6864 8.31371 28.0001 5 28.0001C4.79955 28.0001 4.60139 28.01 4.40599 28.0292C4.13979 26.7277 4 25.3803 4 24.0001C4 21.9095 4.32077 19.8938 4.91579 17.9995C4.94381 17.9999 4.97188 18.0001 5 18.0001C8.31371 18.0001 11 15.3138 11 12.0001C11 11.0488 10.7786 10.1493 10.3846 9.35011C12.6975 7.1995 15.5205 5.59002 18.6521 4.72314C19.6444 6.66819 21.6667 8.00013 24 8.00013C26.3333 8.00013 28.3556 6.66819 29.3479 4.72314C32.4795 5.59002 35.3025 7.1995 37.6154 9.35011C37.2214 10.1493 37 11.0488 37 12.0001C37 15.3138 39.6863 18.0001 43 18.0001C43.0281 18.0001 43.0562 17.9999 43.0842 17.9995C43.6792 19.8938 44 21.9095 44 24.0001C44 25.3803 43.8602 26.7277 43.594 28.0292C43.3986 28.01 43.2005 28.0001 43 28.0001C39.6863 28.0001 37 30.6864 37 34.0001C37 35.4734 37.531 36.8227 38.4121 37.867C36.0502 40.3213 33.0673 42.1736 29.7162 43.1713C28.9428 40.752 26.676 39.0001 24 39.0001C21.324 39.0001 19.0572 40.752 18.2838 43.1713Z" fill="none" stroke="#3c3e55" stroke-width="3" stroke-linejoin="round"/><path d="M24 31C27.866 31 31 27.866 31 24C31 20.134 27.866 17 24 17C20.134 17 17 20.134 17 24C17 27.866 20.134 31 24 31Z" fill="none" stroke="#3c3e55" stroke-width="3" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="mt-4 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <input
            v-model="groupQuery"
            class="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            placeholder="搜索群组"
            inputmode="search"
          />
        </div>

        <div class="mt-4 flex-1 overflow-y-auto pr-1">
          <p class="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Groups</p>
          <button
            v-for="group in visibleGroups"
            :key="group.id"
            type="button"
            @click="openGroup(group.id)"
            class="mb-2 flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition"
            :class="
              activeGroup === group.id
                ? 'border-sky-200 bg-sky-50 text-sky-700 shadow-sm'
                : 'border-transparent bg-slate-100/70 text-slate-700 hover:border-slate-200 hover:bg-white'
            "
          >
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-2">
              <span class="truncate text-sm font-medium">{{ group.name }}</span>
              <span class="shrink-0 text-[11px] font-medium text-slate-400">{{ groupPreviewTime(group.id) }}</span>
            </div>
            <p class="mt-0.5 truncate text-xs text-slate-500">
              {{
                groupPreviewText(group.id) ||
                  (group.id === SYSTEM_GROUP ? '欢迎来到 LINKCONNECT' : '暂无消息')
              }}
            </p>
          </div>
          <span
            v-if="group.onlineCount"
            class="ml-3 inline-flex min-w-6 items-center justify-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700"
          >
            {{ group.onlineCount }}
          </span>
          <span
            v-if="getUnreadCount(group.id)"
            class="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white"
          >
            {{ formatUnreadCount(getUnreadCount(group.id)) }}
          </span>
        </button>
        </div>

        <div class="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
          <p class="text-sm font-semibold text-slate-800">为什么我的群聊消失了？</p>
          <p class="mt-1 leading-5 text-slate-500">
            为了安全，我们只信任首次加载的状态，任何其他状态都会被视为可能伪装。
            刷新页面或更换浏览器后，历史群聊不会自动恢复。
            尽量不要频繁刷新；如需长期聊天，请把对方加入通讯录。
          </p>
        </div>

        <button
          type="button"
          @click="createGroup"
          class="mt-3 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-600"
        >
          + 按时间创建群组
        </button>
      </aside>

      <main class="relative flex min-w-0 flex-1 flex-col bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100">
        <div class="pointer-events-none absolute inset-0 opacity-70">
          <div class="chat-pattern h-full w-full"></div>
        </div>

        <header class="relative z-10 border-b border-white/60 bg-white/70 px-4 py-3 backdrop-blur md:px-6">
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs uppercase tracking-wide text-slate-400 md:hidden">Current Group</p>
              <h1 class="truncate text-base font-semibold text-slate-800 md:text-lg">{{ activeGroupName }}</h1>
              <p class="text-xs text-emerald-600">端到端加密已启用（客户端本地密钥）</p>
              <p class="mt-1 text-[11px] text-slate-500">在线 {{ activeGroupOnlineCount }} 人</p>
            </div>
            <div class="hidden items-center gap-2 md:flex">
              <button
                type="button"
                @click="openContacts"
                class="relative rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
              >
                通讯录
                <span
                  v-if="hasPendingContactRequests"
                  class="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"
                  aria-hidden="true"
                ></span>
              </button>
              <button
                type="button"
                @click="copyInviteLink"
                class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
              >
                邀请新人
              </button>
              <div
                class="hidden items-center gap-2 rounded-full px-3 py-1 text-xs font-medium sm:flex"
                :class="connectionPillClass"
              >
                <span class="h-2 w-2 rounded-full" :class="connectionDotClass"></span>
                {{ connectionLabel }}
              </div>
            </div>
          </div>

          <div class="mt-2 grid grid-cols-2 gap-2 md:hidden">
            <button
              type="button"
              @click="showMobilePanel = true"
              class="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-2 text-[12px] font-medium text-slate-700"
            >
              菜单
            </button>
            <button
              type="button"
              @click="copyInviteLink"
              class="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-2 text-[12px] font-medium text-slate-700"
            >
              邀请新人
            </button>
            <button
              type="button"
              @click="openContacts"
              class="relative inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-2 text-[12px] font-medium text-slate-700"
            >
              通讯录
              <span
                v-if="hasPendingContactRequests"
                class="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"
                aria-hidden="true"
              ></span>
            </button>
            <button
              type="button"
              @click="settingsOpen = true"
              class="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-2 text-[12px] font-medium text-slate-700"
            >
              设置
            </button>
          </div>
        </header>

        <div v-if="showMobilePanel" class="absolute inset-0 z-20 md:hidden">
          <button
            type="button"
            @click="showMobilePanel = false"
            class="absolute inset-0 bg-slate-900/35"
            aria-label="Close group panel"
          ></button>
          <div class="absolute inset-x-2 flex flex-col top-2 max-h-[76dvh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
           <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
             <div class="min-w-0">
               <p class="text-xs uppercase tracking-wide text-slate-400">Group Panel</p>
               <p
                 class="cursor-pointer text-sm font-semibold text-slate-800"
                 :class="isIdentityExpanded('self-id-mobile') ? 'whitespace-normal break-all' : 'truncate'"
                 @click="toggleIdentityExpanded('self-id-mobile')"
               >
                 {{ formatIdentityDisplay(myUid || 'Connecting...', 'self-id-mobile', 10, 10) }}
               </p>
             </div>
             <button
                type="button"
                @click="showMobilePanel = false"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
              >
                关闭
              </button>
           </div>
           <div class="border-b border-slate-100 px-3 py-2">
             <input
               v-model="groupQuery"
               class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
               placeholder="搜索群组"
               inputmode="search"
             />
           </div>
           <div class="max-h-[54dvh] overflow-y-auto p-3">
             <button
               v-for="group in visibleGroups"
                :key="`drawer-${group.id}`"
               type="button"
               @click="openGroup(group.id)"
               class="mb-2 flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition"
               :class="
                 activeGroup === group.id
                   ? 'border-sky-200 bg-sky-50 text-sky-700 shadow-sm'
                   : 'border-transparent bg-slate-100/70 text-slate-700'
               "
             >
               <div class="min-w-0 flex-1">
                 <div class="flex items-center justify-between gap-2">
                   <span class="truncate text-sm font-medium">{{ group.name }}</span>
                   <span class="shrink-0 text-[11px] font-medium text-slate-400">{{ groupPreviewTime(group.id) }}</span>
                 </div>
                 <p class="mt-0.5 truncate text-xs text-slate-500">
                   {{
                     groupPreviewText(group.id) ||
                       (group.id === SYSTEM_GROUP ? '欢迎来到 LINKCONNECT' : '暂无消息')
                   }}
                 </p>
               </div>
               <span
                 v-if="group.onlineCount"
                 class="ml-3 inline-flex min-w-6 items-center justify-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700"
               >
                 {{ group.onlineCount }}
               </span>
               <span
                 v-if="getUnreadCount(group.id)"
                 class="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white"
               >
                 {{ formatUnreadCount(getUnreadCount(group.id)) }}
               </span>
             </button>
             <div class="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
               <p class="text-sm font-semibold text-slate-800">为什么我的群聊消失了？</p>
               <p class="mt-1 leading-5 text-slate-500">
                 为了安全，我们只信任首次加载的状态，任何其他状态都会被视为可能伪装。
                 刷新页面或更换浏览器后，历史群聊不会自动恢复。
                 尽量不要频繁刷新；如需长期聊天，请把对方加入通讯录。
               </p>
             </div>
           </div>
            <div class="border-t border-slate-100 p-3">
              <button
                type="button"
                @click="createGroup"
                class="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700"
              >
                时间建群
              </button>
            </div>
          </div>
        </div>

        <section
          ref="msgBox"
          class="relative z-10 flex-1 overflow-y-auto px-3 py-4 sm:px-4 md:px-6"
          @click="closeComposerMenu"
          @scroll="maybeMarkActiveGroupSeen"
        >
          <div
            v-if="activeGroup === SYSTEM_GROUP && !filteredMessages.length"
            class="flex h-fit min-h-full items-center justify-center py-10"
          >
            <div class="w-full max-w-2xl rounded-[32px] border border-slate-200/80 bg-white/90 p-8 text-left shadow-2xl shadow-slate-900/10 backdrop-blur md:p-10">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">LINKCONNECT</p>
              <h2 class="mt-3 text-3xl font-semibold text-slate-900">临时隐私聊天</h2>
              <p class="mt-4 text-base leading-7 text-slate-600">
                这是一个专注于临时隐私聊天的软件，已在 GitHub 上开源。服务器不会保留聊天数据，
                本地刷新页面后聊天丢失是正常的安全行为。
              </p>
              <p class="mt-4 text-sm leading-6 text-slate-500">
                如果担心联系人丢失，可以把对方加入通讯录——但这只是设备与设备的绑定。
                任何一方更换设备，都将无法再互相联系。我们不需要任何身份验证，
                只认设备：设备就是唯一凭据。
              </p>

              <div class="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  @click="createGroup"
                  class="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
                >
                  创建临时群组
                </button>
                <button
                  type="button"
                  @click="settingsOpen = true"
                  class="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 active:scale-[0.98]"
                >
                  通知与提示音
                </button>
              </div>

              <div class="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">加入群组</p>
                <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    v-model="inviteJoinInput"
                    class="min-h-11 w-full flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                    placeholder="粘贴邀请码（TCINV-...）"
                    autocomplete="off"
                    spellcheck="false"
                  />
                  <button
                    type="button"
                    @click="joinByInviteCode"
                    class="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-sky-500 px-5 text-sm font-semibold text-white transition hover:bg-sky-600 active:scale-[0.98] sm:w-auto"
                  >
                    加入
                  </button>
                </div>
                <p class="mt-2 text-xs text-slate-500">
                  小提示：邀请文案里既有链接也有“特殊字母串”，只要复制完整，打开链接或粘贴邀请码都能自动入群。
                </p>
              </div>

              <div class="mt-5 grid gap-4 md:grid-cols-2">
                <div class="rounded-2xl border border-slate-200 bg-white/90 p-4 text-left">
                  <div class="flex items-center justify-between">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">设备绑定</p>
                    <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      已绑定
                    </span>
                  </div>
                  <p class="mt-2 text-sm font-semibold text-slate-800">
                    指纹：{{ deviceFingerprintShort || '生成中...' }}
                  </p>
                  <p class="mt-1 text-xs text-slate-500">
                    仅展示部分指纹，服务器不展示 IP。
                  </p>
                </div>

                <div class="rounded-2xl border border-slate-200 bg-white/90 p-4 text-left">
                  <div class="flex items-center justify-between">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">实时在线</p>
                    <span class="text-[11px] font-semibold text-slate-500">
                      {{ onlineUsers.length }} 人
                    </span>
                  </div>
                  <div v-if="onlineUserCards.length" class="mt-3 grid gap-3">
                    <div
                      v-for="user in onlineUserCards"
                      :key="`online-${user.uid}`"
                      class="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-sm font-semibold text-slate-800">
                            {{ user.isSelf ? '你' : `用户 ${user.uidShort}` }}
                          </p>
                          <p class="truncate text-xs text-slate-500">
                            {{ user.os }} · {{ user.location }}
                          </p>
                        </div>
                        <div class="flex flex-wrap items-center justify-between gap-3 sm:flex-col sm:items-end">
                          <div class="text-right">
                            <p class="text-[11px] font-semibold text-slate-500">指纹</p>
                            <p class="text-xs font-mono text-slate-700 break-all sm:max-w-[120px]">
                              {{ user.fingerprintShort }}
                            </p>
                          </div>
                          <span
                            v-if="!user.isSelf"
                            class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            :class="
                              !user.identityValid
                                ? 'bg-rose-100 text-rose-700'
                                : user.keyChanged
                                  ? 'bg-rose-100 text-rose-700'
                                  : user.verified
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : user.unverified
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-slate-100 text-slate-600'
                            "
                          >
                            {{ user.statusText }}
                          </span>
                          <button
                            v-if="!user.isSelf"
                            type="button"
                            @click="startDirectChat(user)"
                            class="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white"
                          >
                            临时对话
                          </button>
                          <button
                            v-if="!user.isSelf && !user.inContacts && !user.requestPending"
                            type="button"
                            @click="addContact(user)"
                            class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700"
                          >
                            请求加入
                          </button>
                          <span
                            v-if="!user.isSelf && user.requestPending"
                            class="rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-semibold text-amber-700"
                          >
                            待同意
                          </span>
                          <span
                            v-if="!user.isSelf && user.inContacts"
                            class="rounded-full bg-emerald-100 px-3 py-1.5 text-[11px] font-semibold text-emerald-700"
                          >
                            已在通讯录
                          </span>
                          <button
                            v-if="!user.isSelf && user.identitySign"
                            type="button"
                            @click="openVerifyModal(user)"
                            class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700"
                          >
                            {{ user.keyChanged ? '重新验证' : user.verified ? '查看验证' : '验证' }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p v-else class="mt-3 text-xs text-slate-500">暂无在线用户。</p>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="!filteredMessages.length" class="flex h-full items-center justify-center">
            <div class="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-center shadow-sm backdrop-blur">
              <p class="text-sm font-medium text-slate-700">还没有消息</p>
              <p class="mt-1 text-xs text-slate-500">发送第一条加密消息开始会话</p>
            </div>
          </div>

          <div v-else class="mx-auto flex w-full max-w-4xl flex-col gap-3">
            <article
              v-for="msg in filteredMessages"
              :key="`${msg.msgId}-${msg.sender}-${msg.groupId || 'system'}`"
              class="flex message-item"
              :class="
                msg.payloadType === 'dm_limit_tip'
                  ? 'justify-center'
                  : msg.isSystem || msg.sender !== myUid
                    ? 'justify-start'
                    : 'justify-end'
              "
            >
              <div v-if="msg.payloadType === 'dm_limit_tip'" class="w-full max-w-xl px-2">
                <div class="mx-auto rounded-2xl border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-center shadow-sm">
                  <p class="text-[11px] font-semibold text-amber-700">{{ msg.tipText }}</p>
                  <button
                    v-if="msg.tipTargetUid"
                    type="button"
                    @click="requestContactByUid(msg.tipTargetUid)"
                    :disabled="isOutgoingContactPending(msg.tipTargetUid)"
                    class="mt-2 rounded-full border border-amber-300 bg-white px-3 py-1 text-[11px] font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {{ isOutgoingContactPending(msg.tipTargetUid) ? '已申请，待同意' : '申请加入对方通讯录' }}
                  </button>
                </div>
              </div>
              <div v-else class="max-w-[92%] sm:max-w-[75%]">
                <p
                  v-if="!msg.isSystem && msg.sender !== myUid"
                  class="mb-1 px-1 text-[11px] font-medium text-slate-500 break-all"
                >
                  {{ msg.sender }}
                </p>
                <div
                  class="message-bubble rounded-2xl px-3.5 py-2.5 shadow-sm ring-1"
                  :class="
                    msg.sender === myUid
                      ? 'rounded-br-md bg-gradient-to-br from-sky-500 to-sky-600 text-white ring-sky-400/30'
                      : 'rounded-bl-md bg-white text-slate-800 ring-slate-200/80'
                  "
                >
                  <template v-if="msg.payloadType === 'image' && msg.imageData">
                    <img
                      :src="msg.imageData"
                      :alt="msg.name || '图片消息'"
                      class="max-h-80 w-auto max-w-full rounded-xl object-contain"
                    />
                    <p v-if="msg.name" class="mt-2 text-xs" :class="msg.sender === myUid ? 'text-sky-100' : 'text-slate-500'">
                      {{ msg.name }}
                    </p>
                  </template>
                  <div v-else-if="msg.payloadType === 'pair'" class="invite-card rounded-xl bg-white/80 p-3 text-sm text-slate-800">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">群聊邀请</p>
                    <p class="mt-1 text-sm font-semibold text-slate-800">
                      {{ msg.pairGroupName || '新群聊' }}
                    </p>
                    <p class="mt-1 text-xs text-slate-500">
                      通过同意后，你们会加入同一个群聊。
                    </p>
                    <div class="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        v-if="msg.sender !== myUid && msg.pairStatus !== 'accepted'"
                        type="button"
                        @click="acceptPairInvite(msg)"
                        class="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        同意并进入
                      </button>
                      <span v-else class="text-xs text-slate-500">
                        {{ msg.pairStatus === 'accepted' ? '已同意' : '等待对方同意' }}
                      </span>
                    </div>
                  </div>
                  <div v-else-if="msg.payloadType === 'invite'" class="invite-card rounded-xl bg-white/80 p-3 text-sm text-slate-800">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">群邀请卡</p>
                    <p class="mt-1 text-sm font-semibold text-slate-800">
                      {{ msg.inviteGroupName || msg.inviteGroup || '未知群组' }}
                    </p>
                    <p class="mt-1 text-xs text-slate-500">
                      邀请码：<br/><span class="font-mono break-all">{{ msg.inviteCode || '--' }}</span>
                    </p>
                    <!-- <p v-if="msg.inviteLink" class="mt-2 text-xs text-slate-500 line-clamp-3">
                      {{ formatInviteLinkDisplay(msg.inviteLink) }}
                    </p> -->
                    <div class="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        @click="joinFromInvite(msg.inviteCode)"
                        class="rounded-full bg-sky-500 hover:text-white/80 transition px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        立即加入
                      </button>
                      <button
                        type="button"
                        @click="copyInviteFromMessage(msg.inviteCode, msg.inviteLink)"
                        class="rounded-full border border-slate-200 hover:bg-slate-100 transition bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        复制链接
                      </button>
                    </div>
                    <p v-if="msg.expiresAt" class="mt-2 text-[11px] text-slate-400">
                      有效期至 {{ formatDateTime(msg.expiresAt) }}
                    </p>
                  </div>
                  <div
                    v-else-if="msg.payloadType === 'system'"
                    class="invite-card rounded-xl bg-white/90 p-3 text-sm text-slate-800"
                  >
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">系统消息</p>
                    <p class="mt-1 text-sm font-semibold text-slate-800">
                      {{ msg.systemTitle || '提醒' }}
                    </p>
                    <p class="mt-1 text-xs text-slate-500">
                      {{ msg.systemText || '' }}
                    </p>
                    <div
                      v-if="(Array.isArray(msg.systemActions) && msg.systemActions.length) || msg.systemAction"
                      class="mt-3 flex flex-wrap gap-2"
                    >
                      <button
                        v-for="(item, idx) in (Array.isArray(msg.systemActions) && msg.systemActions.length
                          ? msg.systemActions
                          : [{ action: msg.systemAction, label: msg.systemActionLabel || '处理' }])"
                        :key="`sys-action-${msg.msgId}-${idx}`"
                        type="button"
                        @click="handleSystemAction(msg, item)"
                        class="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        {{ item.label || item.action || '处理' }}
                      </button>
                    </div>
                  </div>
                  <p v-else class="emoji-font whitespace-pre-wrap break-words text-[15px] leading-6">{{ msg.text }}</p>
                  <div
                    class="mt-1.5 flex items-center justify-end gap-1 text-[11px]"
                    :class="msg.sender === myUid ? 'text-sky-100/90' : 'text-slate-400'"
                  >
                    <span>{{ formatTime(msg.ts) }}</span>
                    <button
                      v-if="msg.sender === myUid"
                      type="button"
                      class="cursor-pointer"
                      :class="msg.readBy && msg.readBy.length ? 'underline decoration-dotted' : ''"
                      @click="msg.readBy && msg.readBy.length ? openReadReceipts(msg) : null"
                    >
                      {{ msg.readBy && msg.readBy.length ? '已读' : '送达' }}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <div v-if="readReceiptModal.open" class="absolute inset-0 z-30">
          <button
            type="button"
            @click="closeReadReceipts"
            class="absolute inset-0 bg-slate-900/35"
            aria-label="Close read receipts"
          ></button>
          <div class="absolute inset-x-3 top-16 mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p class="text-xs uppercase tracking-wide text-slate-400">已读详情</p>
                <p class="text-sm font-semibold text-slate-800">共 {{ readReceiptList.length }} 人</p>
              </div>
              <button
                type="button"
                @click="closeReadReceipts"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                关闭
              </button>
            </div>
            <div class="max-h-[60dvh] overflow-y-auto px-4 py-3">
              <div v-if="!readReceiptList.length" class="py-6 text-center text-sm text-slate-500">
                暂无已读记录
              </div>
              <div v-else class="grid gap-3">
                <div
                  v-for="entry in readReceiptList"
                  :key="`read-${entry.uid}-${entry.ts}`"
                  class="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-slate-800">用户 {{ entry.uidShort }}</p>
                    <p class="truncate text-xs text-slate-500">{{ entry.os }} · {{ entry.location }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-slate-500">已读时间</p>
                    <p class="text-xs font-medium text-slate-700">{{ formatDateTime(entry.ts) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="invitePickerOpen" class="absolute inset-0 z-30">
          <button
            type="button"
            @click="closeInvitePicker"
            class="absolute inset-0 bg-slate-900/35"
            aria-label="Close invite picker"
          ></button>
          <div class="absolute inset-x-3 top-20 mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p class="text-xs uppercase tracking-wide text-slate-400">选择群组</p>
                <p class="text-sm font-semibold text-slate-800">发送群邀请卡</p>
              </div>
              <button
                type="button"
                @click="closeInvitePicker"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                关闭
              </button>
            </div>
            <div class="max-h-[60dvh] overflow-y-auto px-4 py-3">
              <div class="grid gap-2">
                <label
                  v-for="group in eligibleInviteGroups"
                  :key="`invite-${group.id}`"
                  class="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-slate-800">{{ group.name }}</p>
                    <p class="truncate text-xs text-slate-500">{{ group.id }}</p>
                  </div>
                  <input
                    type="radio"
                    name="invite-group"
                    :value="group.id"
                    v-model="invitePickerGroupId"
                    class="h-4 w-4"
                  />
                </label>
              </div>
            </div>
            <div class="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
              <button
                type="button"
                @click="closeInvitePicker"
                class="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                取消
              </button>
              <button
                type="button"
                @click="confirmInvitePicker"
                class="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white"
              >
                发送邀请卡
              </button>
            </div>
          </div>
        </div>

        <div v-if="settingsOpen" class="absolute inset-0 z-30">
          <button
            type="button"
            @click="settingsOpen = false"
            class="absolute inset-0 bg-slate-900/35"
            aria-label="Close settings"
          ></button>
          <div class="absolute inset-x-3 top-20 mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p class="text-xs uppercase tracking-wide text-slate-400">设置</p>
                <p class="text-sm font-semibold text-slate-800">通知与提示音</p>
              </div>
              <button
                type="button"
                @click="settingsOpen = false"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
              >
                关闭
              </button>
            </div>
            <div class="px-4 py-6">
              <div class="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-slate-800">系统通知</p>
                  <p class="text-xs text-slate-500">需要浏览器授权，开启后可推送通知</p>
                </div>
                <button
                  type="button"
                  @click="toggleSystemNotify"
                  class="rounded-full px-3 py-1.5 text-xs font-semibold"
                  :class="systemNotifyEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'"
                >
                  {{ systemNotifyEnabled ? '已开启' : '已关闭' }}
                </button>
              </div>

              <div class="mt-3 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-slate-800">提示音</p>
                  <p class="text-xs text-slate-500">新消息到达时播放提示音</p>
                </div>
                <button
                  type="button"
                  @click="toggleSound"
                  class="rounded-full px-3 py-1.5 text-xs font-semibold"
                  :class="soundEnabled ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-700'"
                >
                  {{ soundEnabled ? '已开启' : '已关闭' }}
                </button>
              </div>

              <p class="mt-3 text-xs text-slate-500">
                横幅提示默认开启，点击横幅可进入聊天。
              </p>
            </div>
          </div>
        </div>

        <div v-if="contactsOpen" class="absolute inset-0 z-30">
          <button
            type="button"
            @click="contactsOpen = false"
            class="absolute inset-0 bg-slate-900/35"
            aria-label="Close contacts"
          ></button>
          <div class="absolute inset-x-3 top-16 mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p class="text-xs uppercase tracking-wide text-slate-400">通讯录</p>
                <p class="text-sm font-semibold text-slate-800">设备绑定联系人</p>
              </div>
              <button
                type="button"
                @click="contactsOpen = false"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
              >
                关闭
              </button>
            </div>
            <div class="max-h-[65dvh] overflow-y-auto px-4 py-4">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">联系人列表</p>
                <button
                  type="button"
                  @click="requestContacts"
                  class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  刷新
                </button>
              </div>
              <div
                v-if="contactRequestCards.length"
                class="mt-3 rounded-2xl border border-amber-100 bg-amber-50/60 px-3 py-3"
              >
                <p class="text-xs font-semibold uppercase tracking-wide text-amber-600">待处理请求</p>
                <div class="mt-2 grid gap-2">
                  <div
                    v-for="req in contactRequestCards"
                    :key="`req-${req.requestId}`"
                    class="flex items-center justify-between rounded-xl border border-amber-100 bg-white px-3 py-2"
                  >
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-slate-800">
                        用户 {{ req.uidShort }}
                      </p>
                      <p class="truncate text-xs text-slate-500">
                        {{ req.os }} · {{ req.location }}
                      </p>
                      <p class="truncate text-[11px] text-slate-400">
                        指纹：{{ req.fingerprintShort }}
                      </p>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        @click="acceptContactRequest(req)"
                        class="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-white"
                      >
                        同意
                      </button>
                      <button
                        type="button"
                        @click="declineContactRequest(req)"
                        class="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700"
                      >
                        拒绝
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="contactsLoading" class="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                正在加载通讯录…
              </div>
              <div v-else-if="!contactCards.length" class="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                暂无联系人，可在“实时在线”列表中添加。
              </div>
              <div v-else class="mt-3 grid gap-2">
                <div
                  v-for="contact in contactCards"
                  :key="`contact-${contact.contactFingerprint}`"
                  class="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div class="min-w-0">
                    <p
                      class="cursor-pointer text-sm font-semibold text-slate-800"
                      :class="
                        isIdentityExpanded(`contact-alias-${contact.contactFingerprint}`)
                          ? 'whitespace-normal break-all'
                          : 'truncate'
                      "
                      @click="toggleIdentityExpanded(`contact-alias-${contact.contactFingerprint}`)"
                    >
                      {{
                        formatIdentityDisplay(
                          contact.alias,
                          `contact-alias-${contact.contactFingerprint}`,
                          12,
                          10
                        )
                      }}
                    </p>
                    <p
                      class="cursor-pointer text-xs text-slate-500 font-mono"
                      :class="
                        isIdentityExpanded(`contact-fp-${contact.contactFingerprint}`)
                          ? 'whitespace-normal break-all'
                          : 'truncate'
                      "
                      @click="toggleIdentityExpanded(`contact-fp-${contact.contactFingerprint}`)"
                    >
                      指纹：{{
                        formatIdentityDisplay(
                          contact.contactFingerprint,
                          `contact-fp-${contact.contactFingerprint}`,
                          8,
                          8
                        )
                      }}
                    </p>
                    <p class="truncate text-xs text-slate-500">
                      {{ contact.online ? `${contact.os} · ${contact.location}` : '离线' }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      v-if="contact.online"
                      type="button"
                      @click="startContactChat(contact)"
                      class="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
                    >
                      私聊
                    </button>
                    <button
                      type="button"
                      @click="removeContact(contact)"
                      class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      移除
                    </button>
                  </div>
                </div>
              </div>

              <div class="mt-5 rounded-2xl border border-slate-100 bg-white px-3 py-3">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">迁移通讯录</p>
                <p class="mt-1 text-xs text-slate-500">
                  新旧设备同时打开。新设备生成迁移码，旧设备输入后授权迁移。
                </p>
                <div class="mt-3 grid gap-3 sm:grid-cols-2">
                  <div class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                    <p class="text-xs font-semibold text-slate-700">新设备</p>
                    <button
                      type="button"
                      @click="requestMigrationCode"
                      class="mt-2 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      生成迁移码
                    </button>
                    <p v-if="migrationCode" class="mt-2 font-mono text-sm text-slate-800">
                      {{ migrationCode }}
                    </p>
                    <p v-if="migrationExpireText" class="mt-1 text-[11px] text-slate-500">
                      有效期至 {{ migrationExpireText }}
                    </p>
                    <div
                      v-if="migrationConfirm.code"
                      class="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-2 text-xs text-emerald-700"
                    >
                      <p class="font-semibold">旧设备已授权</p>
                      <p class="mt-1 text-[11px] text-emerald-600">
                        {{
                          migrationConfirm.fromOs || migrationConfirm.fromLocation
                            ? `${migrationConfirm.fromOs} · ${migrationConfirm.fromLocation}`
                            : migrationConfirm.fromFingerprintShort
                              ? `设备指纹 ${migrationConfirm.fromFingerprintShort}`
                              : '请确认迁移请求'
                        }}
                      </p>
                      <button
                        type="button"
                        @click="confirmMigration(migrationConfirm.code)"
                        class="mt-2 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white"
                      >
                        确认迁移
                      </button>
                    </div>
                  </div>
                  <div class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                    <p class="text-xs font-semibold text-slate-700">旧设备</p>
                    <input
                      v-model="migrationInput"
                      class="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700"
                      placeholder="输入迁移码"
                    />
                    <button
                      type="button"
                      @click="approveMigration"
                      class="mt-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      授权迁移
                    </button>
                  </div>
                </div>
                <div
                  v-if="migrationStatus.text"
                  class="mt-3 rounded-xl border px-3 py-2 text-xs"
                  :class="migrationStatusClass"
                >
                  {{ migrationStatus.text }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="verifyModal.open" class="absolute inset-0 z-30">
          <button
            type="button"
            @click="closeVerifyModal"
            class="absolute inset-0 bg-slate-900/35"
            aria-label="Close verify modal"
          ></button>
          <div class="absolute inset-x-3 top-20 mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p class="text-xs uppercase tracking-wide text-slate-400">安全验证</p>
                <p class="text-sm font-semibold text-slate-800">
                  用户 {{ verifyModal.user?.uidShort || '' }}
                </p>
              </div>
              <button
                type="button"
                @click="closeVerifyModal"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
              >
                关闭
              </button>
            </div>
            <div class="px-4 py-4">
              <div class="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                <p class="text-xs font-semibold text-slate-500">安全码（双方一致）</p>
                <p class="mt-2 font-mono text-sm text-slate-800">{{ verifyModal.safetyCode || '生成中...' }}</p>
                <p class="mt-2 text-xs text-slate-500">
                  通过线下或其他安全渠道对比该安全码，可发现中间人攻击。
                </p>
              </div>
              <div class="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  @click="confirmTrustUser"
                  class="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white"
                >
                  标记为可信
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer
          v-if="activeGroup !== SYSTEM_GROUP && activeGroup !== SYSTEM_NOTICE_GROUP"
          class="mobile-safe-footer relative z-10 border-t border-white/70 bg-white/75 p-3 backdrop-blur sm:p-4 md:px-6 md:py-4"
        >
          <div class="mx-auto flex w-full max-w-4xl items-end gap-2.5">
            <input
              ref="imagePicker"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onPickImage"
            />
            <div class="relative">
              <button
                type="button"
                @click="toggleComposerMenu"
                class="inline-flex h-[46px] w-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
              >
                +
              </button>
              <div
                v-if="showComposerMenu"
                class="absolute bottom-[54px] left-0 z-20 w-[270px] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
              >
                <button
                  type="button"
                  @click="triggerImagePicker(); closeComposerMenu()"
                  :disabled="isSendingImage"
                  class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
                >
                  发送图片
                  <span class="text-xs text-slate-400">JPG/PNG</span>
                </button>
                <button
                  type="button"
                  @click="sendInviteCard(); closeComposerMenu()"
                  class="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  群邀请卡
                  <span class="text-xs text-slate-400">Share</span>
                </button>
                <button
                  v-if="isDirectGroupId(activeGroup)"
                  type="button"
                  @click="sendPairGroupCard(); closeComposerMenu()"
                  class="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  发起群聊
                  <span class="text-xs text-slate-400">需同意</span>
                </button>
                <div class="mt-2 rounded-xl bg-slate-50 px-3 py-2">
                  <p class="text-xs font-semibold text-slate-400">表情</p>
                  <div class="mt-2 grid max-h-40 grid-cols-7 gap-1.5 overflow-y-auto pr-1">
                    <button
                      v-for="emoji in EMOJI_SET"
                      :key="`emoji-${emoji}`"
                      type="button"
                      class="emoji-font inline-flex h-7 w-7 items-center justify-center rounded-lg text-lg hover:bg-slate-100 transition"
                      @click="insertEmoji(emoji)"
                    >
                      {{ emoji }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <textarea
              v-model="inputMsg"
              @keydown="onInputKeydown"
              ref="textInput"
              rows="1"
              class="emoji-font max-h-36 min-h-[46px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              placeholder="输入加密消息，Enter 发送，Shift+Enter 换行"
            ></textarea>
            <button
              type="button"
              @click="handleSend"
              :disabled="!canSendText"
              class="inline-flex h-[46px] items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              发送
            </button>
          </div>
        </footer>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, onBeforeUnmount } from 'vue';

const SYSTEM_GROUP = 'system';
const SYSTEM_NOTICE_GROUP = 'system-notice';
const GROUP_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const MAX_TEXT_LENGTH = 2000;
const MAX_IMAGE_BYTES = 900 * 1024;
const MAX_IMAGE_DIMENSION = 1440;
const INVITE_CODE_PATTERN = /(?:^|\b)(TCINV-[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)(?:\b|$)/;
const DM_LIMIT_REASON_TEXT = '你不在对方通讯录：对方回复前你只能发送一条消息。';

const isInsecureBrowser = ref(false);
const currentUrl = window.location.href;
const copyText = ref('复制链接');
const inviteText = ref('邀请新人');
const myUid = ref('');
const myPrivateKey = ref(null);
const myPublicKeyBase64 = ref('');
const identitySignKeyPair = ref(null);
const identityDhKeyPair = ref(null);
const identitySignPublicBase64 = ref('');
const identityDhPublicBase64 = ref('');
const onlineUsers = ref([]);
const messages = ref([]);
const inputMsg = ref('');
const activeGroup = ref(SYSTEM_GROUP);
const groups = ref([
  { id: SYSTEM_GROUP, name: '首页', onlineCount: 0 },
  { id: SYSTEM_NOTICE_GROUP, name: '系统消息', onlineCount: 0 },
]);
const pendingJoin = ref({ groupId: '', inviteCode: '', select: true });
const connectionState = ref('connecting'); // connecting | verifying | connected | reconnecting
const showMobilePanel = ref(false);
const isSendingImage = ref(false);
const msgBox = ref(null);
const imagePicker = ref(null);
const textInput = ref(null);
const lastToast = ref({ kind: 'info', text: '' });
const powState = ref({ nonce: '', difficulty: 0, verified: false, solving: false });
const powUid = ref('');
const soundEnabled = ref(false);
const soundUnlocked = ref(false);
const groupQuery = ref('');
const inviteJoinInput = ref('');
const deviceFingerprint = ref('');
const groupCounts = ref({});
const readReceiptModal = ref({ open: false, msgId: '' });
const showComposerMenu = ref(false);
const pendingDirect = ref({ groupId: '', targetUid: '' });
const pendingPairGroup = ref({ groupId: '', targetUid: '' });
const pendingPairInvite = ref({ reqId: '', groupId: '', targetUid: '' });
const invitePickerOpen = ref(false);
const invitePickerGroupId = ref('');
const unreadCounts = ref({});
const banner = ref({ open: false, groupId: '', title: '', text: '', canEnableNotify: false });
const notificationPrompted = ref(false);
const systemNotifyEnabled = ref(false);
const settingsOpen = ref(false);
const contactsOpen = ref(false);
const contacts = ref([]);
const contactsLoading = ref(false);
const contactRequests = ref([]);
const outgoingContactRequests = ref([]);
const deviceBound = ref(false);
const identityExpandMap = ref({});
const migrationCode = ref('');
const migrationExpiresAt = ref(0);
const migrationInput = ref('');
const migrationStatus = ref({ kind: 'info', text: '' });
const migrationConfirm = ref({ code: '', fromFingerprintShort: '', fromOs: '', fromLocation: '' });
const trustedKeys = ref({});
const verifyModal = ref({ open: false, user: null, safetyCode: '' });
const dmLocks = ref({});
const dmUnlocked = ref({});
const dmHasIncoming = ref({});
const dmHasOutgoing = ref({});
const deviceKicked = ref({ open: false, reason: '' });
const suppressReconnect = ref(false);
let powSolveToken = 0;
let ws = null;
let notificationAudio = null;
const joinedGroups = new Set([SYSTEM_GROUP, SYSTEM_NOTICE_GROUP]);
const dmSessions = new Map();

const importedPublicKeyCache = new Map();

const activeGroupName = computed(() => {
  return groups.value.find((g) => g.id === activeGroup.value)?.name || activeGroup.value;
});

const visibleGroups = computed(() => {
  const q = groupQuery.value.trim().toLowerCase();
  if (!q) return groups.value;
  return groups.value.filter((g) => {
    const name = String(g.name || '').toLowerCase();
    const id = String(g.id || '').toLowerCase();
    return name.includes(q) || id.includes(q);
  });
});

const filteredMessages = computed(() => {
  return messages.value.filter((m) => (m.groupId || SYSTEM_GROUP) === activeGroup.value);
});

const lastMessageByGroup = computed(() => {
  const map = Object.create(null);
  for (const msg of messages.value) {
    const gid = sanitizeGroupId(msg.groupId) || SYSTEM_GROUP;
    map[gid] = msg;
  }
  return map;
});

const eligibleInviteGroups = computed(() => {
  const active = sanitizeGroupId(activeGroup.value) || SYSTEM_GROUP;
  return groups.value.filter(
    (g) =>
      g.id &&
      g.id !== active &&
      g.id !== SYSTEM_GROUP &&
      g.id !== SYSTEM_NOTICE_GROUP &&
      !g.id.startsWith('dm-')
  );
});

const activeGroupOnlineCount = computed(() => {
  const gid = sanitizeGroupId(activeGroup.value) || SYSTEM_GROUP;
  const count = groupCounts.value[gid];
  return typeof count === 'number' ? count : 0;
});

const getUnreadCount = (groupId) => {
  const gid = sanitizeGroupId(groupId) || SYSTEM_GROUP;
  const count = unreadCounts.value[gid];
  return typeof count === 'number' ? count : 0;
};

const formatUnreadCount = (count) => {
  if (!count) return '';
  return count > 99 ? '99+' : String(count);
};

const selectedReadMessage = computed(() => {
  if (!readReceiptModal.value.msgId) return null;
  return messages.value.find((m) => m.msgId === readReceiptModal.value.msgId) || null;
});

const readReceiptList = computed(() => {
  const msg = selectedReadMessage.value;
  if (!msg || !Array.isArray(msg.readBy)) return [];
  const userMap = new Map(
    onlineUsers.value
      .filter((u) => u && typeof u.uid === 'string')
      .map((u) => [u.uid, u])
  );
  return msg.readBy.map((entry) => {
    const user = userMap.get(entry.uid);
    const os = user && typeof user.os === 'string' ? user.os : '';
    const location = user && typeof user.location === 'string' ? user.location : '';
    return {
      uid: entry.uid,
      uidShort: entry.uid ? entry.uid.slice(0, 8) : '未知',
      ts: entry.ts,
      os: os && os !== 'Unknown' ? os : '未知系统',
      location: location && location !== 'Unknown' ? location : '未知地区',
    };
  });
});

const deviceFingerprintShort = computed(() => {
  return deviceFingerprint.value ? deviceFingerprint.value.slice(0, 10) : '';
});

const isOutgoingContactPending = (uid) => {
  if (!uid) return false;
  return outgoingContactRequests.value.some((req) => req && req.targetUid === uid);
};

const onlineUserCards = computed(() => {
  const normalize = (value, fallback) => {
    return typeof value === 'string' && value && value !== 'Unknown' ? value : fallback;
  };
  const contactSet = new Set(
    contacts.value
      .filter((c) => c && typeof c.contactFingerprint === 'string')
      .map((c) => c.contactFingerprint)
  );
  return onlineUsers.value.map((user) => {
    const uid = typeof user.uid === 'string' ? user.uid : '';
    const os = normalize(user.os, '未知系统');
    const location = normalize(user.location, '未知地区');
    const fp = typeof user.deviceFingerprint === 'string' ? user.deviceFingerprint : '';
    const fpFull = typeof user.deviceFingerprintFull === 'string' ? user.deviceFingerprintFull : fp;
    const identitySign = typeof user.identitySign === 'string' ? user.identitySign : '';
    const identityDh = typeof user.identityDh === 'string' ? user.identityDh : '';
    const identitySig = typeof user.identitySig === 'string' ? user.identitySig : '';
    const trustedKey = trustedKeys.value[uid] || '';
    const identityValid = user.identityValid !== false;
    const keyChanged = Boolean(trustedKey && identitySign && trustedKey !== identitySign);
    const verified = Boolean(trustedKey && identitySign && trustedKey === identitySign);
    const unverified = Boolean(identitySign && !trustedKey);
    const statusText = !identityValid
      ? '签名无效'
      : keyChanged
        ? '密钥变更'
        : verified
          ? '已验证'
          : unverified
            ? '未验证'
            : '未注册';
    return {
      uid,
      uidShort: uid ? uid.slice(0, 6) : '未知',
      os,
      location,
      fingerprintShort: fp || '--',
      fingerprintFull: fpFull || '',
      isSelf: uid && uid === myUid.value,
      identitySign,
      identityDh,
      identitySig,
      identityValid,
      keyChanged,
      verified,
      unverified,
      statusText,
      inContacts: fpFull ? contactSet.has(fpFull) : false,
      requestPending: uid ? isOutgoingContactPending(uid) : false,
    };
  });
});

const contactCards = computed(() => {
  return contacts.value.map((contact) => {
    const fingerprint = contact.contactFingerprint || '';
    const alias = contact.alias || `设备 ${fingerprint.slice(0, 6)}`;
    return {
      contactFingerprint: fingerprint,
      alias,
      fingerprintShort: fingerprint ? fingerprint.slice(0, 10) : '--',
      online: Boolean(contact.onlineUid),
      onlineUid: contact.onlineUid || '',
      os: contact.os || '未知系统',
      location: contact.location || '未知地区',
      mutual: Boolean(contact.mutual),
    };
  });
});

const contactRequestCards = computed(() => {
  return contactRequests.value.map((req) => {
    const uid = req.fromUid || '';
    return {
      requestId: req.requestId,
      uid,
      uidShort: uid ? uid.slice(0, 6) : '未知',
      os: req.fromOs || '未知系统',
      location: req.fromLocation || '未知地区',
      fingerprintShort: req.fromFingerprintShort || '--',
    };
  });
});

const hasPendingContactRequests = computed(() => {
  return contactRequestCards.value.length > 0;
});

const migrationExpireText = computed(() => {
  if (!migrationExpiresAt.value) return '';
  return new Date(migrationExpiresAt.value).toLocaleString();
});

const migrationStatusClass = computed(() => {
  const kind = migrationStatus.value.kind;
  if (kind === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (kind === 'error') return 'border-rose-200 bg-rose-50 text-rose-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
});

const canSendText = computed(() => {
  if (!ws || ws.readyState !== WebSocket.OPEN || !powState.value.verified) return false;
  if (!inputMsg.value.trim()) return false;
  if (isDirectGroupId(activeGroup.value) && isDmLocked(activeGroup.value)) return false;
  return true;
});

const connectionLabel = computed(() => {
  if (connectionState.value === 'connected') return 'Online';
  if (connectionState.value === 'verifying') return 'Checking';
  if (connectionState.value === 'reconnecting') return 'Reconnecting';
  return 'Connecting';
});

const connectionPillClass = computed(() => {
  if (connectionState.value === 'connected') return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
  if (connectionState.value === 'verifying') return 'border border-sky-200 bg-sky-50 text-sky-700';
  if (connectionState.value === 'reconnecting') return 'border border-amber-200 bg-amber-50 text-amber-700';
  return 'border border-slate-200 bg-slate-100 text-slate-600';
});

const connectionDotClass = computed(() => {
  if (connectionState.value === 'connected') return 'bg-emerald-500';
  if (connectionState.value === 'verifying') return 'bg-sky-500';
  if (connectionState.value === 'reconnecting') return 'bg-amber-500';
  return 'bg-slate-400';
});

const shortIdentity = (value, head = 10, tail = 8) => {
  const text = typeof value === 'string' ? value : '';
  if (!text) return '';
  if (text.length <= head + tail + 3) return text;
  return `${text.slice(0, head)}...${text.slice(-tail)}`;
};

const isIdentityExpanded = (key) => {
  return Boolean(identityExpandMap.value[key]);
};

const toggleIdentityExpanded = (key) => {
  identityExpandMap.value = {
    ...identityExpandMap.value,
    [key]: !isIdentityExpanded(key),
  };
};

const formatIdentityDisplay = (value, key, head = 10, tail = 8) => {
  const text = typeof value === 'string' ? value : '';
  if (!text) return '';
  return isIdentityExpanded(key) ? text : shortIdentity(text, head, tail);
};

const toast = (text, kind = 'info') => {
  lastToast.value = { kind, text };
  setTimeout(() => {
    if (lastToast.value.text === text) {
      lastToast.value = { kind: 'info', text: '' };
    }
  }, 2600);
};

const setMigrationStatus = (kind, text) => {
  migrationStatus.value = { kind, text };
};

const loadNotificationPrompt = () => {
  try {
    notificationPrompted.value = window.localStorage.getItem('telechat.notify.prompted') === '1';
  } catch {
    notificationPrompted.value = false;
  }
};

const markNotificationPrompted = () => {
  notificationPrompted.value = true;
  try {
    window.localStorage.setItem('telechat.notify.prompted', '1');
  } catch {
    // no-op
  }
};

const loadTrustedKeys = () => {
  try {
    const raw = window.localStorage.getItem('telechat.trusted.keys');
    trustedKeys.value = raw ? JSON.parse(raw) : {};
  } catch {
    trustedKeys.value = {};
  }
};

const persistTrustedKeys = () => {
  try {
    window.localStorage.setItem('telechat.trusted.keys', JSON.stringify(trustedKeys.value));
  } catch {
    // no-op
  }
};

const trustUserKey = (uid, identitySign) => {
  if (!uid || !identitySign) return;
  trustedKeys.value = { ...trustedKeys.value, [uid]: identitySign };
  persistTrustedKeys();
};

const computeSafetyCode = async (myKey, theirKey) => {
  if (!myKey || !theirKey) return '';
  const pair = [myKey, theirKey].sort().join('|');
  const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(pair));
  const bytes = new Uint8Array(digest);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const short = hex.slice(0, 24);
  return short.match(/.{1,4}/g)?.join(' ') || short;
};

const openVerifyModal = async (user) => {
  if (!user || !user.uid || !user.identitySign) return;
  const safetyCode = await computeSafetyCode(identitySignPublicBase64.value, user.identitySign);
  verifyModal.value = { open: true, user, safetyCode };
};

const confirmTrustUser = () => {
  const user = verifyModal.value.user;
  if (!user || !user.uid || !user.identitySign) return;
  trustUserKey(user.uid, user.identitySign);
  verifyModal.value = { open: false, user: null, safetyCode: '' };
  toast('已标记为可信。', 'info');
};

const closeVerifyModal = () => {
  verifyModal.value = { open: false, user: null, safetyCode: '' };
};

const requestContacts = () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  if (!powState.value.verified) {
    return;
  }
  if (!deviceBound.value) {
    toast('请先完成设备绑定。', 'info');
    return;
  }
  contactsLoading.value = true;
  ws.send(JSON.stringify({ type: 'contacts_list' }));
};

const openContacts = () => {
  contactsOpen.value = true;
  if (!powState.value.verified) {
    toast('正在验证连接，通讯录稍后加载。', 'info');
  }
  requestContacts();
};

const upsertContact = (contact) => {
  if (!contact || !contact.contactFingerprint) return;
  const list = contacts.value.slice();
  const idx = list.findIndex((c) => c.contactFingerprint === contact.contactFingerprint);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...contact };
  } else {
    list.unshift(contact);
  }
  contacts.value = list;
};

const syncContactsOnlineStatus = () => {
  const onlineMap = new Map(
    onlineUsers.value
      .filter((u) => u && typeof u.deviceFingerprintFull === 'string' && u.deviceFingerprintFull)
      .map((u) => [u.deviceFingerprintFull, u])
  );
  contacts.value = contacts.value.map((contact) => {
    const user = onlineMap.get(contact.contactFingerprint);
    const onlineUid = user ? user.uid : '';
    return {
      ...contact,
      onlineUid,
      os: user ? user.os : '',
      location: user ? user.location : '',
    };
  });
};

const requestContactByUid = (targetUid, alias = '') => {
  const uid = typeof targetUid === 'string' ? targetUid.trim() : '';
  if (!uid) return;
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return false;
  }
  if (!deviceBound.value) {
    toast('请先完成设备绑定。', 'info');
    return false;
  }
  if (isOutgoingContactPending(uid)) {
    toast('已发送请求，等待对方同意。', 'info');
    return false;
  }
  const finalAlias = alias || `用户 ${uid.slice(0, 6) || uid}`;
  ws.send(
    JSON.stringify({
      type: 'contacts_add',
      targetUid: uid,
      alias: finalAlias,
    })
  );
  return true;
};

const addContact = (user) => {
  if (!user || !user.uid) return;
  requestContactByUid(user.uid, `用户 ${user.uidShort || user.uid}`);
};

const removeContact = (contact) => {
  if (!contact || !contact.contactFingerprint) return;
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  ws.send(
    JSON.stringify({
      type: 'contacts_remove',
      contactFingerprint: contact.contactFingerprint,
    })
  );
};

const removeContactRequest = (requestId) => {
  contactRequests.value = contactRequests.value.filter((req) => req.requestId !== requestId);
};

const acceptContactRequest = (req) => {
  if (!req || !req.requestId) return;
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  ws.send(JSON.stringify({ type: 'contacts_accept', requestId: req.requestId }));
};

const declineContactRequest = (req) => {
  if (!req || !req.requestId) return;
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  ws.send(JSON.stringify({ type: 'contacts_decline', requestId: req.requestId }));
};

const startContactChat = (contact) => {
  if (!contact || !contact.onlineUid) {
    toast('联系人不在线。', 'info');
    return;
  }
  const user = onlineUsers.value.find((u) => u.uid === contact.onlineUid);
  if (!user) {
    toast('联系人不在线。', 'info');
    return;
  }
  if (!contact.mutual) {
    toast('你不在对方通讯录，只能发起临时私聊。', 'info');
  }
  contactsOpen.value = false;
  startDirectChat(user);
};

const requestMigrationCode = () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  if (!deviceBound.value) {
    toast('请先完成设备绑定。', 'info');
    return;
  }
  setMigrationStatus('info', '正在生成迁移码…');
  ws.send(JSON.stringify({ type: 'contacts_migrate_init' }));
};

const approveMigration = () => {
  const code = migrationInput.value.trim().toUpperCase();
  if (!code) {
    toast('请输入迁移码。', 'info');
    return;
  }
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  if (!deviceBound.value) {
    toast('请先完成设备绑定。', 'info');
    return;
  }
  setMigrationStatus('info', '授权请求已发送，等待新设备确认…');
  ws.send(JSON.stringify({ type: 'contacts_migrate_approve', code }));
};

const confirmMigration = (codeOverride = '') => {
  const code = (codeOverride || migrationConfirm.value.code || migrationCode.value || '').trim().toUpperCase();
  if (!code) {
    toast('没有可确认的迁移码。', 'info');
    return;
  }
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  if (!deviceBound.value) {
    toast('请先完成设备绑定。', 'info');
    return;
  }
  setMigrationStatus('info', '已发送确认请求，等待迁移完成…');
  ws.send(JSON.stringify({ type: 'contacts_migrate_confirm', code }));
};

const dismissDeviceKicked = () => {
  deviceKicked.value = { open: false, reason: '' };
};

const reconnectAfterKick = () => {
  deviceKicked.value = { open: false, reason: '' };
  suppressReconnect.value = false;
  if (!isInsecureBrowser.value) {
    connectWS();
  }
};

const loadSystemNotifySetting = () => {
  try {
    systemNotifyEnabled.value = window.localStorage.getItem('telechat.notify.enabled') === '1';
  } catch {
    systemNotifyEnabled.value = false;
  }
};

const persistSystemNotifySetting = () => {
  try {
    window.localStorage.setItem('telechat.notify.enabled', systemNotifyEnabled.value ? '1' : '0');
  } catch {
    // no-op
  }
};

const toggleSystemNotify = async () => {
  const next = !systemNotifyEnabled.value;
  systemNotifyEnabled.value = next;
  persistSystemNotifySetting();

  if (!next) {
    toast('系统通知已关闭。', 'info');
    return;
  }

  if (!('Notification' in window)) {
    toast('当前浏览器不支持系统通知。', 'error');
    systemNotifyEnabled.value = false;
    persistSystemNotifySetting();
    return;
  }

  if (Notification.permission === 'denied') {
    toast('系统通知被浏览器阻止，请在浏览器设置中开启。', 'error');
    return;
  }

  if (Notification.permission === 'default') {
    await requestSystemNotification();
  }
};

const requestSystemNotification = async () => {
  if (!('Notification' in window)) return;
  markNotificationPrompted();
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast('系统通知已开启。', 'info');
    }
  } catch {
    // no-op
  }
};

const SOUND_URL = 'https://s.lingben.top/2869-preview.mp3';
const buildEmojiSet = () => {
  const ranges = [
  [0x1F600, 0x1F64F], // 表情符号
  ];
  const out = [];
  for (const [start, end] of ranges) {
    for (let code = start; code <= end; code += 1) {
      out.push(String.fromCodePoint(code));
      // if (out.length >= 96) return out;
    }
  }
  return out;
};

const EMOJI_SET = buildEmojiSet();

const toggleComposerMenu = () => {
  showComposerMenu.value = !showComposerMenu.value;
};

const closeComposerMenu = () => {
  showComposerMenu.value = false;
};

const insertEmoji = (emoji) => {
  inputMsg.value = `${inputMsg.value}${emoji}`;
  nextTick(() => {
    textInput.value?.focus();
  });
};

const loadSoundSetting = () => {
  try {
    soundEnabled.value = window.localStorage.getItem('LINKCONNECT.sound.enabled') === '1';
  } catch {
    soundEnabled.value = false;
  }
};

const persistSoundSetting = () => {
  try {
    window.localStorage.setItem('LINKCONNECT.sound.enabled', soundEnabled.value ? '1' : '0');
  } catch {
    // no-op
  }
};

const unlockSound = async () => {
  if (soundUnlocked.value) return true;
  if (!notificationAudio) return false;
  try {
    notificationAudio.muted = true;
    await notificationAudio.play();
    notificationAudio.pause();
    notificationAudio.currentTime = 0;
    notificationAudio.muted = false;
    soundUnlocked.value = true;
    return true;
  } catch {
    return false;
  }
};

const toggleSound = async () => {
  soundEnabled.value = !soundEnabled.value;
  persistSoundSetting();
  if (soundEnabled.value) {
    void unlockSound();
    toast('提示音已开启。', 'info');
  } else {
    toast('提示音已关闭。', 'info');
  }
};

const playNotifySound = async () => {
  if (!soundEnabled.value) return;
  if (!notificationAudio) return;
  if (!soundUnlocked.value) return;

  try {
    notificationAudio.currentTime = 0;
    await notificationAudio.play();
  } catch {
    // autoplay might be blocked; ignore
  }
};

const checkEnvironment = () => {
  const ua = navigator.userAgent.toLowerCase();
  const isWechat = ua.includes('micromessenger');
  const isUC = ua.includes('ucbrowser');
  const isQuark = ua.includes('quark');
  const isBaidu = ua.includes('baidu');

  isInsecureBrowser.value = isWechat || isUC || isQuark || isBaidu;
};

const sanitizeGroupId = (value) => {
  if (!value) return '';
  const gid = String(value).trim();
  return GROUP_ID_PATTERN.test(gid) ? gid : '';
};

const isDirectGroupId = (value) => {
  const gid = sanitizeGroupId(value);
  return gid.startsWith('dm-');
};

const base64UrlToBytes = (base64url) => {
  if (typeof base64url !== 'string' || !/^[A-Za-z0-9_-]+$/.test(base64url)) return null;
  const padded = `${base64url}${'='.repeat((4 - (base64url.length % 4 || 4)) % 4)}`;
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  try {
    const binary = atob(base64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      out[i] = binary.charCodeAt(i);
    }
    return out;
  } catch {
    return null;
  }
};

const extractInviteCode = (value) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  const match = trimmed.match(INVITE_CODE_PATTERN);
  return match ? match[1] : '';
};

const decodeInviteGroupId = (inviteCode) => {
  const code = extractInviteCode(inviteCode);
  const raw = code.startsWith('TCINV-') ? code.slice(6) : code;
  const [payloadB64] = raw.split('.');
  if (!payloadB64) return '';

  const payloadBytes = base64UrlToBytes(payloadB64);
  if (!payloadBytes) return '';

  try {
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
    return sanitizeGroupId(payload?.g);
  } catch {
    return '';
  }
};

const groupPreviewText = (groupId) => {
  const msg = lastMessageByGroup.value[groupId];
  if (!msg) return '';
  if (msg.payloadType === 'image') return msg.name ? `[图片] ${msg.name}` : '[图片]';
  if (msg.payloadType === 'pair') return '群聊邀请';
  if (msg.payloadType === 'invite') {
    const name = msg.inviteGroupName || msg.inviteGroup;
    return name ? `邀请加入 ${name}` : '群邀请';
  }
  if (msg.payloadType === 'system') return msg.systemTitle || '系统提醒';
  if (msg.payloadType === 'dm_limit_tip') return '私聊受限提醒';
  const text = typeof msg.text === 'string' ? msg.text : '';
  return text.replace(/\s+/g, ' ').trim();
};

const groupPreviewTime = (groupId) => {
  const msg = lastMessageByGroup.value[groupId];
  if (!msg || !msg.ts) return '';
  return formatTime(msg.ts);
};

const joinByInviteCode = async () => {
  const code = extractInviteCode(inviteJoinInput.value);
  if (!code) {
    toast('请粘贴正确的邀请码。', 'info');
    return;
  }
  const gid = decodeInviteGroupId(code);
  if (!gid) {
    toast('无法解析邀请码，请确认复制完整。', 'error');
    return;
  }

  ensureGroupInList(gid);
  activeGroup.value = gid;

  pendingJoin.value = { groupId: gid, inviteCode: code, select: true };
  if (powState.value.verified && ws && ws.readyState === WebSocket.OPEN) {
    joinGroup(gid, code);
    pendingJoin.value = { groupId: '', inviteCode: '', select: true };
  } else {
    void startPowSolve();
  }

  inviteJoinInput.value = '';
};

const joinFromInvite = (inviteCode) => {
  const code = extractInviteCode(inviteCode);
  if (!code) return;
  inviteJoinInput.value = code;
  void joinByInviteCode();
};

const copyInviteFromMessage = async (inviteCode, inviteLink = '') => {
  const code = extractInviteCode(inviteCode);
  if (!code) {
    toast('邀请码无效', 'error');
    return;
  }
  const link = inviteLink || buildShortInviteLink(code);
  try {
    await navigator.clipboard.writeText(link);
    toast('邀请链接已复制', 'info');
  } catch {
    toast('复制失败', 'error');
  }
};

const confirmInvitePicker = () => {
  const groupId = sanitizeGroupId(invitePickerGroupId.value);
  if (!groupId) {
    toast('请选择一个群组。', 'info');
    return;
  }
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  if (!powState.value.verified) {
    toast('正在进行反机器人验证…', 'info');
    void startPowSolve();
    return;
  }

  const reqId = createReqId();
  pendingInviteRequest.value = { reqId, groupId, mode: 'card' };
  invitePickerOpen.value = false;
  ws.send(JSON.stringify({ type: 'create_invite', groupId, ttlSec: 2 * 24 * 60 * 60, reqId }));
};

const closeInvitePicker = () => {
  invitePickerOpen.value = false;
};

const ensureGroupInList = (groupId, name = '') => {
  if (!groupId) return;
  const existing = groups.value.find((g) => g.id === groupId);
  if (!existing) {
    groups.value.push({ id: groupId, name: name || groupId, onlineCount: 0 });
    return;
  }
  if (name && (existing.name === existing.id || !existing.name)) {
    existing.name = name;
  }
};

const selectGroup = (groupId) => {
  const gid = sanitizeGroupId(groupId);
  if (!gid) return;
  activeGroup.value = gid;
  showMobilePanel.value = false;
  nextTick(() => {
    scrollToBottom();
    maybeMarkActiveGroupSeen();
  });
};

const nameForDirectGroup = (groupId) => {
  if (!groupId || !groupId.startsWith('dm-')) return '';
  const ids = groupId.slice(3).split(':').filter(Boolean);
  if (ids.length !== 2) return '';
  const other = ids.find((id) => id !== myUid.value) || ids[0];
  const label = other && other !== 'undefined' ? other : '未知';
  return `私聊 · ${label.slice(0, 6)}`;
};

const getDirectTargetUid = (groupId) => {
  if (!groupId || !groupId.startsWith('dm-')) return '';
  const ids = groupId.slice(3).split(':').filter(Boolean);
  if (ids.length !== 2) return '';
  return ids.find((id) => id !== myUid.value) || '';
};

const buildDirectGroupId = (uidA, uidB) => {
  if (!uidA || !uidB) return '';
  const pair = [uidA, uidB].sort();
  return sanitizeGroupId(`dm-${pair[0]}:${pair[1]}`);
};

const sendDirectStart = (groupId, targetUid) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ type: 'direct_start', groupId, targetUid }));
};

const startDirectChat = (user) => {
  if (!user || !user.uid || user.uid === myUid.value) return;
  if (!user.identityDh || !user.identitySign) {
    toast('对方身份信息未就绪。', 'error');
    return;
  }
  const groupId = buildDirectGroupId(myUid.value, user.uid);
  if (!groupId) return;
  const label = user.uidShort || (user.uid ? user.uid.slice(0, 6) : '未知');
  ensureGroupInList(groupId, `私聊 · ${label}`);
  activeGroup.value = groupId;

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }

  if (!powState.value.verified) {
    pendingDirect.value = { groupId, targetUid: user.uid };
    toast('正在进行反机器人验证…', 'info');
    void startPowSolve();
    return;
  }

  sendDirectStart(groupId, user.uid);
};

const createReqId = () => {
  const rand = window.crypto.getRandomValues(new Uint8Array(4));
  const suffix = Array.from(rand).map((v) => v.toString(16).padStart(2, '0')).join('');
  return `r-${Date.now()}-${suffix}`;
};

const buildShortInviteLink = (inviteCode) => {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = inviteCode;
  return url.toString();
};

const formatInviteLinkDisplay = (link) => {
  if (!link) return '';
  return link.replace(/^https?:\/\//, '');
};

const pendingInviteRequest = ref({ reqId: '', groupId: '', mode: 'copy' });

const copyInviteLink = async () => {
  const groupId = sanitizeGroupId(activeGroup.value);
  if (!groupId || groupId === SYSTEM_GROUP || groupId === SYSTEM_NOTICE_GROUP) {
    toast('请选择一个非系统群组再邀请。', 'info');
    return;
  }
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  if (!powState.value.verified) {
    toast('正在进行反机器人验证…', 'info');
    void startPowSolve();
    return;
  }

  const reqId = createReqId();
  pendingInviteRequest.value = { reqId, groupId, mode: 'copy' };
  inviteText.value = '生成邀请中...';
  ws.send(JSON.stringify({ type: 'create_invite', groupId, ttlSec: 2 * 24 * 60 * 60, reqId }));
};

const sendInviteCard = () => {
  if (!eligibleInviteGroups.value.length) {
    toast('没有可分享的群组（需先加入或创建）。', 'info');
    return;
  }
  invitePickerGroupId.value = eligibleInviteGroups.value[0]?.id || '';
  invitePickerOpen.value = true;
};

const sendPairGroupCard = (targetOverride = '') => {
  const dmGroupId = sanitizeGroupId(activeGroup.value);
  if (!dmGroupId || !isDirectGroupId(dmGroupId)) {
    toast('请在私聊中发起群聊。', 'info');
    return;
  }
  const targetUid = targetOverride || getDirectTargetUid(dmGroupId);
  if (!targetUid) {
    toast('无法找到私聊对象。', 'error');
    return;
  }
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  if (!powState.value.verified) {
    pendingPairGroup.value = { groupId: '', targetUid };
    toast('正在进行反机器人验证…', 'info');
    void startPowSolve();
    return;
  }
  const groupId = generateTimeGroupId();
  pendingPairGroup.value = { groupId, targetUid };
  ensureGroupInList(groupId, `群聊 · ${targetUid.slice(0, 6)}`);
  joinGroup(groupId, '', { select: false });
};

const requestPairInvite = (groupId, targetUid) => {
  if (!groupId || !targetUid) return;
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  const reqId = createReqId();
  pendingPairInvite.value = { reqId, groupId, targetUid };
  ws.send(JSON.stringify({ type: 'create_invite', groupId, ttlSec: 2 * 24 * 60 * 60, reqId }));
};

const markPairAccepted = (dmGroupId, pairGroupId) => {
  for (const msg of messages.value) {
    if (
      msg.groupId === dmGroupId &&
      msg.payloadType === 'pair' &&
      msg.pairGroupId === pairGroupId
    ) {
      msg.pairStatus = 'accepted';
    }
  }
};

const acceptPairInvite = (msg) => {
  if (!msg || !msg.pairGroupId || !msg.pairInviteCode) return;
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  ws.send(
    JSON.stringify({
      type: 'pair_accept',
      dmGroupId: msg.groupId,
      groupId: msg.pairGroupId,
      inviteCode: msg.pairInviteCode,
      targetUid: msg.sender,
    })
  );
};

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(currentUrl);
    copyText.value = '已复制';
  } catch {
    copyText.value = '复制失败';
  }
  setTimeout(() => {
    copyText.value = '复制链接';
  }, 2000);
};

const uint8ToBinary = (bytes) => {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return binary;
};

const arrayBufferToBase64 = (buffer) => {
  return btoa(uint8ToBinary(new Uint8Array(buffer)));
};

const base64UrlFromBase64 = (base64) => {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const base64ToUint8 = (base64) => {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
};

const getOrCreateDeviceId = () => {
  try {
    const cached = window.localStorage.getItem('LINKCONNECT.device.id');
    if (cached) return cached;
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    const id = Array.from(bytes).map((v) => v.toString(16).padStart(2, '0')).join('');
    window.localStorage.setItem('LINKCONNECT.device.id', id);
    return id;
  } catch {
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes).map((v) => v.toString(16).padStart(2, '0')).join('');
  }
};

const DEVICE_COOKIE_NAME = 'telechat.device.cookie';

const ensureDeviceCookie = () => {
  try {
    const existing = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${DEVICE_COOKIE_NAME}=`));
    if (existing) return;
    const bytes = window.crypto.getRandomValues(new Uint8Array(64));
    const value = base64UrlFromBase64(arrayBufferToBase64(bytes.buffer));
    document.cookie = `${DEVICE_COOKIE_NAME}=${value}; Path=/; Max-Age=31536000; SameSite=Strict`;
  } catch {
    // no-op
  }
};

const hashToFingerprint = async (text) => {
  const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return base64UrlFromBase64(arrayBufferToBase64(digest));
};

const initDeviceFingerprint = async () => {
  if (deviceFingerprint.value) {
    myUid.value = deviceFingerprint.value;
    return;
  }
  const id = getOrCreateDeviceId();
  deviceFingerprint.value = await hashToFingerprint(`telechat:${id}`);
  myUid.value = deviceFingerprint.value;
  registerDeviceFingerprint();
};

const getDeviceToken = () => {
  try {
    return window.localStorage.getItem('LINKCONNECT.device.token') || '';
  } catch {
    return '';
  }
};

const setDeviceToken = (token) => {
  if (!token) return;
  try {
    window.localStorage.setItem('LINKCONNECT.device.token', token);
  } catch {
    // no-op
  }
};

const resetDeviceBinding = () => {
  try {
    window.localStorage.removeItem('LINKCONNECT.device.id');
    window.localStorage.removeItem('LINKCONNECT.device.token');
  } catch {
    // no-op
  }
  deviceFingerprint.value = '';
  void initDeviceFingerprint();
};

const registerDeviceFingerprint = () => {
  if (!ws || ws.readyState !== WebSocket.OPEN || !deviceFingerprint.value) return;
  const deviceToken = getDeviceToken();
  ws.send(
    JSON.stringify({
      type: 'set_device_fingerprint',
      fingerprint: deviceFingerprint.value,
      deviceToken: deviceToken || undefined,
    })
  );
};

const importPublicKey = async (base64) => {
  const binary = base64ToUint8(base64);
  return window.crypto.subtle.importKey(
    'spki',
    binary,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
};

const getImportedPublicKey = async (uid, base64) => {
  const key = `${uid}:${base64}`;
  if (importedPublicKeyCache.has(key)) {
    return importedPublicKeyCache.get(key);
  }
  const publicKey = await importPublicKey(base64);
  importedPublicKeyCache.set(key, publicKey);
  return publicKey;
};

const ensureIdentityKeys = async () => {
  if (myPrivateKey.value && myPublicKeyBase64.value) return;

  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  myPrivateKey.value = keyPair.privateKey;
  const publicKeyBuf = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  myPublicKeyBase64.value = arrayBufferToBase64(publicKeyBuf);
};

const exportSpkiBase64 = async (key) => {
  const buf = await window.crypto.subtle.exportKey('spki', key);
  return arrayBufferToBase64(buf);
};

const exportJwk = async (key) => {
  return window.crypto.subtle.exportKey('jwk', key);
};

const importEcdsaPrivateKey = async (jwk) => {
  return window.crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
};

const importEcdsaPublicKey = async (spkiBase64) => {
  const binary = base64ToUint8(spkiBase64);
  return window.crypto.subtle.importKey(
    'spki',
    binary,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify']
  );
};

const importEcdhPrivateKey = async (jwk) => {
  return window.crypto.subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
};

const importEcdhPublicKey = async (spkiBase64) => {
  const binary = base64ToUint8(spkiBase64);
  return window.crypto.subtle.importKey(
    'spki',
    binary,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
};

const ensureIdentitySignKeys = async () => {
  if (identitySignKeyPair.value && identitySignPublicBase64.value) return;

  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );
  identitySignKeyPair.value = keyPair;
  identitySignPublicBase64.value = await exportSpkiBase64(keyPair.publicKey);
};

const ensureIdentityDhKeys = async () => {
  if (identityDhKeyPair.value && identityDhPublicBase64.value) return;

  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  identityDhKeyPair.value = keyPair;
  identityDhPublicBase64.value = await exportSpkiBase64(keyPair.publicKey);
};

const signBytes = async (dataBytes) => {
  if (!identitySignKeyPair.value?.privateKey) return '';
  const sig = await window.crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    identitySignKeyPair.value.privateKey,
    dataBytes
  );
  return arrayBufferToBase64(sig);
};

const verifySignature = async (signPubBase64, dataBytes, signatureBase64) => {
  try {
    const pubKey = await importEcdsaPublicKey(signPubBase64);
    const sigBytes = base64ToUint8(signatureBase64);
    return await window.crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      pubKey,
      sigBytes,
      dataBytes
    );
  } catch {
    return false;
  }
};

const validateIdentities = async (users) => {
  const validated = await Promise.all(
    users.map(async (u) => {
      if (!u.identitySign || !u.identityDh || !u.identitySig) {
        return { ...u, identityValid: false };
      }
      const ok = await verifySignature(u.identitySign, base64ToUint8(u.identityDh), u.identitySig);
      return { ...u, identityValid: ok };
    })
  );
  onlineUsers.value = validated;
};

const registerIdentity = async () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  await ensureIdentitySignKeys();
  await ensureIdentityDhKeys();
  if (!identitySignPublicBase64.value || !identityDhPublicBase64.value) return;

  const dhBytes = base64ToUint8(identityDhPublicBase64.value);
  const identitySig = await signBytes(dhBytes);
  ws.send(
    JSON.stringify({
      type: 'set_identity',
      identitySign: identitySignPublicBase64.value,
      identityDh: identityDhPublicBase64.value,
      identitySig,
    })
  );
};

const registerPublicKey = () => {
  if (!ws || ws.readyState !== WebSocket.OPEN || !myPublicKeyBase64.value) return;
  ws.send(JSON.stringify({ type: 'set_public_key', publicKey: myPublicKeyBase64.value }));
};

const textToBase64 = (text) => {
  return arrayBufferToBase64(new TextEncoder().encode(text));
};

const base64ToText = (base64) => {
  return new TextDecoder().decode(base64ToUint8(base64));
};

const hmacSha256 = async (keyBytes, dataBytes) => {
  const key = await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await window.crypto.subtle.sign('HMAC', key, dataBytes);
  return new Uint8Array(sig);
};

const kdfRoot = async (rootKey, dhOut) => {
  const rk = await hmacSha256(rootKey, dhOut);
  const ck = await hmacSha256(rk, new TextEncoder().encode('ck'));
  return { rootKey: rk, chainKey: ck };
};

const kdfChain = async (chainKey) => {
  const messageKey = await hmacSha256(chainKey, new TextEncoder().encode('msg'));
  const nextChain = await hmacSha256(chainKey, new TextEncoder().encode('ck'));
  return { messageKey, chainKey: nextChain };
};

const generateEcdhKeyPair = async () => {
  return window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
};

const deriveDhBits = async (privateKey, publicKey) => {
  const bits = await window.crypto.subtle.deriveBits(
    { name: 'ECDH', public: publicKey },
    privateKey,
    256
  );
  return new Uint8Array(bits);
};

const getDmSession = (uid) => {
  return dmSessions.get(uid) || null;
};

const ensureDmSession = async (uid, identityDhBase64, role) => {
  if (!identityDhKeyPair.value?.privateKey) return null;
  let session = getDmSession(uid);
  if (session) return session;
  if (!identityDhBase64) return null;

  const targetDh = await importEcdhPublicKey(identityDhBase64);
  const seed = await deriveDhBits(identityDhKeyPair.value.privateKey, targetDh);
  const zeroRoot = new Uint8Array(32);
  const rootInit = await hmacSha256(zeroRoot, seed);

  session = {
    rootKey: rootInit,
    chainKeySend: null,
    chainKeyRecv: null,
    dhSelf: null,
    dhSelfPub: '',
    dhRemotePub: identityDhBase64,
    sendCount: 0,
    recvCount: 0,
  };

  if (role === 'sender') {
    session.dhSelf = await generateEcdhKeyPair();
    session.dhSelfPub = await exportSpkiBase64(session.dhSelf.publicKey);
    const dhOut = await deriveDhBits(session.dhSelf.privateKey, targetDh);
    const kdf = await kdfRoot(session.rootKey, dhOut);
    session.rootKey = kdf.rootKey;
    session.chainKeySend = kdf.chainKey;
  } else {
    session.dhSelf = identityDhKeyPair.value;
    session.dhSelfPub = identityDhPublicBase64.value;
  }

  dmSessions.set(uid, session);
  return session;
};

const dmRatchet = async (session, remotePubBase64) => {
  if (!session?.dhSelf?.privateKey) return null;
  const remotePubKey = await importEcdhPublicKey(remotePubBase64);
  const dhOut = await deriveDhBits(session.dhSelf.privateKey, remotePubKey);
  const kdfRecv = await kdfRoot(session.rootKey, dhOut);
  session.rootKey = kdfRecv.rootKey;
  session.chainKeyRecv = kdfRecv.chainKey;
  session.dhRemotePub = remotePubBase64;

  session.dhSelf = await generateEcdhKeyPair();
  session.dhSelfPub = await exportSpkiBase64(session.dhSelf.publicKey);
  const dhOut2 = await deriveDhBits(session.dhSelf.privateKey, remotePubKey);
  const kdfSend = await kdfRoot(session.rootKey, dhOut2);
  session.rootKey = kdfSend.rootKey;
  session.chainKeySend = kdfSend.chainKey;
  return session;
};

const dmEncryptPayload = async (targetUid, targetIdentityDhBase64, payload) => {
  const session = await ensureDmSession(targetUid, targetIdentityDhBase64, 'sender');
  if (!session || !session.chainKeySend) return null;

  const { messageKey, chainKey } = await kdfChain(session.chainKeySend);
  session.chainKeySend = chainKey;

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await window.crypto.subtle.importKey('raw', messageKey, 'AES-GCM', false, ['encrypt']);
  const plain = new TextEncoder().encode(JSON.stringify(payload));
  const cipher = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, plain);

  const ratchetPub = session.dhSelfPub;
  const sig = await signBytes(base64ToUint8(ratchetPub));
  const header = {
    v: 1,
    rp: ratchetPub,
    sig,
    ctr: session.sendCount,
  };
  session.sendCount += 1;

  return {
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(cipher),
    header: textToBase64(JSON.stringify(header)),
  };
};

const dmDecryptPayload = async (senderUid, senderIdentityDh, senderIdentitySign, encryptedKey, iv, ciphertext) => {
  if (!senderIdentityDh || !senderIdentitySign) return null;
  const headerText = base64ToText(encryptedKey);
  let header;
  try {
    header = JSON.parse(headerText);
  } catch {
    return null;
  }

  if (!header?.rp || !header?.sig) return null;
  const sigOk = await verifySignature(senderIdentitySign, base64ToUint8(header.rp), header.sig);
  if (!sigOk) return null;

  let session = getDmSession(senderUid);
  if (!session) {
    session = await ensureDmSession(senderUid, senderIdentityDh, 'receiver');
  }
  if (!session) return null;

  if (!session.dhRemotePub || session.dhRemotePub !== header.rp || !session.chainKeyRecv) {
    await dmRatchet(session, header.rp);
  }
  if (!session.chainKeyRecv) return null;

  const { messageKey, chainKey } = await kdfChain(session.chainKeyRecv);
  session.chainKeyRecv = chainKey;
  session.recvCount += 1;

  const aesKey = await window.crypto.subtle.importKey('raw', messageKey, 'AES-GCM', false, ['decrypt']);
  const ivBytes = base64ToUint8(iv);
  const cipherBytes = base64ToUint8(ciphertext);
  const plain = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, aesKey, cipherBytes);
  return JSON.parse(new TextDecoder().decode(plain));
};

const hasLeadingHexZeros = (bytes, difficulty) => {
  const fullBytes = Math.floor(difficulty / 2);
  const halfNibble = difficulty % 2;
  for (let i = 0; i < fullBytes; i += 1) {
    if (bytes[i] !== 0) return false;
  }
  if (!halfNibble) return true;
  const next = bytes[fullBytes];
  return (next & 0xf0) === 0;
};

const solvePow = async ({ uid, nonce, difficulty }, token) => {
  const enc = new TextEncoder();
  let counter = 0;
  while (token === powSolveToken) {
    const answer = counter.toString(36);
    const input = `${uid}:${nonce}:${answer}`;
    const digest = await window.crypto.subtle.digest('SHA-256', enc.encode(input));
    const bytes = new Uint8Array(digest);
    if (hasLeadingHexZeros(bytes, difficulty)) return answer;

    counter += 1;
    if (counter % 250 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  return null;
};

const startPowSolve = async () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  if (powState.value.verified) return;
  if (!powUid.value || !powState.value.nonce || !powState.value.difficulty) return;
  if (powState.value.solving) return;

  powState.value.solving = true;
  connectionState.value = 'verifying';
  const token = (powSolveToken += 1);

  try {
    const answer = await solvePow(
      { uid: powUid.value, nonce: powState.value.nonce, difficulty: powState.value.difficulty },
      token
    );
    if (!answer) return;

    ws.send(JSON.stringify({ type: 'solve_pow', answer }));
  } catch {
    toast('反机器人验证失败，请刷新重试。', 'error');
  } finally {
    if (token === powSolveToken) {
      powState.value.solving = false;
    }
  }
};

const encryptPayloadForRecipients = async (payload, recipients) => {
  if (!recipients.length) throw new Error('No recipients');

  const aesKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(payload));
  const cipher = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, plain);
  const rawKey = await window.crypto.subtle.exportKey('raw', aesKey);

  const keys = {};
  for (const user of recipients) {
    const publicKey = await getImportedPublicKey(user.uid, user.publicKey);
    const encryptedKey = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawKey);
    keys[user.uid] = arrayBufferToBase64(encryptedKey);
  }

  return {
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(cipher),
    keys,
  };
};

const decryptIncomingPayload = async (data) => {
  if (data.encType === 'dm') {
    const sender = onlineUsers.value.find((u) => u.uid === data.sender);
    if (!sender) return null;
    try {
      return await dmDecryptPayload(
        data.sender,
        sender.identityDh,
        sender.identitySign,
        data.encryptedKey,
        data.iv,
        data.ciphertext
      );
    } catch {
      return null;
    }
  }

  if (!myPrivateKey.value || !data.encryptedKey) return null;

  try {
    const encryptedAesKey = base64ToUint8(data.encryptedKey);
    const rawKey = await window.crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      myPrivateKey.value,
      encryptedAesKey
    );

    const aesKey = await window.crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const iv = base64ToUint8(data.iv);
    const ciphertext = base64ToUint8(data.ciphertext);
    const plain = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ciphertext);
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    return null;
  }
};

const createMsgId = () => {
  const rand = window.crypto.getRandomValues(new Uint8Array(3));
  const suffix = Array.from(rand).map((v) => v.toString(16).padStart(2, '0')).join('');
  return `m-${Date.now()}-${suffix}`;
};

const generateTimeGroupId = () => {
  const now = new Date();
  const pad = (v) => String(v).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = window.crypto.getRandomValues(new Uint8Array(4));
  const suffix = Array.from(rand).map((v) => v.toString(16).padStart(2, '0')).join('');
  return `grp-${stamp}-${suffix}`;
};

const formatTime = (ts) => {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (ts) => {
  return new Date(ts).toLocaleString();
};

const isNearBottom = () => {
  if (!msgBox.value) return false;
  const threshold = 80;
  const distance = msgBox.value.scrollHeight - msgBox.value.scrollTop - msgBox.value.clientHeight;
  return distance < threshold;
};

const scrollToBottom = () => {
  nextTick(() => {
    if (msgBox.value) {
      msgBox.value.scrollTop = msgBox.value.scrollHeight;
    }
  });
};

const sendReadReceipt = (toUid, targetMsgId, groupId) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(
    JSON.stringify({
      type: 'read_receipt',
      to: toUid,
      targetMsgId,
      groupId: sanitizeGroupId(groupId) || SYSTEM_GROUP,
    })
  );
};

const setUnreadCount = (groupId, count) => {
  const gid = sanitizeGroupId(groupId) || SYSTEM_GROUP;
  unreadCounts.value = { ...unreadCounts.value, [gid]: Math.max(0, count) };
};

const setDmLock = (groupId, locked) => {
  const gid = sanitizeGroupId(groupId) || SYSTEM_GROUP;
  dmLocks.value = { ...dmLocks.value, [gid]: Boolean(locked) };
};

const setDmUnlocked = (groupId, unlocked) => {
  const gid = sanitizeGroupId(groupId) || SYSTEM_GROUP;
  dmUnlocked.value = { ...dmUnlocked.value, [gid]: Boolean(unlocked) };
};

const isDmUnlocked = (groupId) => {
  const gid = sanitizeGroupId(groupId) || SYSTEM_GROUP;
  return Boolean(dmUnlocked.value[gid]);
};

const markDmIncoming = (groupId) => {
  const gid = sanitizeGroupId(groupId) || SYSTEM_GROUP;
  if (!gid) return;
  dmHasIncoming.value = { ...dmHasIncoming.value, [gid]: true };
  if (isDmUnlocked(gid)) {
    setDmLock(gid, false);
    return;
  }
  if (dmHasOutgoing.value[gid]) {
    setDmUnlocked(gid, true);
    setDmLock(gid, false);
  }
};

const markDmOutgoing = (groupId) => {
  const gid = sanitizeGroupId(groupId) || SYSTEM_GROUP;
  if (!gid) return;
  dmHasOutgoing.value = { ...dmHasOutgoing.value, [gid]: true };
  if (dmHasIncoming.value[gid]) {
    setDmUnlocked(gid, true);
    setDmLock(gid, false);
  }
};

const isDmLocked = (groupId) => {
  const gid = sanitizeGroupId(groupId) || SYSTEM_GROUP;
  return Boolean(dmLocks.value[gid]) && !isDmUnlocked(gid);
};

const clearDmLimitForUid = (uid) => {
  const targetUid = typeof uid === 'string' ? uid.trim() : '';
  if (!targetUid || !myUid.value) return;
  const gid = buildDirectGroupId(myUid.value, targetUid);
  if (!gid) return;
  setDmLock(gid, false);
};

const pushDmLimitTip = (groupId, targetUid = '') => {
  const gid = sanitizeGroupId(groupId);
  if (!gid || !isDirectGroupId(gid)) return;
  const uid = typeof targetUid === 'string' ? targetUid : '';
  const exists = messages.value.some(
    (msg) =>
      msg.payloadType === 'dm_limit_tip' &&
      (msg.groupId || SYSTEM_GROUP) === gid &&
      (msg.tipTargetUid || '') === uid &&
      msg.tipText === DM_LIMIT_REASON_TEXT
  );
  if (exists) return;
  messages.value.push({
    msgId: createMsgId(),
    payloadType: 'dm_limit_tip',
    sender: '系统消息',
    groupId: gid,
    text: '',
    tipText: DM_LIMIT_REASON_TEXT,
    tipTargetUid: uid,
    ts: Date.now(),
    read: true,
    localSeen: true,
    readBy: [],
    isSystem: true,
  });
  scrollToBottom();
};

const incrementUnread = (groupId) => {
  const gid = sanitizeGroupId(groupId) || SYSTEM_GROUP;
  const current = unreadCounts.value[gid] || 0;
  setUnreadCount(gid, current + 1);
};

const clearUnread = (groupId) => {
  setUnreadCount(groupId, 0);
};

const markGroupSeen = (groupId) => {
  const gid = sanitizeGroupId(groupId) || SYSTEM_GROUP;
  if (!gid) return;
  const unseen = messages.value.filter(
    (m) => (m.groupId || SYSTEM_GROUP) === gid && m.sender !== myUid.value && !m.localSeen
  );
  if (!unseen.length) {
    clearUnread(gid);
    return;
  }

  for (const msg of unseen) {
    msg.localSeen = true;
    if (!msg.isSystem && msg.msgId && msg.sender) {
      sendReadReceipt(msg.sender, msg.msgId, gid);
    }
  }
  clearUnread(gid);
};

const maybeMarkActiveGroupSeen = () => {
  if (document.hidden) return;
  if (!isNearBottom()) return;
  markGroupSeen(activeGroup.value);
};

const showBanner = ({ groupId, title, text }) => {
  banner.value = {
    open: true,
    groupId,
    title,
    text,
    canEnableNotify:
      'Notification' in window &&
      Notification.permission === 'default' &&
      !systemNotifyEnabled.value &&
      !notificationPrompted.value,
  };
  if (banner.value.canEnableNotify) {
    markNotificationPrompted();
  }
  setTimeout(() => {
    if (banner.value.groupId === groupId) {
      banner.value.open = false;
    }
  }, 10000);
};

const openBannerChat = () => {
  const gid = banner.value.groupId;
  if (!gid) return;
  banner.value.open = false;
  openGroup(gid);
  nextTick(() => {
    scrollToBottom();
    maybeMarkActiveGroupSeen();
  });
};

const showSystemNotification = (groupId, previewText) => {
  if (!('Notification' in window)) return;
  if (!systemNotifyEnabled.value) return;
  if (Notification.permission !== 'granted') return;
  const groupName = groups.value.find((g) => g.id === groupId)?.name || groupId;
  const notification = new Notification(groupName, {
    body: previewText,
    silent: true,
  });
  notification.onclick = () => {
    window.focus();
    joinGroup(groupId);
    notification.close();
  };
};

const handleVisibilityChange = () => {
  if (!document.hidden) {
    nextTick(() => {
      maybeMarkActiveGroupSeen();
    });
  }
};

const openReadReceipts = (msg) => {
  if (!msg || !msg.msgId) return;
  readReceiptModal.value = { open: true, msgId: msg.msgId };
};

const closeReadReceipts = () => {
  readReceiptModal.value = { open: false, msgId: '' };
};

const pushLocalMessage = ({
  msgId,
  payloadType,
  groupId,
  text = '',
  imageData = '',
  name = '',
  inviteCode = '',
  inviteLink = '',
  inviteGroup = '',
  inviteGroupName = '',
  pairGroupId = '',
  pairInviteCode = '',
  pairInviteLink = '',
  pairGroupName = '',
  pairStatus = 'pending',
  expiresAt = null,
}) => {
  messages.value.push({
    msgId,
    payloadType,
    sender: myUid.value,
    groupId,
    text,
    imageData,
    name,
    inviteCode,
    inviteLink,
    inviteGroup,
    inviteGroupName,
    pairGroupId,
    pairInviteCode,
    pairInviteLink,
    pairGroupName,
    pairStatus,
    expiresAt,
    ts: Date.now(),
    read: false,
    localSeen: true,
    readBy: [],
  });
};

const normalizeSystemActions = (actions, fallbackAction = '', fallbackLabel = '') => {
  const out = [];
  if (Array.isArray(actions)) {
    for (const item of actions) {
      const action = typeof item?.action === 'string' ? item.action.trim() : '';
      if (!action) continue;
      const label = typeof item?.label === 'string' && item.label.trim() ? item.label.trim() : action;
      out.push({ action, label });
      if (out.length >= 8) break;
    }
  }
  const fbAction = typeof fallbackAction === 'string' ? fallbackAction.trim() : '';
  if (fbAction && !out.some((item) => item.action === fbAction)) {
    out.unshift({
      action: fbAction,
      label:
        typeof fallbackLabel === 'string' && fallbackLabel.trim() ? fallbackLabel.trim() : fbAction,
    });
  }
  return out;
};

const pushSystemMessage = ({ title, text, action = '', actionLabel = '', actions = [], meta = {} }) => {
  const groupId = SYSTEM_NOTICE_GROUP;
  const normalizedActions = normalizeSystemActions(actions, action, actionLabel);
  messages.value.push({
    msgId: createMsgId(),
    payloadType: 'system',
    sender: '系统消息',
    groupId,
    text: '',
    systemTitle: title,
    systemText: text,
    systemAction: action,
    systemActionLabel: actionLabel,
    systemActions: normalizedActions,
    systemMeta: meta,
    ts: Date.now(),
    read: false,
    localSeen: false,
    readBy: [],
    isSystem: true,
  });
  const preview = title || text || '系统提醒';
  if (document.hidden || activeGroup.value !== groupId || !isNearBottom()) {
    incrementUnread(groupId);
    showBanner({
      groupId,
      title: groups.value.find((g) => g.id === groupId)?.name || groupId,
      text: preview.slice(0, 80),
    });
    showSystemNotification(groupId, preview.slice(0, 80));
    void playNotifySound();
  } else {
    markGroupSeen(groupId);
  }
};

const handleSystemAction = (msg, actionItem = null) => {
  const action = typeof actionItem?.action === 'string' && actionItem.action
    ? actionItem.action
    : msg?.systemAction || '';
  if (!msg || !action) return;
  if (action === 'confirm_migration') {
    const code = msg.systemMeta?.code || migrationConfirm.value.code || migrationCode.value;
    confirmMigration(code);
    return;
  }
  if (action === 'open_contacts') {
    openContacts();
    return;
  }
  if (action === 'open_settings') {
    settingsOpen.value = true;
    return;
  }
  if (action === 'open_home') {
    openGroup(SYSTEM_GROUP);
    return;
  }
  if (action === 'open_system_notice') {
    openGroup(SYSTEM_NOTICE_GROUP);
    return;
  }
  if (action === 'create_group') {
    createGroup();
    return;
  }
  if (action === 'toggle_notify') {
    void toggleSystemNotify();
    return;
  }
  if (action === 'toggle_sound') {
    void toggleSound();
    return;
  }
  if (action === 'copy_invite') {
    void copyInviteLink();
  }
};

const sendEncryptedPayload = async (payloadType, payload) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  const groupId = sanitizeGroupId(activeGroup.value) || SYSTEM_GROUP;
  if (isDirectGroupId(groupId)) {
    await sendDirectEncryptedPayload(payloadType, payload, groupId);
    return;
  }
  const serverPayloadType = payloadType === 'image' ? 'image' : 'text';
  const recipients = onlineUsers.value.filter(
    (u) =>
      typeof u.uid === 'string' &&
      u.uid &&
      u.uid !== myUid.value &&
      typeof u.publicKey === 'string' &&
      u.publicKey.length > 0
  );

  if (!recipients.length) {
    alert('当前群组暂无可接收消息的在线成员。');
    return;
  }

  const encrypted = await encryptPayloadForRecipients(payload, recipients);
  const msgId = createMsgId();

  ws.send(
    JSON.stringify({
      type: 'chat',
      msgId,
      groupId,
      payloadType: serverPayloadType,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
      keys: encrypted.keys,
      mimeType: payload.mimeType || null,
      name: payload.name || null,
    })
  );

  if (payloadType === 'image') {
    pushLocalMessage({
      msgId,
      payloadType: 'image',
      groupId,
      imageData: payload.imageData,
      name: payload.name,
    });
  } else if (payloadType === 'pair') {
    pushLocalMessage({
      msgId,
      payloadType: 'pair',
      groupId,
      pairGroupId: payload.pairGroupId || '',
      pairInviteCode: payload.pairInviteCode || '',
      pairInviteLink: payload.pairInviteLink || '',
      pairGroupName: payload.pairGroupName || '',
      pairStatus: payload.pairStatus || 'pending',
    });
  } else if (payloadType === 'invite') {
    pushLocalMessage({
      msgId,
      payloadType: 'invite',
      groupId,
      text: payload.inviteGroup || '',
      inviteCode: payload.inviteCode || '',
      inviteLink: payload.inviteLink || '',
      inviteGroup: payload.inviteGroup || '',
      inviteGroupName: payload.inviteGroupName || '',
      expiresAt: payload.expiresAt || null,
    });
  } else {
    pushLocalMessage({
      msgId,
      payloadType: 'text',
      groupId,
      text: payload.text,
    });
  }

  scrollToBottom();
};

const sendDirectEncryptedPayload = async (payloadType, payload, groupId) => {
  const targetUid = getDirectTargetUid(groupId);
  if (!targetUid) {
    toast('无法找到私聊对象。', 'error');
    return false;
  }

  if (isDmLocked(groupId)) {
    pushDmLimitTip(groupId, targetUid);
    toast('你不在对方通讯录：请等待对方回复，或先申请加入对方通讯录。', 'info');
    return false;
  }

  const target = onlineUsers.value.find((u) => u.uid === targetUid);
  if (!target || !target.identityDh || !target.identitySign) {
    toast('对方身份信息未就绪。', 'error');
    return false;
  }
  if (target.identityValid === false) {
    toast('对方身份签名无效，无法安全通信。', 'error');
    return false;
  }

  const encrypted = await dmEncryptPayload(targetUid, target.identityDh, payload);
  if (!encrypted) {
    toast('私聊加密失败。', 'error');
    return false;
  }

  const msgId = createMsgId();
  const serverPayloadType = payloadType === 'image' ? 'image' : 'text';

  ws.send(
    JSON.stringify({
      type: 'chat',
      msgId,
      groupId,
      payloadType: serverPayloadType,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
      keys: { [targetUid]: encrypted.header },
      encType: 'dm',
    })
  );

  if (payloadType === 'image') {
    pushLocalMessage({
      msgId,
      payloadType: 'image',
      groupId,
      imageData: payload.imageData,
      name: payload.name,
    });
  } else if (payloadType === 'pair') {
    pushLocalMessage({
      msgId,
      payloadType: 'pair',
      groupId,
      pairGroupId: payload.pairGroupId || '',
      pairInviteCode: payload.pairInviteCode || '',
      pairInviteLink: payload.pairInviteLink || '',
      pairGroupName: payload.pairGroupName || '',
      pairStatus: payload.pairStatus || 'pending',
    });
  } else if (payloadType === 'invite') {
    pushLocalMessage({
      msgId,
      payloadType: 'invite',
      groupId,
      text: payload.inviteGroup || '',
      inviteCode: payload.inviteCode || '',
      inviteLink: payload.inviteLink || '',
      inviteGroup: payload.inviteGroup || '',
      inviteGroupName: payload.inviteGroupName || '',
      expiresAt: payload.expiresAt || null,
    });
  } else {
    pushLocalMessage({
      msgId,
      payloadType: 'text',
      groupId,
      text: payload.text,
    });
  }

  markDmOutgoing(groupId);
  scrollToBottom();
  return true;
};

const handleSend = async () => {
  const text = inputMsg.value.trim();
  if (!text) return;
  if (!powState.value.verified) {
    toast('正在进行反机器人验证…', 'info');
    void startPowSolve();
    return;
  }
  if (isDirectGroupId(activeGroup.value) && isDmLocked(activeGroup.value)) {
    pushDmLimitTip(activeGroup.value, getDirectTargetUid(activeGroup.value));
    toast('你不在对方通讯录：请等待对方回复，或先申请加入对方通讯录。', 'info');
    return;
  }
  if (text.length > MAX_TEXT_LENGTH) {
    alert(`文本长度不能超过 ${MAX_TEXT_LENGTH} 字符。`);
    return;
  }

  await sendEncryptedPayload('text', { kind: 'text', text });
  inputMsg.value = '';
};

const onInputKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    void handleSend();
  }
};

const estimateDataUrlBytes = (dataUrl) => {
  const base64 = dataUrl.split(',')[1] || '';
  const paddingMatch = base64.match(/=+$/);
  const padding = paddingMatch ? paddingMatch[0].length : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
};

const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

const compressImageDataUrl = async (dataUrl, maxBytes, maxDimension) => {
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(image, 0, 0, width, height);

  for (const quality of [0.86, 0.76, 0.66, 0.56]) {
    const output = canvas.toDataURL('image/jpeg', quality);
    if (estimateDataUrlBytes(output) <= maxBytes) {
      return { dataUrl: output, mimeType: 'image/jpeg' };
    }
  }

  return null;
};

const prepareImageForSending = async (file) => {
  const originalDataUrl = await fileToDataUrl(file);
  if (estimateDataUrlBytes(originalDataUrl) <= MAX_IMAGE_BYTES) {
    return { dataUrl: originalDataUrl, mimeType: file.type || 'image/jpeg' };
  }

  return compressImageDataUrl(originalDataUrl, MAX_IMAGE_BYTES, MAX_IMAGE_DIMENSION);
};

const triggerImagePicker = () => {
  imagePicker.value?.click();
};

const onPickImage = async (event) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('仅支持图片文件。');
    return;
  }

  isSendingImage.value = true;
  try {
    const prepared = await prepareImageForSending(file);
    if (!prepared) {
      alert('图片过大，压缩后仍无法发送。请换一张更小的图片。');
      return;
    }

    await sendEncryptedPayload('image', {
      kind: 'image',
      imageData: prepared.dataUrl,
      mimeType: prepared.mimeType,
      name: file.name,
    });
  } catch {
    alert('图片处理失败，请重试。');
  } finally {
    isSendingImage.value = false;
  }
};

const joinGroup = (groupId, inviteCode = '', options = {}) => {
  const gid = sanitizeGroupId(groupId);
  if (!gid) return;
  const shouldSelect = options?.select !== false;
  if (shouldSelect) {
    selectGroup(gid);
  }
  ensureGroupInList(gid, nameForDirectGroup(gid));

  if (gid === SYSTEM_NOTICE_GROUP) {
    return;
  }

  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  if (!powState.value.verified) {
    if (isDirectGroupId(gid)) {
      const targetUid = getDirectTargetUid(gid);
      if (targetUid) {
        pendingDirect.value = { groupId: gid, targetUid };
      }
    } else {
      pendingJoin.value = { groupId: gid, inviteCode: inviteCode || '', select: shouldSelect };
    }
    toast('正在进行反机器人验证…', 'info');
    void startPowSolve();
    return;
  }

  if (isDirectGroupId(gid)) {
    if (!joinedGroups.has(gid)) {
      const targetUid = getDirectTargetUid(gid);
      if (targetUid) {
        sendDirectStart(gid, targetUid);
      }
    }
    return;
  }

  const code = extractInviteCode(inviteCode || '');
  ws.send(
    JSON.stringify({
      type: 'join_group',
      groupId: gid,
      inviteCode: code || undefined,
    })
  );
};

const openGroup = (groupId) => {
  const gid = sanitizeGroupId(groupId);
  if (!gid) return;
  if (gid === SYSTEM_NOTICE_GROUP) {
    ensureGroupInList(gid, '系统消息');
    selectGroup(gid);
    return;
  }
  joinGroup(gid);
};

const createGroup = () => {
  const gid = generateTimeGroupId();
  joinGroup(gid);
};

const resolveWsUrl = () => {
  const configuredUrl = import.meta.env.VITE_WS_URL;
  if (typeof configuredUrl === 'string' && configuredUrl.trim()) {
    return configuredUrl.trim();
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
};

const connectWS = () => {
  myPrivateKey.value = null;
  myPublicKeyBase64.value = '';
  identitySignKeyPair.value = null;
  identitySignPublicBase64.value = '';
  identityDhKeyPair.value = null;
  identityDhPublicBase64.value = '';
  importedPublicKeyCache.clear();
  dmSessions.clear();
  powUid.value = '';
  ws = new WebSocket(resolveWsUrl());
  connectionState.value = 'connecting';
  powState.value = { nonce: '', difficulty: 0, verified: false, solving: false };
  powSolveToken += 1;

  ws.onopen = () => {
    connectionState.value = 'verifying';
  };

  ws.onmessage = async (event) => {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }

    if (data.type === 'identity') {
      powUid.value = typeof data.powUid === 'string' && data.powUid ? data.powUid : data.uid || '';
      powState.value.nonce = typeof data.powNonce === 'string' ? data.powNonce : '';
      powState.value.difficulty = Number.isFinite(data.powDifficulty) ? data.powDifficulty : 0;
      await ensureIdentityKeys();
      await ensureIdentitySignKeys();
      await ensureIdentityDhKeys();
      registerPublicKey();
      await registerIdentity();
      registerDeviceFingerprint();
      void startPowSolve();
      return;
    }

    if (data.type === 'device_bound') {
      if (typeof data.deviceToken === 'string' && data.deviceToken) {
        setDeviceToken(data.deviceToken);
        toast('设备已绑定。', 'info');
      }
      return;
    }

    if (data.type === 'device_fingerprint_registered') {
      deviceBound.value = true;
      requestContacts();
      return;
    }

    if (data.type === 'contacts_list') {
      contactsLoading.value = false;
      contacts.value = Array.isArray(data.contacts) ? data.contacts : [];
      syncContactsOnlineStatus();
      return;
    }

    if (data.type === 'system_notice') {
      const title = typeof data.title === 'string' ? data.title : '系统提醒';
      const text = typeof data.text === 'string' ? data.text : '';
      const action = typeof data.action === 'string' ? data.action : '';
      const actionLabel = typeof data.actionLabel === 'string' ? data.actionLabel : '';
      const actions = Array.isArray(data.actions) ? data.actions : [];
      pushSystemMessage({
        title,
        text,
        action,
        actionLabel,
        actions,
      });
      return;
    }

    if (data.type === 'contacts_request') {
      const requestId = typeof data.requestId === 'string' ? data.requestId : '';
      const fromUid = typeof data.fromUid === 'string' ? data.fromUid : '';
      if (requestId && fromUid) {
        const exists = contactRequests.value.some((req) => req.requestId === requestId);
        if (!exists) {
          contactRequests.value = [
            {
              requestId,
              fromUid,
              fromFingerprintShort: typeof data.fromFingerprintShort === 'string' ? data.fromFingerprintShort : '',
              fromOs: typeof data.fromOs === 'string' ? data.fromOs : '',
              fromLocation: typeof data.fromLocation === 'string' ? data.fromLocation : '',
            },
            ...contactRequests.value,
          ];
          const fromOs = typeof data.fromOs === 'string' ? data.fromOs : '';
          const fromLocation = typeof data.fromLocation === 'string' ? data.fromLocation : '';
          const fromText = [fromOs, fromLocation].filter((v) => v && v !== 'Unknown').join(' · ');
          pushSystemMessage({
            title: '通讯录请求',
            text: fromText ? `设备 ${fromUid}（${fromText}）请求加入通讯录。` : `设备 ${fromUid} 请求加入通讯录。`,
            action: 'open_contacts',
            actionLabel: '查看通讯录',
          });
          toast('收到通讯录请求。', 'info');
        }
      }
      return;
    }

    if (data.type === 'contacts_request_sent') {
      const requestId = typeof data.requestId === 'string' ? data.requestId : '';
      const targetUid = typeof data.targetUid === 'string' ? data.targetUid : '';
      if (requestId && targetUid) {
        outgoingContactRequests.value = [
          { requestId, targetUid },
          ...outgoingContactRequests.value.filter((req) => req.requestId !== requestId),
        ];
      }
      toast('通讯录请求已发送，等待对方同意。', 'info');
      return;
    }

    if (data.type === 'contacts_request_result') {
      const requestId = typeof data.requestId === 'string' ? data.requestId : '';
      const status = typeof data.status === 'string' ? data.status : '';
      const peerUid = typeof data.peerUid === 'string' ? data.peerUid : '';
      const eventTs = typeof data.ts === 'number' ? data.ts : Date.now();
      const forRequester = data.forRequester === true;
      const outgoingReq = requestId
        ? outgoingContactRequests.value.find((req) => req.requestId === requestId) || null
        : null;
      const incomingReq = requestId
        ? contactRequests.value.find((req) => req.requestId === requestId) || null
        : null;
      const wasOutgoing = forRequester || Boolean(outgoingReq);
      if (requestId) {
        removeContactRequest(requestId);
        outgoingContactRequests.value = outgoingContactRequests.value.filter((req) => req.requestId !== requestId);
      }
      if (status === 'accepted') {
        if (outgoingReq?.targetUid) {
          clearDmLimitForUid(outgoingReq.targetUid);
        }
        if (incomingReq?.fromUid) {
          clearDmLimitForUid(incomingReq.fromUid);
        }
        const who = peerUid || outgoingReq?.targetUid || incomingReq?.fromUid || '对方设备';
        toast(wasOutgoing ? '对方已同意通讯录请求。' : '已同意通讯录请求。', 'info');
        if (wasOutgoing) {
          pushSystemMessage({
            title: '通讯录申请已同意',
            text: `设备 ${who} 于 ${formatDateTime(eventTs)} 同意了你的通讯录申请。`,
          });
        } else {
          pushSystemMessage({
            title: '通讯录已建立',
            text: `你于 ${formatDateTime(eventTs)} 同意了设备 ${who} 的通讯录申请，双方已互为通讯录。`,
          });
        }
      } else if (status === 'declined') {
        const who = peerUid || outgoingReq?.targetUid || '对方设备';
        toast(wasOutgoing ? '对方拒绝了通讯录请求。' : '已拒绝通讯录请求。', 'error');
        if (wasOutgoing) {
          pushSystemMessage({
            title: '通讯录申请被拒绝',
            text: `设备 ${who} 于 ${formatDateTime(eventTs)} 拒绝了你的通讯录申请。`,
          });
        }
      }
      return;
    }

    if (data.type === 'contacts_saved') {
      contactsLoading.value = false;
      if (data.contact) {
        data.contact.mutual = true;
        upsertContact(data.contact);
        const contactUid =
          (typeof data.contact.onlineUid === 'string' && data.contact.onlineUid) ||
          (typeof data.contact.contactFingerprint === 'string' ? data.contact.contactFingerprint : '');
        clearDmLimitForUid(contactUid);
        toast('已加入通讯录。', 'info');
      }
      return;
    }

    if (data.type === 'contacts_removed') {
      contactsLoading.value = false;
      const fp = typeof data.contactFingerprint === 'string' ? data.contactFingerprint : '';
      if (fp) {
        contacts.value = contacts.value.filter((c) => c.contactFingerprint !== fp);
        toast('已移除联系人。', 'info');
      }
      return;
    }

    if (data.type === 'contacts_migrate_code') {
      migrationCode.value = typeof data.code === 'string' ? data.code : '';
      migrationExpiresAt.value = typeof data.expiresAt === 'number' ? data.expiresAt : 0;
      migrationConfirm.value = { code: '', fromFingerprintShort: '', fromOs: '', fromLocation: '' };
      setMigrationStatus('success', '迁移码已生成，10 分钟内有效。请在旧设备输入并授权。');
      toast('迁移码已生成。', 'info');
      return;
    }

    if (data.type === 'contacts_migrate_waiting') {
      setMigrationStatus('info', '旧设备已授权，等待新设备确认…');
      pushSystemMessage({
        title: '通讯录迁移已授权',
        text: '等待新设备确认后将完成迁移。',
      });
      return;
    }

    if (data.type === 'contacts_migrate_request') {
      const fromOs = typeof data.fromOs === 'string' ? data.fromOs : '';
      const fromLocation = typeof data.fromLocation === 'string' ? data.fromLocation : '';
      const fromText = [fromOs, fromLocation].filter((v) => v && v !== 'Unknown').join(' · ');
      migrationConfirm.value = {
        code: typeof data.code === 'string' ? data.code : '',
        fromFingerprintShort: typeof data.fromFingerprintShort === 'string' ? data.fromFingerprintShort : '',
        fromOs,
        fromLocation,
      };
      setMigrationStatus('info', '旧设备已授权，请在新设备确认迁移。');
      pushSystemMessage({
        title: '通讯录迁移确认',
        text: fromText
          ? `旧设备（${fromText}）已授权，请在新设备点击确认完成迁移。`
          : '旧设备已授权，请在新设备点击确认完成迁移。',
        action: 'confirm_migration',
        actionLabel: '确认迁移',
        meta: { code: migrationConfirm.value.code },
      });
      return;
    }

    if (data.type === 'contacts_migrate_done') {
      contactsLoading.value = false;
      const count = typeof data.count === 'number' ? data.count : 0;
      setMigrationStatus('success', `通讯录迁移完成，共 ${count} 条。新设备可刷新通讯录确认。`);
      toast(`通讯录迁移完成（${count} 条）。`, 'info');
      pushSystemMessage({
        title: '通讯录迁移完成',
        text: `已同步 ${count} 位联系人。`,
      });
      migrationCode.value = '';
      migrationExpiresAt.value = 0;
      migrationInput.value = '';
      migrationConfirm.value = { code: '', fromFingerprintShort: '', fromOs: '', fromLocation: '' };
      requestContacts();
      return;
    }

    if (data.type === 'device_kicked') {
      suppressReconnect.value = true;
      deviceKicked.value = {
        open: true,
        reason: typeof data.reason === 'string' ? data.reason : '',
      };
      try {
        ws?.close(1008, 'Device re-bound');
      } catch {
        // no-op
      }
      return;
    }

    if (data.type === 'pow_verified') {
      powState.value.verified = true;
      powState.value.solving = false;
      connectionState.value = 'connected';

      if (pendingDirect.value.groupId && pendingDirect.value.targetUid) {
        sendDirectStart(pendingDirect.value.groupId, pendingDirect.value.targetUid);
        pendingDirect.value = { groupId: '', targetUid: '' };
      } else if (pendingJoin.value.groupId) {
        joinGroup(pendingJoin.value.groupId, pendingJoin.value.inviteCode, {
          select: pendingJoin.value.select,
        });
        pendingJoin.value = { groupId: '', inviteCode: '', select: true };
      } else if (activeGroup.value !== SYSTEM_GROUP && activeGroup.value !== SYSTEM_NOTICE_GROUP) {
        joinGroup(activeGroup.value);
      }
      if (deviceBound.value) {
        requestContacts();
      }
      if (pendingPairGroup.value.targetUid && !pendingPairGroup.value.groupId) {
        sendPairGroupCard(pendingPairGroup.value.targetUid);
      }
      return;
    }

    if (data.type === 'status') {
      const rawUsers = Array.isArray(data.users) ? data.users : [];
      onlineUsers.value = rawUsers;
      void validateIdentities(rawUsers);
      importedPublicKeyCache.clear();
      groups.value[0].onlineCount = typeof data.onlineCount === 'number' ? data.onlineCount : onlineUsers.value.length;
      groupCounts.value = data.groupCounts && typeof data.groupCounts === 'object' ? data.groupCounts : {};
      for (const group of groups.value) {
        const count = groupCounts.value[group.id];
        group.onlineCount = typeof count === 'number' ? count : 0;
      }
      syncContactsOnlineStatus();
      return;
    }

    if (data.type === 'group_joined') {
      const gid = sanitizeGroupId(data.groupId);
      const directName = nameForDirectGroup(gid);
      ensureGroupInList(gid, directName);
      if (gid && !joinedGroups.has(gid)) {
        joinedGroups.add(gid);
        if (gid !== SYSTEM_GROUP && gid !== SYSTEM_NOTICE_GROUP) {
          const name = groups.value.find((g) => g.id === gid)?.name || gid;
          toast(`已加入群组：${name}`, 'info');
        }
      }
      clearUnread(gid);
      if (pendingPairGroup.value.groupId && pendingPairGroup.value.groupId === gid) {
        const targetUid = pendingPairGroup.value.targetUid;
        pendingPairGroup.value = { groupId: '', targetUid: '' };
        requestPairInvite(gid, targetUid);
      }
      return;
    }

    if (data.type === 'invite_created') {
      const groupId = sanitizeGroupId(data.groupId);
      const inviteCode = extractInviteCode(data.inviteCode);
      const expiresAt = typeof data.expiresAt === 'number' ? data.expiresAt : null;
      const reqId = typeof data.reqId === 'string' ? data.reqId : '';
      const mode = pendingInviteRequest.value.mode || 'copy';

      if (pendingPairInvite.value.reqId && reqId && pendingPairInvite.value.reqId === reqId) {
        const targetUid = pendingPairInvite.value.targetUid;
        pendingPairInvite.value = { reqId: '', groupId: '', targetUid: '' };

        if (!groupId || !inviteCode) {
          toast('群聊邀请生成失败，请重试。', 'error');
          return;
        }

        const dmGroupId = buildDirectGroupId(myUid.value, targetUid);
        if (!dmGroupId) {
          toast('无法发送群聊邀请。', 'error');
          return;
        }

        const shortLink = buildShortInviteLink(inviteCode);
        const groupName = groups.value.find((g) => g.id === groupId)?.name || groupId;

        const ok = await sendDirectEncryptedPayload(
          'pair',
          {
            kind: 'pair',
            pairGroupId: groupId,
            pairInviteCode: inviteCode,
            pairInviteLink: shortLink,
            pairGroupName: groupName,
            pairStatus: 'pending',
            expiresAt,
          },
          dmGroupId
        );
        if (ok) {
          toast('已发送群聊邀请卡片。', 'info');
        }
        return;
      }

      if (
        pendingInviteRequest.value.reqId &&
        reqId &&
        pendingInviteRequest.value.reqId !== reqId
      ) {
        return;
      }

      pendingInviteRequest.value = { reqId: '', groupId: '', mode: 'copy' };

      if (!groupId || !inviteCode) {
        inviteText.value = '邀请新人';
        toast('邀请生成失败，请重试。', 'error');
        return;
      }

      const shortLink = buildShortInviteLink(inviteCode);
      const expireText = expiresAt ? new Date(expiresAt).toLocaleString() : '';

      if (mode === 'card') {
        const groupName = groups.value.find((g) => g.id === groupId)?.name || groupId;
        await sendEncryptedPayload('invite', {
          kind: 'invite',
          inviteCode,
          inviteLink: shortLink,
          inviteGroup: groupId,
          inviteGroupName: groupName,
          expiresAt,
        });
        toast('已发送群邀请卡片。', 'info');
        return;
      }

      const shareText = [
        `加入 零本LINKCONNECT 群组：${groupId}`,
        shortLink,
        `邀请码：${inviteCode}`,
        expireText ? `有效期至：${expireText}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      try {
        await navigator.clipboard.writeText(shareText);
        inviteText.value = '微信邀请文案已复制';
        toast('已复制邀请文案（含链接 + 特殊字母串）。', 'info');
      } catch {
        inviteText.value = '复制失败';
        toast('复制失败：请手动复制邀请码或链接。', 'error');
      } finally {
        setTimeout(() => {
          inviteText.value = '邀请新人';
        }, 2000);
      }

      return;
    }

    if (data.type === 'error') {
      const code = typeof data.code === 'string' ? data.code : 'ERROR';
      const message = typeof data.message === 'string' ? data.message : '请求失败';

      if (code === 'POW_REQUIRED') {
        powState.value.verified = false;
        void startPowSolve();
        toast('正在进行反机器人验证…', 'info');
        return;
      }

      if (code === 'INVITE_REQUIRED') {
        toast('该群组需要邀请码才能加入。请使用“邀请新人”生成的链接/邀请码。', 'error');
        return;
      }

      if (code === 'USER_OFFLINE') {
        toast('对方当前不在线，无法发起临时对话。', 'error');
        return;
      }

      if (code === 'DEVICE_AUTH_REQUIRED') {
        const ok = window.confirm('设备绑定验证失败，是否恢复绑定？恢复后将生成新的设备指纹。');
        if (ok) {
          toast('正在恢复设备绑定…', 'info');
          resetDeviceBinding();
        } else {
          toast('设备绑定验证失败，请使用原设备或恢复绑定。', 'error');
        }
        deviceBound.value = false;
        return;
      }

      if (code === 'DEVICE_BIND_REQUIRED') {
        toast('请先完成设备绑定后再发起私聊。', 'error');
        return;
      }

      if (code === 'DM_WAIT_REPLY') {
        const gid = isDirectGroupId(activeGroup.value) ? activeGroup.value : '';
        if (gid) {
          setDmLock(gid, true);
          pushDmLimitTip(gid, getDirectTargetUid(gid));
        }
        toast('你不在对方通讯录：请等待对方回复，或先申请加入对方通讯录。', 'info');
        return;
      }

      if (code === 'CONTACT_TARGET_OFFLINE') {
        toast('对方不在线，无法发送通讯录请求。', 'info');
        return;
      }

      if (code === 'CONTACT_TARGET_UNBOUND') {
        toast('对方设备未绑定，暂不可发送通讯录请求。', 'info');
        return;
      }

      if (code === 'CONTACT_SELF') {
        toast('不能添加自己到通讯录。', 'info');
        return;
      }

      if (code === 'CONTACT_REQUEST_PENDING') {
        toast('通讯录请求已发送，请等待对方同意。', 'info');
        return;
      }

      if (code === 'CONTACT_REQUEST_INVALID') {
        toast('通讯录请求已失效或不存在。', 'error');
        return;
      }

      if (code === 'CONTACT_REQUEST_EXPIRED') {
        toast('通讯录请求已过期，请重新发起。', 'error');
        return;
      }

      if (code === 'INVALID_CONTACT_REQUEST') {
        toast('通讯录请求参数无效。', 'error');
        return;
      }

      if (code === 'DB_NOT_READY' || code === 'DB_ERROR') {
        contactsLoading.value = false;
        setMigrationStatus('error', '通讯录服务暂不可用，请稍后重试。');
        toast('通讯录服务暂不可用，请稍后重试。', 'error');
        return;
      }

      if (code === 'MIGRATION_INVALID') {
        setMigrationStatus('error', '迁移码无效或已使用，请确认输入正确。');
        toast('迁移码无效，请确认输入正确。', 'error');
        return;
      }

      if (code === 'MIGRATION_NOT_APPROVED') {
        setMigrationStatus('info', '旧设备尚未授权，请稍后再确认。');
        toast('旧设备尚未授权。', 'info');
        return;
      }

      if (code === 'MIGRATION_NOT_NEW_DEVICE') {
        setMigrationStatus('error', '只有新设备可以确认迁移。');
        toast('确认失败：请在新设备操作。', 'error');
        return;
      }

      if (code === 'MIGRATION_EXPIRED') {
        setMigrationStatus('error', '迁移码已过期，请在新设备重新生成。');
        toast('迁移码已过期，请重新生成。', 'error');
        return;
      }

      if (code === 'MIGRATION_SAME_DEVICE') {
        setMigrationStatus('error', '新旧设备不能相同，请换另一台设备授权。');
        toast('新旧设备不能相同。', 'error');
        return;
      }

      if (code === 'INVALID_MIGRATION_CODE') {
        setMigrationStatus('error', '请填写迁移码（以 MC- 开头）。');
        toast('请输入迁移码。', 'info');
        return;
      }

      if (code === 'INVITE_INVALID') {
        toast('群聊邀请已失效，请重新发起。', 'error');
        return;
      }

      toast(`${code}: ${message}`, 'error');
      return;
    }

    if (data.type === 'chat') {
      const payload = await decryptIncomingPayload(data);
      if (!payload) return;

      const groupId = sanitizeGroupId(data.groupId) || SYSTEM_GROUP;
      ensureGroupInList(groupId);

      const previewText =
        payload.kind === 'image'
          ? '[图片]'
          : payload.kind === 'invite'
            ? '群邀请卡'
            : payload.kind === 'pair'
              ? '群聊邀请'
              : payload.text || '[新消息]';

      if (!messages.value.some((m) => m.msgId === data.msgId)) {
        const incoming = {
          msgId: data.msgId || createMsgId(),
          payloadType:
            payload.kind === 'image'
              ? 'image'
              : payload.kind === 'invite'
                ? 'invite'
                : payload.kind === 'pair'
                  ? 'pair'
                  : 'text',
          sender: data.sender,
          groupId,
          text: payload.kind === 'text' ? payload.text || '' : '',
          imageData: payload.kind === 'image' ? payload.imageData || '' : '',
          name: payload.kind === 'image' ? payload.name || data.name || '' : '',
          inviteCode: payload.kind === 'invite' ? payload.inviteCode || '' : '',
          inviteLink: payload.kind === 'invite' ? payload.inviteLink || '' : '',
          inviteGroup: payload.kind === 'invite' ? payload.inviteGroup || '' : '',
          inviteGroupName: payload.kind === 'invite' ? payload.inviteGroupName || '' : '',
          pairGroupId: payload.kind === 'pair' ? payload.pairGroupId || '' : '',
          pairInviteCode: payload.kind === 'pair' ? payload.pairInviteCode || '' : '',
          pairInviteLink: payload.kind === 'pair' ? payload.pairInviteLink || '' : '',
          pairGroupName: payload.kind === 'pair' ? payload.pairGroupName || '' : '',
          pairStatus: payload.kind === 'pair' ? payload.pairStatus || 'pending' : 'pending',
          expiresAt: payload.kind === 'invite' ? payload.expiresAt || null : null,
          ts: data.ts || Date.now(),
          read: false,
          localSeen: false,
          readBy: [],
        };

        if (incoming.payloadType === 'text' && !incoming.text) {
          incoming.text = '[空消息]';
        }

        messages.value.push(incoming);
      }

      if (data.sender !== myUid.value && data.msgId) {
        if (isDirectGroupId(groupId)) {
          markDmIncoming(groupId);
        }
        if (document.hidden || activeGroup.value !== groupId || !isNearBottom()) {
          incrementUnread(groupId);
          showBanner({
            groupId,
            title: groups.value.find((g) => g.id === groupId)?.name || groupId,
            text: previewText.slice(0, 80),
          });
          showSystemNotification(groupId, previewText.slice(0, 80));
          void playNotifySound();
        } else {
          markGroupSeen(groupId);
        }
      }

      scrollToBottom();
      nextTick(() => {
        maybeMarkActiveGroupSeen();
      });
      return;
    }

    if (data.type === 'pair_accepted') {
      const gid = sanitizeGroupId(data.groupId);
      const dmGroupId = sanitizeGroupId(data.dmGroupId);
      const inviteCode = extractInviteCode(data.inviteCode || '');
      if (dmGroupId && gid) {
        markPairAccepted(dmGroupId, gid);
      }
      if (gid && inviteCode) {
        joinGroup(gid, inviteCode, { select: false });
        toast('已加入群聊。', 'info');
      }
      return;
    }

    if (data.type === 'sent_ack') {
      const local = messages.value.find((m) => m.msgId === data.msgId && m.sender === myUid.value);
      if (local && data.ts) {
        local.ts = data.ts;
      }
      if (local && isDirectGroupId(local.groupId) && !isDmUnlocked(local.groupId)) {
        const delivered = Number(data.delivered) || 0;
        const dmRestricted = data.dmRestricted === true;
        if (dmRestricted && delivered > 0) {
          setDmLock(local.groupId, true);
          pushDmLimitTip(local.groupId, getDirectTargetUid(local.groupId));
        } else {
          setDmLock(local.groupId, false);
        }
      }
      return;
    }

    if (data.type === 'read_receipt') {
      const local = messages.value.find(
        (m) => m.msgId === data.targetMsgId && m.sender === myUid.value
      );
      if (local) {
        local.read = true;
        if (!Array.isArray(local.readBy)) {
          local.readBy = [];
        }
        const already = local.readBy.some((entry) => entry.uid === data.sender);
        if (!already) {
          local.readBy.push({
            uid: data.sender,
            ts: data.ts || Date.now(),
          });
        }
      }
      return;
    }
  };

  ws.onclose = () => {
    connectionState.value = 'reconnecting';
    if (suppressReconnect.value) return;
    setTimeout(() => {
      if (!isInsecureBrowser.value) connectWS();
    }, 3000);
  };

  ws.onerror = () => {
    connectionState.value = 'reconnecting';
  };
};

onMounted(() => {
  loadSoundSetting();
  loadNotificationPrompt();
  loadSystemNotifySetting();
  loadTrustedKeys();
  ensureDeviceCookie();
  void initDeviceFingerprint();
  notificationAudio = new Audio(SOUND_URL);
  notificationAudio.preload = 'auto';
  const tryUnlock = () => {
    void unlockSound();
  };
  window.addEventListener('pointerdown', tryUnlock, { once: true, passive: true });
  window.addEventListener('keydown', tryUnlock, { once: true });

  const url = new URL(window.location.href);
  const groupFromUrl = sanitizeGroupId(url.searchParams.get('group'));
  const inviteFromUrl = extractInviteCode(
    url.searchParams.get('i') || url.searchParams.get('invite') || url.searchParams.get('code') || ''
  );
  const inviteFromHash = extractInviteCode(decodeURIComponent(url.hash || ''));
  const inviteOnly = inviteFromUrl || inviteFromHash;
  const groupFromInviteOnly = inviteOnly && !groupFromUrl ? decodeInviteGroupId(inviteOnly) : '';

  if (groupFromUrl || groupFromInviteOnly) {
    const gid = groupFromUrl || groupFromInviteOnly;
    pendingJoin.value = { groupId: gid, inviteCode: inviteOnly, select: true };
    activeGroup.value = gid;
    ensureGroupInList(gid);
  }

  checkEnvironment();
  if (!isInsecureBrowser.value) {
    connectWS();
  }
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<style scoped>
.chat-pattern {
  background-image:
    radial-gradient(circle at 25px 25px, rgba(148, 163, 184, 0.09) 2px, transparent 0),
    radial-gradient(circle at 75px 75px, rgba(148, 163, 184, 0.09) 2px, transparent 0);
  background-size: 100px 100px;
}

.emoji-font {
  font-family: 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', 'EmojiOne Color', sans-serif;
}

.clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.message-item {
  animation: message-in 180ms ease;
}

.message-bubble {
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.message-bubble:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
}

@keyframes message-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .message-item {
    animation: none;
  }
  .message-bubble {
    transition: none;
  }
}

.mobile-safe-footer {
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
}

@media (min-width: 640px) {
  .mobile-safe-footer {
    padding-bottom: 1rem;
  }
}

section::-webkit-scrollbar {
  width: 10px;
}

section::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.45);
}

section::-webkit-scrollbar-track {
  background: transparent;
}
</style>
