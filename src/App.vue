<template>
  <div
    class="h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-slate-100 text-slate-900 antialiased"
    :class="[{ 'keyboard-open': isKeyboardOpen }, { 'viewport-narrow': viewportNarrow }, `ui-scale-${uiScale}`]"
    :style="appScaleStyle"
  >
    <div
      v-if="isInsecureBrowser"
      class="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4"
    >
      <div class="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur">
        <div class="mb-4 flex items-center justify-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
            <svg viewBox="0 0 24 24" class="h-8 w-8 text-amber-500" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 9v4m0 4h.01M10.29 3.86l-8.6 14.93A2 2 0 0 0 3.43 21h17.14a2 2 0 0 0 1.74-3.01l-8.6-14.93a2 2 0 0 0-3.48 0z"/>
            </svg>
          </div>
        </div>
        <h2 class="text-center text-xl font-semibold text-slate-900">请在外部浏览器中打开</h2>
        <p class="mt-3 text-center text-sm leading-6 text-slate-500">
          当前应用内浏览器暂不支持端到端加密功能，请用手机自带浏览器或 Chrome 打开本页。
        </p>

        <div class="mt-6 space-y-3">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold text-slate-500">操作方法</p>
            <p class="mt-2 text-sm text-slate-700">
              点击右上角 <span class="inline-block rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">⋯</span>
              选择「在浏览器中打开」
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold text-slate-500">当前链接</p>
            <p class="mt-2 break-all font-mono text-xs text-slate-600">{{ currentUrl }}</p>
          </div>
        </div>

        <button
          type="button"
          @click="copyUrl"
          class="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 active:scale-[0.98]"
        >
          {{ copyText }}
        </button>
      </div>
    </div>

    <div v-else class="flex h-full w-full">
      <div
        v-if="lastToast.text"
        class="fixed left-1/2 top-4 z-[70] w-[min(92vw,560px)] -translate-x-1/2 rounded-2xl border px-4 py-3 text-sm shadow-2xl transition"
        :class="
          lastToast.kind === 'error'
            ? 'border-rose-200 bg-rose-50/90 text-rose-700'
            : 'border-slate-200 bg-white/85 text-slate-700'
        "
      >
        {{ lastToast.text }}
      </div>
      <Transition name="banner-pop">
        <div
          v-if="banner.open"
          class="message-banner fixed left-1/2 top-6 z-[70] w-[min(92vw,400px)] -translate-x-1/2 rounded-[22px] border border-sky-100 bg-slate-50 shadow-[0_16px_48px_rgba(15,23,42,0.12)] md:left-auto md:right-4 md:top-3 md:w-[344px] md:translate-x-0"
          :style="bannerSwipeStyle"
          @pointerdown="startBannerSwipe"
          @pointermove="handleBannerSwipeMove"
          @pointerup="endBannerSwipe"
          @pointercancel="cancelBannerSwipe"
        >
          <div class="flex items-start justify-between gap-2 px-4 pb-1 pt-3">
            <button
              v-if="banner.clickable"
              type="button"
              class="min-w-0 flex-1 text-left"
              @click="openBannerChat"
            >
              <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600/80">新消息</p>
              <p class="mt-1 truncate text-sm font-semibold text-slate-800">{{ banner.title }}</p>
              <p class="mt-1 clamp-2 text-xs leading-5 text-slate-600">{{ banner.text }}</p>
            </button>
            <div v-else class="min-w-0 flex-1 text-left">
              <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600/80">新消息</p>
              <p class="mt-1 truncate text-sm font-semibold text-slate-800">{{ banner.title }}</p>
              <p class="mt-1 clamp-2 text-xs leading-5 text-slate-600">{{ banner.text }}</p>
            </div>
            <button
              type="button"
              @click="dismissBanner"
              class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
              aria-label="Close banner"
            >
              <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 6l12 12M18 6 6 18"/>
              </svg>
            </button>
          </div>
          <div class="flex items-center justify-between gap-2 border-t border-sky-100/70 px-4 py-3">
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
              {{ banner.groupId === SYSTEM_NOTICE_GROUP ? '查看通知' : '进入聊天' }}
            </button>
          </div>
        </div>
      </Transition>
      <div v-if="deviceKicked.open" class="fixed inset-0 z-50">
        <button
          type="button"
          class="absolute inset-0 bg-slate-900/40"
          @click="dismissDeviceKicked"
          aria-label="Close kicked notice"
        ></button>
        <div class="viewport-modal-scroll">
          <div class="device-kicked-panel viewport-modal-panel rounded-2xl border border-slate-200 bg-white shadow-2xl" style="--dialog-max: 32rem;">
            <div class="viewport-modal-body px-5 py-5">
              <p class="text-xs font-semibold uppercase tracking-wide text-rose-400">已下线</p>
              <h3 class="mt-1 text-lg font-semibold text-slate-800">你的账号在同一设备被重新登录</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                为保证"一台设备一个用户"，本窗口已断开连接。
                {{ deviceKicked.reason ? `原因：${deviceKicked.reason}` : '' }}
              </p>
              <div class="mt-4 flex flex-wrap items-center justify-end gap-2">
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
        </div>
      </div>
      <aside
        v-if="!mobileViewport"
        class="w-72 shrink-0 border-r border-slate-200/80 bg-white/85 p-3 backdrop-blur flex flex-col"
      >
        <div class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div class="flex items-center justify-between gap-2">
            <div class="flex min-w-0 items-center gap-2">
              <div class="relative">
                <div class="h-9 w-9 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500"></div>
                <span class="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500"></span>
              </div>
              <div class="min-w-0">
                <p class="text-xs uppercase tracking-wide text-slate-400">My ID</p>
                <p class="truncate text-xs font-semibold text-slate-700">
                  {{ myNickname || '未设置昵称' }}
                </p>
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
              @click="openSettingsPage"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
              aria-label="Settings"
            >
              <svg viewBox="0 0 48 48" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M18.2838 43.1713C14.9327 42.1736 11.9498 40.3213 9.58787 37.867C10.469 36.8227 11 35.4734 11 34.0001C11 30.6864 8.31371 28.0001 5 28.0001C4.79955 28.0001 4.60139 28.01 4.40599 28.0292C4.13979 26.7277 4 25.3803 4 24.0001C4 21.9095 4.32077 19.8938 4.91579 17.9995C4.94381 17.9999 4.97188 18.0001 5 18.0001C8.31371 18.0001 11 15.3138 11 12.0001C11 11.0488 10.7786 10.1493 10.3846 9.35011C12.6975 7.1995 15.5205 5.59002 18.6521 4.72314C19.6444 6.66819 21.6667 8.00013 24 8.00013C26.3333 8.00013 28.3556 6.66819 29.3479 4.72314C32.4795 5.59002 35.3025 7.1995 37.6154 9.35011C37.2214 10.1493 37 11.0488 37 12.0001C37 15.3138 39.6863 18.0001 43 18.0001C43.0281 18.0001 43.0562 17.9999 43.0842 17.9995C43.6792 19.8938 44 21.9095 44 24.0001C44 25.3803 43.8602 26.7277 43.594 28.0292C43.3986 28.01 43.2005 28.0001 43 28.0001C39.6863 28.0001 37 30.6864 37 34.0001C37 35.4734 37.531 36.8227 38.4121 37.867C36.0502 40.3213 33.0673 42.1736 29.7162 43.1713C28.9428 40.752 26.676 39.0001 24 39.0001C21.324 39.0001 19.0572 40.752 18.2838 43.1713Z" fill="none" stroke="#3c3e55" stroke-width="3" stroke-linejoin="round"/><path d="M24 31C27.866 31 31 27.866 31 24C31 20.134 27.866 17 24 17C20.134 17 17 20.134 17 24C17 27.866 20.134 31 24 31Z" fill="none" stroke="#3c3e55" stroke-width="3" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="mt-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
          <input
            v-model="groupQuery"
            class="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            placeholder="搜索群组"
            inputmode="search"
          />
        </div>

        <div class="mt-2 flex-1 overflow-y-auto pr-1">
          <p class="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Groups</p>
          <button
            v-for="group in visibleGroups"
            :key="group.id"
            type="button"
            @click="handleGroupListPrimaryAction(group.id)"
            @contextmenu="handleGroupContextMenu($event, group.id)"
            @pointerdown="startGroupLongPress($event, group.id)"
            @pointerup="cancelGroupLongPress"
            @pointermove="cancelGroupLongPress"
            @pointercancel="cancelGroupLongPress"
            @pointerleave="cancelGroupLongPress"
            class="group-quick-trigger mb-1 flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left transition"
            :class="
              isGroupSelected(group.id)
                ? 'border-sky-200 bg-sky-50 text-sky-700 shadow-sm'
                : 'border-transparent bg-slate-100/70 text-slate-700 hover:border-slate-200 hover:bg-white'
            "
          >
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-2">
              <div class="flex min-w-0 items-center gap-2">
                <span v-if="isGroupPinned(group.id)" class="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">置顶</span>
                <span class="truncate text-sm font-medium">{{ groupDisplayName(group, group.name) }}</span>
              </div>
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
            v-if="group.id === SYSTEM_NOTICE_GROUP && getUnreadCount(group.id)"
            class="ml-2 h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500"
          ></span>
          <span
            v-else-if="getUnreadCount(group.id)"
            class="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white"
          >
            {{ formatUnreadCount(getUnreadCount(group.id)) }}
          </span>
        </button>
        </div>

        <div class="mt-3 flex justify-end">
          <div class="relative">
            <button
              type="button"
              @click="groupRestoreHintOpen = !groupRestoreHintOpen"
              class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-500 shadow-sm transition hover:border-sky-300 hover:text-sky-600"
              aria-label="为什么我的群聊消失了"
            >
              ?
            </button>
            <div
              v-if="groupRestoreHintOpen"
              class="absolute right-0 top-9 z-10 w-[min(78vw,18rem)] rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-600 shadow-xl"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-slate-800">为什么我的群聊消失了？</p>
                  <p class="mt-1 leading-5 text-slate-500">
                    现在普通群会优先自动恢复，自己创建的群也会随设备身份一起找回。
                    如果这是修复前加入的旧群，而服务端还没有你的成员记录，仍可能需要用邀请链接重新加入一次。
                    之后这类群关系会被持续保存。
                  </p>
                </div>
                <button
                  type="button"
                  @click="groupRestoreHintOpen = false"
                  class="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500"
                >
                  关
                </button>
              </div>
            </div>
          </div>
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

        <header class="mobile-header-shell relative z-10 border-b border-white/60 bg-white/92 px-4 py-3 md:px-6">
          <template v-if="mobileViewport">
            <div class="flex items-center gap-2">
              <!-- 左侧：返回按钮 or 汉堡菜单 -->
              <button
                v-if="activeGroup !== SYSTEM_GROUP"
                type="button"
                @click="openGroup(SYSTEM_GROUP)"
                class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
                aria-label="Back to homepage"
              >
                <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <button
                v-else
                type="button"
                @click="showMobilePanel = true; mobileDrawerMode = 'home'"
                class="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
                aria-label="Open mobile panel"
              >
                <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M4 7h16M4 12h16M4 17h16"/>
                </svg>
                <span
                  v-if="getUnreadCount(SYSTEM_NOTICE_GROUP) || hasPendingContactRequests"
                  class="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"
                  aria-hidden="true"
                ></span>
              </button>
              <!-- 中间：标题 -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <h1 class="truncate text-[15px] font-semibold text-slate-800">{{ pageHeaderTitle }}</h1>
                  <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="connectionDotClass"></span>
                </div>
                <p v-if="connectionState !== 'connected'" class="mt-0.5 truncate text-[11px] leading-4 text-slate-500">
                  {{ mobileConnectionHint }}
                </p>
              </div>
              <!-- 右侧：群设置按钮 -->
              <button
                v-if="activeGroup !== SYSTEM_GROUP && activeGroup !== SYSTEM_NOTICE_GROUP && !isDirectGroupId(activeGroup)"
                type="button"
                @click="openGroupManage"
                class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
                aria-label="Group settings"
              >
                <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
            </div>
          </template>
          <div v-else class="flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <div class="min-w-0">
                <h1 class="truncate text-base font-semibold text-slate-800 md:text-lg">{{ pageHeaderTitle }}</h1>
                <p v-if="isRootMessagesPage" class="text-xs text-slate-500">最近聊天排在最上面，点击即可进入会话。</p>
                <p v-else-if="isRootContactsPage" class="text-xs text-slate-500">联系人、群聊和待处理请求都集中在这里。</p>
                <p v-else-if="isRootSettingsPage" class="text-xs text-slate-500">身份、通知和隐私偏好统一在这里管理。</p>
                <template v-else>
                  <p class="text-xs text-emerald-600">端到端加密已启用（客户端本地密钥）</p>
                </template>
              </div>
            </div>
            <div class="flex items-center gap-2">
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
                @click="openSystemNoticePanel"
                class="relative rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-rose-300 hover:text-rose-700"
              >
                通知
                <span
                  v-if="getUnreadCount(SYSTEM_NOTICE_GROUP)"
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
              <button
                v-if="activeGroup !== SYSTEM_GROUP && activeGroup !== SYSTEM_NOTICE_GROUP && !isDirectGroupId(activeGroup)"
                type="button"
                @click="toggleCurrentGroupContact"
                class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
              >
                {{ currentGroupSavedToContacts ? '移出通讯录' : '加入通讯录' }}
              </button>
              <button
                v-if="activeGroup !== SYSTEM_GROUP && activeGroup !== SYSTEM_NOTICE_GROUP && !isDirectGroupId(activeGroup)"
                type="button"
                @click="openGroupManage"
                class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
              >
                群设置
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
        </header>

        <div
          v-if="activeGroup !== SYSTEM_GROUP && activeGroup !== SYSTEM_NOTICE_GROUP && !isDirectGroupId(activeGroup) && activeGroupAnnouncement"
          class="relative z-10 border-b border-amber-100 bg-amber-50/90 px-4 py-2.5 text-sm text-amber-900 md:px-6"
        >
          <div class="mx-auto flex w-full max-w-4xl items-start gap-3">
            <span class="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-semibold text-amber-700">公告</span>
            <p class="min-w-0 flex-1 break-words leading-6">{{ activeGroupAnnouncement }}</p>
          </div>
        </div>

        <Transition name="status-strip">
          <div
            v-if="showReconnectBanner"
            class="relative z-10 border-b border-amber-100/60 bg-white/94 px-3 py-1.5 md:px-6"
          >
            <div
              class="flex items-center gap-2 rounded-xl border px-3 py-1.5 shadow-sm"
              :class="connectionBannerClass"
            >
              <div class="flex items-center gap-2 min-w-0">
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-medium text-slate-700 truncate">{{ connectionBannerTitle }}</p>
                </div>
                <span
                  v-if="reconnectAttempt > 0"
                  class="shrink-0 text-[10px] text-slate-400"
                >
                  重连中…
                </span>
                <button
                  type="button"
                  @click="manualReconnect"
                  class="shrink-0 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white"
                >
                  重连
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <Transition name="dm-negotiation">
          <div
            v-if="showDmNegotiationBanner"
            class="relative z-10 px-3 pb-1.5 md:px-6"
          >
            <div
              class="flex items-center gap-2 rounded-xl border px-3 py-1.5 shadow-sm md:flex-row md:items-center md:justify-between"
              :class="dmNegotiationBannerClass"
            >
              <div class="min-w-0 flex items-start gap-3">
                <span
                  class="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
                  :class="dmNegotiationIconClass"
                >
                  <svg
                    v-if="dmNegotiationState.phase === 'ready'"
                    viewBox="0 0 24 24"
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.9"
                  >
                    <path d="M5 12.5 9.2 16.7 19 7.4"/>
                  </svg>
                  <span v-else class="dm-negotiation-orb">
                    <span class="dm-negotiation-wave"></span>
                    <span class="dm-negotiation-wave dm-negotiation-wave-delay"></span>
                    <span class="dm-negotiation-core"></span>
                  </span>
                </span>
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="text-sm font-semibold text-slate-900">{{ dmNegotiationTitle }}</p>
                    <span
                      class="rounded-full border border-white/70 bg-white/72 px-2.5 py-1 text-[11px] font-semibold"
                      :class="dmNegotiationChipClass"
                    >
                      {{ dmNegotiationChipText }}
                    </span>
                  </div>
                  <p class="mt-1 text-xs leading-5 text-slate-600">{{ dmNegotiationText }}</p>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <Transition name="mobile-drawer">
          <div v-if="mobileViewport && showMobilePanel" class="absolute inset-0 z-20">
            <button
              type="button"
              @click="showMobilePanel = false"
              class="mobile-panel-overlay absolute inset-0 bg-slate-900/30"
              aria-label="Close group panel"
            ></button>
            <div class="pointer-events-none absolute inset-y-2 left-2 flex max-w-[calc(100%-1rem)] items-start gap-2">
            <div v-if="mobileDrawerMode === 'home'" class="mobile-side-drawer pointer-events-auto flex w-[min(76vw,21rem)] max-w-[calc(100vw-4.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_48px_rgba(15,23,42,0.18)]">
              <!-- 头部：个人信息 -->
              <div class="border-b border-slate-100 px-4 py-3">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex min-w-0 items-center gap-3">
                    <div class="relative shrink-0">
                      <div class="h-11 w-11 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500"></div>
                      <span class="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white" :class="connectionState === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'"></span>
                    </div>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-slate-800">{{ myNickname || '未设置昵称' }}</p>
                      <p
                        class="cursor-pointer text-[11px] font-mono text-slate-500"
                        :class="isIdentityExpanded('self-id-mobile') ? 'whitespace-normal break-all' : 'truncate'"
                        @click="toggleIdentityExpanded('self-id-mobile')"
                      >{{ formatIdentityDisplay(myUid || 'Connecting...', 'self-id-mobile', 10, 10) }}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="showMobilePanel = false"
                    class="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700"
                  >关闭</button>
                </div>
              </div>

              <!-- 连接状态 -->
              <div class="border-b border-slate-100 px-4 py-2.5">
                <div class="flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-medium" :class="connectionPillClass">
                  <span class="h-2 w-2 rounded-full" :class="connectionDotClass"></span>
                  {{ connectionLabel }}
                </div>
                <p v-if="connectionState !== 'connected'" class="mt-1.5 px-1 text-[11px] leading-4 text-slate-500">{{ mobileConnectionHint }}</p>
              </div>

              <!-- 个人快捷操作 -->
              <div class="border-b border-slate-100 px-3 py-2.5">
                <p class="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">个人</p>
                <div class="grid grid-cols-2 gap-1.5">
                  <!-- 通知 -->
                  <button
                    type="button"
                    @click="openSystemNoticePanel(); showMobilePanel = false"
                    class="mobile-panel-action relative flex min-h-[56px] flex-col items-start justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-slate-700"
                  >
                    <div class="flex items-center gap-2">
                      <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8">
                          <path d="M12 4.75a4 4 0 0 0-4 4v1.28c0 .57-.16 1.13-.46 1.61L6.5 13.25c-.4.64.06 1.5.82 1.5h9.36c.76 0 1.22-.86.82-1.5l-1.04-1.61a3.1 3.1 0 0 1-.46-1.61V8.75a4 4 0 0 0-4-4Z"/>
                          <path d="M9.75 17.25a2.25 2.25 0 0 0 4.5 0"/>
                        </svg>
                      </span>
                      <span class="text-sm font-semibold text-slate-800">通知</span>
                    </div>
                    <span v-if="getUnreadCount(SYSTEM_NOTICE_GROUP)" class="absolute right-3 top-3 h-2 w-2 rounded-full bg-rose-500"></span>
                  </button>
                  <!-- 添加好友 -->
                  <button
                    type="button"
                    @click="openAddFriendDialog(); showMobilePanel = false"
                    class="mobile-panel-action flex min-h-[56px] flex-col items-start justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-slate-700"
                  >
                    <div class="flex items-center gap-2">
                      <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <line x1="19" y1="8" x2="19" y2="14"/>
                          <line x1="22" y1="11" x2="16" y2="11"/>
                        </svg>
                      </span>
                      <span class="text-sm font-semibold text-slate-800">加好友</span>
                    </div>
                  </button>
                  <!-- 设备名片 -->
                  <button
                    type="button"
                    @click="saveDeviceCard(); showMobilePanel = false"
                    class="mobile-panel-action flex min-h-[56px] flex-col items-start justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-slate-700"
                  >
                    <div class="flex items-center gap-2">
                      <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <path d="M3 9h18"/>
                          <circle cx="9" cy="15" r="2"/>
                          <path d="M13 15h4"/>
                        </svg>
                      </span>
                      <span class="text-sm font-semibold text-slate-800">名片</span>
                    </div>
                  </button>
                  <!-- 设置 -->
                  <button
                    type="button"
                    @click="openSettingsPage(); showMobilePanel = false"
                    class="mobile-panel-action flex min-h-[56px] flex-col items-start justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-slate-700"
                  >
                    <div class="flex items-center gap-2">
                      <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <svg viewBox="0 0 48 48" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8">
                          <path d="M18.2838 43.1713C14.9327 42.1736 11.9498 40.3213 9.58787 37.867C10.469 36.8227 11 35.4734 11 34.0001C11 30.6864 8.31371 28.0001 5 28.0001C4.79955 28.0001 4.60139 28.01 4.40599 28.0292C4.13979 26.7277 4 25.3803 4 24.0001C4 21.9095 4.32077 19.8938 4.91579 17.9995C4.94381 17.9999 4.97188 18.0001 5 18.0001C8.31371 18.0001 11 15.3138 11 12.0001C11 11.0488 10.7786 10.1493 10.3846 9.35011C12.6975 7.1995 15.5205 5.59002 18.6521 4.72314C19.6444 6.66819 21.6667 8.00013 24 8.00013C26.3333 8.00013 28.3556 6.66819 29.3479 4.72314C32.4795 5.59002 35.3025 7.1995 37.6154 9.35011C37.2214 10.1493 37 11.0488 37 12.0001C37 15.3138 39.6863 18.0001 43 18.0001C43.0281 18.0001 43.0562 17.9999 43.0842 17.9995C43.6792 19.8938 44 21.9095 44 24.0001C44 25.3803 43.8602 26.7277 43.594 28.0292C43.3986 28.01 43.2005 28.0001 43 28.0001C39.6863 28.0001 37 30.6864 37 34.0001C37 35.4734 37.531 36.8227 38.4121 37.867C36.0502 40.3213 33.0673 42.1736 29.7162 43.1713C28.9428 40.752 26.676 39.0001 24 39.0001C21.324 39.0001 19.0572 40.752 18.2838 43.1713Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
                          <path d="M24 31C27.866 31 31 27.866 31 24C31 20.134 27.866 17 24 17C20.134 17 17 20.134 17 24C17 27.866 20.134 31 24 31Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
                        </svg>
                      </span>
                      <span class="text-sm font-semibold text-slate-800">设置</span>
                    </div>
                  </button>
                </div>
              </div>

              <!-- 快捷开关 -->
              <div class="border-b border-slate-100 px-4 py-2.5">
                <p class="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">偏好</p>
                <div class="space-y-2">
                  <!-- 提示音 -->
                  <div class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span class="text-xs text-slate-700">提示音</span>
                    <button type="button" @click="toggleSound" class="relative inline-flex h-5 w-8 items-center rounded-full transition-colors" :class="soundEnabled ? 'bg-sky-500' : 'bg-slate-200'">
                      <span class="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform" :class="soundEnabled ? 'translate-x-4' : 'translate-x-0.5'"></span>
                    </button>
                  </div>
                  <!-- 阅后即焚 -->
                  <div class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span class="text-xs text-slate-700">阅后即焚</span>
                    <button type="button" @click="burnAfterReadEnabled = !burnAfterReadEnabled" class="relative inline-flex h-5 w-8 items-center rounded-full transition-colors" :class="burnAfterReadEnabled ? 'bg-rose-500' : 'bg-slate-200'">
                      <span class="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform" :class="burnAfterReadEnabled ? 'translate-x-4' : 'translate-x-0.5'"></span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- 底部：版本 + 邀请 -->
              <div class="mt-auto border-t border-slate-100 px-4 py-3">
                <div class="flex items-center justify-between">
                  <button type="button" @click="handleVersionTap" class="text-[11px] text-slate-400">v{{ APP_VERSION }}</button>
                  <button
                    type="button"
                    @click="copyInviteLink(); showMobilePanel = false"
                    class="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white"
                  >邀请新人</button>
                </div>
                <div v-if="debugModeEnabled" class="mt-2 rounded-xl bg-sky-50 px-3 py-2">
                  <p class="text-[10px] font-semibold uppercase tracking-wide text-sky-600">Debug</p>
                  <div class="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-slate-600">
                    <span>WS</span><span class="text-right font-mono">{{ debugInfo.wsState }}</span>
                    <span>PoW</span><span class="text-right font-mono">{{ debugInfo.powStatus }}</span>
                    <span>Msg</span><span class="text-right font-mono">{{ debugInfo.msgCount }}</span>
                    <span>DM</span><span class="text-right font-mono">{{ debugInfo.dmSessionCount }}</span>
                    <span>Outbox</span><span class="text-right font-mono">{{ debugInfo.outboxCount }}</span>
                    <span>Build</span><span class="text-right font-mono">{{ debugInfo.buildTime }}</span>
                  </div>
                </div>
              </div>
            </div>
           <div v-else class="mobile-side-drawer pointer-events-auto flex w-[min(76vw,21rem)] max-w-[calc(100vw-4.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_48px_rgba(15,23,42,0.18)]">
              <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div class="min-w-0">
                  <p class="text-xs uppercase tracking-wide text-slate-400">侧边栏</p>
                  <p class="truncate text-xs font-semibold text-slate-700">{{ activeGroupName || '群聊' }}</p>
                </div>
                <button type="button" @click="showMobilePanel = false" class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">关闭</button>
              </div>
              <div class="border-b border-slate-100 px-3 py-2.5">
                <p class="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">快捷操作</p>
                <div class="mt-2 grid grid-cols-2 gap-1.5">
                  <button type="button" @click="toggleGroupPinned(activeGroup); showMobilePanel = false" class="mobile-panel-action flex min-h-[58px] flex-col items-start justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-slate-700">
                    <div class="flex items-center gap-2"><span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 5h14l-1.5 9H6.5L5 5Z"/><path d="M8 14v5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-5"/></svg></span><span class="mobile-panel-action-title text-sm font-semibold text-slate-800">置顶</span></div>
                    <span class="mt-1 text-[10px] leading-4 text-slate-400">{{ isGroupPinned(activeGroup) ? '已置顶' : '未置顶' }}</span>
                  </button>
                  <button type="button" @click="toast('功能开发中'); showMobilePanel = false" class="mobile-panel-action flex min-h-[58px] flex-col items-start justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-slate-700">
                    <div class="flex items-center gap-2"><span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></span><span class="mobile-panel-action-title text-sm font-semibold text-slate-800">免打扰</span></div>
                    <span class="mt-1 text-[10px] leading-4 text-slate-400">静音通知</span>
                  </button>
                  <button type="button" @click="toast('功能开发中'); showMobilePanel = false" class="mobile-panel-action flex min-h-[58px] flex-col items-start justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-slate-700">
                    <div class="flex items-center gap-2"><span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/></svg></span><span class="mobile-panel-action-title text-sm font-semibold text-slate-800">导出聊天记录</span></div>
                    <span class="mt-1 text-[10px] leading-4 text-slate-400">保存为文件</span>
                  </button>
                  <button type="button" @click="toast('功能开发中'); showMobilePanel = false" class="mobile-panel-action flex min-h-[58px] flex-col items-start justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-slate-700">
                    <div class="flex items-center gap-2"><span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></span><span class="mobile-panel-action-title text-sm font-semibold text-slate-800">清空聊天记录</span></div>
                    <span class="mt-1 text-[10px] leading-4 text-slate-400">不可恢复</span>
                  </button>
                </div>
              </div>
              <div class="border-b border-slate-100 px-3 py-2.5">
                <p class="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">成员列表</p>
                <div v-if="groupMembersLoading" class="mt-2 px-1 text-xs text-slate-500">加载中…</div>
                <div v-else-if="!groupMembers.length" class="mt-2 px-1 text-xs text-slate-500">暂无成员</div>
                <div v-else class="mt-2 flex flex-wrap gap-2">
                  <div v-for="member in groupMembers" :key="`drawer-member-${member.uid}`" class="flex flex-col items-center gap-1">
                    <div class="avatar h-9 w-9 shrink-0 rounded-full text-[11px] font-semibold leading-9 text-white text-center" :style="{ background: avatarColor(member.uid) }">{{ avatarInitial(member.nickname || member.uidShort || '?') }}</div>
                    <span class="max-w-[2.5rem] truncate text-[10px] text-slate-500">{{ member.nickname || member.uidShort || '?' }}</span>
                  </div>
                </div>
              </div>
              <div class="mt-auto border-t border-slate-100 px-3 py-2.5">
                <div class="grid grid-cols-2 gap-1.5">
                  <button type="button" @click="openGroupManage(); showMobilePanel = false" class="mobile-panel-action flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">群设置</button>
                  <button type="button" @click="openGroup(SYSTEM_GROUP); showMobilePanel = false" class="mobile-panel-action flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">返回首页</button>
                </div>
              </div>
            </div>
           </div>
          </div>
        </Transition>

        <section
          ref="msgBox"
          class="mobile-content-shell relative z-10 flex-1 overflow-y-auto px-3 py-4 sm:px-4 md:px-6"
          @click="closeComposerMenu"
          @scroll="maybeMarkActiveGroupSeen"
        >
          <div v-if="isRootMessagesPage" class="mobile-root-stack mx-auto flex w-full max-w-4xl flex-col pb-4">
            <div class="mobile-message-toolbar border-b border-slate-200 bg-white/88 px-1 py-2 backdrop-blur">
              <div class="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                <input
                  v-model="groupQuery"
                  class="min-h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  placeholder="搜索聊天、群组"
                  inputmode="search"
                />
                <button
                  type="button"
                  @click="openContacts"
                  class="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  通讯录
                </button>
                <button
                  type="button"
                  @click="createGroup"
                  class="inline-flex h-9 items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  新建群聊
                </button>
              </div>

              <div class="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                <input
                  v-model="inviteJoinInput"
                  class="min-h-9 w-full flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  placeholder="粘贴邀请链接或邀请码"
                  autocomplete="off"
                  spellcheck="false"
                />
                <button
                  type="button"
                  @click="joinByInviteCode"
                  class="inline-flex h-9 w-full items-center justify-center rounded-lg border border-sky-500 bg-sky-500 px-4 text-xs font-semibold text-white transition hover:bg-sky-600 md:w-auto"
                >
                  加入群聊
                </button>
              </div>
            </div>

            <div v-if="chatListGroups.length" class="border-b border-slate-200 bg-white/94">
              <button
                v-for="group in chatListGroups"
                :key="`chat-list-${group.id}`"
                type="button"
                @click="handleGroupListPrimaryAction(group.id)"
                @contextmenu="handleGroupContextMenu($event, group.id)"
                @pointerdown="startGroupLongPress($event, group.id)"
                @pointerup="cancelGroupLongPress"
                @pointermove="cancelGroupLongPress"
                @pointercancel="cancelGroupLongPress"
                @pointerleave="cancelGroupLongPress"
                class="mobile-message-row group-quick-trigger flex w-full items-center gap-3 border-b border-slate-200 px-1 py-4 text-left transition hover:bg-slate-50 last:border-b-0"
              >
                <div
                  class="avatar h-12 w-12 shrink-0 rounded-full text-[14px] font-semibold text-white"
                  :style="{ background: avatarColor(group.id || groupDisplayName(group, group.name)) }"
                >
                  {{ avatarInitial(groupDisplayName(group, group.name) || group.id || 'C') }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex min-w-0 items-center gap-2">
                      <span v-if="isGroupPinned(group.id)" class="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">置顶</span>
                      <p class="truncate text-sm font-semibold text-slate-800">{{ groupDisplayName(group, group.name) }}</p>
                    </div>
                    <p class="shrink-0 text-[11px] text-slate-400">{{ groupPreviewTime(group.id) }}</p>
                  </div>
                  <div class="mt-1 flex items-center gap-2 text-xs leading-5 text-slate-500">
                    <p class="min-w-0 flex-1 truncate">
                      {{ groupPreviewText(group.id) || (group.id === SYSTEM_NOTICE_GROUP ? '系统通知会集中显示在这里' : '还没有消息，点进去开始聊天') }}
                    </p>
                  </div>
                </div>
                <div class="flex shrink-0 items-center">
                  <span
                    v-if="getUnreadCount(group.id)"
                    class="inline-flex min-w-6 items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white"
                  >
                    {{ formatUnreadCount(getUnreadCount(group.id)) }}
                  </span>
                </div>
              </button>
            </div>
            <div v-else class="border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
              <p class="text-sm font-semibold text-slate-800">还没有会话</p>
              <p class="mt-2 text-xs leading-6 text-slate-500">
                先去通讯录添加联系人，或者直接创建群聊。这里会始终保留消息列表入口。
              </p>
              <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  @click="openContacts"
                  class="rounded-none border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  打开通讯录
                </button>
                <button
                  type="button"
                  @click="createGroup"
                  class="rounded-none border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  创建群聊
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="isRootContactsPage" class="mobile-root-stack mx-auto flex w-full max-w-4xl flex-col gap-2 pb-4">
            <!-- 搜索 -->
            <div class="px-1">
              <input
                v-model="contactQuery"
                class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                placeholder="搜索联系人"
                inputmode="search"
              />
            </div>

            <!-- 快捷入口 -->
            <div class="mobile-root-card rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
              <button type="button" @click="requestContacts" class="flex w-full items-center gap-3 px-4 py-3 active:bg-slate-50">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
                  <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                </div>
                <p class="text-sm text-slate-800">新的朋友</p>
                <span v-if="contactRequestCards.length" class="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">{{ contactRequestCards.length }}</span>
              </button>
              <div class="border-t border-slate-100"></div>
              <button type="button" @click="openAddFriendDialog" class="flex w-full items-center gap-3 px-4 py-3 active:bg-slate-50">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500 text-white">
                  <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                </div>
                <p class="text-sm text-slate-800">添加好友</p>
              </button>
              <div class="border-t border-slate-100"></div>
              <button type="button" @click="createGroup" class="flex w-full items-center gap-3 px-4 py-3 active:bg-slate-50">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500 text-white">
                  <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <p class="text-sm text-slate-800">新建群聊</p>
              </button>
            </div>

            <!-- 待处理 -->
            <div v-if="contactRequestCards.length" class="mobile-root-card rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
              <div class="divide-y divide-slate-100">
                <div
                  v-for="req in contactRequestCards"
                  :key="`root-contact-req-${req.requestId}`"
                  class="flex items-center gap-3 px-4 py-2.5"
                >
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                    {{ req.uidShort?.slice(0,2) || '?' }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm text-slate-800">用户 {{ req.uidShort }}</p>
                    <p class="text-[11px] text-slate-400">{{ req.os }} · {{ req.location }}</p>
                  </div>
                  <div class="flex shrink-0 gap-1.5">
                    <button type="button" @click="acceptContactRequest(req)" class="rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white">同意</button>
                    <button type="button" @click="declineContactRequest(req)" class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">拒绝</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 联系人 -->
            <div v-if="filteredContactCards.length" class="mobile-root-card rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
              <div class="border-b border-slate-100 px-4 py-2">
                <p class="text-[11px] font-medium text-slate-400">联系人 · {{ filteredContactCards.length }}</p>
              </div>
              <div class="divide-y divide-slate-100">
                <div
                  v-for="contact in filteredContactCards"
                  :key="`root-contact-${contact.contactFingerprint}`"
                  class="flex items-center gap-3 px-4 py-2.5"
                >
                  <div class="avatar h-9 w-9 shrink-0 rounded-full text-[11px] font-semibold text-white" :style="{ background: avatarColor(contact.contactFingerprint || contact.displayName) }">
                    {{ avatarInitial(contact.displayName || 'U') }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm text-slate-800">{{ contact.displayName }}</p>
                    <p class="truncate text-[11px] text-slate-400">{{ contact.os ? `${contact.os} · ${contact.location}` : '' }}</p>
                  </div>
                  <button
                    type="button"
                    @click="startContactChat(contact)"
                    class="shrink-0 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white"
                  >私聊</button>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="isRootSettingsPage" class="mobile-root-stack mx-auto flex w-full max-w-3xl flex-col gap-3 pb-4">
            <!-- 昵称 -->
            <div class="mobile-root-card rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div class="px-4 py-3">
                <div class="flex items-center justify-between gap-3">
                  <p class="text-sm text-slate-800">昵称</p>
                  <div class="flex items-center gap-2">
                    <input
                      v-model="nicknameInput"
                      maxlength="24"
                      class="w-32 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-800 text-right outline-none placeholder:text-slate-400"
                      placeholder="未设置"
                    />
                    <button type="button" @click="submitNickname" :disabled="nicknameSaving" class="text-xs font-medium text-sky-600 disabled:opacity-60">
                      {{ nicknameSaving ? '…' : '保存' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 身份与安全 -->
            <div class="mobile-root-card rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div class="border-b border-slate-100 px-4 py-2.5">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">身份与安全</p>
              </div>
              <div class="divide-y divide-slate-100">
                <div class="flex items-center justify-between px-4 py-3">
                  <div>
                    <p class="text-sm text-slate-800">助记词语言</p>
                  </div>
                  <div class="flex items-center rounded-lg bg-slate-100 p-0.5">
                    <button
                      type="button"
                      @click="identityMnemonicLanguage = 'zh'"
                      class="rounded-md px-2.5 py-1 text-xs font-medium transition"
                      :class="identityMnemonicLanguage === 'zh' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'"
                    >
                      中文
                    </button>
                    <button
                      type="button"
                      @click="identityMnemonicLanguage = 'en'"
                      class="rounded-md px-2.5 py-1 text-xs font-medium transition"
                      :class="identityMnemonicLanguage === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'"
                    >
                      EN
                    </button>
                  </div>
                </div>
                <button type="button" @click="exportCurrentIdentityCredential" class="flex w-full items-center justify-between px-4 py-3 active:bg-slate-50">
                  <p class="text-sm text-slate-800">查看助记词</p>
                  <svg viewBox="0 0 24 24" class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                <button type="button" @click="triggerIdentityCredentialFilePicker" class="flex w-full items-center justify-between px-4 py-3 active:bg-slate-50">
                  <p class="text-sm text-slate-800">导入 TXT 凭证</p>
                  <svg viewBox="0 0 24 24" class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
              <input
                ref="identityCredentialFilePicker"
                type="file"
                accept=".txt,text/plain"
                class="hidden"
                @change="onPickIdentityCredentialFile"
              />
              <div class="border-t border-slate-100 px-4 py-3">
                <textarea
                  v-model="identityCredentialImport"
                  rows="3"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-400"
                  placeholder="粘贴助记词或 recovery_code 以恢复身份"
                ></textarea>
                <div class="mt-2 flex justify-end">
                  <button type="button" @click="restoreIdentityCredential" class="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white">恢复身份</button>
                </div>
              </div>
            </div>

            <!-- 通用设置 -->
            <div class="mobile-root-card rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div class="border-b border-slate-100 px-4 py-2.5">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">通用</p>
              </div>
              <div class="divide-y divide-slate-100">
                <div class="flex items-center justify-between px-4 py-3">
                  <p class="text-sm text-slate-800">界面大小</p>
                  <div class="flex items-center rounded-lg bg-slate-100 p-0.5">
                    <button
                      v-for="item in sizeSettingOptions"
                      :key="`root-scale-${item.value}`"
                      type="button"
                      @click="setUiScaleLevel(item.value)"
                      class="rounded-md px-2 py-1 text-xs font-medium transition"
                      :class="uiScale === item.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'"
                    >
                      {{ item.label }}
                    </button>
                  </div>
                </div>
                <div class="flex items-center justify-between px-4 py-3">
                  <div>
                    <p class="text-sm text-slate-800">系统通知</p>
                    <p class="text-[11px] text-slate-400">需浏览器授权</p>
                  </div>
                  <button type="button" @click="toggleSystemNotify" class="relative inline-flex h-6 w-10 items-center rounded-full transition-colors" :class="systemNotifyEnabled ? 'bg-emerald-500' : 'bg-slate-200'">
                    <span class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform" :class="systemNotifyEnabled ? 'translate-x-5' : 'translate-x-1'"></span>
                  </button>
                </div>
                <div class="flex items-center justify-between px-4 py-3">
                  <p class="text-sm text-slate-800">提示音</p>
                  <button type="button" @click="toggleSound" class="relative inline-flex h-6 w-10 items-center rounded-full transition-colors" :class="soundEnabled ? 'bg-sky-500' : 'bg-slate-200'">
                    <span class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform" :class="soundEnabled ? 'translate-x-5' : 'translate-x-1'"></span>
                  </button>
                </div>
                <div class="flex items-center justify-between px-4 py-3">
                  <div>
                    <p class="text-sm text-slate-800">陌生人私聊</p>
                    <p class="text-[11px] text-slate-400">{{ dmContactsOnly ? '仅通讯录可私聊' : '允许陌生人请求' }}</p>
                  </div>
                  <button type="button" @click="toggleDmPreference" :disabled="dmPreferenceSaving" class="relative inline-flex h-6 w-10 items-center rounded-full transition-colors disabled:opacity-60" :class="!dmContactsOnly ? 'bg-emerald-500' : 'bg-slate-200'">
                    <span class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform" :class="!dmContactsOnly ? 'translate-x-5' : 'translate-x-1'"></span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 版本 -->
            <div class="mobile-root-card rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div class="flex items-center justify-between px-4 py-3">
                <p class="text-sm text-slate-800">版本</p>
                <button
                  type="button"
                  @click="handleVersionTap"
                  class="text-xs text-slate-400"
                >
                  v{{ APP_VERSION }}
                </button>
              </div>
              <div v-if="debugModeEnabled" class="border-t border-slate-100 px-4 py-2.5">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-sky-600">Debug Panel</p>
                <div class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600">
                  <p>设备类型</p><p class="text-right font-mono">{{ debugDeviceKindLabel }}</p>
                  <p>连接状态</p><p class="text-right font-mono">{{ debugInfo.connectionState }}</p>
                  <p>WebSocket</p><p class="text-right font-mono">{{ debugInfo.wsState }}</p>
                  <p>PoW 验证</p><p class="text-right font-mono">{{ debugInfo.powStatus }}</p>
                  <p>RSA 加密</p><p class="text-right font-mono">{{ debugInfo.encStatus }}</p>
                  <p>ECDSA 签名</p><p class="text-right font-mono">{{ debugInfo.ecdsaStatus }}</p>
                  <p>ECDH 密钥</p><p class="text-right font-mono">{{ debugInfo.ecdhStatus }}</p>
                  <p>消息数</p><p class="text-right font-mono">{{ debugInfo.msgCount }}</p>
                  <p>群组数</p><p class="text-right font-mono">{{ debugInfo.groupCount }}</p>
                  <p>联系人</p><p class="text-right font-mono">{{ debugInfo.contactCount }}</p>
                  <p>DM 会话</p><p class="text-right font-mono">{{ debugInfo.dmSessionCount }}</p>
                  <p>待发队列</p><p class="text-right font-mono">{{ debugInfo.outboxCount }}</p>
                  <p>可信密钥</p><p class="text-right font-mono">{{ debugInfo.trustedKeyCount }}</p>
                  <p>未读总数</p><p class="text-right font-mono">{{ debugInfo.unreadTotal }}</p>
                  <p>JS 堆内存</p><p class="text-right font-mono">{{ debugInfo.memoryInfo }}</p>
                  <p>设备指纹</p><p class="text-right font-mono">{{ debugInfo.deviceFingerprint }}</p>
                  <p>构建时间</p><p class="text-right font-mono">{{ debugInfo.buildTime }}</p>
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

          <div v-else class="mx-auto flex w-full max-w-4xl flex-col">
            <article
              v-for="msg in displayMessages"
              :key="`${msg.msgId}-${msg.sender}-${msg.groupId || 'system'}`"
              class="flex message-item"
              :data-msg-id="msg.msgId"
              :class="
                msg.payloadType === 'dm_limit_tip' || msg.payloadType === 'send_block_tip'
                  ? `justify-center ${messageSpacingClass(msg)}`
                  : msg.payloadType === 'system'
                    ? `justify-center ${messageSpacingClass(msg)}`
                    : msg.isSystem || msg.sender !== myUid
                      ? `justify-start ${messageSpacingClass(msg)}`
                      : `justify-end ${messageSpacingClass(msg)}`
              "
            >
              <div v-if="msg.payloadType === 'dm_limit_tip'" class="w-full max-w-xl px-2">
                <div class="mx-auto rounded-xl border border-amber-200/90 bg-amber-50/90 px-3 py-1.5 text-center shadow-sm">
                  <p class="text-[11px] font-medium text-amber-700">{{ msg.tipText }}</p>
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
              <div v-else-if="msg.payloadType === 'send_block_tip'" class="w-full max-w-xl px-2">
                <div class="mx-auto rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-center shadow-sm">
                  <p class="text-[11px] font-medium text-slate-700">{{ msg.tipTitle || '发送未完成' }}</p>
                  <p class="text-[11px] text-slate-500">{{ msg.tipText }}</p>
                  <div v-if="Array.isArray(msg.tipActions) && msg.tipActions.length" class="mt-2 flex flex-wrap justify-center gap-2">
                    <button
                      v-for="(item, idx) in msg.tipActions"
                      :key="`tip-action-${msg.msgId}-${idx}`"
                      type="button"
                      @click="handleSystemAction(msg, item)"
                      class="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white"
                    >
                      {{ item.label || item.action || '处理' }}
                    </button>
                  </div>
                </div>
              </div>
              <div v-else-if="msg.payloadType === 'system'" class="w-full max-w-[min(100%,36rem)] px-1.5 sm:px-4">
                <div class="rounded-xl border px-3 py-2.5 shadow-sm" :class="systemCardSurfaceClass(msg)">
                  <div class="flex items-start justify-between gap-2">
                    <p class="min-w-0 flex-1 text-xs leading-5 text-slate-700">{{ msg.systemText || msg.systemTitle || '' }}</p>
                    <p class="shrink-0 text-[10px] text-slate-400 mt-0.5">{{ formatTime(msg.ts) }}</p>
                  </div>
                  <div v-if="systemCardActions(msg).length" class="mt-2 flex items-center gap-2">
                    <button
                      v-for="(item, idx) in systemCardActions(msg)"
                      :key="`sys-action-${msg.msgId}-${idx}`"
                      type="button"
                      @click.stop="handleSystemAction(msg, item)"
                      class="rounded-lg px-3 py-1.5 text-xs font-medium transition"
                      :class="item.label === '同意' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : item.label === '拒绝' ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50' : idx === 0 ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700'"
                    >
                      {{ item.label || item.action || '处理' }}
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="max-w-[94%] sm:max-w-[78%] flex items-end gap-2">
                <div v-if="msg.sender !== myUid" class="shrink-0">
                  <div
                    v-if="msg.showAvatar"
                    class="avatar h-8 w-8 rounded-full text-[11px] font-semibold text-white"
                    :style="{ background: avatarColor(msg.sender) }"
                  >
                    {{ avatarInitial(displayNameForUid(msg.sender) || msg.sender) }}
                  </div>
                  <div v-else class="h-8 w-8"></div>
                </div>
                <div class="min-w-0">
                  <p
                    v-if="msg.sender !== myUid && msg.showSenderMeta"
                    class="mb-1 px-1 text-[11px] font-medium text-slate-500 break-all"
                  >
                    {{ displayNameForUid(msg.sender) }}
                  </p>
                  <div class="message-bubble shadow-sm ring-1" :class="messageBubbleClass(msg)">
                    <button
                      v-if="msg.replyTo"
                      type="button"
                      @click.stop="jumpToMessage(msg.replyTo.msgId)"
                      class="reply-preview mb-2 block w-full rounded-xl border px-3 py-2 text-left"
                      :class="msg.sender === myUid ? 'border-white/20 bg-white/10 text-white/90' : 'border-slate-200 bg-slate-50 text-slate-700'"
                    >
                      <p class="text-[11px] font-semibold">{{ replySenderLabel(msg.replyTo) }}</p>
                      <p class="mt-1 truncate text-[11px] opacity-90">{{ msg.replyTo.text }}</p>
                    </button>
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
                          v-if="msg.sender !== myUid && msg.pairStatus === 'pending'"
                          type="button"
                          @click="acceptPairInvite(msg)"
                          class="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          同意并进入
                        </button>
                        <button
                          v-if="msg.sender !== myUid && msg.pairStatus === 'pending'"
                          type="button"
                          @click="declinePairInvite(msg)"
                          class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
                        >
                          拒绝
                        </button>
                        <span v-else class="text-xs text-slate-500">
                          {{
                            msg.pairStatus === 'accepted'
                              ? (msg.sender === myUid ? '对方已同意' : '已同意')
                              : msg.pairStatus === 'declined'
                                ? (msg.sender === myUid ? '对方已拒绝' : '已拒绝')
                                : '等待对方同意'
                          }}
                        </span>
                      </div>
                    </div>
                    <div v-else-if="msg.payloadType === 'invite'" class="invite-card rounded-xl bg-white/80 p-3 text-sm text-slate-800">
                      <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">群邀请卡</p>
                      <p class="mt-1 text-sm font-semibold text-slate-800">
                        {{ msg.inviteGroupName || msg.inviteGroup || '未知群组' }}
                      </p>
                      <p class="mt-2 break-all text-xs leading-5 text-slate-500">{{ msg.inviteLink || buildShortInviteLink(msg.inviteCode) }}</p>
                      <div class="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          @click="joinFromInvite(msg.inviteLink || msg.inviteCode)"
                          class="rounded-full bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:text-white/80"
                        >
                          立即加入
                        </button>
                        <button
                          type="button"
                          @click="copyInviteFromMessage(msg.inviteCode, msg.inviteLink)"
                          class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          复制链接
                        </button>
                      </div>
                      <p v-if="msg.expiresAt" class="mt-2 text-[11px] text-slate-400">
                        有效期至 {{ formatDateTime(msg.expiresAt) }}
                      </p>
                    </div>
                    <div
                      v-else-if="msg.payloadType === 'audio' && msg.audioData"
                      class="voice-message-card rounded-2xl px-2.5 py-2"
                      :class="msg.sender === myUid ? 'bg-white/14 text-white' : 'bg-slate-50 text-slate-800'"
                    >
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          class="voice-play-button inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                          :class="msg.sender === myUid ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'"
                          @click="toggleAudioPlayback(msg)"
                          :aria-label="isAudioMessagePlaying(msg) ? 'Pause voice message' : 'Play voice message'"
                        >
                          <svg v-if="isAudioMessagePlaying(msg)" viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="currentColor">
                            <path d="M7 5h3v14H7zM14 5h3v14h-3z"/>
                          </svg>
                          <svg v-else viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="currentColor">
                            <path d="M8 6.5v11l9-5.5-9-5.5Z"/>
                          </svg>
                        </button>
                        <div class="min-w-0 flex-1">
                          <div class="voice-waveform flex h-8 items-end gap-[2px]">
                            <span
                              v-for="(bar, idx) in audioWaveformForMessage(msg)"
                              :key="`voice-wave-${msg.msgId}-${idx}`"
                              class="voice-waveform-bar"
                              :class="audioWaveformBarClass(msg, idx)"
                              :style="audioWaveformBarStyle(bar)"
                            ></span>
                          </div>
                          <div class="mt-1 flex items-center justify-between text-[10px]" :class="msg.sender === myUid ? 'text-white/75' : 'text-slate-500'">
                            <span>{{ isAudioMessagePlaying(msg) ? '播放中' : '语音' }}</span>
                            <span>{{ audioMessageTimeLabel(msg) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p v-else class="emoji-font whitespace-pre-wrap break-words text-[14px] leading-[1.45]">{{ msg.text }}</p>
                    <div
                      class="mt-1.5 flex items-center justify-end gap-1 text-[10px]"
                      :class="msg.sender === myUid ? 'text-sky-100/90' : 'text-slate-400'"
                    >
                      <button
                        v-if="canReplyToMessage(msg)"
                        type="button"
                        @click.stop="setReplyTarget(msg)"
                        class="rounded-full px-1.5 py-0.5 font-medium transition"
                        :class="msg.sender === myUid ? 'text-white/80 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'"
                      >
                        回复
                      </button>
                      <span
                        v-if="msg.sender === myUid && msg.clientStatus === 'sending'"
                        class="inline-flex h-3.5 w-3.5 items-center justify-center"
                        aria-hidden="true"
                      >
                        <svg viewBox="0 0 24 24" class="status-spinner h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 3a9 9 0 1 0 9 9"/>
                        </svg>
                      </span>
                      <button
                        v-if="msg.sender === myUid && msg.clientStatus === 'failed'"
                        type="button"
                        class="inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-rose-400 text-[9px] font-bold text-white transition hover:bg-rose-500"
                        :title="msg.clientError || '发送失败，点击重试'"
                        @click.stop="retryMessage(msg)"
                      >!</button>
                      <span
                        v-if="msg.burnAfterRead"
                        class="rounded-full border px-1.5 py-0.5"
                        :class="msg.sender === myUid ? 'border-white/25' : 'border-slate-200'"
                      >
                        {{ burnStatusLabel(msg) }}
                      </span>
                      <span>{{ formatTime(msg.ts) }}</span>
                      <button
                        v-if="msg.sender === myUid"
                        type="button"
                        class="cursor-pointer"
                        :class="msg.readBy && msg.readBy.length ? 'underline decoration-dotted' : ''"
                        @click="msg.readBy && msg.readBy.length ? openReadReceipts(msg) : null"
                      >
                        {{ outgoingStatusLabel(msg) }}
                      </button>
                    </div>
                  </div>
                </div>
                <div
                  v-if="msg.sender === myUid"
                  class="avatar h-8 w-8 shrink-0 rounded-full text-[11px] font-semibold text-white"
                  :style="{ background: avatarColor(myUid || myNickname || 'me') }"
                >
                  {{ avatarInitial(myNickname || '我') }}
                </div>
              </div>
            </article>
          </div>
        </section>

        <div v-if="readReceiptModal.open" class="fixed inset-0 z-[60]">
          <button
            type="button"
            @click="closeReadReceipts"
            class="absolute inset-0 bg-slate-900/40"
            aria-label="Close read receipts"
          ></button>
          <div class="viewport-modal-scroll">
            <div class="viewport-modal-panel rounded-2xl border border-slate-200 bg-white shadow-2xl" style="--dialog-max: 34rem;">
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
              <div class="viewport-modal-body px-4 py-3" style="--dialog-offset: 8rem;">
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
                      <p class="truncate text-sm font-semibold text-slate-800">{{ entry.displayName }}</p>
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
        </div>

        <div v-if="invitePickerOpen" class="fixed inset-0 z-[60]">
          <button
            type="button"
            @click="closeInvitePicker"
            class="absolute inset-0 bg-slate-900/40"
            aria-label="Close invite picker"
          ></button>
          <div class="viewport-modal-scroll">
            <div class="viewport-modal-panel rounded-2xl border border-slate-200 bg-white shadow-2xl" style="--dialog-max: 30rem;">
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
              <div class="viewport-modal-body px-4 py-3" style="--dialog-offset: 9rem;">
                <div class="grid gap-2">
                  <label
                    v-for="group in eligibleInviteGroups"
                    :key="`invite-${group.id}`"
                    class="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-slate-800">{{ groupDisplayName(group, group.name) }}</p>
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
        </div>

        <div v-if="inviteDialog.open" class="fixed inset-0 z-[61]">
          <button
            type="button"
            @click="closeInviteDialog"
            class="absolute inset-0 bg-slate-900/40"
            aria-label="Close invite dialog"
          ></button>
          <div class="viewport-modal-scroll">
            <div class="viewport-modal-panel rounded-2xl border border-slate-200 bg-white shadow-2xl" style="--dialog-max: 28rem;">
              <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p class="text-sm font-semibold text-slate-800">邀请新人加入「{{ groupMetaMap[inviteDialog.groupId]?.groupName || activeGroupName }}」</p>
                <button
                  type="button"
                  @click="closeInviteDialog"
                  class="text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  完成
                </button>
              </div>
              <div class="viewport-modal-body px-4 py-4" style="--dialog-offset: 6rem;">
                <div class="grid gap-3">
                  <!-- 无链接时：生成按钮 -->
                  <div v-if="!myActiveGroupInvite && !inviteDialog.generatedInviteCode" class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-center">
                    <p class="text-sm text-slate-600">点击生成你的专属邀请链接，分享给朋友即可加入</p>
                    <button
                      type="button"
                      @click="createInviteFromDialog"
                      class="mt-3 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      生成邀请链接
                    </button>
                  </div>

                  <!-- 刚生成的链接（对话框临时状态） -->
                  <div v-if="inviteDialog.generatedShortCode || inviteDialog.generatedInviteCode" class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                    <p class="text-xs font-semibold text-emerald-700">你的邀请链接</p>
                    <p class="mt-2 break-all text-sm text-slate-800 select-all">{{ inviteLinkForEntry({ inviteCode: inviteDialog.generatedInviteCode, shortCode: inviteDialog.generatedShortCode }) }}</p>
                    <div class="mt-3 flex justify-center rounded-xl bg-white p-3" v-html="inviteDialogQR"></div>
                    <div class="mt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        @click="copyInviteDialogLink()"
                        class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        复制链接
                      </button>
                      <button
                        type="button"
                        @click="saveGroupInviteCard(inviteLinkForEntry({ inviteCode: inviteDialog.generatedInviteCode, shortCode: inviteDialog.generatedShortCode }))"
                        class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        保存名片
                      </button>
                    </div>
                  </div>

                  <!-- 我的有效邀请链接 -->
                  <div v-if="myActiveGroupInvite" class="rounded-xl border border-slate-100 bg-white px-3 py-3">
                    <p class="text-xs font-semibold text-slate-500">我的邀请链接</p>
                    <div class="mt-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <div class="flex items-center justify-between gap-2">
                        <p class="text-xs font-medium text-emerald-600">{{ inviteStatusLabel(myActiveGroupInvite) }}</p>
                        <p class="text-[11px] text-slate-400">已用 {{ inviteUsageLabel(myActiveGroupInvite) }}</p>
                      </div>
                      <p class="mt-1.5 break-all text-xs leading-5 text-slate-600 select-all">{{ formatInviteLinkDisplay(inviteLinkForEntry(myActiveGroupInvite)) }}</p>
                      <div class="mt-3 flex justify-center rounded-lg bg-white p-2" v-html="activeInviteQR"></div>
                      <div class="mt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          @click="copyInviteDialogLink(myActiveGroupInvite)"
                          class="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                        >
                          复制
                        </button>
                        <button
                          type="button"
                          @click="saveGroupInviteCard(inviteLinkForEntry(myActiveGroupInvite))"
                          class="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                        >
                          保存名片
                        </button>
                        <button
                          type="button"
                          @click="revokeOwnGroupInvite"
                          class="rounded-full border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50"
                        >
                          撤销链接
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- 群主：其他成员的邀请状态 -->
                  <div v-if="otherMembersGroupInvites.length" class="rounded-xl border border-slate-100 bg-white px-3 py-3">
                    <p class="text-xs font-semibold text-slate-500">成员邀请链接</p>
                    <div class="mt-2 grid gap-2">
                      <div
                        v-for="entry in otherMembersGroupInvites"
                        :key="`other-invite-${entry.inviteId}`"
                        class="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
                      >
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-xs font-medium text-slate-700">{{ entry.creatorNickname || '未知用户' }}</p>
                          <p class="mt-0.5 text-[11px]" :class="inviteStatusLabel(entry) === '生效中' ? 'text-emerald-600' : 'text-slate-400'">{{ inviteStatusLabel(entry) }} · 已用 {{ inviteUsageLabel(entry) }}</p>
                        </div>
                        <button
                          type="button"
                          @click="revokeGroupInvite(entry.inviteId)"
                          class="shrink-0 rounded-full border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50"
                        >
                          撤销
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- 高级设置（仅群主可见，折叠） -->
                  <details v-if="isActiveGroupOwner" class="group">
                    <summary class="cursor-pointer select-none rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-500 hover:bg-slate-100">
                      高级设置
                    </summary>
                    <div class="mt-2 grid gap-2 rounded-xl border border-slate-100 bg-white px-3 py-3">
                      <div class="flex items-center justify-between gap-3">
                        <div class="min-w-0">
                          <p class="text-sm font-semibold text-slate-800">加入前是否需要审批</p>
                          <p class="mt-0.5 text-[11px] text-slate-500">关闭后，通过链接可直接加入</p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          :aria-checked="activeGroupInviteApprovalRequired ? 'true' : 'false'"
                          @click="setLocalActiveGroupInviteApprovalRequired(!activeGroupInviteApprovalRequired)"
                          class="relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors"
                          :class="activeGroupInviteApprovalRequired ? 'bg-emerald-500' : 'bg-slate-200'"
                        >
                          <span
                            class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
                            :class="activeGroupInviteApprovalRequired ? 'translate-x-5' : 'translate-x-1'"
                          ></span>
                        </button>
                      </div>
                      <div class="flex justify-end">
                        <button
                          type="button"
                          @click="saveInviteApprovalPolicy"
                          class="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="createGroupModal.open" class="fixed inset-0 z-[60]">
          <button
            type="button"
            @click="closeCreateGroupModal"
            class="absolute inset-0 bg-slate-900/40"
            aria-label="Close create group modal"
          ></button>
          <div class="viewport-modal-scroll">
            <div class="viewport-modal-panel rounded-2xl border border-slate-200 bg-white shadow-2xl" style="--dialog-max: 24rem;">
              <div class="border-b border-slate-100 px-4 py-3">
                <p class="text-sm font-semibold text-slate-800">新建群聊</p>
              </div>
              <div class="px-4 py-4">
                <input
                  ref="createGroupInputRef"
                  v-model="createGroupModal.name"
                  maxlength="40"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  placeholder="输入群名称"
                />
                <div class="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    @click="closeCreateGroupModal"
                    class="rounded-full px-4 py-1.5 text-xs font-medium text-slate-500"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    @click="submitCreateGroup"
                    :disabled="!createGroupModal.name.trim()"
                    class="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    创建
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="nicknameGuideOpen" class="fixed inset-0 z-[60]">
          <button
            type="button"
            @click="closeNicknameGuide"
            class="absolute inset-0 bg-slate-900/40"
            aria-label="Close nickname guide"
          ></button>
          <div class="viewport-modal-scroll">
            <div class="viewport-modal-panel rounded-2xl border border-slate-200 bg-white shadow-2xl" style="--dialog-max: 32rem;">
              <div class="border-b border-slate-100 px-4 py-4">
                <p class="text-xs uppercase tracking-wide text-slate-400">首次设置</p>
                <p class="mt-1 text-base font-semibold text-slate-800">先确认一下你的昵称</p>
                <p class="mt-2 text-sm leading-6 text-slate-500">
                  系统已经为这台设备分配了一个默认昵称。你可以直接使用，也可以先改成更顺手的名字。
                </p>
              </div>
              <div class="viewport-modal-body px-4 py-4" style="--dialog-offset: 8rem;">
                <div class="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                  <p class="text-sm font-semibold text-slate-800">当前设备昵称</p>
                  <input
                    v-model="nicknameInput"
                    maxlength="24"
                    class="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    placeholder="请输入昵称（1-24 字）"
                  />
                  <p class="mt-2 text-xs text-slate-500">昵称全局唯一，后续也可以在设置里继续修改。</p>
                </div>
                <div class="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    @click="closeNicknameGuide"
                    class="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    先这样进入
                  </button>
                  <button
                    type="button"
                    @click="submitNicknameGuide"
                    :disabled="nicknameSaving"
                    class="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {{ nicknameGuideSubmitLabel }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="identityCredentialModal.open" class="fixed inset-0 z-[65]">
          <button
            type="button"
            @click="closeIdentityCredentialModal"
            class="absolute inset-0 bg-slate-900/40"
            aria-label="Close identity credential"
          ></button>
          <div class="viewport-modal-scroll">
            <div class="viewport-modal-panel rounded-2xl border border-slate-200 bg-white shadow-2xl" style="--dialog-max: 34rem;">
              <div class="border-b border-slate-100 px-4 py-4">
                <p class="text-xs uppercase tracking-wide text-slate-400">身份凭证</p>
                <p class="mt-1 text-base font-semibold text-slate-800">
                  {{ identityCredentialModal.firstBind ? '首次绑定成功，请先保存凭证' : '当前身份凭证' }}
                </p>
                <p class="mt-2 text-sm leading-6 text-slate-500">
                  这是恢复当前身份的唯一凭证。换浏览器或恢复身份时，需要导入这份 TXT 或 recovery_code。
                </p>
              </div>
              <div class="viewport-modal-body px-4 py-4" style="--dialog-offset: 8rem;">
                <div class="mb-3 flex items-center gap-2">
                  <button
                    type="button"
                    @click="identityCredentialModal.language = 'zh'; identityMnemonicLanguage = 'zh'"
                    class="rounded-full px-3 py-1.5 text-xs font-semibold"
                    :class="identityCredentialModal.language === 'zh' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'"
                  >
                    中文助记词
                  </button>
                  <button
                    type="button"
                    @click="identityCredentialModal.language = 'en'; identityMnemonicLanguage = 'en'"
                    class="rounded-full px-3 py-1.5 text-xs font-semibold"
                    :class="identityCredentialModal.language === 'en' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'"
                  >
                    English Mnemonic
                  </button>
                </div>
                <div class="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {{ identityCredentialModal.language === 'en' ? 'Natural Language Mnemonic' : '自然语言助记词' }}
                  </p>
                  <p class="mt-2 break-words text-sm leading-7 text-slate-800">
                    {{ activeIdentityMnemonic }}
                  </p>
                  <p class="mt-2 text-[11px] text-slate-500">
                    当前指纹：{{ formatIdentityDisplay(identityCredentialModal.fingerprint || '生成中...', 'credential-fingerprint', 12, 10) }}
                  </p>
                  <p class="mt-2 text-[11px] font-semibold text-rose-600">请务必妥善保管好助记词和 TXT 文件，泄露后他人可恢复你的身份。</p>
                </div>
                <div class="mt-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">TXT 内容预览</p>
                  <pre class="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-white px-3 py-3 text-[11px] leading-5 text-slate-700">{{ activeIdentityCredentialFileText }}</pre>
                </div>
                <div class="mt-4 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    @click="downloadIdentityCredential"
                    class="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white"
                  >
                    下载 TXT
                  </button>
                  <button
                    type="button"
                    @click="closeIdentityCredentialModal"
                    class="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    我已保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="groupManageOpen" class="fixed inset-0 z-[60]">
          <button
            type="button"
            @click="groupManageOpen = false"
            class="absolute inset-0 bg-slate-900/40"
            aria-label="Close group manage modal"
          ></button>
          <div class="viewport-modal-scroll">
            <div class="viewport-modal-panel rounded-2xl border border-slate-200 bg-white shadow-2xl" style="--dialog-max: 30rem;">
            <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p class="text-sm font-semibold text-slate-800">群设置</p>
              <button
                type="button"
                @click="groupManageOpen = false"
                class="text-xs font-medium text-slate-500"
              >
                完成
              </button>
            </div>
            <div class="viewport-modal-body" style="--dialog-offset: 6rem;">

              <!-- 群名称 -->
              <div class="divide-y divide-slate-100">
                <div class="flex items-center justify-between px-4 py-3">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <p class="text-sm text-slate-800">群名称</p>
                      <span
                        class="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                        :class="isActiveGroupOwner ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
                      >
                        {{ isActiveGroupOwner ? '群主' : '成员' }}
                      </span>
                    </div>
                    <p class="mt-0.5 text-[11px] text-slate-400 truncate">{{ activeGroup }}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <input
                      v-model="groupRenameInput"
                      maxlength="40"
                      :disabled="!isActiveGroupOwner"
                      class="w-28 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-700 text-right outline-none disabled:opacity-60"
                      :placeholder="activeGroupName || '群名称'"
                    />
                    <button
                      type="button"
                      :disabled="!isActiveGroupOwner"
                      @click="renameActiveGroup"
                      class="text-xs font-medium text-sky-600 disabled:opacity-50"
                    >保存</button>
                  </div>
                </div>
                <div class="flex items-center justify-between px-4 py-3">
                  <p class="text-sm text-slate-800">群置顶</p>
                  <button
                    type="button"
                    @click="toggleActiveGroupPinned"
                    class="relative inline-flex h-6 w-10 items-center rounded-full transition-colors"
                    :class="activeGroupPinned ? 'bg-amber-500' : 'bg-slate-200'"
                  >
                    <span class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform" :class="activeGroupPinned ? 'translate-x-5' : 'translate-x-1'"></span>
                  </button>
                </div>
              </div>

              <!-- 群公告 -->
              <div class="mt-3 border-y border-slate-100">
                <div class="border-b border-slate-100 px-4 py-2 bg-slate-50">
                  <div class="flex items-center justify-between">
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">群公告</p>
                    <span class="text-[10px] text-slate-400">{{ groupAnnouncementInput.length }}/{{ GROUP_ANNOUNCEMENT_MAX }}</span>
                  </div>
                </div>
                <div class="px-4 py-3">
                  <textarea
                    v-model="groupAnnouncementInput"
                    rows="3"
                    :maxlength="GROUP_ANNOUNCEMENT_MAX"
                    :disabled="!isActiveGroupOwner"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none disabled:opacity-60"
                    placeholder="群公告会展示在群聊顶部"
                  ></textarea>
                  <div class="mt-2 flex justify-end">
                    <button
                      type="button"
                      :disabled="!isActiveGroupOwner"
                      @click="saveGroupAnnouncement"
                      class="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >保存公告</button>
                  </div>
                </div>
              </div>

              <!-- 邀请与链接 -->
              <div class="mt-3 border-y border-slate-100">
                <div class="divide-y divide-slate-100">
                  <button
                    type="button"
                    @click="openInviteDialog(activeGroup)"
                    class="flex w-full items-center justify-between px-4 py-3 active:bg-slate-50"
                  >
                    <p class="text-sm text-slate-800">邀请新人</p>
                    <svg viewBox="0 0 24 24" class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>
              </div>

              <!-- 群成员 -->
              <div class="mt-3 border-y border-slate-100">
                <div class="flex items-center justify-between border-b border-slate-100 px-4 py-2 bg-slate-50">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">群成员 · {{ groupMembers.length }}</p>
                  <button
                    type="button"
                    @click="requestGroupMembers"
                    class="text-[11px] font-medium text-sky-600"
                  >刷新</button>
                </div>
                <div v-if="groupMembersLoading" class="px-4 py-4 text-xs text-slate-500">加载中…</div>
                <div v-else-if="!groupMembers.length" class="px-4 py-4 text-xs text-slate-500">暂无成员</div>
                <div v-else class="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  <div
                    v-for="member in groupMembers"
                    :key="`gm-${member.uid}`"
                    class="flex w-full min-w-0 items-center gap-2 px-4 py-2.5"
                  >
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-1.5">
                        <p class="truncate text-sm text-slate-800">{{ member.nickname || `用户 ${member.uidShort}` }}</p>
                        <span v-if="member.isOwner" class="rounded px-1 py-0.5 text-[9px] font-semibold bg-emerald-100 text-emerald-700">群主</span>
                      </div>
                      <p class="truncate text-[11px] text-slate-400">{{ member.os || '未知' }} · {{ member.location || '未知' }}</p>
                    </div>
                    <button
                      v-if="isActiveGroupOwner && !member.isOwner"
                      type="button"
                      @click="kickGroupMember(member.uid)"
                      class="shrink-0 text-[11px] font-medium text-rose-500"
                    >移出</button>
                  </div>
                </div>
              </div>

              <!-- 退出 -->
              <div class="mt-3 border-y border-slate-100">
                <button
                  type="button"
                  @click="leaveActiveGroup"
                  class="w-full px-4 py-3 text-sm text-center text-rose-500 font-medium active:bg-rose-50"
                >
                  退出群聊
                </button>
              </div>

            </div>
            </div>
          </div>
        </div>

        <div v-if="groupQuickMenu.open" class="fixed inset-0 z-[62]">
          <button
            type="button"
            @click="closeGroupQuickMenu"
            class="absolute inset-0 bg-slate-900/10"
            aria-label="Close group quick menu"
          ></button>
          <div
            v-if="groupQuickMenu.mobile"
            class="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-slate-200 bg-white pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-2xl"
          >
            <div class="flex justify-center py-2">
              <div class="h-1 w-8 rounded-full bg-slate-300"></div>
            </div>
            <p class="px-4 pb-2 truncate text-sm font-medium text-slate-500">{{ groupQuickMenuName }}</p>
            <div class="divide-y divide-slate-100 border-y border-slate-100">
              <button
                type="button"
                @click="toggleQuickMenuGroupPinned"
                class="w-full px-4 py-3 text-left text-sm text-slate-800 active:bg-slate-50"
              >
                {{ groupQuickMenuPinned ? '取消置顶' : '置顶' }}
              </button>
              <button
                v-if="groupQuickMenuCanLeave"
                type="button"
                @click="promptLeaveGroup(groupQuickMenu.groupId)"
                class="w-full px-4 py-3 text-left text-sm text-rose-500 active:bg-rose-50"
              >
                退出群聊
              </button>
            </div>
          </div>
          <div
            v-else
            class="absolute w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
            :style="{ left: `${groupQuickMenu.x}px`, top: `${groupQuickMenu.y}px` }"
          >
            <button
              type="button"
              @click="toggleQuickMenuGroupPinned"
              class="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              {{ groupQuickMenuPinned ? '取消置顶' : '置顶' }}
            </button>
            <button
              v-if="groupQuickMenuCanLeave"
              type="button"
              @click="promptLeaveGroup(groupQuickMenu.groupId)"
              class="mt-1 flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-50"
            >
              退出群聊
            </button>
          </div>
        </div>

        <div v-if="leaveGroupDialog.open" class="fixed inset-0 z-[63]">
          <button
            type="button"
            @click="closeLeaveGroupDialog"
            class="absolute inset-0 bg-slate-900/40"
            aria-label="Close leave group dialog"
          ></button>
          <div class="viewport-modal-scroll">
            <div class="viewport-modal-panel rounded-2xl border border-slate-200 bg-white shadow-2xl" style="--dialog-max: 24rem;">
              <div class="border-b border-slate-100 px-4 py-3">
                <p class="text-sm font-semibold text-slate-800">退出群聊</p>
                <p class="mt-1 text-xs text-slate-500">确认退出"{{ leaveGroupDialog.name || leaveGroupDialog.groupId }}"？</p>
              </div>
              <div class="px-4 py-4">
                <template v-if="leaveGroupDialogIsOwner">
                  <p class="text-sm leading-6 text-slate-600">你是群主，退出前需要选择群聊后续处理方式。</p>
                  <div class="mt-4 grid gap-2">
                    <button
                      type="button"
                      @click="leaveGroupDialog.ownerAction = 'inherit'"
                      class="rounded-2xl border px-3 py-3 text-left transition"
                      :class="leaveGroupDialog.ownerAction === 'inherit' ? 'border-sky-300 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-700'"
                    >
                      <p class="text-sm font-semibold">顺位继承</p>
                      <p class="mt-1 text-xs leading-5 text-slate-500">
                        {{
                          leaveGroupDialogSuccessorLabel
                            ? `将按入群顺序把群主转给 ${leaveGroupDialogSuccessorLabel}，然后你退出群聊。`
                            : '按入群顺序自动把群主转给下一位成员，然后你退出群聊。'
                        }}
                      </p>
                    </button>
                    <button
                      type="button"
                      @click="leaveGroupDialog.ownerAction = 'dissolve'"
                      class="rounded-2xl border px-3 py-3 text-left transition"
                      :class="leaveGroupDialog.ownerAction === 'dissolve' ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-700'"
                    >
                      <p class="text-sm font-semibold">解散群聊</p>
                      <p class="mt-1 text-xs leading-5 text-slate-500">移除全部成员并清空该群的成员关系和邀请链接。</p>
                    </button>
                  </div>
                  <p v-if="leaveGroupDialog.ownerAction === 'inherit' && !leaveGroupDialogCanInherit" class="mt-3 text-xs text-amber-600">
                    当前未发现其他成员，顺位继承可能无法执行。
                  </p>
                </template>
                <p v-else class="text-sm leading-6 text-slate-600">退出后当前会话会从列表移除，后续需要邀请链接才能重新加入。</p>
                <div class="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    @click="closeLeaveGroupDialog"
                    class="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    @click="confirmLeaveGroup"
                    class="rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-semibold text-rose-700"
                  >
                    {{ leaveGroupDialogIsOwner ? '确认处理并退出' : '确认退出' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="settingsOpen" class="fixed inset-0 z-[60]">
          <button
            type="button"
            @click="settingsOpen = false"
            class="absolute inset-0 bg-slate-900/40"
            aria-label="Close settings"
          ></button>
          <div class="viewport-modal-scroll">
            <div class="viewport-modal-panel rounded-2xl border border-slate-200 bg-white shadow-2xl" style="--dialog-max: 28rem;">
            <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p class="text-sm font-semibold text-slate-800">设置</p>
              <button
                type="button"
                @click="settingsOpen = false"
                class="text-xs font-medium text-slate-500"
              >
                完成
              </button>
            </div>
            <div class="viewport-modal-body" style="--dialog-offset: 6rem;">
              <input
                ref="identityCredentialFilePicker"
                type="file"
                accept=".txt,text/plain"
                class="hidden"
                @change="onPickIdentityCredentialFile"
              />

              <!-- 昵称 -->
              <div class="divide-y divide-slate-100">
                <div class="flex items-center justify-between px-4 py-3">
                  <p class="text-sm text-slate-800">昵称</p>
                  <div class="flex items-center gap-2">
                    <input
                      v-model="nicknameInput"
                      maxlength="24"
                      class="w-36 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-800 text-right outline-none placeholder:text-slate-400"
                      placeholder="未设置"
                    />
                    <button type="button" @click="submitNickname" :disabled="nicknameSaving" class="text-xs font-medium text-sky-600 disabled:opacity-60">
                      {{ nicknameSaving ? '…' : '保存' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- 身份与安全 -->
              <div class="mt-3 border-y border-slate-100">
                <div class="border-b border-slate-100 px-4 py-2 bg-slate-50">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">身份与安全</p>
                </div>
                <div class="divide-y divide-slate-100">
                  <button type="button" @click="exportCurrentIdentityCredential" class="flex w-full items-center justify-between px-4 py-3 active:bg-slate-50">
                    <p class="text-sm text-slate-800">导出身份凭证</p>
                    <svg viewBox="0 0 24 24" class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                  <button type="button" @click="triggerIdentityCredentialFilePicker" class="flex w-full items-center justify-between px-4 py-3 active:bg-slate-50">
                    <p class="text-sm text-slate-800">导入 TXT 凭证</p>
                    <svg viewBox="0 0 24 24" class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>
                <div class="px-4 py-3">
                  <textarea
                    v-model="identityCredentialImport"
                    rows="3"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-400"
                    placeholder="粘贴助记词或 recovery_code 以恢复身份"
                  ></textarea>
                  <div class="mt-2 flex justify-end">
                    <button type="button" @click="restoreIdentityCredential" class="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white">恢复身份</button>
                  </div>
                </div>
              </div>

              <!-- 通用 -->
              <div class="mt-3 border-y border-slate-100">
                <div class="border-b border-slate-100 px-4 py-2 bg-slate-50">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">通用</p>
                </div>
                <div class="divide-y divide-slate-100">
                  <div class="flex items-center justify-between px-4 py-3">
                    <div>
                      <p class="text-sm text-slate-800">系统通知</p>
                      <p class="text-[11px] text-slate-400">需浏览器授权</p>
                    </div>
                    <button type="button" @click="toggleSystemNotify" class="relative inline-flex h-6 w-10 items-center rounded-full transition-colors" :class="systemNotifyEnabled ? 'bg-emerald-500' : 'bg-slate-200'">
                      <span class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform" :class="systemNotifyEnabled ? 'translate-x-5' : 'translate-x-1'"></span>
                    </button>
                  </div>
                  <div class="flex items-center justify-between px-4 py-3">
                    <p class="text-sm text-slate-800">界面大小</p>
                    <div class="flex items-center rounded-lg bg-slate-100 p-0.5">
                      <button
                        v-for="item in sizeSettingOptions"
                        :key="`modal-scale-${item.value}`"
                        type="button"
                        @click="setUiScaleLevel(item.value)"
                        class="rounded-md px-2 py-1 text-xs font-medium transition"
                        :class="uiScale === item.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'"
                      >
                        {{ item.label }}
                      </button>
                    </div>
                  </div>
                  <div class="flex items-center justify-between px-4 py-3">
                    <p class="text-sm text-slate-800">提示音</p>
                    <button type="button" @click="toggleSound" class="relative inline-flex h-6 w-10 items-center rounded-full transition-colors" :class="soundEnabled ? 'bg-sky-500' : 'bg-slate-200'">
                      <span class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform" :class="soundEnabled ? 'translate-x-5' : 'translate-x-1'"></span>
                    </button>
                  </div>
                  <div class="flex items-center justify-between px-4 py-3">
                    <div>
                      <p class="text-sm text-slate-800">陌生人私聊</p>
                      <p class="text-[11px] text-slate-400">{{ dmContactsOnly ? '仅通讯录' : '允许请求' }}</p>
                    </div>
                    <button type="button" @click="toggleDmPreference" :disabled="dmPreferenceSaving" class="relative inline-flex h-6 w-10 items-center rounded-full transition-colors disabled:opacity-60" :class="!dmContactsOnly ? 'bg-emerald-500' : 'bg-slate-200'">
                      <span class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform" :class="!dmContactsOnly ? 'translate-x-5' : 'translate-x-1'"></span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- 我的设备 -->
              <div class="mt-3 border-y border-slate-100">
                <div class="border-b border-slate-100 px-4 py-2 bg-slate-50">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">我的设备</p>
                </div>
                <div class="divide-y divide-slate-100">
                  <div class="px-4 py-3">
                    <p class="text-sm text-slate-800">设备 ID</p>
                    <p class="mt-1 break-all font-mono text-xs text-slate-500">{{ myUid || '加载中...' }}</p>
                    <div class="mt-2 flex gap-2">
                      <button type="button" @click="copyMyDeviceId" class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-sky-300">
                        复制 ID
                      </button>
                      <button type="button" @click="showDeviceQR = !showDeviceQR" class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-sky-300">
                        {{ showDeviceQR ? '隐藏二维码' : '显示二维码' }}
                      </button>
                      <button type="button" @click="saveDeviceCard" class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-sky-300">
                        保存名片
                      </button>
                    </div>
                    <div v-if="showDeviceQR && myUid" class="mt-3 flex justify-center rounded-xl bg-white p-3" v-html="myDeviceQRSvg"></div>
                  </div>
                </div>
              </div>

              <!-- 版本 -->
              <div class="mt-3 border-y border-slate-100">
                <div class="flex items-center justify-between px-4 py-3">
                  <p class="text-sm text-slate-800">版本</p>
                  <button type="button" @click="handleVersionTap" class="text-xs text-slate-400">v{{ APP_VERSION }}</button>
                </div>
                <div v-if="debugModeEnabled" class="border-t border-slate-100 px-4 py-2.5 bg-slate-50">
                  <p class="text-[10px] font-semibold uppercase tracking-wide text-sky-600">Debug Panel</p>
                  <div class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600">
                    <p>设备类型</p><p class="text-right font-mono">{{ debugDeviceKindLabel }}</p>
                    <p>连接状态</p><p class="text-right font-mono">{{ debugInfo.connectionState }}</p>
                    <p>WebSocket</p><p class="text-right font-mono">{{ debugInfo.wsState }}</p>
                    <p>PoW 验证</p><p class="text-right font-mono">{{ debugInfo.powStatus }}</p>
                    <p>RSA 加密</p><p class="text-right font-mono">{{ debugInfo.encStatus }}</p>
                    <p>ECDSA 签名</p><p class="text-right font-mono">{{ debugInfo.ecdsaStatus }}</p>
                    <p>ECDH 密钥</p><p class="text-right font-mono">{{ debugInfo.ecdhStatus }}</p>
                    <p>消息数</p><p class="text-right font-mono">{{ debugInfo.msgCount }}</p>
                    <p>群组数</p><p class="text-right font-mono">{{ debugInfo.groupCount }}</p>
                    <p>联系人</p><p class="text-right font-mono">{{ debugInfo.contactCount }}</p>
                    <p>DM 会话</p><p class="text-right font-mono">{{ debugInfo.dmSessionCount }}</p>
                    <p>待发队列</p><p class="text-right font-mono">{{ debugInfo.outboxCount }}</p>
                    <p>可信密钥</p><p class="text-right font-mono">{{ debugInfo.trustedKeyCount }}</p>
                    <p>未读总数</p><p class="text-right font-mono">{{ debugInfo.unreadTotal }}</p>
                    <p>JS 堆内存</p><p class="text-right font-mono">{{ debugInfo.memoryInfo }}</p>
                    <p>设备指纹</p><p class="text-right font-mono">{{ debugInfo.deviceFingerprint }}</p>
                    <p>构建时间</p><p class="text-right font-mono">{{ debugInfo.buildTime }}</p>
                  </div>
                </div>
              </div>

            </div>
            </div>
          </div>
        </div>

        <!-- 添加好友弹窗 -->
        <div v-if="addFriendDialog.open" class="fixed inset-0 z-[65]">
          <button type="button" @click="addFriendDialog.open = false" class="absolute inset-0 bg-slate-900/40" aria-label="Close"></button>
          <div class="viewport-modal-scroll">
            <div class="viewport-modal-panel rounded-2xl border border-slate-200 bg-white shadow-2xl" style="--dialog-max: 24rem;">
              <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p class="text-sm font-semibold text-slate-800">添加好友</p>
                <button type="button" @click="addFriendDialog.open = false" class="text-xs font-medium text-slate-500">关闭</button>
              </div>
              <div class="px-4 py-4">
                <div class="flex gap-2 mb-4">
                  <button type="button" @click="addFriendDialog.mode = 'input'" class="rounded-full px-3 py-1 text-xs font-medium transition" :class="addFriendDialog.mode === 'input' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'">输入 ID</button>
                  <button type="button" @click="addFriendDialog.mode = 'qr'" class="rounded-full px-3 py-1 text-xs font-medium transition" :class="addFriendDialog.mode === 'qr' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'">扫码</button>
                </div>
                <div v-if="addFriendDialog.mode === 'input'">
                  <p class="text-xs text-slate-500 mb-2">输入对方的设备 ID 或粘贴分享字符串</p>
                  <input v-model="addFriendDialog.deviceIdInput" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400" placeholder="LC:xxxxxxxx 或设备 ID" />
                  <p v-if="addFriendDialog.error" class="mt-1 text-xs text-rose-500">{{ addFriendDialog.error }}</p>
                  <button type="button" @click="submitAddFriend" class="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">添加为好友</button>
                </div>
                <div v-else>
                  <p class="text-xs text-slate-500 mb-3">上传对方的设备二维码图片</p>
                  <input
                    ref="qrImagePicker"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="onPickQrImage"
                  />
                  <button type="button" @click="$refs.qrImagePicker?.click()" class="w-full rounded-xl border-2 border-dashed border-slate-300 py-8 text-sm text-slate-500 hover:border-sky-300 hover:text-sky-600">
                    📷 上传二维码图片
                  </button>
                  <p class="mt-2 text-[11px] text-slate-400 text-center">仅本地识别，不会上传图片到服务器</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Transition name="notice-panel">
          <div v-if="systemNoticeOpen" class="fixed inset-0 z-[70]">
            <button
              type="button"
              @click="closeSystemNoticePanel"
              class="system-notice-backdrop absolute inset-0"
              :class="systemNoticeFullscreen ? 'bg-slate-900/40' : 'bg-slate-900/50'"
              aria-label="Close system notices"
            ></button>
            <div
              style="max-width: calc(100% - 20px);"
              class="system-notice-shell absolute flex flex-col overflow-hidden border border-slate-200/90 bg-white/100 shadow-[0_24px_56px_rgba(15,23,42,0.16)]"
              :class="
                mobileViewport
                  ? 'inset-y-2 left-0 w-[min(88vw,22rem)] rounded-r-[30px] rounded-l-none'
                  : systemNoticeFullscreen
                    ? 'inset-4 rounded-2xl'
                    : 'left-1/2 top-1/2 h-[min(82vh,44rem)] w-[min(92vw,42rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl'
              "
            >
              <div class="border-b border-slate-100 px-4 py-3">
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">系统通知</p>
                    <p class="truncate text-sm font-semibold text-slate-800">推荐操作会在这里集中展示</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      v-if="!mobileViewport"
                      type="button"
                      @click="systemNoticeFullscreen = !systemNoticeFullscreen"
                      class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {{ systemNoticeFullscreen ? '退出全屏' : '全屏' }}
                    </button>
                    <button
                      type="button"
                      @click="closeSystemNoticePanel"
                      class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      关闭
                    </button>
                  </div>
                </div>
                <div
                  class="mt-3 flex items-center justify-between gap-3 bg-slate-50/90"
                  :class="mobileViewport ? 'rounded-[18px] px-3 py-1.5' : 'rounded-[22px] px-3 py-2'"
                >
                  <p class="text-xs text-slate-500">
                    {{ systemNoticeMessages.length ? `最近 ${systemNoticeMessages.length} 条通知` : '暂无系统通知' }}
                  </p>
                  <button
                    v-if="getUnreadCount(SYSTEM_NOTICE_GROUP)"
                    type="button"
                    @click="clearUnread(SYSTEM_NOTICE_GROUP)"
                    class="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700"
                  >
                    标为已读
                  </button>
                </div>
              </div>
              <div class="system-notice-body flex-1 overflow-y-auto px-3 py-3">
                <div
                  v-if="!systemNoticeMessages.length"
                  class="border border-slate-200 bg-slate-50 text-center"
                  :class="mobileViewport ? 'rounded-[18px] px-3 py-5' : 'rounded-[24px] px-4 py-8'"
                >
                  <p class="text-sm font-semibold text-slate-700">目前没有系统通知</p>
                  <p class="mt-1 text-xs text-slate-500">群聊、设备迁移和安全提醒会出现在这里。</p>
                </div>
                <div v-else class="grid" :class="mobileViewport ? 'gap-2' : 'gap-3'">
                  <div
                    v-for="msg in systemNoticeMessages"
                    :key="`system-panel-${msg.msgId}`"
                    class="border text-left shadow-sm"
                    :class="[systemCardSurfaceClass(msg), mobileViewport ? 'rounded-[18px] px-3 py-3' : 'rounded-[26px] px-4 py-4']"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="flex items-center gap-2">
                        <span class="h-2.5 w-2.5 rounded-full" :class="systemCardDotClass(msg)"></span>
                        <p class="text-[11px] font-semibold uppercase tracking-[0.18em]" :class="systemCardEyebrowClass(msg)">
                          {{ systemCardEyebrow(msg) }}
                        </p>
                      </div>
                      <p class="shrink-0 text-[11px] text-slate-400">{{ formatDateTime(msg.ts) }}</p>
                    </div>
                    <div class="flex flex-col" :class="mobileViewport ? 'mt-2 gap-2' : 'mt-3 gap-3'">
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="text-sm font-semibold text-slate-900">{{ msg.systemTitle || '系统提醒' }}</p>
                          <p class="mt-1 text-xs leading-5 text-slate-600">{{ msg.systemText || '' }}</p>
                        </div>
                        <div
                          v-if="systemMessageTargetLabel(msg)"
                          class="shrink-0 bg-white/85 text-right"
                          :class="mobileViewport ? 'rounded-xl px-2.5 py-1.5' : 'rounded-2xl px-3 py-2'"
                        >
                          <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">目标</p>
                          <p class="mt-1 text-xs font-semibold text-slate-700">{{ systemMessageTargetLabel(msg) }}</p>
                        </div>
                      </div>
                      <div v-if="systemCardPreviewUsers(msg).length" class="flex items-center" :class="mobileViewport ? 'gap-2' : 'gap-3'">
                        <div class="flex -space-x-2">
                          <div
                            v-for="(user, idx) in systemCardPreviewUsers(msg)"
                            :key="`system-preview-${msg.msgId}-${user.uid || idx}`"
                            class="avatar rounded-full border-2 border-white text-[10px] font-semibold text-white"
                            :class="mobileViewport ? 'h-7 w-7' : 'h-9 w-9'"
                            :style="{ background: avatarColor(user.uid || user.nickname || user.uidShort || idx) }"
                          >
                            {{ avatarInitial(user.nickname || user.uidShort || 'U') }}
                          </div>
                        </div>
                        <p class="min-w-0 text-xs leading-5 text-slate-500" :class="mobileViewport ? 'clamp-1' : 'clamp-2'">{{ systemCardPreviewSummary(msg) }}</p>
                      </div>
                    </div>
                    <div
                      v-if="systemCardActions(msg).length"
                      class="bg-white/70"
                      :class="mobileViewport ? 'mt-3 rounded-[16px] p-1.5' : 'mt-4 rounded-[22px] p-2'"
                    >
                      <p class="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">可用操作</p>
                      <div class="mt-2 flex flex-wrap items-center" :class="mobileViewport ? 'gap-1.5' : 'gap-2'">
                        <button
                          v-for="(item, idx) in systemCardActions(msg)"
                          :key="`system-panel-action-${msg.msgId}-${idx}`"
                          type="button"
                          @click="handleSystemAction(msg, item)"
                          class="rounded-lg text-xs font-semibold transition"
                          :class="[mobileViewport ? 'px-3 py-1.5' : 'px-3.5 py-2', item.label === '同意' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : item.label === '拒绝' ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50' : idx === 0 ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700']"
                        >
                          {{ item.label || item.action || '处理' }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <Transition name="dialog-pop">
          <div v-if="explanationModal.open" class="fixed inset-0 z-[70]">
            <button
              type="button"
              @click="closeExplanationModal"
              class="dialog-backdrop absolute inset-0 bg-slate-900/40"
              aria-label="Close explanation"
            ></button>
            <div class="viewport-modal-scroll">
              <div class="dialog-shell relative w-full rounded-t-[30px] border border-slate-200/90 bg-white shadow-[0_24px_56px_rgba(15,23,42,0.16)] md:max-w-md md:rounded-2xl">
                <div class="viewport-modal-body px-5 py-5" style="--dialog-offset: 6rem;">
                 <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">原因说明</p>
                    <p class="mt-1 text-base font-semibold text-slate-900">{{ explanationModal.title }}</p>
                  </div>
                  <button
                    type="button"
                    @click="closeExplanationModal"
                    class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500"
                    aria-label="Close explanation"
                  >
                    <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M6 6l12 12M18 6 6 18"/>
                    </svg>
                  </button>
                </div>
                <p class="mt-4 text-sm leading-6 text-slate-600">{{ explanationModal.text }}</p>
                <div v-if="explanationModal.tip" class="mt-4 rounded-[20px] bg-slate-50 px-4 py-3">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">建议</p>
                  <p class="mt-1 text-sm leading-6 text-slate-600">{{ explanationModal.tip }}</p>
                </div>
                <div class="mt-5 flex justify-end">
                  <button
                    type="button"
                    @click="closeExplanationModal"
                    class="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    我知道了
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>
        </Transition>

        <div v-if="contactsOpen" class="fixed inset-0 z-[60]">
          <button
            type="button"
            @click="contactsOpen = false"
            class="absolute inset-0 bg-slate-900/40"
            aria-label="Close contacts"
          ></button>
          <div class="viewport-modal-scroll">
          <div class="viewport-modal-panel rounded-2xl border border-slate-200 bg-white shadow-2xl" style="--dialog-max: 38rem;">
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
            <div class="viewport-modal-body px-4 py-4" style="--dialog-offset: 7rem;">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-auto">
                  <div class="min-w-0 rounded-2xl bg-slate-50 px-3 py-2">
                    <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">联系人</p>
                    <p class="mt-1 text-sm font-semibold text-slate-800">{{ contactCards.length }}</p>
                  </div>
                  <div class="min-w-0 rounded-2xl bg-slate-50 px-3 py-2">
                    <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">待处理</p>
                    <p class="mt-1 text-sm font-semibold text-slate-800">{{ contactRequestCards.length }}</p>
                  </div>
                </div>
                <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 lg:w-[20rem]">
                  <input
                    v-model="contactQuery"
                    class="min-w-0 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    placeholder="搜索联系人、指纹、地区"
                  />
                  <button
                    type="button"
                    @click="requestContacts"
                    class="shrink-0 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    刷新
                  </button>
                  <button
                    type="button"
                    @click="contactsOpen = false; openAddFriendDialog()"
                    class="shrink-0 whitespace-nowrap rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                  >
                    添加好友
                  </button>
                </div>
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
                    class="flex flex-col gap-3 rounded-xl border border-amber-100 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
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
                    <div class="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        @click="acceptContactRequest(req)"
                        class="shrink-0 whitespace-nowrap rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-white"
                      >
                        同意
                      </button>
                      <button
                        type="button"
                        @click="declineContactRequest(req)"
                        class="shrink-0 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700"
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
              <div v-else-if="!filteredContactCards.length" class="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                {{ contactCards.length ? '没有匹配到联系人。' : '暂无联系人。' }}
              </div>
              <div v-else class="mt-3 grid gap-4">
                <div v-if="filteredContactCards.length" class="grid gap-2">
                  <div class="flex items-center justify-between px-1">
                    <p class="text-xs font-semibold text-slate-600">联系人</p>
                    <p class="text-[11px] text-slate-400">{{ filteredContactCards.length }} 位</p>
                  </div>
                  <div
                    v-for="contact in filteredContactCards"
                    :key="`contact-${contact.contactFingerprint}`"
                    class="flex flex-col gap-3 rounded-[22px] border border-slate-100 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div class="min-w-0 flex items-center gap-3">
                      <div
                        class="avatar h-10 w-10 rounded-full text-[12px] font-semibold text-white"
                        :style="{ background: avatarColor(contact.contactFingerprint || contact.displayName) }"
                      >
                        {{ avatarInitial(contact.displayName || contact.fingerprintShort || 'U') }}
                      </div>
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
                          {{ formatIdentityDisplay(contact.displayName, `contact-alias-${contact.contactFingerprint}`, 14, 10) }}
                        </p>
                        <p
                          class="cursor-pointer text-[11px] font-mono text-slate-500"
                          :class="
                            isIdentityExpanded(`contact-fp-${contact.contactFingerprint}`)
                              ? 'whitespace-normal break-all'
                              : 'truncate'
                          "
                          @click="toggleIdentityExpanded(`contact-fp-${contact.contactFingerprint}`)"
                        >
                          指纹：{{ formatIdentityDisplay(contact.contactFingerprint, `contact-fp-${contact.contactFingerprint}`, 10, 8) }}
                        </p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        @click="startContactChat(contact)"
                        class="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        私聊
                      </button>
                      <button
                        type="button"
                        @click="removeContact(contact)"
                        class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        移除
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-5 rounded-2xl border border-slate-100 bg-white px-3 py-3">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">设备迁移</p>
                <p class="mt-1 text-xs text-slate-500">
                  新旧设备同时打开。新设备生成迁移码，旧设备输入后授权。可迁移通讯录、群组成员，并可选择转让昵称。
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
                      <p v-if="migrationConfirm.transferNickname" class="mt-2 text-[11px] text-emerald-700">
                        将同步转让昵称{{ migrationConfirm.oldNickname ? `：${migrationConfirm.oldNickname}` : '' }}，旧设备会恢复默认身份显示。
                      </p>
                    </div>
                  </div>
                  <div class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                    <p class="text-xs font-semibold text-slate-700">旧设备</p>
                    <input
                      v-model="migrationInput"
                      class="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700"
                      placeholder="输入迁移码"
                    />
                    <label class="mt-2 flex items-center gap-2 text-[11px] text-slate-600">
                      <input v-model="transferNicknameOnMigration" type="checkbox" class="h-3.5 w-3.5" />
                      授权同时转让昵称（旧设备回默认）
                    </label>
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
        </div>

        <div v-if="verifyModal.open" class="fixed inset-0 z-[60]">
          <button
            type="button"
            @click="closeVerifyModal"
            class="absolute inset-0 bg-slate-900/40"
            aria-label="Close verify modal"
          ></button>
          <div class="viewport-modal-scroll">
            <div class="viewport-modal-panel rounded-2xl border border-slate-200 bg-white shadow-2xl" style="--dialog-max: 30rem;">
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
              <div class="viewport-modal-body px-4 py-4" style="--dialog-offset: 8rem;">
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
        </div>

        <div
          v-if="mobileViewport && activeGroup === SYSTEM_GROUP"
          class="mobile-bottom-tabs relative z-10 border-t border-slate-100 bg-white/95 px-2 py-1.5"
        >
          <div class="grid grid-cols-3 gap-0">
            <button
              type="button"
              @click="switchMobilePrimaryTab('messages')"
              class="mobile-bottom-tab flex flex-col items-center gap-0.5 rounded-lg py-1 text-[11px] font-medium transition"
              :class="mobilePrimaryTab === 'messages' ? 'text-slate-900' : 'text-slate-400'"
            >
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              消息
            </button>
            <button
              type="button"
              @click="switchMobilePrimaryTab('contacts')"
              class="mobile-bottom-tab flex flex-col items-center gap-0.5 rounded-lg py-1 text-[11px] font-medium transition"
              :class="mobilePrimaryTab === 'contacts' ? 'text-slate-900' : 'text-slate-400'"
            >
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              通讯录
            </button>
            <button
              type="button"
              @click="switchMobilePrimaryTab('settings')"
              class="mobile-bottom-tab flex flex-col items-center gap-0.5 rounded-lg py-1 text-[11px] font-medium transition"
              :class="mobilePrimaryTab === 'settings' ? 'text-slate-900' : 'text-slate-400'"
            >
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              设置
            </button>
          </div>
        </div>

        <footer
          v-if="activeGroup !== SYSTEM_GROUP && activeGroup !== SYSTEM_NOTICE_GROUP && activeGroup !== joinApprovalPendingGroup"
          class="mobile-footer-shell mobile-safe-footer relative z-10 border-t border-slate-100 bg-white/95 px-3 py-2.5 sm:px-3 md:px-6 md:py-3"
        >
          <div
            v-if="voiceComposerActive && mobileViewport"
            class="pointer-events-none absolute inset-x-3 bottom-full z-20 mb-3"
          >
            <div
              class="mobile-voice-panel voice-mobile-panel pointer-events-auto rounded-2xl border border-slate-200/90 bg-white px-4 py-4 shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
              :class="voiceComposerShellClass"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 min-w-0">
                  <span v-if="voiceComposeState === 'recording'" class="voice-recording-dot h-3 w-3 shrink-0 rounded-full bg-rose-500"></span>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-slate-900">{{ voiceComposerTitle }}</p>
                  </div>
                </div>
                <p class="shrink-0 text-base font-semibold tabular-nums text-slate-700">{{ voiceComposerElapsedLabel }}</p>
              </div>
              <div v-if="voiceComposeState === 'requesting'" class="voice-waiting mt-4 flex items-center justify-center gap-2">
                <span class="voice-waiting-dot"></span>
                <span class="voice-waiting-dot"></span>
                <span class="voice-waiting-dot"></span>
              </div>
              <div v-else class="mt-3 flex h-10 items-end justify-center gap-1">
                <span
                  v-for="(bar, idx) in voiceComposerWaveform"
                  :key="`mobile-composer-wave-${idx}`"
                  class="voice-waveform-bar voice-waveform-bar-live"
                  :style="audioWaveformBarStyle(bar)"
                ></span>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  class="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="voiceComposeState === 'encoding' || voiceComposeState === 'sending'"
                  @click="cancelVoiceRecording"
                >
                  取消
                </button>
                <button
                  type="button"
                  class="voice-recorder-action inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="voiceComposeState !== 'recording'"
                  @click="finishVoiceRecording"
                >
                  <span v-if="voiceComposeState === 'recording'" class="inline-flex items-center gap-2">
                    <span class="voice-recorder-dot h-2 w-2 rounded-full bg-white"></span>
                    发送
                  </span>
                  <span v-else-if="voiceComposeState === 'encoding'">整理中…</span>
                  <span v-else>发送中…</span>
                </button>
              </div>
            </div>
          </div>
          <div class="mx-auto flex w-full max-w-4xl flex-col gap-2">
            <input
              ref="imagePicker"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onPickImage"
            />
            <div
              v-if="replyDraft"
              class="flex items-start justify-between gap-3 rounded-[22px] border border-slate-200 bg-white px-3 py-2 shadow-sm"
            >
              <button type="button" @click="jumpToMessage(replyDraft.msgId)" class="min-w-0 flex-1 text-left">
                <p class="text-[11px] font-semibold text-slate-700">回复 {{ replySenderLabel(replyDraft) }}</p>
                <p class="mt-1 truncate text-xs text-slate-500">{{ replyDraft.text }}</p>
              </button>
              <button
                type="button"
                @click="clearReplyDraft"
                class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500"
                aria-label="Cancel reply"
              >
                <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 6l12 12M18 6 6 18"/>
                </svg>
              </button>
            </div>
            <div class="flex w-full items-end gap-2.5">
            <div class="relative">
              <button
                type="button"
                @click="toggleComposerMenu"
                :disabled="voiceComposerActive"
                class="inline-flex h-[46px] w-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                <button
                  type="button"
                  @click="burnAfterReadEnabled = !burnAfterReadEnabled"
                  class="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition"
                  :class="burnAfterReadEnabled ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'"
                >
                  阅后即焚
                  <span class="text-xs" :class="burnAfterReadEnabled ? 'text-white/70' : 'text-slate-400'">
                    {{ burnAfterReadEnabled ? burnAfterReadPreviewText : '关闭' }}
                  </span>
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
            <button
              v-if="mobileViewport"
              type="button"
              @click="burnAfterReadEnabled = !burnAfterReadEnabled"
              :disabled="voiceComposerActive"
              class="inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl border text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50"
              :class="burnAfterReadEnabled ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white'"
              aria-label="Toggle burn after read"
            >
              <!-- <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M12 3.75c2.4 2.33 3.92 4.46 3.92 7.05A3.92 3.92 0 1 1 8.08 10.8c0-1.1.32-2.14.9-3.08"/>
                <path d="M12 13.25a2.35 2.35 0 0 1 0 4.7 2.35 2.35 0 0 1 0-4.7Z"/>
              </svg> -->
              <svg  class="h-4 w-4" width="24" height="24" stroke-width="1.8" viewBox="0 0 48 48" fill="none" stroke="currentColor" >
                <path d="M24 44C32.2347 44 38.9998 37.4742 38.9998 29.0981C38.9998 27.0418 38.8953 24.8375 37.7555 21.4116C36.6157 17.9858 36.3861 17.5436 35.1809 15.4279C34.666 19.7454 31.911 21.5448 31.2111 22.0826C31.2111 21.5231 29.5445 15.3359 27.0176 11.6339C24.537 8 21.1634 5.61592 19.1853 4C19.1853 7.06977 18.3219 11.6339 17.0854 13.9594C15.8489 16.2849 15.6167 16.3696 14.0722 18.1002C12.5278 19.8308 11.8189 20.3653 10.5274 22.4651C9.23596 24.565 9 27.3618 9 29.4181C9 37.7942 15.7653 44 24 44Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
              </svg>
            </button>
            <div
              v-if="voiceComposerActive && mobileViewport"
              class="voice-mobile-bar flex min-h-[46px] flex-1 items-center gap-3 rounded-[24px] border border-slate-200/90 bg-white px-4 py-2 shadow-[0_14px_32px_rgba(15,23,42,0.08)]"
            >
              <span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V7.5a3.5 3.5 0 1 0-7 0V11a3.5 3.5 0 0 0 3.5 3.5Z"/>
                  <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0"/>
                  <path d="M12 17v3.5"/>
                </svg>
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-slate-900">{{ voiceComposerTitle }}</p>
                <p class="mt-0.5 truncate text-[11px] text-slate-500">{{ voiceComposerElapsedLabel }} · 上方完成发送</p>
              </div>
            </div>
            <div
              v-else-if="voiceComposerActive"
              class="voice-composer-shell relative flex min-h-[46px] flex-1 items-center gap-3 overflow-hidden rounded-[24px] border border-slate-200/90 bg-white px-3 py-2 shadow-[0_18px_48px_rgba(15,23,42,0.12)]"
              :class="voiceComposerShellClass"
            >
              <button
                type="button"
                class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="voiceComposeState === 'encoding' || voiceComposeState === 'sending'"
                @click="cancelVoiceRecording"
                aria-label="Cancel voice message"
              >
                <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 6l12 12M18 6 6 18"/>
                </svg>
              </button>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <p class="truncate text-sm font-semibold text-slate-900">{{ voiceComposerTitle }}</p>
                  <p class="shrink-0 text-sm font-semibold tabular-nums text-slate-700">{{ voiceComposerElapsedLabel }}</p>
                </div>
                <div v-if="voiceComposeState === 'requesting'" class="voice-waiting mt-1.5 flex items-center gap-1.5">
                  <span class="voice-waiting-dot"></span>
                  <span class="voice-waiting-dot"></span>
                  <span class="voice-waiting-dot"></span>
                </div>
                <div v-else class="mt-1.5 flex h-7 items-end gap-1">
                  <span
                    v-for="(bar, idx) in voiceComposerWaveform"
                    :key="`composer-wave-${idx}`"
                    class="voice-waveform-bar voice-waveform-bar-live"
                    :style="audioWaveformBarStyle(bar)"
                  ></span>
                </div>
              </div>
              <button
                type="button"
                class="voice-recorder-action inline-flex h-10 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
                :disabled="voiceComposeState !== 'recording'"
                @click="finishVoiceRecording"
              >
                <span v-if="voiceComposeState === 'recording'" class="inline-flex items-center gap-2">
                  <span class="voice-recorder-dot h-2.5 w-2.5 rounded-full bg-white"></span>
                  发送
                </span>
                <span v-else-if="voiceComposeState === 'encoding'">整理中…</span>
                <span v-else>发送中…</span>
              </button>
            </div>
            <template v-else>
              <textarea
                v-model="inputMsg"
                @keydown="onInputKeydown"
                ref="textInput"
                rows="1"
                class="emoji-font max-h-36 min-h-[46px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                :placeholder="composerPlaceholder"
              ></textarea>
              <button
                v-if="inputMsg.trim()"
                type="button"
                @click="handleSend"
                class="inline-flex h-[46px] min-w-[46px] items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <svg v-if="mobileViewport" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 12h13"/>
                  <path d="m12 5 7 7-7 7"/>
                </svg>
                <span v-else>发送</span>
              </button>
              <button
                v-else
                type="button"
                @click="startVoiceRecording"
                class="voice-start-button inline-flex h-[46px] min-w-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
                aria-label="Start voice recording"
              >
                <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V7.5a3.5 3.5 0 1 0-7 0V11a3.5 3.5 0 0 0 3.5 3.5Z"/>
                  <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0"/>
                  <path d="M12 17v3.5"/>
                </svg>
              </button>
            </template>
            </div>
          </div>
        </footer>
        <div
          v-else-if="activeGroup === joinApprovalPendingGroup"
          class="mobile-footer-shell mobile-safe-footer relative z-10 border-t border-slate-100 bg-white/95 px-3 py-2.5 sm:px-3 md:px-6 md:py-3"
        >
          <p class="text-center text-sm text-slate-500">你的入群申请还在审批中，请耐心等待群主/管理员审批。</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, onBeforeUnmount, watch } from 'vue';
import appPackage from '../package.json';
import { TransportSocket, createTransportSocket } from './lib/transport-socket.js';
import { generateSnowflakeId } from './lib/snowflake.js';
import { initPush, getPushStatus, registerServiceWorker } from './lib/push.js';
import { generateDeviceQRSvg, generateInviteQRSvg, buildDeviceShareString, parseDeviceShareString } from './lib/qrcode.js';

// WebSocket readyState 兼容常量（TransportSocket 也使用这些值）
const WS_CONNECTING = 0;
const WS_OPEN = 1;

const SYSTEM_GROUP = 'system';
const SYSTEM_NOTICE_GROUP = 'system-notice';
const GROUP_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const DIRECT_GROUPS_STORAGE_KEY = 'LINKCONNECT.direct.groups.v1';
const REGULAR_GROUPS_STORAGE_KEY = 'LINKCONNECT.groups.v1';
const GROUP_META_STORAGE_KEY = 'LINKCONNECT.group.meta.v1';
const GROUP_CONTACTS_STORAGE_KEY = 'LINKCONNECT.group.contacts.v1';
const GROUP_PIN_STORAGE_KEY = 'LINKCONNECT.group.pins.v1';
const DEVICE_SECRET_STORAGE_KEY = 'LINKCONNECT.device.secret';
const DEVICE_TOKEN_STORAGE_KEY = 'LINKCONNECT.device.token';
const DEVICE_FINGERPRINT_STORAGE_KEY = 'LINKCONNECT.device.fingerprint';
const UI_SCALE_STORAGE_KEY = 'LINKCONNECT.ui.scale.v1';
const IDENTITY_CREDENTIAL_HEADER = 'LINKCONNECT IDENTITY CREDENTIAL';
const MAX_TEXT_LENGTH = 2000;
const MAX_IMAGE_BYTES = 900 * 1024;
const MAX_IMAGE_DIMENSION = 1440;
const MAX_AUDIO_BYTES = 700 * 1024;
const MAX_AUDIO_DURATION_MS = 60_000;
const OUTGOING_ACK_TIMEOUT_MS = 60_000;
const OUTBOX_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const VOICE_WAVEFORM_SIZE = 28;
const GROUP_ANNOUNCEMENT_MAX = 240;
const REPLY_PREVIEW_MAX = 72;
const INVITE_CODE_PATTERN = /(?:^|\b)(TCINV-[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)(?:\b|$)/;
const INVITE_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.';
const INVITE_MNEMONIC_WORDS = ['acorn', 'basil', 'cedar', 'delta', 'ember', 'frost', 'grove', 'harbor', 'ivory', 'juniper', 'kettle', 'lagoon', 'maple', 'nectar', 'orbit', 'pebble', 'quartz', 'ripple', 'summit', 'thistle', 'umber', 'velvet', 'willow', 'yonder', 'zephyr', 'anchor', 'blossom', 'compass', 'drift', 'evergreen', 'falcon', 'glacier', 'horizon', 'island', 'jasmine', 'lantern', 'meadow', 'north', 'opal', 'prairie', 'quiver', 'rocket', 'sparrow', 'timber', 'upland', 'valley', 'whisper', 'xenon', 'yellow', 'zenith', 'apricot', 'beacon', 'canyon', 'dune', 'echo', 'feather', 'granite', 'harborlight', 'inkstone', 'jetstream', 'keystone', 'lighthouse', 'moonrise', 'nightfall', 'overland'];
const DM_LIMIT_REASON_TEXT = '你不在对方通讯录：对方回复前你只能发送一条消息。';
const APP_VERSION = typeof appPackage?.version === 'string' ? appPackage.version : '0.0.0';

const isInsecureBrowser = ref(false);
const currentUrl = window.location.href;
const copyText = ref('复制链接');
const inviteText = ref('邀请新人');
const myUid = ref('');
const myNickname = ref('');
const myPrivateKey = ref(null);
const myPublicKeyBase64 = ref('');
const identitySignKeyPair = ref(null);
const identityDhKeyPair = ref(null);
const identitySignPublicBase64 = ref('');
const identityDhPublicBase64 = ref('');
const peerIdentityMap = ref({});
const messages = ref([]);
const inputMsg = ref('');
const activeGroup = ref(SYSTEM_GROUP);
const groups = ref([
  { id: SYSTEM_GROUP, name: '聊天' },
  { id: SYSTEM_NOTICE_GROUP, name: '系统消息' },
]);
const pendingJoin = ref({ groupId: '', inviteCode: '', select: true, groupName: '', joinStatement: '' });
const joinApprovalPendingGroup = ref('');
const connectionState = ref('connecting'); // connecting | verifying | connected | reconnecting | offline
const showMobilePanel = ref(false);
const mobileDrawerMode = ref('home'); // 'home' | 'group'
const groupRestoreHintOpen = ref(false);
const isSendingImage = ref(false);
const msgBox = ref(null);
const imagePicker = ref(null);
const textInput = ref(null);
const lastToast = ref({ kind: 'info', text: '' });
const powState = ref({ nonce: '', difficulty: 0, verified: false, solving: false });
const powUid = ref('');
const soundEnabled = ref(false);
const soundUnlocked = ref(false);
const dmContactsOnly = ref(true);
const dmPreferenceSaving = ref(false);
const uiScale = ref('standard');
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
const inviteDialog = ref({
  open: false,
  groupId: '',
  ttlSec: 2 * 24 * 60 * 60,
  maxUses: 10,
  inviteStatement: '',
  generatedInviteCode: '',
  generatedShortCode: '',
  generatedExpiresAt: null,
});
const unreadCounts = ref({});
const banner = ref({ open: false, groupId: '', title: '', text: '', canEnableNotify: false, clickable: true });
const bannerSwipe = ref({ active: false, pointerId: null, startX: 0, startY: 0, dx: 0, dy: 0, axis: '' });
const notificationPrompted = ref(false);
const systemNotifyEnabled = ref(false);
const settingsOpen = ref(false);
const debugModeEnabled = ref(false);
// Web Push 状态
const pushStatus = ref({ supported: false, permission: 'default', subscribed: false });
const pushInitializing = ref(false);
// 好友系统 — 添加设备好友
const addFriendDialog = ref({ open: false, deviceIdInput: '', error: '', mode: 'input' }); // mode: 'input' | 'qr'
const qrImagePicker = ref(null);
const showDeviceQR = ref(false); // 在设置中显示设备二维码
const versionTapState = ref({ count: 0, lastAt: 0 });
const nicknameGuideOpen = ref(false);
const nicknameGuidePending = ref(false);
const mobilePrimaryTab = ref('messages');
const mobileHistoryInternal = ref(false);
const identityMnemonicLanguage = ref('zh');
const identityCredentialModal = ref({
  open: false,
  fingerprint: '',
  mnemonicZh: '',
  mnemonicEn: '',
  fileTextZh: '',
  fileTextEn: '',
  language: 'zh',
  firstBind: false,
});
const identityCredentialImport = ref('');
const createGroupModal = ref({ open: false, name: '' });
const groupManageOpen = ref(false);
const groupMembers = ref([]);
const groupMembersLoading = ref(false);
const groupRenameInput = ref('');
const groupAnnouncementInput = ref('');
const groupMetaMap = ref({});
const groupInviteSettingsLoading = ref(false);
const groupInviteEntries = ref([]);
const pendingInviteApprovals = ref([]);
const systemNoticeOpen = ref(false);
const systemNoticeFullscreen = ref(false);
const explanationModal = ref({ open: false, title: '', text: '', tip: '' });
const dmNegotiationState = ref({ active: false, groupId: '', peerUid: '', phase: 'idle' });
const contactsOpen = ref(false);
const contacts = ref([]);
const savedGroupContacts = ref([]);
const contactsLoading = ref(false);
const contactRequests = ref([]);
const outgoingContactRequests = ref([]);
const contactQuery = ref('');
const deviceBound = ref(false);
const identityExpandMap = ref({});
const migrationCode = ref('');
const migrationExpiresAt = ref(0);
const migrationInput = ref('');
const migrationStatus = ref({ kind: 'info', text: '' });
const migrationConfirm = ref({
  code: '',
  fromFingerprintShort: '',
  fromOs: '',
  fromLocation: '',
  transferNickname: true,
  oldNickname: '',
});
const transferNicknameOnMigration = ref(true);
const nicknameInput = ref('');
const nicknameSaving = ref(false);
const trustedKeys = ref({});
const verifyModal = ref({ open: false, user: null, safetyCode: '' });
const dmLocks = ref({});
const dmUnlocked = ref({});
const dmHasIncoming = ref({});
const dmHasOutgoing = ref({});
const deviceKicked = ref({ open: false, reason: '' });
const reconnectState = ref({ attempt: 0, nextAt: 0, lastReason: '' });
const networkOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine !== false);
const outboxQueue = ref([]);
const isFlushingOutbox = ref(false);
const identityCredentialFilePicker = ref(null);
const isKeyboardOpen = ref(false);
const viewportNarrow = ref(false);
const mobileViewport = ref(false);
const suppressReconnect = ref(false);
const burnAfterReadEnabled = ref(false);
const pinnedGroups = ref({});
const replyDraft = ref(null);
const burnNow = ref(Date.now());
const reconnectNow = ref(Date.now());
const groupQuickMenu = ref({ open: false, groupId: '', x: 0, y: 0, mobile: false });
const leaveGroupDialog = ref({ open: false, groupId: '', name: '', ownerAction: 'inherit', successorUid: '', successorName: '' });
const voiceComposer = ref({
  state: 'idle',
  startedAt: 0,
  elapsedMs: 0,
  mimeType: '',
  waveform: [],
  level: 0,
});
const audioPlayback = ref({
  msgId: '',
  currentTimeMs: 0,
  durationMs: 0,
  playing: false,
});
let powSolveToken = 0;
let ws = null;
let notificationAudio = null;
const joinedGroups = new Set([SYSTEM_GROUP, SYSTEM_NOTICE_GROUP]);
const dmSessions = new Map();
const burnTimers = new Map();
let burnTicker = 0;
let voiceRequestToken = 0;
let voiceMediaRecorder = null;
let voiceMediaStream = null;
let voiceAudioContext = null;
let voiceAnalyser = null;
let voiceSourceNode = null;
let voiceMeterRaf = 0;
let voiceElapsedTimer = 0;
let voiceRecordedChunks = [];
let voiceRecordedSamples = [];
let voicePendingSend = true;
let voicePlaybackAudio = null;
const outgoingAckTimers = new Map();
let reconnectTimer = 0;
let reconnectTicker = 0;
let heartbeatTimer = 0;
let lastPongAt = 0;
let wsConnectionSeq = 0;
let dmNegotiationTimer = 0;
const directRestoreAttempts = new Map();
const ownedGroupRestoreAttempts = new Map();
const pendingLeaveRequests = new Map();
let groupLongPressTimer = 0;
let suppressGroupClickUntil = 0;
let suppressGroupClickGroupId = '';
let mobileHistoryReady = false;
let pendingMobileHistoryMode = 'replace';
let lastMobileHistorySignature = '';

const importedPublicKeyCache = new Map();
const knownRemoteIdentityDh = new Map();
const resetReconnectTicker = () => {
  if (reconnectTicker) {
    window.clearInterval(reconnectTicker);
    reconnectTicker = 0;
  }
};

const resetReconnectTimer = () => {
  if (reconnectTimer) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = 0;
  }
  resetReconnectTicker();
  reconnectState.value = { ...reconnectState.value, nextAt: 0 };
};

const resetReconnectState = () => {
  resetReconnectTimer();
  reconnectState.value = { attempt: 0, nextAt: 0, lastReason: '' };
};

const stopHeartbeat = () => {
  if (heartbeatTimer) {
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = 0;
  }
  lastPongAt = 0;
};

const startHeartbeat = () => {
  stopHeartbeat();
  lastPongAt = Date.now();
  heartbeatTimer = window.setInterval(() => {
    if (!ws || ws.readyState !== WS_OPEN) {
      stopHeartbeat();
      return;
    }
    const now = Date.now();
    // If no pong received in 35s, connection is likely dead
    if (lastPongAt && now - lastPongAt > 35000) {
      stopHeartbeat();
      ws.close();
      return;
    }
    try {
      ws.send(JSON.stringify({ type: 'ping' }));
    } catch {
      stopHeartbeat();
    }
  }, 25000);
};

const resetDmNegotiationTimer = () => {
  if (dmNegotiationTimer) {
    window.clearTimeout(dmNegotiationTimer);
    dmNegotiationTimer = 0;
  }
};

const resetGroupLongPress = () => {
  if (groupLongPressTimer) {
    window.clearTimeout(groupLongPressTimer);
    groupLongPressTimer = 0;
  }
};

const clearDmNegotiation = () => {
  resetDmNegotiationTimer();
  dmNegotiationState.value = { active: false, groupId: '', peerUid: '', phase: 'idle' };
};

const startDmNegotiation = (groupId, peerUid = '') => {
  const gid = sanitizeGroupId(groupId);
  if (!gid || !isDirectGroupId(gid)) return;
  resetDmNegotiationTimer();
  dmNegotiationState.value = {
    active: true,
    groupId: gid,
    peerUid: peerUid || getDirectTargetUid(gid),
    phase: 'syncing',
  };
  dmNegotiationTimer = window.setTimeout(() => {
    if (dmNegotiationState.value.groupId === gid && dmNegotiationState.value.phase === 'syncing') {
      clearDmNegotiation();
    }
  }, 4800);
};

const finishDmNegotiation = (groupId, peerUid = '') => {
  const gid = sanitizeGroupId(groupId);
  if (!gid || !isDirectGroupId(gid)) return;
  const current = dmNegotiationState.value;
  if (!current.active && current.groupId !== gid) return;
  resetDmNegotiationTimer();
  dmNegotiationState.value = {
    active: true,
    groupId: gid,
    peerUid: peerUid || current.peerUid || getDirectTargetUid(gid),
    phase: 'ready',
  };
  dmNegotiationTimer = window.setTimeout(() => {
    if (dmNegotiationState.value.groupId === gid) {
      clearDmNegotiation();
    }
  }, 1400);
};

const handleNetworkOnline = () => {
  networkOnline.value = true;
  if (ws && ws.readyState === WS_OPEN) {
    connectionState.value = powState.value.verified ? 'connected' : 'verifying';
    return;
  }
  if (!suppressReconnect.value && !isInsecureBrowser.value) {
    manualReconnect();
  }
};

const handleNetworkOffline = () => {
  networkOnline.value = false;
  resetReconnectTimer();
  connectionState.value = 'offline';
};
const handleViewportResize = () => {
  updateViewportState();
};

const composerPlaceholder = computed(() => {
  return mobileViewport.value ? '' : '输入加密消息，Enter 发送，Shift+Enter 换行';
});

const isChatListView = computed(() => activeGroup.value === SYSTEM_GROUP);
const isRootMessagesPage = computed(() => activeGroup.value === SYSTEM_GROUP && (!mobileViewport.value || mobilePrimaryTab.value === 'messages'));
const isRootContactsPage = computed(() => mobileViewport.value && activeGroup.value === SYSTEM_GROUP && mobilePrimaryTab.value === 'contacts');
const isRootSettingsPage = computed(() => mobileViewport.value && activeGroup.value === SYSTEM_GROUP && mobilePrimaryTab.value === 'settings');
const mobileHeaderEyebrow = computed(() => {
  if (systemNoticeOpen.value) return '系统通知';
  if (isRootContactsPage.value) return '通讯录';
  if (isRootSettingsPage.value) return '设置';
  if (isRootMessagesPage.value) return '消息';
  return '当前群聊';
});
const pageHeaderTitle = computed(() => {
  if (systemNoticeOpen.value) return '系统通知';
  if (activeGroup.value !== SYSTEM_GROUP) return activeGroupName.value;
  if (!mobileViewport.value) return activeGroupName.value;
  if (mobilePrimaryTab.value === 'contacts') return '通讯录';
  if (mobilePrimaryTab.value === 'settings') return '设置';
  return '聊天';
});
const activeIdentityMnemonic = computed(() => {
  return identityCredentialModal.value.language === 'en'
    ? identityCredentialModal.value.mnemonicEn
    : identityCredentialModal.value.mnemonicZh;
});
const activeIdentityCredentialFileText = computed(() => {
  return identityCredentialModal.value.language === 'en'
    ? identityCredentialModal.value.fileTextEn
    : identityCredentialModal.value.fileTextZh;
});

const groupDisplayName = (groupOrId, fallback = '') => {
  const gid =
    typeof groupOrId === 'string'
      ? sanitizeGroupId(groupOrId)
      : sanitizeGroupId(groupOrId?.id || '');
  if (!gid) return fallback || '';
  if (gid === SYSTEM_GROUP) return '聊天';
  if (gid === SYSTEM_NOTICE_GROUP) return '系统消息';
  if (isDirectGroupId(gid)) {
    return nameForDirectGroup(gid) || fallback || gid;
  }
  const metaName = typeof groupMetaMap.value[gid]?.groupName === 'string' ? groupMetaMap.value[gid].groupName.trim() : '';
  const itemName =
    typeof groupOrId === 'object' && typeof groupOrId?.name === 'string'
      ? groupOrId.name.trim()
      : (groups.value.find((group) => group?.id === gid)?.name || '').trim();
  if (metaName) return metaName;
  if (itemName) return itemName;
  return fallback || gid;
};
const currentGroupSavedToContacts = computed(() => {
  const gid = sanitizeGroupId(activeGroup.value);
  if (!gid || gid === SYSTEM_GROUP || gid === SYSTEM_NOTICE_GROUP || isDirectGroupId(gid)) return false;
  return savedGroupContacts.value.some((item) => item && item.id === gid);
});

const activeGroupName = computed(() => {
  return groupDisplayName(activeGroup.value, activeGroup.value);
});

const activeGroupMeta = computed(() => {
  const gid = sanitizeGroupId(activeGroup.value) || '';
  return gid ? groupMetaMap.value[gid] || null : null;
});

const isActiveGroupOwner = computed(() => {
  const meta = activeGroupMeta.value;
  if (!meta || !meta.ownerUid) return false;
  return meta.ownerUid === myUid.value;
});

const activeGroupInviteApprovalRequired = computed(() => {
  return activeGroupMeta.value?.inviteApprovalRequired !== false;
});

const myGroupInviteEntries = computed(() => {
  const uid = myUid.value;
  if (!uid) return [];
  return groupInviteEntries.value.filter((entry) => entry.creatorUid === uid);
});

const myActiveGroupInvite = computed(() => {
  const uid = myUid.value;
  if (!uid) return null;
  return groupInviteEntries.value.find((entry) => {
    if (entry.creatorUid !== uid) return false;
    if (Number(entry.revokedAt) > 0) return false;
    if (Number(entry.expiresAt) > 0 && Number(entry.expiresAt) <= Date.now()) return false;
    return true;
  }) || null;
});

// 邀请弹窗中的二维码（刚生成的链接）
const inviteDialogQR = computed(() => {
  const link = inviteLinkForEntry({ inviteCode: inviteDialog.value.generatedInviteCode, shortCode: inviteDialog.value.generatedShortCode });
  return link ? generateInviteQRSvg(link, 160) : '';
});

// 已有邀请链接的二维码
const activeInviteQR = computed(() => {
  if (!myActiveGroupInvite.value) return '';
  const link = inviteLinkForEntry(myActiveGroupInvite.value);
  return link ? generateInviteQRSvg(link, 140) : '';
});

const otherMembersGroupInvites = computed(() => {
  if (!isActiveGroupOwner.value) return [];
  return groupInviteEntries.value.filter((entry) => entry.creatorUid !== myUid.value);
});

const activeGroupAnnouncement = computed(() => {
  return typeof activeGroupMeta.value?.announcement === 'string' ? activeGroupMeta.value.announcement.trim() : '';
});

const activeGroupPinned = computed(() => {
  return isGroupPinned(activeGroup.value);
});

const groupQuickMenuPinned = computed(() => {
  return isGroupPinned(groupQuickMenu.value.groupId);
});

const groupQuickMenuCanLeave = computed(() => {
  const gid = sanitizeGroupId(groupQuickMenu.value.groupId);
  if (!gid || gid === SYSTEM_GROUP || gid === SYSTEM_NOTICE_GROUP || isDirectGroupId(gid)) return false;
  return true;
});

const groupQuickMenuName = computed(() => {
  const gid = sanitizeGroupId(groupQuickMenu.value.groupId);
  return gid ? groupDisplayName(gid, gid) : '';
});

const detectDeviceKind = () => {
  const ua = (navigator.userAgent || '').toLowerCase();
  const platform = String(navigator.userAgentData?.platform || navigator.platform || '').toLowerCase();
  const uaDataMobile = navigator.userAgentData?.mobile === true;
  const mobileUa = /android|iphone|ipad|ipod|mobile|harmonyos/.test(ua);
  const ipadDesktopMode = platform.includes('mac') && navigator.maxTouchPoints > 1;
  let coarsePointer = false;
  try {
    coarsePointer =
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(any-pointer: coarse)').matches;
  } catch {
    coarsePointer = false;
  }
  const hasTouch = navigator.maxTouchPoints > 0;
  const desktopPlatform = platform.startsWith('win') || platform.startsWith('mac') || platform.startsWith('linux x86_64');
  if (uaDataMobile || mobileUa || ipadDesktopMode) return 'mobile';
  if ((hasTouch || coarsePointer) && !desktopPlatform) return 'mobile';
  return 'pc';
};

const debugDeviceKindLabel = computed(() => {
  return detectDeviceKind() === 'mobile' ? '移动端' : 'PC';
});

const debugInfo = computed(() => {
  const wsState = ws ? ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState] || `未知(${ws.readyState})` : '未创建';
  const msgCount = messages.value.length;
  const groupCount = groups.value.length;
  const dmSessionCount = dmSessions.size;
  const outboxCount = outboxQueue.value.length;
  const powStatus = powState.value.verified ? '✅ 已验证' : powState.value.solving ? '⏳ 验证中' : '❌ 未验证';
  const encStatus = myPrivateKey.value ? '✅ RSA-2048' : '❌ 未生成';
  const ecdsaStatus = identitySignKeyPair.value ? '✅ ECDSA-P256' : '❌ 未生成';
  const ecdhStatus = identityDhKeyPair.value ? '✅ ECDH-P256' : '❌ 未生成';
  const contactCount = contacts.value.length;
  const trustedKeyCount = Object.keys(trustedKeys.value).length;
  const unreadTotal = Object.values(unreadCounts.value).reduce((sum, n) => sum + (Number(n) || 0), 0);
  const memoryInfo = performance?.memory
    ? `${Math.round(performance.memory.usedJSHeapSize / 1048576)}MB / ${Math.round(performance.memory.jsHeapSizeLimit / 1048576)}MB`
    : 'N/A';

  return {
    wsState,
    msgCount,
    groupCount,
    dmSessionCount,
    outboxCount,
    powStatus,
    encStatus,
    ecdsaStatus,
    ecdhStatus,
    contactCount,
    trustedKeyCount,
    unreadTotal,
    memoryInfo,
    connectionState: connectionState.value,
    deviceFingerprint: deviceFingerprint.value ? shortIdentity(deviceFingerprint.value, 12, 8) : '未绑定',
    appVersion: APP_VERSION,
    buildTime: __BUILD_TIME__,
    mobileViewport: mobileViewport.value,
    soundEnabled: soundEnabled.value,
    systemNotifyEnabled: systemNotifyEnabled.value,
    dmContactsOnly: dmContactsOnly.value,
    uiScale: uiScale.value,
    debugModeEnabled: debugModeEnabled.value,
  };
});

const leaveGroupDialogIsOwner = computed(() => {
  return isOwnedGroupByMe(leaveGroupDialog.value.groupId);
});

const leaveGroupDialogCanInherit = computed(() => {
  const gid = sanitizeGroupId(leaveGroupDialog.value.groupId);
  if (!gid || !leaveGroupDialogIsOwner.value) return false;
  return Boolean(leaveGroupDialog.value.successorUid);
});

const leaveGroupDialogSuccessorLabel = computed(() => {
  const uid = typeof leaveGroupDialog.value.successorUid === 'string' ? leaveGroupDialog.value.successorUid : '';
  const name = typeof leaveGroupDialog.value.successorName === 'string' ? leaveGroupDialog.value.successorName.trim() : '';
  if (!uid) return '';
  return name || `用户 ${uid.slice(0, 6)}`;
});

const appScaleStyle = computed(() => {
  if (uiScale.value === 'small') return { fontSize: '14px' };
  if (uiScale.value === 'large') return { fontSize: '18px' };
  return { fontSize: '16px' };
});

const bannerSwipeStyle = computed(() => {
  const dx = Number(bannerSwipe.value.dx) || 0;
  const dy = Number(bannerSwipe.value.dy) || 0;
  const distance = Math.max(Math.abs(dx), Math.max(0, -dy));
  return {
    translate: `${dx}px ${dy}px`,
    opacity: String(Math.max(0.38, 1 - distance / 180)),
    transition: bannerSwipe.value.active ? 'none' : 'translate 180ms ease, opacity 180ms ease',
    touchAction: mobileViewport.value ? 'none' : 'auto',
  };
});

const sizeSettingOptions = [
  { value: 'small', label: '小' },
  { value: 'standard', label: '标准' },
  { value: 'large', label: '大' },
];

const isRegularPinnedGroupId = (groupId) => {
  const gid = sanitizeGroupId(groupId);
  return Boolean(gid && gid !== SYSTEM_GROUP && gid !== SYSTEM_NOTICE_GROUP && !isDirectGroupId(gid));
};

const isOwnedGroupByMe = (groupId) => {
  const gid = sanitizeGroupId(groupId);
  if (!gid || !myUid.value) return false;
  const meta = groupMetaMap.value[gid] || null;
  return Boolean(meta?.ownerUid && meta.ownerUid === myUid.value);
};

const canLeaveGroup = (groupId) => {
  const gid = sanitizeGroupId(groupId);
  return Boolean(gid && gid !== SYSTEM_GROUP && gid !== SYSTEM_NOTICE_GROUP && !isDirectGroupId(gid));
};

const canOpenGroupQuickMenu = (groupId) => {
  return isRegularPinnedGroupId(groupId);
};

const groupPinTs = (groupId) => {
  if (!isRegularPinnedGroupId(groupId)) return 0;
  return Number(pinnedGroups.value[groupId]) || 0;
};

const isGroupPinned = (groupId) => {
  return groupPinTs(groupId) > 0;
};

const sortGroupEntries = (items = []) => {
  return items.slice().sort((a, b) => {
    const aId = sanitizeGroupId(a?.id) || '';
    const bId = sanitizeGroupId(b?.id) || '';
    if (aId === SYSTEM_GROUP && bId !== SYSTEM_GROUP) return -1;
    if (bId === SYSTEM_GROUP && aId !== SYSTEM_GROUP) return 1;

    const aPin = groupPinTs(aId);
    const bPin = groupPinTs(bId);
    if (aPin !== bPin) return bPin - aPin;

    const aTs = Number(lastMessageByGroup.value[aId]?.ts) || 0;
    const bTs = Number(lastMessageByGroup.value[bId]?.ts) || 0;
    if (aTs !== bTs) return bTs - aTs;

    if (aId === SYSTEM_NOTICE_GROUP && bId !== SYSTEM_NOTICE_GROUP) return 1;
    if (bId === SYSTEM_NOTICE_GROUP && aId !== SYSTEM_NOTICE_GROUP) return -1;
    return String(groupDisplayName(a, a?.name || aId) || aId).localeCompare(
      String(groupDisplayName(b, b?.name || bId) || bId)
    );
  });
};

const visibleGroups = computed(() => {
  const q = groupQuery.value.trim().toLowerCase();
  const filtered = groups.value.filter((g) => {
    const name = String(groupDisplayName(g, g?.name || '') || '').toLowerCase();
    const id = String(g.id || '').toLowerCase();
    return name.includes(q) || id.includes(q);
  });
  return sortGroupEntries(filtered);
});

const chatListGroups = computed(() => {
  const q = groupQuery.value.trim().toLowerCase();
  return sortGroupEntries(
    groups.value
    .filter((group) => group && group.id && group.id !== SYSTEM_GROUP)
    .filter((group) => {
      if (!q) return true;
      const name = String(groupDisplayName(group, group?.name || '') || '').toLowerCase();
      const id = String(group.id || '').toLowerCase();
      return name.includes(q) || id.includes(q);
    })
  );
});

const chatListSummary = computed(() => {
  const dmCount = groups.value.filter((group) => group && isDirectGroupId(group.id)).length;
  const roomCount = groups.value.filter(
    (group) => group && group.id && group.id !== SYSTEM_GROUP && group.id !== SYSTEM_NOTICE_GROUP && !isDirectGroupId(group.id)
  ).length;
  return {
    chats: chatListGroups.value.length,
    dms: dmCount,
    rooms: roomCount,
  };
});

const filteredMessages = computed(() => {
  return messages.value.filter((m) => (m.groupId || SYSTEM_GROUP) === activeGroup.value);
});

const isClusterableMessage = (msg) => {
  return Boolean(
    msg &&
    msg.payloadType !== 'dm_limit_tip' &&
    msg.payloadType !== 'send_block_tip' &&
    msg.payloadType !== 'system' &&
    !msg.isSystem
  );
};

const sameMessageCluster = (current, sibling) => {
  if (!isClusterableMessage(current) || !isClusterableMessage(sibling)) return false;
  return current.sender === sibling.sender && (current.groupId || SYSTEM_GROUP) === (sibling.groupId || SYSTEM_GROUP);
};

const displayMessages = computed(() => {
  return filteredMessages.value.map((msg, index, list) => {
    const prev = list[index - 1];
    const next = list[index + 1];
    const clusterWithPrev = sameMessageCluster(msg, prev);
    const clusterWithNext = sameMessageCluster(msg, next);
    return {
      ...msg,
      clusterStart: !clusterWithPrev,
      clusterEnd: !clusterWithNext,
      showSenderMeta: msg.sender !== myUid.value && !clusterWithPrev,
      showAvatar: msg.sender !== myUid.value && !clusterWithNext,
    };
  });
});

const systemNoticeMessages = computed(() => {
  return messages.value
    .filter((msg) => (msg.groupId || SYSTEM_GROUP) === SYSTEM_NOTICE_GROUP)
    .slice()
    .sort((a, b) => (b.ts || 0) - (a.ts || 0));
});

const pendingOutboxCount = computed(() => {
  return normalizeOutboxQueueEntries(outboxQueue.value).filter((entry) => {
    const local = findLocalOutgoing(entry.msgId);
    return !(local && (local.clientStatus === 'delivered' || local.clientStatus === 'read'));
  }).length;
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
  const contactMap = new Map(
    contacts.value
      .filter((c) => c && typeof c.contactFingerprint === 'string' && c.contactFingerprint)
      .map((c) => [c.onlineUid || c.contactFingerprint, c])
  );
  return msg.readBy.map((entry) => {
    const contact = contactMap.get(entry.uid);
    const os = contact && typeof contact.os === 'string' ? contact.os : '';
    const location = contact && typeof contact.location === 'string' ? contact.location : '';
    const displayName = displayNameForUid(entry.uid);
    return {
      uid: entry.uid,
      uidShort: entry.uid ? entry.uid.slice(0, 8) : '未知',
      displayName,
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

const isGeneratedContactAlias = (alias, uid = '') => {
  const text = typeof alias === 'string' ? alias.trim() : '';
  if (!text) return true;
  const normalizedUid = typeof uid === 'string' ? uid.trim() : '';
  if (normalizedUid && (text === `用户 ${normalizedUid}` || text === `用户 ${normalizedUid.slice(0, 6)}`)) {
    return true;
  }
  return /^用户\s+[A-Za-z0-9_-]{4,}$/.test(text);
};

const contactDisplayName = (contact) => {
  if (!contact || typeof contact !== 'object') return '未知联系人';
  const nickname = typeof contact.nickname === 'string' ? contact.nickname.trim() : '';
  const alias = typeof contact.alias === 'string' ? contact.alias.trim() : '';
  const onlineUid = typeof contact.onlineUid === 'string' ? contact.onlineUid : '';
  if (nickname && isGeneratedContactAlias(alias, onlineUid)) return nickname;
  if (alias) return alias;
  if (nickname) return nickname;
  const fingerprint = typeof contact.contactFingerprint === 'string' ? contact.contactFingerprint : '';
  return fingerprint ? `设备 ${fingerprint.slice(0, 6)}` : '未知联系人';
};

// Compact pinyin initial mapping for common Chinese characters (first letter)
const PINYIN_MAP = {};
const _pm = (chars, initial) => { for (const c of chars) PINYIN_MAP[c] = initial; };
_pm('啊阿哎哀唉埃挨矮爱碍安岸按案暗昂凹熬傲奥', 'a');
_pm('八巴扒吧疤拔把坝爸罢霸白百柏摆败拜班般颁斑搬版半办扮伴拌帮绑榜膀棒傍包剥薄饱宝保堡抱报暴爆卑杯悲碑北贝备背被倍辈奔本笨逼鼻比彼笔币闭毕毙壁避臂边编鞭扁便变遍辨辩标表别宾滨冰兵丙柄饼并病拨波玻剥菠播伯驳泊博搏薄卜补捕不步怖部', 'b');
_pm('擦猜才材财裁采彩菜蔡参餐残蚕惨灿仓苍舱藏操曹草册侧测策层叉插查茶察差拆柴产阐长肠尝常偿厂场畅倡唱抄超朝潮车扯彻沉尘陈辰臣晨称趁衬撑成呈诚承城程惩橙吃池驰迟持尺齿斥赤翅充冲虫崇抽仇愁丑臭出初除厨锄础储楚处触穿传船创吹垂春纯词辞慈磁此次刺从匆葱聪丛凑粗促催脆翠村存寸错', 'c');
_pm('搭达答打大呆代带待怠贷戴丹单担耽胆旦但诞弹淡当挡党荡刀导岛倒到盗悼道稻得德的灯登等凳低堤滴敌迪笛底抵地弟帝递第颠典点电店垫殿雕吊钓调跌叠蝶丁叮盯钉顶订定丢东冬懂动冻栋洞都斗抖陡豆督毒读独堵赌杜肚度渡端短段断锻堆队对吨顿多朵躲惰', 'd');
_pm('鹅额恶饿恩儿而尔耳二', 'e');
_pm('发乏伐罚阀法帆番翻凡烦繁反返犯泛饭范贩方坊芳防妨房仿访纺放飞非肥匪废沸肺费分吩纷芬坟粉份奋愤粪丰风封疯峰锋蜂冯逢缝凤奉否夫肤伏扶服浮符幅福辐蝠抚府俯辅腐父付妇负附复赴副傅富腹覆', 'f');
_pm('该改概钙盖干甘杆肝赶敢感冈刚纲缸港杠高搞稿告哥歌阁革格葛隔个各给根跟更耕工弓公功攻供宫恭躬巩共贡勾沟钩狗构购够姑孤辜古谷股骨鼓固故顾瓜刮挂乖拐怪关观官冠馆管贯惯灌罐光广归龟规轨鬼柜贵桂滚棍锅郭国果裹过', 'g');
_pm('哈孩海害含寒韩喊汉汗旱杭毫豪好号浩喝合何和河核荷贺黑很狠恨恒横衡轰哄红宏洪虹喉猴吼后厚候乎呼忽胡壶湖葫糊蝴虎互户护花华哗滑化划画话怀淮欢环还缓幻唤换患荒慌皇黄煌晃灰恢辉回悔汇会绘惠慧昏婚浑混活火伙或货获祸惑', 'h');
_pm('几击饥圾机肌鸡迹积基绩激及吉级即极急疾集籍几己挤脊计记纪忌技际剂季既济继寂寄加佳家嘉夹甲价驾架假嫁稼歼坚间艰监兼煎拣俭茧捡减剪简见件建剑荐贱健舰渐践鉴键箭江姜将浆僵疆讲奖桨酱降交郊浇娇骄胶焦角绞脚搅叫轿较教阶皆接揭街节杰洁结捷截竭姐解介戒届界借巾今斤金津筋仅紧锦尽劲近进晋浸禁京经茎惊睛精鲸井景警净径竞竟敬境静镜纠究揪九久酒旧救就舅居拘鞠局菊橘举矩句巨拒具俱剧据距聚捐卷决诀绝君均菌俊', 'j');
_pm('卡开凯慨刊堪砍看康抗考烤靠科棵颗壳咳可渴克刻客课肯垦恳空孔恐控口扣枯哭苦库裤酷夸块快宽款狂况矿亏葵愧坤昆捆困扩括阔', 'k');
_pm('垃拉啦喇腊蜡辣来赖兰拦栏蓝篮览懒烂滥郎狼廊朗浪捞劳牢老乐勒了雷垒泪类累冷厘梨狸离莉璃黎礼李里理力历厉立丽利励例隶栗粒连帘怜莲联廉脸练恋炼链良凉梁粮两亮谅辆量辽疗聊了料列劣烈裂邻林临淋磷灵玲凌铃陵零龄领令另溜刘流留柳六龙笼隆垄拢楼漏露卢芦炉鲁陆录鹿碌路旅律虑率绿氯卵乱掠轮论罗萝逻螺洛络骆落', 'l');
_pm('妈麻马码蚂骂吗埋买迈麦卖脉蛮满慢忙芒盲茫毛矛茅茂冒贸帽貌么没眉梅煤霉每美妹门闷们蒙盟猛孟眯迷谜米泌秘密蜜眠绵棉免勉面苗描秒妙庙灭民敏名明鸣命谬模膜摩磨抹末莫墨默谋某母亩木目牧募幕慕暮穆', 'm');
_pm('那纳娜呐乃奶耐男南难囊挠脑闹呢内嫩能尼泥你年念娘鸟尿捏宁凝牛扭纽农浓弄奴怒女暖挪诺', 'n');
_pm('哦欧偶', 'o');
_pm('爬怕帕拍排牌派攀盘判盼乓旁胖抛炮跑泡培陪赔佩配喷盆朋棚蓬膨捧碰批披皮疲脾匹僻片偏篇飘票拼贫品乒平评凭瓶萍坡泼迫破剖仆扑铺朴普谱', 'p');
_pm('七妻柒栖戚期欺漆齐其奇歧祈脐崎棋旗乞企岂启起气弃汽契砌器恰千迁牵铅谦签前钱潜浅遣欠枪腔强墙抢悄敲乔桥瞧巧切茄且窃亲侵芹秦琴禽勤青轻倾清情晴顷请庆穷秋丘求球区曲驱屈趋渠取去趣圈全权泉拳犬劝缺却雀确鹊裙群', 'q');
_pm('然燃染壤嚷让饶扰绕惹热人仁忍认任扔仍日荣绒容熔融柔肉如儒乳辱入软锐瑞润若弱', 'r');
_pm('撒洒塞赛三伞散桑嗓丧扫嫂色森杀沙纱刹砂傻厦筛晒山删衫闪陕扇善伤商赏尚烧稍勺芍少绍舌蛇舍设社射涉摄申伸身深神沈审婶肾甚渗慎升生声牲绳省圣盛剩尸失师诗施湿十石时识实拾食蚀史使始驶士氏世市示式事侍势视试饰室是适逝释收手守首寿受兽售授瘦书抒叔殊梳疏舒输蔬熟暑鼠薯术束述树竖数刷耍衰摔甩帅双谁水税睡顺瞬说司丝私思斯撕死四寺似饲松宋送诵搜艘苏俗诉肃素速宿塑酸蒜算虽随岁碎穗孙损笋缩所索锁', 's');
_pm('他她它塔踏台抬太态泰摊滩坛谈潭坦叹炭探汤堂塘糖躺趟涛逃桃陶淘萄讨套特疼腾踢提题蹄体替天添田甜填挑条跳贴铁厅听廷亭庭停蜓挺艇通同桐铜童统桶筒痛偷头投透突图徒涂途屠土吐兔团推腿退吞托拖脱驼妥拓唾', 't');
_pm('挖娃瓦袜歪外湾丸完玩顽挽晚碗万汪亡王网往忘旺望危威微为围违唯维伟伪尾委萎卫未位味畏胃谓慰温文纹闻蚊吻稳问翁窝我沃卧握乌污屋无吴五午伍武舞务物误悟雾', 'w');
_pm('夕西希析息牺悉惜晰稀溪锡熙嘻习席袭洗喜戏系细隙虾瞎峡狭暇辖霞下吓夏仙先纤掀鲜闲弦贤咸衔嫌显险现限线宪陷献腺乡相香箱详祥享响想向巷项象像橡削消宵销小晓孝效校笑些歇协邪胁斜携鞋写泄泻谢心辛欣新薪信兴星腥刑行形型醒杏姓幸性凶兄匈胸雄熊休修羞朽秀绣袖嗅须虚需许序叙畜绪续絮蓄宣悬选旋玄学雪血寻巡询训讯迅', 'x');
_pm('丫压呀押鸦鸭牙芽崖哑雅亚咽烟淹严延言岩沿炎研盐颜掩眼演厌宴艳验焰雁央扬羊阳杨洋仰养氧样妖腰邀摇遥窑谣咬药要爷也冶野业叶页夜液一伊衣医依仪宜姨移遗疑乙已以矣蚁倚椅义亿忆艺议亦异役译易疫益谊意翼因阴音吟银引饮隐印应英婴鹰迎盈营蝇赢影映硬拥永泳勇涌用优忧悠尤由犹邮油游友有又右幼诱于予余鱼娱渔愉愚榆与宇屿羽雨语玉育郁浴欲喻裕遇誉豫元员园原圆援缘源远怨院愿约月阅越跃粤云匀允孕运晕韵', 'y');
_pm('杂砸灾栽宰载再在咱暂赞脏葬遭糟早枣澡造噪燥躁则责择泽贼怎增赠渣扎轧闸眨炸榨摘宅窄债沾粘斩展盏崭占战站张章涨掌丈仗帐胀障招找召兆赵照罩遮折哲者这浙针珍真诊枕阵振镇震争征蒸整正证郑政之支汁芝枝知织脂蜘执直值职植殖止只旨址纸指至志制质治致智置中忠终钟种重州舟周洲轴宙皱骤朱株珠诸猪蛛竹烛逐主煮嘱住助注驻柱祝著筑抓专转赚庄装壮状追准捉桌着仔姿资滋子紫自字宗棕踪总纵走奏租足族阻组祖钻最罪醉尊遵作坐座做', 'z');

// Get a sortable key for a display name (pinyin-aware)
const getPinyinSortKey = (text) => {
  if (!text) return '\uffff';
  const result = [];
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code >= 0x4e00 && code <= 0x9fff) {
      result.push(PINYIN_MAP[ch] || 'z');
    } else {
      result.push(ch.toLowerCase());
    }
  }
  return result.join('');
};

const contactCards = computed(() => {
  const cards = contacts.value.map((contact) => {
    const fingerprint = contact.contactFingerprint || '';
    const alias = typeof contact.alias === 'string' ? contact.alias : '';
    const nickname = typeof contact.nickname === 'string' ? contact.nickname : '';
    return {
      contactFingerprint: fingerprint,
      alias,
      nickname,
      displayName: contactDisplayName({ ...contact, alias, nickname, contactFingerprint: fingerprint }),
      fingerprintShort: fingerprint ? fingerprint.slice(0, 10) : '--',
      onlineUid: contact.onlineUid || '',
      os: contact.os || '',
      location: contact.location || '',
      mutual: Boolean(contact.mutual),
    };
  });
  cards.sort((a, b) => getPinyinSortKey(a.displayName).localeCompare(getPinyinSortKey(b.displayName)));
  return cards;
});

const filteredContactCards = computed(() => {
  const query = contactQuery.value.trim().toLowerCase();
  if (!query) return contactCards.value;
  return contactCards.value.filter((contact) =>
    [contact.displayName, contact.alias, contact.nickname, contact.contactFingerprint, contact.os, contact.location]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  );
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

const savedGroupContactCards = computed(() => {
  return savedGroupContacts.value
    .map((entry) => {
      const group = groups.value.find((item) => item.id === entry.id);
      const name = groupDisplayName(group || entry.id, group?.name || entry.name || entry.id);
      return {
        id: entry.id,
        name,
        preview: groupPreviewText(entry.id) || '已加入通讯录的群聊',
        ts: Number(lastMessageByGroup.value[entry.id]?.ts) || 0,
        unread: getUnreadCount(entry.id),
      };
    })
    .sort((a, b) => {
      if (a.ts !== b.ts) return b.ts - a.ts;
      return a.name.localeCompare(b.name);
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

const reconnectAttempt = computed(() => reconnectState.value.attempt);
const reconnectCountdownMs = computed(() => {
  if (!reconnectState.value.nextAt) return 0;
  return Math.max(0, reconnectState.value.nextAt - reconnectNow.value);
});
const reconnectCountdownLabel = computed(() => {
  if (!reconnectCountdownMs.value) return '';
  return `${Math.ceil(reconnectCountdownMs.value / 1000)}s 后重试`;
});

const connectionLabel = computed(() => {
  if (connectionState.value === 'connected') return '在线';
  if (connectionState.value === 'verifying') return '安全校验中';
  if (connectionState.value === 'reconnecting') return '重连中';
  if (connectionState.value === 'offline') return '网络离线';
  return '连接中';
});

const connectionPillClass = computed(() => {
  if (connectionState.value === 'connected') return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
  if (connectionState.value === 'verifying') return 'border border-sky-200 bg-sky-50 text-sky-700';
  if (connectionState.value === 'reconnecting') return 'border border-amber-200 bg-amber-50 text-amber-700';
  if (connectionState.value === 'offline') return 'border border-slate-300 bg-slate-100 text-slate-600';
  return 'border border-slate-200 bg-slate-100 text-slate-600';
});

const connectionDotClass = computed(() => {
  if (connectionState.value === 'connected') return 'bg-emerald-500';
  if (connectionState.value === 'verifying') return 'bg-sky-500 connection-dot-pulse';
  if (connectionState.value === 'reconnecting') return 'bg-amber-500 connection-dot-pulse';
  if (connectionState.value === 'offline') return 'bg-slate-400';
  return 'bg-slate-400';
});

const mobileConnectionHint = computed(() => {
  if (connectionState.value === 'connected') {
    return '连接正常';
  }
  if (connectionState.value === 'verifying') return '正在重新验证安全状态';
  if (connectionState.value === 'reconnecting') {
    return reconnectCountdownLabel.value
      ? `正在自动重连，${reconnectCountdownLabel.value}`
      : '正在自动重连';
  }
  if (connectionState.value === 'offline') return '当前网络离线，恢复后会自动重连';
  return '正在建立连接';
});

const showReconnectBanner = computed(() => {
  if (deviceKicked.value.open) return false;
  if (connectionState.value === 'reconnecting' || connectionState.value === 'offline') return true;
  if ((connectionState.value === 'connecting' || connectionState.value === 'verifying') && reconnectAttempt.value > 0) {
    return true;
  }
  return false;
});

const connectionBannerTitle = computed(() => {
  if (connectionState.value === 'offline') return '网络暂时不可用';
  if (connectionState.value === 'verifying') return '连接已恢复，正在校验安全状态';
  if (connectionState.value === 'connecting') return '正在重新建立连接';
  return '正在自动重连';
});

const connectionBannerText = computed(() => {
  if (connectionState.value === 'offline') {
    return '网络恢复后会自动连接。';
  }
  if (connectionState.value === 'verifying') {
    return '正在完成安全校验。';
  }
  if (connectionState.value === 'connecting') {
    return '正在重新连接。';
  }
  return '正在自动重连…';
});

const connectionBannerClass = computed(() => {
  if (connectionState.value === 'offline') return 'border-slate-200 bg-slate-50/90';
  if (connectionState.value === 'verifying') return 'border-sky-200 bg-sky-50/90';
  return 'border-amber-200 bg-amber-50/90';
});

const connectionBannerIconClass = computed(() => {
  if (connectionState.value === 'offline') return 'bg-slate-200 text-slate-600';
  if (connectionState.value === 'verifying') return 'bg-sky-100 text-sky-700';
  return 'bg-amber-100 text-amber-700';
});

const showDmNegotiationBanner = computed(() => {
  const gid = sanitizeGroupId(activeGroup.value) || '';
  return Boolean(
    dmNegotiationState.value.active &&
      gid &&
      isDirectGroupId(gid) &&
      dmNegotiationState.value.groupId === gid
  );
});

const dmNegotiationPeerName = computed(() => {
  const peerUid = dmNegotiationState.value.peerUid || getDirectTargetUid(dmNegotiationState.value.groupId);
  if (!peerUid || peerUid === myUid.value) return '对方';
  const label = String(displayNameForUid(peerUid) || '').trim();
  return label || '对方';
});

const dmNegotiationTitle = computed(() => {
  return dmNegotiationState.value.phase === 'ready' ? '私聊安全会话已恢复' : '正在同步私聊安全会话';
});

const dmNegotiationText = computed(() => {
  const peer = dmNegotiationPeerName.value;
  if (dmNegotiationState.value.phase === 'ready') {
    return `已与 ${peer} 恢复端到端私聊会话，现在可以继续正常收发消息。`;
  }
  return `检测到 ${peer} 刚刷新或完成重连，正在重新协商端到端密钥并恢复消息解密。`;
});

const dmNegotiationBannerClass = computed(() => {
  if (dmNegotiationState.value.phase === 'ready') return 'border-emerald-200 bg-emerald-50/92';
  return 'border-sky-200 bg-sky-50/92';
});

const dmNegotiationIconClass = computed(() => {
  if (dmNegotiationState.value.phase === 'ready') return 'bg-emerald-100 text-emerald-700';
  return 'bg-sky-100 text-sky-700';
});

const dmNegotiationChipClass = computed(() => {
  if (dmNegotiationState.value.phase === 'ready') return 'text-emerald-700';
  return 'text-sky-700';
});

const dmNegotiationChipText = computed(() => {
  return dmNegotiationState.value.phase === 'ready' ? '已恢复' : '重新协商中';
});

const nicknameGuideSubmitLabel = computed(() => {
  const nickname = nicknameInput.value.trim();
  if (!nickname) return '保存并进入';
  return nickname === myNickname.value ? '进入聊天' : '保存并进入';
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

const avatarInitial = (text) => {
  const value = String(text || '').trim();
  if (!value) return 'U';
  return value[0].toUpperCase();
};

const avatarColor = (seed) => {
  const palette = [
    ['#64748b', '#475569'],
    ['#6b7280', '#4b5563'],
    ['#7c6f64', '#5b5047'],
    ['#6d7f72', '#516154'],
    ['#6f7f8f', '#536271'],
    ['#7b6d8d', '#5d526d'],
    ['#7d7a6a', '#5f5c50'],
    ['#6e7f86', '#506168'],
  ];
  const raw = String(seed || 'seed');
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  const [from, to] = palette[hash % palette.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
};

const displayNameForUid = (uid) => {
  const id = typeof uid === 'string' ? uid : '';
  if (!id) return '未知用户';
  if (id === myUid.value) return myNickname.value || '你';
  const contact = contacts.value.find((c) => c && c.onlineUid === id);
  if (contact) return contactDisplayName(contact);
  return `用户 ${id.slice(0, 6)}`;
};

const formatDefaultGroupNameFromDate = (label = '用户', date = new Date()) => {
  const safeLabel = typeof label === 'string' && label.trim() ? label.trim() : '用户';
  const safeDate = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const month = safeDate.getMonth() + 1;
  const day = safeDate.getDate();
  const hour = String(safeDate.getHours()).padStart(2, '0');
  const minute = String(safeDate.getMinutes()).padStart(2, '0');
  return `【${safeLabel}】在${month}月${day}日${hour}${minute}发起的群聊`;
};

const defaultGroupNameForMembers = (...uids) => {
  const firstUid = uids.find((uid) => typeof uid === 'string' && uid.trim()) || '';
  const rawName = firstUid === myUid.value ? (myNickname.value || '你') : displayNameForUid(firstUid);
  const name = String(rawName || '').trim() || (firstUid ? `用户 ${firstUid.slice(0, 6)}` : '用户');
  return formatDefaultGroupNameFromDate(name, new Date());
};

const estimateReadDurationMs = ({ text = '', payloadType = 'text', imageData = '', name = '' } = {}) => {
  const contentLength = String(text || '').trim().length + String(name || '').trim().length;
  const imageBonus = payloadType === 'image' || imageData ? 4500 : 0;
  const readingMs = 3500 + contentLength * 220 + imageBonus;
  return Math.max(10000, Math.min(45000, readingMs)) + 10000;
};

const makeWaveform = (size = VOICE_WAVEFORM_SIZE, seed = 0.16) => {
  return Array.from({ length: size }, (_, idx) => {
    const sway = Math.sin((idx / Math.max(1, size - 1)) * Math.PI) * 0.08;
    return Math.max(0.08, Math.min(1, seed + sway));
  });
};

const normalizeWaveform = (values, size = VOICE_WAVEFORM_SIZE) => {
  const input = Array.isArray(values) ? values.map((value) => Number(value) || 0) : [];
  if (!input.length) return makeWaveform(size);
  if (input.length === size) {
    return input.map((value) => Math.max(0.08, Math.min(1, value)));
  }
  const output = [];
  for (let idx = 0; idx < size; idx += 1) {
    const start = Math.floor((idx / size) * input.length);
    const end = Math.max(start + 1, Math.floor(((idx + 1) / size) * input.length));
    const slice = input.slice(start, end);
    const avg = slice.reduce((sum, value) => sum + value, 0) / Math.max(1, slice.length);
    output.push(Math.max(0.08, Math.min(1, avg)));
  }
  return output;
};

const formatDurationMs = (ms = 0) => {
  const totalSeconds = Math.max(0, Math.ceil((Number(ms) || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const pickVoiceRecorderMimeType = () => {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/webm',
  ];
  for (const mimeType of candidates) {
    if (typeof MediaRecorder.isTypeSupported !== 'function' || MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return '';
};

const measureAudioDurationMs = (src) => {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration * 1000) : 0);
    };
    audio.onerror = () => resolve(0);
    audio.src = src;
  });
};

const buildAudioBurnDurationMs = (durationMs = 0) => {
  const total = Math.max(10_000, Math.min(120_000, Math.round((Number(durationMs) || 0) + 10_000)));
  return total;
};

const resolveBurnDelayMs = (msg, overrideDelayMs = 0) => {
  const explicit = Number(overrideDelayMs) || 0;
  if (explicit > 0) return Math.max(1000, explicit);
  const stored = Number(msg?.burnAfterMs) || 0;
  if (msg?.payloadType === 'audio') {
    const durationMs = Math.max(0, Number(msg?.audioDurationMs) || 0);
    if (stored > durationMs) {
      return Math.max(10_000, stored - durationMs);
    }
    if (stored > 0) {
      return Math.max(10_000, stored);
    }
    return 10_000;
  }
  return Math.max(1000, stored || estimateReadDurationMs(msg));
};

const voiceComposerActive = computed(() => voiceComposer.value.state !== 'idle');
const voiceComposeState = computed(() => voiceComposer.value.state);
const voiceComposerWaveform = computed(() => normalizeWaveform(voiceComposer.value.waveform, VOICE_WAVEFORM_SIZE));
const voiceComposerElapsedLabel = computed(() => formatDurationMs(voiceComposer.value.elapsedMs));
const voiceComposerTitle = computed(() => {
  if (voiceComposeState.value === 'requesting') return '等待麦克风权限';
  if (voiceComposeState.value === 'recording') return '正在录音';
  if (voiceComposeState.value === 'encoding') return '正在整理语音';
  if (voiceComposeState.value === 'sending') return '语音发送中';
  return '';
});
const voiceComposerSubtitle = computed(() => {
  if (voiceComposeState.value === 'requesting') return '系统权限弹窗出现后，请允许使用麦克风';
  if (voiceComposeState.value === 'recording') return '波形会跟随你的声音轻微起伏，点击右侧完成发送';
  if (voiceComposeState.value === 'encoding') return '正在封装音频与波形数据';
  if (voiceComposeState.value === 'sending') return '消息气泡会在发送完成后平滑落位';
  return '';
});
const voiceComposerShellClass = computed(() => {
  if (voiceComposeState.value === 'requesting') return 'voice-shell-requesting voice-active';
  if (voiceComposeState.value === 'recording') return 'voice-shell-recording voice-active';
  if (voiceComposeState.value === 'encoding') return 'voice-shell-encoding';
  if (voiceComposeState.value === 'sending') return 'voice-shell-sending';
  return '';
});

const burnAfterReadPreviewText = computed(() => {
  const payloadType = 'text';
  const ms = estimateReadDurationMs({ text: inputMsg.value, payloadType });
  return `${Math.ceil(ms / 1000)}s 后焚毁`;
});

const refreshBurnClock = () => {
  burnNow.value = Date.now();
};

const ensureBurnTicker = () => {
  if (burnTicker) return;
  refreshBurnClock();
  burnTicker = window.setInterval(() => {
    refreshBurnClock();
  }, 1000);
};

const stopBurnTickerIfIdle = () => {
  if (burnTicker && burnTimers.size === 0) {
    window.clearInterval(burnTicker);
    burnTicker = 0;
  }
};

const burnCountdownMs = (msg) => {
  if (!msg?.burnAfterRead || !msg.burnAt) return 0;
  return Math.max(0, msg.burnAt - burnNow.value);
};

const burnCountdownCompact = (msg) => {
  const remainMs = burnCountdownMs(msg);
  if (!remainMs) return '即将';
  const totalSeconds = Math.ceil(remainMs / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const burnStatusLabel = (msg) => {
  if (!msg?.burnAfterRead) return '';
  if (shouldDelayAudioBurnUntilPlaybackEnds(msg) && !msg.audioListenedAt) return '焚 待听';
  if (!msg.burnAt) return '焚 待读';
  return `焚 ${burnCountdownCompact(msg)}`;
};

const audioWaveformForMessage = (msg) => {
  return normalizeWaveform(msg?.audioWaveform, 24);
};

const audioWaveformBarStyle = (value) => {
  const safe = Math.max(0.08, Math.min(1, Number(value) || 0));
  return { height: `${Math.round(10 + safe * 26)}px` };
};

const isAudioMessagePlaying = (msg) => {
  return Boolean(msg?.msgId && audioPlayback.value.msgId === msg.msgId && audioPlayback.value.playing);
};

const audioMessageProgress = (msg) => {
  if (!msg?.msgId || audioPlayback.value.msgId !== msg.msgId) return 0;
  const duration = audioPlayback.value.durationMs || msg.audioDurationMs || 0;
  if (!duration) return 0;
  return Math.max(0, Math.min(1, audioPlayback.value.currentTimeMs / duration));
};

const audioWaveformBarClass = (msg, idx) => {
  const bars = audioWaveformForMessage(msg);
  const progress = audioMessageProgress(msg);
  const played = progress > 0 && idx / Math.max(1, bars.length - 1) <= progress;
  if (msg?.sender === myUid.value) {
    return played ? 'voice-waveform-bar-outgoing-active' : 'voice-waveform-bar-outgoing';
  }
  return played ? 'voice-waveform-bar-active' : 'voice-waveform-bar-idle';
};

const audioMessageTimeLabel = (msg) => {
  if (!msg) return '0:00';
  if (audioPlayback.value.msgId === msg.msgId) {
    return `${formatDurationMs(audioPlayback.value.currentTimeMs)} / ${formatDurationMs(audioPlayback.value.durationMs || msg.audioDurationMs || 0)}`;
  }
  return formatDurationMs(msg.audioDurationMs || 0);
};

const updateAudioPlaybackState = () => {
  if (!voicePlaybackAudio) return;
  audioPlayback.value = {
    msgId: audioPlayback.value.msgId,
    currentTimeMs: Math.round((voicePlaybackAudio.currentTime || 0) * 1000),
    durationMs: Number.isFinite(voicePlaybackAudio.duration) ? Math.round(voicePlaybackAudio.duration * 1000) : (audioPlayback.value.durationMs || 0),
    playing: !voicePlaybackAudio.paused && !voicePlaybackAudio.ended,
  };
};

const ensureVoicePlaybackAudio = () => {
  if (voicePlaybackAudio) return voicePlaybackAudio;
  voicePlaybackAudio = new Audio();
  voicePlaybackAudio.preload = 'metadata';
  voicePlaybackAudio.addEventListener('loadedmetadata', updateAudioPlaybackState);
  voicePlaybackAudio.addEventListener('timeupdate', updateAudioPlaybackState);
  voicePlaybackAudio.addEventListener('play', updateAudioPlaybackState);
  voicePlaybackAudio.addEventListener('pause', updateAudioPlaybackState);
  voicePlaybackAudio.addEventListener('ended', () => {
    const finishedMsgId = audioPlayback.value.msgId;
    audioPlayback.value = {
      msgId: finishedMsgId,
      currentTimeMs: 0,
      durationMs: audioPlayback.value.durationMs,
      playing: false,
    };
    if (voicePlaybackAudio) {
      voicePlaybackAudio.currentTime = 0;
    }
    if (finishedMsgId) {
      const finishedMessage = messages.value.find((msg) => msg?.msgId === finishedMsgId);
      if (finishedMessage) {
        consumeAudioBurnMessage(finishedMessage);
      }
    }
  });
  return voicePlaybackAudio;
};

const stopAudioPlayback = () => {
  if (!voicePlaybackAudio) return;
  voicePlaybackAudio.pause();
  voicePlaybackAudio.currentTime = 0;
  audioPlayback.value = { msgId: '', currentTimeMs: 0, durationMs: 0, playing: false };
};

const toggleAudioPlayback = async (msg) => {
  if (!msg?.audioData || !msg.msgId) return;
  const audio = ensureVoicePlaybackAudio();
  if (audioPlayback.value.msgId === msg.msgId) {
    if (audio.paused) {
      await audio.play().catch(() => {});
    } else {
      audio.pause();
    }
    return;
  }
  audio.pause();
  audio.src = msg.audioData;
  audioPlayback.value = {
    msgId: msg.msgId,
    currentTimeMs: 0,
    durationMs: Number(msg.audioDurationMs) || 0,
    playing: false,
  };
  try {
    await audio.play();
  } catch {
    toast('音频播放失败。', 'error');
  }
};

const resetVoiceComposer = () => {
  voiceComposer.value = {
    state: 'idle',
    startedAt: 0,
    elapsedMs: 0,
    mimeType: '',
    waveform: [],
    level: 0,
  };
};

const stopVoiceMeter = () => {
  if (voiceMeterRaf) {
    window.cancelAnimationFrame(voiceMeterRaf);
    voiceMeterRaf = 0;
  }
  if (voiceElapsedTimer) {
    window.clearInterval(voiceElapsedTimer);
    voiceElapsedTimer = 0;
  }
  if (voiceSourceNode) {
    try {
      voiceSourceNode.disconnect();
    } catch {
      // no-op
    }
    voiceSourceNode = null;
  }
  if (voiceAnalyser) {
    try {
      voiceAnalyser.disconnect();
    } catch {
      // no-op
    }
    voiceAnalyser = null;
  }
  if (voiceAudioContext) {
    void voiceAudioContext.close().catch(() => {});
    voiceAudioContext = null;
  }
};

const stopVoiceTracks = () => {
  if (voiceMediaStream) {
    for (const track of voiceMediaStream.getTracks()) {
      track.stop();
    }
    voiceMediaStream = null;
  }
};

const sampleVoiceMeter = () => {
  if (!voiceAnalyser || voiceComposeState.value !== 'recording') return;
  const bins = new Uint8Array(voiceAnalyser.frequencyBinCount);
  voiceAnalyser.getByteFrequencyData(bins);
  const stride = Math.max(1, Math.floor(bins.length / 24));
  let total = 0;
  for (let idx = 0; idx < bins.length; idx += stride) {
    total += bins[idx];
  }
  const normalized = Math.max(0.08, Math.min(1, total / Math.max(1, Math.ceil(bins.length / stride)) / 180));
  voiceRecordedSamples.push(normalized);
  const waveform = normalizeWaveform(voiceRecordedSamples.slice(-VOICE_WAVEFORM_SIZE * 2), VOICE_WAVEFORM_SIZE);
  voiceComposer.value = {
    ...voiceComposer.value,
    level: normalized,
    waveform,
  };
  voiceMeterRaf = window.requestAnimationFrame(sampleVoiceMeter);
};

const beginVoiceMeter = (stream) => {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return;
  voiceAudioContext = new AudioContextCtor();
  voiceAnalyser = voiceAudioContext.createAnalyser();
  voiceAnalyser.fftSize = 64;
  voiceSourceNode = voiceAudioContext.createMediaStreamSource(stream);
  voiceSourceNode.connect(voiceAnalyser);
  voiceRecordedSamples = [];
  sampleVoiceMeter();
  voiceElapsedTimer = window.setInterval(() => {
    if (voiceComposeState.value !== 'recording') return;
    voiceComposer.value = {
      ...voiceComposer.value,
      elapsedMs: Math.max(0, Date.now() - voiceComposer.value.startedAt),
    };
  }, 200);
};

const finalizeVoiceBlob = async (blob) => {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const durationMs = Math.min(MAX_AUDIO_DURATION_MS, await measureAudioDurationMs(objectUrl));
    const dataUrl = await fileToDataUrl(blob);
    const approxBytes = estimateDataUrlBytes(dataUrl);
    if (approxBytes > MAX_AUDIO_BYTES) {
      toast('语音消息过大，请缩短录音时长。', 'error');
      return null;
    }
    return {
      dataUrl,
      mimeType: blob.type || voiceComposer.value.mimeType || 'audio/webm',
      durationMs,
      waveform: normalizeWaveform(voiceRecordedSamples, VOICE_WAVEFORM_SIZE),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const sendVoiceMessage = async ({ dataUrl, mimeType, durationMs, waveform }) => {
  const gid = sanitizeGroupId(activeGroup.value) || SYSTEM_GROUP;
  const replyTo = currentReplyPayload();
  const payload = {
    kind: 'audio',
    audioData: dataUrl,
    mimeType,
    durationMs,
    waveform,
    replyTo,
    burnAfterRead: burnAfterReadEnabled.value,
    burnAfterMs: burnAfterReadEnabled.value ? buildAudioBurnDurationMs(durationMs) : 0,
  };

  if (!ws || ws.readyState !== WS_OPEN) {
    queueOutgoingMessage('audio', payload, gid);
    clearReplyDraft();
    return true;
  }
  if (!powState.value.verified) {
    pushSendBlockedTip(gid, {
      title: '发送前需安全验证',
      text: '系统正在进行反机器人校验，校验完成后可继续发送。',
      actions: [
        buildExplanationAction({
          label: '为什么要验证',
          title: '为什么发送前要验证',
          text: '当前连接需要重新完成安全校验，系统会借此识别异常脚本或刷消息行为，避免群聊被滥用。',
          tip: '保持页面在线，等待校验完成后再发送即可。',
        }),
      ],
      dedupeKey: 'voice-send-pow-required',
    });
    toast('正在进行反机器人验证…', 'info');
    void startPowSolve();
    return false;
  }
  if (isDirectGroupId(activeGroup.value) && isDmLocked(activeGroup.value)) {
    pushDmLimitTip(activeGroup.value, getDirectTargetUid(activeGroup.value));
    toast('你不在对方通讯录：请等待对方回复，或先申请加入对方通讯录。', 'info');
    return false;
  }
  const ok = await sendEncryptedPayload('audio', payload);
  if (ok) {
    clearReplyDraft();
  }
  return ok;
};

const cleanupVoiceRecorder = () => {
  voicePendingSend = false;
  if (voiceMediaRecorder && voiceMediaRecorder.state !== 'inactive') {
    try {
      voiceMediaRecorder.stop();
    } catch {
      // no-op
    }
  }
  voiceMediaRecorder = null;
  stopVoiceMeter();
  stopVoiceTracks();
  voiceRecordedChunks = [];
  voiceRecordedSamples = [];
};

const startVoiceRecording = async () => {
  if (voiceComposerActive.value) return;
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    toast('当前浏览器不支持语音录制。', 'error');
    return;
  }
  closeComposerMenu();
  voiceRequestToken += 1;
  const token = voiceRequestToken;
  voiceComposer.value = {
    state: 'requesting',
    startedAt: 0,
    elapsedMs: 0,
    mimeType: pickVoiceRecorderMimeType(),
    waveform: makeWaveform(),
    level: 0,
  };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (token !== voiceRequestToken) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      return;
    }
    const mimeType = pickVoiceRecorderMimeType();
    voiceMediaStream = stream;
    voiceRecordedChunks = [];
    voiceRecordedSamples = [];
    voicePendingSend = true;
    voiceMediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    voiceMediaRecorder.ondataavailable = (event) => {
      if (event.data?.size) {
        voiceRecordedChunks.push(event.data);
      }
    };
    voiceMediaRecorder.onstop = async () => {
      const shouldSend = voicePendingSend;
      const blob = voiceRecordedChunks.length
        ? new Blob(voiceRecordedChunks, { type: voiceMediaRecorder?.mimeType || mimeType || 'audio/webm' })
        : null;
      stopVoiceMeter();
      stopVoiceTracks();
      voiceMediaRecorder = null;
      if (!shouldSend || !blob || !blob.size) {
        resetVoiceComposer();
        voiceRecordedChunks = [];
        voiceRecordedSamples = [];
        return;
      }
      voiceComposer.value = { ...voiceComposer.value, state: 'encoding' };
      const prepared = await finalizeVoiceBlob(blob);
      if (!prepared) {
        resetVoiceComposer();
        voiceRecordedChunks = [];
        voiceRecordedSamples = [];
        return;
      }
      voiceComposer.value = {
        ...voiceComposer.value,
        state: 'sending',
        elapsedMs: prepared.durationMs,
        waveform: prepared.waveform,
      };
      const ok = await sendVoiceMessage(prepared);
      if (!ok) {
        toast('语音消息未发送。', 'info');
      }
      resetVoiceComposer();
      voiceRecordedChunks = [];
      voiceRecordedSamples = [];
    };
    voiceMediaRecorder.start(250);
    voiceComposer.value = {
      state: 'recording',
      startedAt: Date.now(),
      elapsedMs: 0,
      mimeType: voiceMediaRecorder.mimeType || mimeType || 'audio/webm',
      waveform: makeWaveform(),
      level: 0,
    };
    beginVoiceMeter(stream);
  } catch {
    resetVoiceComposer();
    toast('未获得麦克风权限或录音启动失败。', 'error');
  }
};

const cancelVoiceRecording = () => {
  if (voiceComposeState.value === 'sending' || voiceComposeState.value === 'encoding') return;
  if (voiceComposeState.value === 'requesting') {
    voiceRequestToken += 1;
    resetVoiceComposer();
    return;
  }
  voicePendingSend = false;
  if (voiceMediaRecorder && voiceMediaRecorder.state !== 'inactive') {
    voiceMediaRecorder.stop();
    return;
  }
  cleanupVoiceRecorder();
  resetVoiceComposer();
};

const finishVoiceRecording = () => {
  if (voiceComposeState.value !== 'recording') return;
  const elapsedMs = Date.now() - voiceComposer.value.startedAt;
  if (elapsedMs < 800) {
    toast('录音时间太短。', 'info');
    return;
  }
  if (elapsedMs > MAX_AUDIO_DURATION_MS) {
    toast('语音消息最长 60 秒。', 'info');
    cancelVoiceRecording();
    return;
  }
  voicePendingSend = true;
  voiceComposer.value = { ...voiceComposer.value, elapsedMs };
  if (voiceMediaRecorder && voiceMediaRecorder.state !== 'inactive') {
    voiceMediaRecorder.stop();
  }
};

const clearBurnTimer = (msgId) => {
  const timer = burnTimers.get(msgId);
  if (timer) {
    window.clearTimeout(timer);
    burnTimers.delete(msgId);
    stopBurnTickerIfIdle();
  }
};

const shouldDelayAudioBurnUntilPlaybackEnds = (msg) => {
  return Boolean(
    msg &&
    msg.payloadType === 'audio' &&
    msg.burnAfterRead === true &&
    msg.sender !== myUid.value
  );
};

const removeMessageById = (msgId) => {
  if (!msgId) return;
  clearBurnTimer(msgId);
  messages.value = messages.value.filter((msg) => msg.msgId !== msgId);
  if (readReceiptModal.value.msgId === msgId) {
    closeReadReceipts();
  }
};

const scheduleBurnMessage = (msg, delayMs = 0) => {
  if (!msg?.msgId || msg.burnScheduledAt) return;
  const timeout = resolveBurnDelayMs(msg, delayMs);
  msg.burnScheduledAt = Date.now();
  msg.burnAt = msg.burnScheduledAt + timeout;
  refreshBurnClock();
  ensureBurnTicker();
  const timer = window.setTimeout(() => {
    removeMessageById(msg.msgId);
  }, timeout);
  burnTimers.set(msg.msgId, timer);
};

const consumeAudioBurnMessage = (msg) => {
  if (!shouldDelayAudioBurnUntilPlaybackEnds(msg) || msg.audioListenedAt) return;
  msg.audioListenedAt = Date.now();
  msg.localSeen = true;
  if (!msg.isSystem && msg.msgId && msg.sender) {
    sendReadReceipt(msg.sender, msg.msgId, msg.groupId || SYSTEM_GROUP);
  }
  scheduleBurnMessage(msg);
};

const isGroupSelected = (groupId) => {
  const gid = sanitizeGroupId(groupId);
  if (!gid) return false;
  return gid === SYSTEM_NOTICE_GROUP ? systemNoticeOpen.value : activeGroup.value === gid;
};

const messageSpacingClass = (msg) => {
  if (!msg) return 'mt-3 first:mt-0';
  if (msg.payloadType === 'dm_limit_tip' || msg.payloadType === 'send_block_tip' || msg.payloadType === 'system') {
    return 'mt-3 first:mt-0';
  }
  return msg.clusterStart ? 'mt-2.5 first:mt-0' : 'mt-1';
};

const messageBubbleClass = (msg) => {
  const outgoing = msg?.sender === myUid.value;
  const classes = ['rounded-2xl', 'px-3', 'py-2'];
  if (outgoing) {
    classes.push('bg-[#4c93ff]', 'text-white', 'ring-sky-400/25');
    classes.push(msg?.clusterStart ? 'rounded-tr-2xl' : 'rounded-tr-lg');
    classes.push(msg?.clusterEnd ? 'rounded-br-md' : 'rounded-br-lg');
  } else {
    classes.push('bg-white', 'text-slate-800', 'ring-slate-200/80');
    classes.push(msg?.clusterStart ? 'rounded-tl-2xl' : 'rounded-tl-lg');
    classes.push(msg?.clusterEnd ? 'rounded-bl-md' : 'rounded-bl-lg');
  }
  return classes.join(' ');
};

const systemMessageKind = (msg) => {
  const metaKind = typeof msg?.systemMeta?.kind === 'string' ? msg.systemMeta.kind : '';
  if (metaKind) return metaKind;
  const text = `${msg?.systemTitle || ''} ${msg?.systemText || ''}`;
  if (text.includes('群')) return 'group';
  if (text.includes('通讯录')) return 'contact';
  if (text.includes('迁移')) return 'migration';
  if (text.includes('通知') || text.includes('提醒')) return 'notice';
  return 'default';
};

const systemMessageTargetGroupId = (msg) => {
  return sanitizeGroupId(msg?.systemMeta?.groupId || msg?.systemMeta?.pairGroupId || '');
};

const systemMessageTargetLabel = (msg) => {
  const gid = systemMessageTargetGroupId(msg);
  if (!gid) return '';
  return (
    groups.value.find((group) => group.id === gid)?.name ||
    (typeof msg?.systemMeta?.groupName === 'string' ? msg.systemMeta.groupName : '') ||
    gid
  );
};

const systemCardEyebrow = (msg) => {
  const kind = systemMessageKind(msg);
  if (kind.startsWith('group')) return '群聊动态';
  if (kind.startsWith('contact')) return '通讯录';
  if (kind.startsWith('migration')) return '设备迁移';
  if (kind.includes('approval') || kind.includes('request')) return '待处理';
  if (kind === 'notice') return '通知';
  return '系统消息';
};

const systemCardEyebrowClass = (msg) => {
  const kind = systemMessageKind(msg);
  if (kind.startsWith('group')) return 'text-sky-600';
  if (kind.startsWith('contact')) return 'text-emerald-600';
  if (kind.startsWith('migration')) return 'text-amber-600';
  if (kind.includes('approval') || kind.includes('request')) return 'text-rose-600';
  return 'text-slate-500';
};

const systemCardDotClass = (msg) => {
  const kind = systemMessageKind(msg);
  if (kind.startsWith('group')) return 'bg-sky-500';
  if (kind.startsWith('contact')) return 'bg-emerald-500';
  if (kind.startsWith('migration')) return 'bg-amber-500';
  if (kind.includes('approval') || kind.includes('request')) return 'bg-rose-500';
  return 'bg-slate-400';
};

const systemCardSurfaceClass = (msg) => {
  const kind = systemMessageKind(msg);
  if (kind.startsWith('group')) return 'border-sky-100 bg-sky-50/85';
  if (kind.startsWith('contact')) return 'border-emerald-100 bg-emerald-50/80';
  if (kind.startsWith('migration')) return 'border-amber-100 bg-amber-50/80';
  if (kind.includes('approval') || kind.includes('request')) return 'border-rose-100 bg-rose-50/80';
  return 'border-slate-200 bg-slate-50/90';
};

const systemCardPreviewUsers = (msg) => {
  const output = [];
  const seen = new Set();
  const pushUser = (uid, nickname = '') => {
    const id = typeof uid === 'string' ? uid : '';
    if (!id || seen.has(id)) return;
    seen.add(id);
    output.push({
      uid: id,
      uidShort: id.slice(0, 6) || '未知',
      nickname: typeof nickname === 'string' ? nickname : '',
    });
  };

  const previewUsers = Array.isArray(msg?.systemMeta?.previewUsers) ? msg.systemMeta.previewUsers : [];
  for (const user of previewUsers) {
    pushUser(user?.uid, user?.nickname || '');
    if (output.length >= 4) return output;
  }

  pushUser(msg?.systemMeta?.ownerUid, msg?.systemMeta?.ownerNickname || '');
  pushUser(msg?.systemMeta?.requesterUid, msg?.systemMeta?.requesterNickname || '');
  pushUser(msg?.systemMeta?.peerUid, msg?.systemMeta?.peerNickname || '');

  if (systemMessageTargetGroupId(msg) && myUid.value) {
    pushUser(myUid.value, myNickname.value || '你');
  }

  return output.slice(0, 4);
};

const systemCardPreviewSummary = (msg) => {
  const label = systemMessageTargetLabel(msg);
  const users = systemCardPreviewUsers(msg);
  if (label && users.length) {
    return `${label} · ${users.map((user) => user.nickname || user.uidShort).join('、')}`;
  }
  if (label) return `${label} · 可通过下方按钮继续处理`;
  if (users.length) return users.map((user) => user.nickname || user.uidShort).join('、');
  return '请使用下方按钮处理这条系统通知。';
};

const systemCardActions = (msg) => {
  const actions = normalizeSystemActions(msg?.systemActions, msg?.systemAction, msg?.systemActionLabel)
    .filter((item) => item.action !== 'open_system_notice')
    .map((item) => ({ ...item }));
  const kind = systemMessageKind(msg);

  // 不再自动添加"进入群聊"按钮 — 用户可通过侧边栏进入群聊
  if (kind.startsWith('contact') && !actions.some((item) => item.action === 'open_contacts')) {
    actions.push({ action: 'open_contacts', label: '打开通讯录' });
  }
  if (kind.startsWith('migration') && msg?.systemMeta?.code && !actions.some((item) => item.action === 'confirm_migration')) {
    actions.unshift({ action: 'confirm_migration', label: '确认迁移', code: msg.systemMeta.code });
  }

  return actions.slice(0, 3);
};

const upsertGroupMeta = (groupId, groupName = '', ownerUid = '', inviteApprovalRequired = null, announcement = null) => {
  const gid = sanitizeGroupId(groupId);
  if (!gid) return;
  const prev = groupMetaMap.value[gid] || {};
  const next = {
    groupId: gid,
    groupName: groupName || prev.groupName || gid,
    ownerUid: ownerUid || prev.ownerUid || '',
    announcement:
      typeof announcement === 'string'
        ? announcement.trim().slice(0, GROUP_ANNOUNCEMENT_MAX)
        : (typeof prev.announcement === 'string' ? prev.announcement : ''),
    inviteApprovalRequired:
      typeof inviteApprovalRequired === 'boolean'
        ? inviteApprovalRequired
        : prev.inviteApprovalRequired !== false,
  };
  groupMetaMap.value = { ...groupMetaMap.value, [gid]: next };
  ensureGroupInList(gid, next.groupName);
  if (gid === activeGroup.value && groupRenameInput.value.trim() === '') {
    groupRenameInput.value = next.groupName;
  }
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

const buildExplanationAction = ({
  label = '了解原因',
  title = '原因说明',
  text = '',
  tip = '',
} = {}) => ({
  action: 'show_explanation',
  label,
  title,
  text,
  tip,
});

const openExplanationModal = ({ title = '原因说明', text = '', tip = '' } = {}) => {
  explanationModal.value = {
    open: true,
    title: title || '原因说明',
    text: text || '当前操作暂时无法完成。',
    tip: tip || '',
  };
};

const closeExplanationModal = () => {
  explanationModal.value = { open: false, title: '', text: '', tip: '' };
};

const normalizeOutboxPayload = (payloadType, payload) => {
  const source = payload && typeof payload === 'object' ? payload : {};
  if (payloadType === 'image') {
    if (typeof source.imageData !== 'string' || !source.imageData) return null;
    return {
      kind: 'image',
      imageData: source.imageData,
      mimeType: typeof source.mimeType === 'string' ? source.mimeType : '',
      name: typeof source.name === 'string' ? source.name : '',
      replyTo: normalizeReplyPayload(source.replyTo),
      burnAfterRead: source.burnAfterRead === true,
      burnAfterMs: Math.max(0, Number(source.burnAfterMs) || 0),
    };
  }
  if (payloadType === 'audio') {
    if (typeof source.audioData !== 'string' || !source.audioData) return null;
    return {
      kind: 'audio',
      audioData: source.audioData,
      mimeType: typeof source.mimeType === 'string' ? source.mimeType : '',
      durationMs: Math.max(0, Number(source.durationMs) || 0),
      waveform: Array.isArray(source.waveform) ? source.waveform : [],
      replyTo: normalizeReplyPayload(source.replyTo),
      burnAfterRead: source.burnAfterRead === true,
      burnAfterMs: Math.max(0, Number(source.burnAfterMs) || 0),
    };
  }
  if (payloadType === 'invite') {
    if (typeof source.inviteCode !== 'string' || !source.inviteCode) return null;
    return {
      kind: 'invite',
      inviteCode: source.inviteCode,
      inviteLink: typeof source.inviteLink === 'string' ? source.inviteLink : '',
      inviteGroup: typeof source.inviteGroup === 'string' ? source.inviteGroup : '',
      inviteGroupName: typeof source.inviteGroupName === 'string' ? source.inviteGroupName : '',
      expiresAt: Number(source.expiresAt) || null,
      replyTo: normalizeReplyPayload(source.replyTo),
    };
  }
  if (payloadType === 'pair') {
    if (typeof source.pairGroupId !== 'string' || !source.pairGroupId) return null;
    return {
      kind: 'pair',
      pairGroupId: source.pairGroupId,
      pairInviteCode: typeof source.pairInviteCode === 'string' ? source.pairInviteCode : '',
      pairInviteLink: typeof source.pairInviteLink === 'string' ? source.pairInviteLink : '',
      pairGroupName: typeof source.pairGroupName === 'string' ? source.pairGroupName : '',
      pairStatus: typeof source.pairStatus === 'string' ? source.pairStatus : 'pending',
      expiresAt: Number(source.expiresAt) || null,
      replyTo: normalizeReplyPayload(source.replyTo),
    };
  }
  if (typeof source.text !== 'string' || !source.text.trim()) return null;
  return {
    kind: 'text',
    text: source.text,
    replyTo: normalizeReplyPayload(source.replyTo),
    burnAfterRead: source.burnAfterRead === true,
    burnAfterMs: Math.max(0, Number(source.burnAfterMs) || 0),
  };
};

const normalizeOutboxEntry = (entry) => {
  const msgId = typeof entry?.msgId === 'string' ? entry.msgId.trim() : '';
  const groupId = sanitizeGroupId(entry?.groupId) || SYSTEM_GROUP;
  const payloadType =
    entry?.payloadType === 'image'
      ? 'image'
      : entry?.payloadType === 'audio'
        ? 'audio'
        : entry?.payloadType === 'invite'
          ? 'invite'
          : entry?.payloadType === 'pair'
            ? 'pair'
            : 'text';
  if (!msgId) return null;
  const createdAt = Math.max(0, Number(entry?.createdAt) || Date.now());
  if (Date.now() - createdAt > OUTBOX_MAX_AGE_MS) return null;
  const payload = normalizeOutboxPayload(payloadType, entry?.payload);
  if (!payload) return null;
  return {
    msgId,
    groupId,
    payloadType,
    payload,
    createdAt,
    retries: Math.max(0, Number(entry?.retries) || 0),
  };
};

const normalizeOutboxQueueEntries = (entries) => {
  const list = Array.isArray(entries) ? entries : [];
  const deduped = new Map();
  for (const rawEntry of list) {
    const entry = normalizeOutboxEntry(rawEntry);
    if (!entry) continue;
    const prev = deduped.get(entry.msgId);
    if (!prev || entry.createdAt >= prev.createdAt) {
      deduped.set(entry.msgId, entry);
    }
  }
  return Array.from(deduped.values()).sort((a, b) => a.createdAt - b.createdAt);
};

const pruneOutboxQueue = () => {
  const normalized = normalizeOutboxQueueEntries(outboxQueue.value).filter((entry) => {
    const local = findLocalOutgoing(entry.msgId);
    return !(local && (local.clientStatus === 'delivered' || local.clientStatus === 'read'));
  });
  const changed =
    normalized.length !== outboxQueue.value.length ||
    normalized.some((entry, index) => {
      const prev = outboxQueue.value[index];
      return !prev || prev.msgId !== entry.msgId || prev.groupId !== entry.groupId || prev.payloadType !== entry.payloadType;
    });
  if (!changed) return;
  outboxQueue.value = normalized;
  persistOutboxQueue();
};

const loadOutboxQueue = () => {
  try {
    const raw = window.localStorage.getItem('telechat.outbox.v1');
    outboxQueue.value = normalizeOutboxQueueEntries(raw ? JSON.parse(raw) : []);
  } catch {
    outboxQueue.value = [];
  }
};

const persistOutboxQueue = () => {
  try {
    window.localStorage.setItem('telechat.outbox.v1', JSON.stringify(outboxQueue.value));
  } catch {
    // no-op
  }
};

const enqueueOutbox = (groupId, payloadType, payload, preferredMsgId = '') => {
  const gid = sanitizeGroupId(groupId) || SYSTEM_GROUP;
  const msgId = typeof preferredMsgId === 'string' && preferredMsgId
    ? preferredMsgId
    : `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  outboxQueue.value.push({
    msgId,
    groupId: gid,
    payloadType,
    payload,
    createdAt: Date.now(),
    retries: 0,
  });
  persistOutboxQueue();
  return msgId;
};

const findOutboxEntry = (msgId) => {
  if (!msgId) return null;
  return outboxQueue.value.find((item) => item.msgId === msgId) || null;
};

const ensureOutboxEntry = (groupId, payloadType, payload, msgId = '') => {
  const gid = sanitizeGroupId(groupId) || SYSTEM_GROUP;
  const finalMsgId = typeof msgId === 'string' && msgId ? msgId : `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const existing = findOutboxEntry(finalMsgId);
  if (existing) {
    existing.groupId = gid;
    existing.payloadType = payloadType;
    existing.payload = payload;
    persistOutboxQueue();
    return finalMsgId;
  }
  return enqueueOutbox(gid, payloadType, payload, finalMsgId);
};

const removeOutboxEntry = (msgId) => {
  if (!msgId) return;
  const idx = outboxQueue.value.findIndex((item) => item.msgId === msgId);
  if (idx < 0) return;
  outboxQueue.value.splice(idx, 1);
  persistOutboxQueue();
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
  if (!ws || ws.readyState !== WS_OPEN) {
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

const normalizeMobileRoute = (route = {}) => {
  const view = typeof route?.view === 'string' ? route.view : 'messages';
  const groupId = sanitizeGroupId(route?.groupId || '');
  if (view === 'contacts' || view === 'settings' || view === 'system_notice') {
    return { view, groupId: '' };
  }
  if ((view === 'chat' || view === 'group_manage') && groupId) {
    return { view, groupId };
  }
  return { view: 'messages', groupId: '' };
};

const currentMobileRoute = () => {
  if (groupManageOpen.value) {
    return normalizeMobileRoute({ view: 'group_manage', groupId: activeGroup.value });
  }
  if (systemNoticeOpen.value) {
    return normalizeMobileRoute({ view: 'system_notice' });
  }
  if (activeGroup.value !== SYSTEM_GROUP && activeGroup.value !== SYSTEM_NOTICE_GROUP) {
    return normalizeMobileRoute({ view: 'chat', groupId: activeGroup.value });
  }
  if (mobilePrimaryTab.value === 'contacts') {
    return normalizeMobileRoute({ view: 'contacts' });
  }
  if (mobilePrimaryTab.value === 'settings') {
    return normalizeMobileRoute({ view: 'settings' });
  }
  return normalizeMobileRoute({ view: 'messages' });
};

const mobileRouteSignature = (route) => JSON.stringify(normalizeMobileRoute(route));

const buildMobileRouteUrl = (route) => {
  const normalized = normalizeMobileRoute(route);
  const url = new URL(window.location.href);
  for (const key of ['page', 'panel']) {
    url.searchParams.delete(key);
  }
  if (normalized.view === 'chat' || normalized.view === 'group_manage') {
    if (normalized.groupId) {
      url.searchParams.set('group', normalized.groupId);
    }
  } else {
    url.searchParams.delete('group');
  }
  if (normalized.view === 'contacts') {
    url.searchParams.set('page', 'contacts');
  } else if (normalized.view === 'settings') {
    url.searchParams.set('page', 'settings');
  } else if (normalized.view === 'system_notice') {
    url.searchParams.set('page', 'notices');
  }
  if (normalized.view === 'group_manage' && normalized.groupId) {
    url.searchParams.set('panel', 'manage');
  }
  const query = url.searchParams.toString();
  return `${url.pathname}${query ? `?${query}` : ''}`;
};

const scheduleMobileHistoryPush = () => {
  if (!mobileViewport.value) return;
  pendingMobileHistoryMode = 'push';
};

const applyMobileRoute = (route, options = {}) => {
  const normalized = normalizeMobileRoute(route);
  mobileHistoryInternal.value = true;
  showMobilePanel.value = false;
  systemNoticeOpen.value = normalized.view === 'system_notice';
  groupManageOpen.value = false;
  if (normalized.view === 'messages' || normalized.view === 'contacts' || normalized.view === 'settings' || normalized.view === 'system_notice') {
    activeGroup.value = SYSTEM_GROUP;
    mobilePrimaryTab.value =
      normalized.view === 'contacts' ? 'contacts' : normalized.view === 'settings' ? 'settings' : 'messages';
    if (normalized.view === 'system_notice') {
      clearUnread(SYSTEM_NOTICE_GROUP);
    }
  } else if (normalized.groupId) {
    mobilePrimaryTab.value = 'messages';
    ensureGroupInList(normalized.groupId);
    activeGroup.value = normalized.groupId;
    if (normalized.view === 'group_manage' && !isDirectGroupId(normalized.groupId) && normalized.groupId !== SYSTEM_NOTICE_GROUP) {
      groupManageOpen.value = true;
      requestGroupMembersForGroup(normalized.groupId);
    }
  }
  lastMobileHistorySignature = mobileRouteSignature(normalized);
  pendingMobileHistoryMode = options.historyMode === 'push' ? 'push' : 'replace';
  window.setTimeout(() => {
    mobileHistoryInternal.value = false;
  }, 0);
};

const syncMobileHistory = () => {
  if (!mobileViewport.value || !mobileHistoryReady || mobileHistoryInternal.value) return;
  const route = currentMobileRoute();
  const signature = mobileRouteSignature(route);
  const url = buildMobileRouteUrl(route);
  const mode = pendingMobileHistoryMode === 'push' && signature !== lastMobileHistorySignature ? 'pushState' : 'replaceState';
  window.history[mode]({ telechatMobile: route }, '', url);
  lastMobileHistorySignature = signature;
  pendingMobileHistoryMode = 'replace';
};

const parseMobileRouteFromUrl = () => {
  const url = new URL(window.location.href);
  const page = String(url.searchParams.get('page') || '').trim();
  const groupId = sanitizeGroupId(url.searchParams.get('group') || '');
  const panel = String(url.searchParams.get('panel') || '').trim();
  if (groupId && panel === 'manage') return normalizeMobileRoute({ view: 'group_manage', groupId });
  if (groupId) return normalizeMobileRoute({ view: 'chat', groupId });
  if (page === 'contacts') return normalizeMobileRoute({ view: 'contacts' });
  if (page === 'settings') return normalizeMobileRoute({ view: 'settings' });
  if (page === 'notices') return normalizeMobileRoute({ view: 'system_notice' });
  return normalizeMobileRoute({ view: 'messages' });
};

const hasMobileRouteInUrl = () => {
  const url = new URL(window.location.href);
  return Boolean(url.searchParams.get('group') || url.searchParams.get('page') || url.searchParams.get('panel'));
};

const initializeMobileHistory = () => {
  if (!mobileViewport.value || mobileHistoryReady) return;
  const route = hasMobileRouteInUrl() ? parseMobileRouteFromUrl() : currentMobileRoute();
  applyMobileRoute(route);
  mobileHistoryReady = true;
  syncMobileHistory();
};

const handleMobilePopState = (event) => {
  if (!mobileViewport.value) return;
  const route = event.state?.telechatMobile ? normalizeMobileRoute(event.state.telechatMobile) : parseMobileRouteFromUrl();
  applyMobileRoute(route);
};

const switchMobilePrimaryTab = (tab) => {
  if (!mobileViewport.value) return;
  scheduleMobileHistoryPush();
  applyMobileRoute({ view: tab === 'contacts' ? 'contacts' : tab === 'settings' ? 'settings' : 'messages' }, { historyMode: 'push' });
};

const openContacts = () => {
  if (mobileViewport.value) {
    switchMobilePrimaryTab('contacts');
    if (powState.value.verified && deviceBound.value) {
      requestContacts();
    }
    return;
  }
  systemNoticeOpen.value = false;
  contactsOpen.value = true;
  if (!powState.value.verified) {
    toast('正在验证连接，通讯录稍后加载。', 'info');
  }
  requestContacts();
};

const openSettingsPage = () => {
  if (mobileViewport.value) {
    switchMobilePrimaryTab('settings');
    return;
  }
  settingsOpen.value = true;
};

// ===== 设备 ID + 好友系统 =====

const myDeviceQRSvg = computed(() => {
  if (!myUid.value) return '';
  return generateDeviceQRSvg(myUid.value, 180);
});

const copyMyDeviceId = async () => {
  if (!myUid.value) return;
  const shareString = buildDeviceShareString(myUid.value);
  try {
    await navigator.clipboard.writeText(shareString);
    toast('设备 ID 已复制，分享给好友即可添加。', 'info');
  } catch {
    toast('复制失败，请手动复制。', 'error');
  }
};

const saveDeviceCard = () => {
  if (!myUid.value) return;
  const svgStr = generateDeviceQRSvg(myUid.value, 280);
  const cardW = 360;
  const cardH = 480;
  const canvas = document.createElement('canvas');
  canvas.width = cardW * 2;
  canvas.height = cardH * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  // 背景
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, cardW, cardH);

  // 顶部色条
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, cardW, 56);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px -apple-system, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LINKCONNECT', cardW / 2, 36);

  // QR 码
  const img = new Image();
  const blob = new Blob([svgStr], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  img.onload = () => {
    const qrSize = 200;
    const qrX = (cardW - qrSize) / 2;
    const qrY = 80;
    // 白色圆角背景
    ctx.fillStyle = '#fff';
    roundRect(ctx, qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 12);
    ctx.fill();
    ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
    URL.revokeObjectURL(url);

    // 设备 ID 文字
    ctx.fillStyle = '#334155';
    ctx.font = '13px "SF Mono", Menlo, monospace';
    ctx.textAlign = 'center';
    const shortId = myUid.value.length > 28 ? myUid.value.slice(0, 28) + '…' : myUid.value;
    ctx.fillText(shortId, cardW / 2, qrY + qrSize + 40);

    // 提示文字
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px -apple-system, "Segoe UI", sans-serif';
    ctx.fillText('扫码添加好友', cardW / 2, qrY + qrSize + 64);

    // 下载
    canvas.toBlob((b) => {
      if (!b) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'linkconnect-card.png';
      a.click();
      URL.revokeObjectURL(a.href);
      toast('名片已保存。', 'info');
    }, 'image/png');
  };
  img.src = url;
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

const openAddFriendDialog = () => {
  addFriendDialog.value = { open: true, deviceIdInput: '', error: '', mode: 'input' };
  settingsOpen.value = false;
};

const submitAddFriend = () => {
  const input = addFriendDialog.value.deviceIdInput.trim();
  if (!input) {
    addFriendDialog.value.error = '请输入设备 ID';
    return;
  }

  const deviceId = parseDeviceShareString(input);
  if (!deviceId) {
    addFriendDialog.value.error = '格式不正确，支持 LC:xxx 或纯设备 ID';
    return;
  }

  if (deviceId === myUid.value) {
    addFriendDialog.value.error = '不能添加自己为好友';
    return;
  }

  addFriendDialog.value.error = '';
  addFriendDialog.value.open = false;

  // 发起私聊
  const dmGroupId = buildDirectGroupId(myUid.value, deviceId);
  if (!dmGroupId) return;
  if (!ws || ws.readyState !== WS_OPEN) return;
  ws.send(JSON.stringify({ type: 'direct_start', groupId: dmGroupId, targetUid: deviceId }));
  toast('已发送私聊请求。', 'info');
};

const scanFriendQR = async () => {
  try {
    const { startQRScanner } = await import('./lib/qrcode.js');
    const result = await startQRScanner();
    if (result) {
      const deviceId = parseDeviceShareString(result);
      if (deviceId) {
        addFriendDialog.value.deviceIdInput = result;
        addFriendDialog.value.mode = 'input';
        submitAddFriend();
      } else {
        addFriendDialog.value.error = '未识别到有效的设备 ID';
      }
    }
  } catch (e) {
    addFriendDialog.value.error = e.message || '摄像头不可用，请手动输入';
  }
};

const onPickQrImage = async (event) => {
  const file = event?.target?.files?.[0];
  if (event?.target) event.target.value = '';
  if (!file) return;

  try {
    // 使用 BarcodeDetector API 识别图片中的二维码
    if ('BarcodeDetector' in window) {
      const detector = new BarcodeDetector({ formats: ['qr_code'] });
      const bitmap = await createImageBitmap(file);
      const barcodes = await detector.detect(bitmap);
      if (barcodes.length > 0) {
        const rawValue = barcodes[0].rawValue;
        const deviceId = parseDeviceShareString(rawValue);
        if (deviceId) {
          addFriendDialog.value.deviceIdInput = rawValue;
          addFriendDialog.value.mode = 'input';
          submitAddFriend();
          return;
        }
        addFriendDialog.value.error = '二维码内容非有效设备 ID';
        return;
      }
      addFriendDialog.value.error = '未检测到二维码，请换一张清晰的图片';
      return;
    }

    // 降级方案：用 canvas 读取后交给用户手动粘贴
    addFriendDialog.value.error = '浏览器不支持自动识别，请手动输入设备 ID';
    addFriendDialog.value.mode = 'input';
  } catch (e) {
    addFriendDialog.value.error = e.message || '图片识别失败，请手动输入';
    addFriendDialog.value.mode = 'input';
  }
};

const openSystemNoticePanel = () => {
  if (mobileViewport.value) {
    scheduleMobileHistoryPush();
    systemNoticeFullscreen.value = false;
  }
  systemNoticeOpen.value = true;
  if (banner.value.groupId === SYSTEM_NOTICE_GROUP) {
    banner.value.open = false;
  }
  clearUnread(SYSTEM_NOTICE_GROUP);
};

const closeSystemNoticePanel = () => {
  systemNoticeOpen.value = false;
  systemNoticeFullscreen.value = false;
  if (mobileViewport.value) {
    pendingMobileHistoryMode = 'replace';
  }
};

const toggleDmPreference = () => {
  if (!ws || ws.readyState !== WS_OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  if (!deviceBound.value) {
    toast('请先完成设备绑定。', 'info');
    return;
  }
  dmPreferenceSaving.value = true;
  ws.send(JSON.stringify({ type: 'set_dm_pref', contactsOnly: !dmContactsOnly.value }));
};

const respondDirectRequest = (requestId, approve) => {
  if (!requestId || !ws || ws.readyState !== WS_OPEN) return;
  ws.send(JSON.stringify({
    type: approve ? 'direct_request_accept' : 'direct_request_decline',
    requestId,
  }));
};

const submitNickname = () => {
  const nickname = nicknameInput.value.trim();
  if (!nickname) {
    toast('请输入昵称。', 'info');
    return;
  }
  if (!ws || ws.readyState !== WS_OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  if (!deviceBound.value) {
    toast('请先完成设备绑定。', 'info');
    return;
  }
  nicknameSaving.value = true;
  ws.send(JSON.stringify({ type: 'set_nickname', nickname }));
};

const closeNicknameGuide = () => {
  nicknameGuideOpen.value = false;
  nicknameGuidePending.value = false;
};

const exportCurrentIdentityCredential = () => {
  const deviceSecret = getOrCreateDeviceSecret();
  const deviceToken = getDeviceToken();
  if (!deviceSecret || !deviceToken || !deviceFingerprint.value) {
    toast('当前身份凭证尚未就绪。', 'info');
    return;
  }
  openIdentityCredentialModal({
    fingerprint: deviceFingerprint.value,
    deviceSecret,
    deviceToken,
    firstBind: false,
  });
};

const applyIdentityCredential = (credential) => {
  if (!credential?.deviceSecret || !credential?.deviceToken) {
    toast('身份凭证格式不正确。', 'error');
    return false;
  }
  try {
    window.localStorage.setItem(DEVICE_SECRET_STORAGE_KEY, credential.deviceSecret);
    window.localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, credential.deviceToken);
    window.localStorage.removeItem(DEVICE_FINGERPRINT_STORAGE_KEY);
  } catch {
    toast('写入身份凭证失败。', 'error');
    return false;
  }
  clearPersistedDirectGroups();
  clearPersistedRegularGroups();
  clearPersistedGroupMeta();
  identityCredentialImport.value = '';
  closeIdentityCredentialModal();
  resetDeviceBinding({ keepCredential: true });
  manualReconnect();
  toast('身份凭证已导入，正在恢复身份。', 'info');
  return true;
};

const restoreIdentityCredential = () => {
  const parsed = parseIdentityCredential(identityCredentialImport.value);
  if (!parsed) {
    toast('无法解析身份凭证。', 'error');
    return;
  }
  applyIdentityCredential(parsed);
};

const triggerIdentityCredentialFilePicker = () => {
  identityCredentialFilePicker.value?.click();
};

const onPickIdentityCredentialFile = async (event) => {
  const file = event?.target?.files?.[0];
  if (!file) return;
  try {
    identityCredentialImport.value = await file.text();
    toast('已载入身份凭证文件。', 'info');
  } catch {
    toast('读取身份凭证文件失败。', 'error');
  } finally {
    if (event?.target) {
      event.target.value = '';
    }
  }
};

const submitNicknameGuide = () => {
  const nickname = nicknameInput.value.trim();
  if (!nickname) {
    toast('请输入昵称。', 'info');
    return;
  }
  if (nickname === myNickname.value) {
    closeNicknameGuide();
    return;
  }
  submitNickname();
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

const requestContactByUid = (targetUid, alias = '') => {
  const uid = typeof targetUid === 'string' ? targetUid.trim() : '';
  if (!uid) return;
  if (!ws || ws.readyState !== WS_OPEN) {
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
  const finalAlias = typeof alias === 'string' ? alias.trim() : '';
  const payload = {
    type: 'contacts_add',
    targetUid: uid,
  };
  if (finalAlias && !isGeneratedContactAlias(finalAlias, uid)) {
    payload.alias = finalAlias;
  }
  ws.send(JSON.stringify(payload));
  return true;
};

const addContact = (user) => {
  if (!user || !user.uid) return;
  requestContactByUid(user.uid);
};

const removeContact = (contact) => {
  if (!contact || !contact.contactFingerprint) return;
  if (!ws || ws.readyState !== WS_OPEN) {
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
  if (!ws || ws.readyState !== WS_OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  ws.send(JSON.stringify({ type: 'contacts_accept', requestId: req.requestId }));
};

const declineContactRequest = (req) => {
  if (!req || !req.requestId) return;
  if (!ws || ws.readyState !== WS_OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  ws.send(JSON.stringify({ type: 'contacts_decline', requestId: req.requestId }));
};

const startContactChat = (contact) => {
  if (!contact) return;
  const targetUid = contact.onlineUid || '';
  if (!targetUid) {
    toast('无法确定联系人身份。', 'info');
    return;
  }
  const peerKeys = peerIdentityMap.value[targetUid];
  if (!peerKeys || !peerKeys.identityDh || !peerKeys.identitySign) {
    toast('对方身份信息未就绪，请稍后再试。', 'info');
    return;
  }
  if (!contact.mutual) {
    toast('你不在对方通讯录，只能发起临时私聊。', 'info');
  }
  contactsOpen.value = false;
  startDirectChat({ uid: targetUid, identityDh: peerKeys.identityDh, identitySign: peerKeys.identitySign, canDirectRequest: true });
};

const requestMigrationCode = () => {
  if (!ws || ws.readyState !== WS_OPEN) {
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
  if (!ws || ws.readyState !== WS_OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  if (!deviceBound.value) {
    toast('请先完成设备绑定。', 'info');
    return;
  }
  setMigrationStatus(
    'info',
    transferNicknameOnMigration.value
      ? '授权请求已发送（含昵称转让），等待新设备确认…'
      : '授权请求已发送，等待新设备确认…'
  );
  ws.send(JSON.stringify({ type: 'contacts_migrate_approve', code, transferNickname: transferNicknameOnMigration.value }));
};

const confirmMigration = (codeOverride = '') => {
  const code = (codeOverride || migrationConfirm.value.code || migrationCode.value || '').trim().toUpperCase();
  if (!code) {
    toast('没有可确认的迁移码。', 'info');
    return;
  }
  if (!ws || ws.readyState !== WS_OPEN) {
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

const scheduleReconnect = (reason = '') => {
  if (suppressReconnect.value || isInsecureBrowser.value) return;
  resetReconnectTimer();
  const offlineNow = typeof navigator !== 'undefined' && navigator.onLine === false;
  networkOnline.value = !offlineNow;
  if (offlineNow) {
    connectionState.value = 'offline';
    reconnectState.value = {
      ...reconnectState.value,
      nextAt: 0,
      lastReason: reason || reconnectState.value.lastReason || 'network-offline',
    };
    return;
  }
  const attempt = reconnectState.value.attempt + 1;
  const baseDelay = Math.min(2000 * (2 ** Math.min(attempt - 1, 4)), 30000);
  const jitter = Math.min(1200, 250 * attempt);
  const delay = attempt === 1 ? 2000 : baseDelay + Math.floor(Math.random() * jitter);
  const nextAt = Date.now() + delay;
  reconnectState.value = {
    attempt,
    nextAt,
    lastReason: reason || reconnectState.value.lastReason || 'socket-closed',
  };
  reconnectNow.value = Date.now();
  connectionState.value = 'reconnecting';
  reconnectTicker = window.setInterval(() => {
    reconnectNow.value = Date.now();
    if (Date.now() >= reconnectState.value.nextAt) {
      resetReconnectTicker();
    }
  }, 250);
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = 0;
    resetReconnectTicker();
    connectWS({ isReconnect: true, force: true });
  }, delay);
};

const manualReconnect = () => {
  if (suppressReconnect.value || isInsecureBrowser.value) return;
  const offlineNow = typeof navigator !== 'undefined' && navigator.onLine === false;
  networkOnline.value = !offlineNow;
  if (offlineNow) {
    connectionState.value = 'offline';
    toast('当前网络未恢复，暂时无法重连。', 'info');
    return;
  }
  resetReconnectTimer();
  connectWS({ isReconnect: true, force: true });
};

const reconnectAfterKick = () => {
  deviceKicked.value = { open: false, reason: '' };
  suppressReconnect.value = false;
  resetReconnectState();
  manualReconnect();
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

const loadUiScaleSetting = () => {
  try {
    const raw = window.localStorage.getItem(UI_SCALE_STORAGE_KEY) || 'standard';
    uiScale.value = raw === 'small' || raw === 'large' ? raw : 'standard';
  } catch {
    uiScale.value = 'standard';
  }
};

const persistUiScaleSetting = () => {
  try {
    window.localStorage.setItem(UI_SCALE_STORAGE_KEY, uiScale.value);
  } catch {
    // no-op
  }
};

const setUiScaleLevel = (value) => {
  uiScale.value = value === 'small' || value === 'large' ? value : 'standard';
  persistUiScaleSetting();
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

const handleVersionTap = () => {
  const now = Date.now();
  const withinWindow = now - (versionTapState.value.lastAt || 0) <= 1200;
  const nextCount = withinWindow ? versionTapState.value.count + 1 : 1;
  versionTapState.value = { count: nextCount, lastAt: now };
  if (debugModeEnabled.value) return;
  if (nextCount < 4) return;
  debugModeEnabled.value = true;
  versionTapState.value = { count: 0, lastAt: 0 };
  toast('Debug 模式已开启（本次生效）。', 'info');
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
  const isQQBrowser = ua.includes('qqbrowser');
  const isUC = ua.includes('ucbrowser');
  const isQuark = ua.includes('quark');
  const isBaidu = ua.includes('baidu');

  isInsecureBrowser.value = isWechat || isQQBrowser || isUC || isQuark || isBaidu;
};

const detectMobileViewport = (width) => {
  const viewportWidth = Number(width) || window.innerWidth || 0;
  if (viewportWidth < 768) return true;
  return detectDeviceKind() === 'mobile' && viewportWidth < 1024;
};

const updateViewportState = () => {
  const vv = window.visualViewport;
  if (!vv) {
    isKeyboardOpen.value = false;
    viewportNarrow.value = window.innerWidth < 380;
    mobileViewport.value = detectMobileViewport(window.innerWidth);
    return;
  }
  const heightDiff = window.innerHeight - vv.height;
  isKeyboardOpen.value = heightDiff > 120;
  viewportNarrow.value = vv.width < 380;
  mobileViewport.value = detectMobileViewport(vv.width);
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

const extractRawInviteCode = (value) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  const match = trimmed.match(INVITE_CODE_PATTERN);
  if (match) return match[1];
  try {
    const decoded = decodeURIComponent(trimmed);
    const decodedMatch = decoded.match(INVITE_CODE_PATTERN);
    return decodedMatch ? decodedMatch[1] : '';
  } catch {
    return '';
  }
};

const encodeInviteMnemonic = (inviteCode) => {
  const code = extractRawInviteCode(inviteCode);
  if (!code) return '';
  const raw = code.startsWith('TCINV-') ? code.slice(6) : code;
  const words = [];
  for (const ch of raw) {
    const idx = INVITE_CODE_ALPHABET.indexOf(ch);
    if (idx < 0 || idx >= INVITE_MNEMONIC_WORDS.length) return '';
    words.push(INVITE_MNEMONIC_WORDS[idx]);
  }
  return words.join('-');
};

const decodeInviteMnemonic = (value) => {
  const normalized = String(value || '')
    .trim()
    .replace(/^#/, '')
    .replace(/^(?:i|invite|mn|mnemonic)=/i, '')
    .replace(/^\/+/, '')
    .trim()
    .toLowerCase();
  if (!normalized) return '';
  const words = normalized.split(/[-\s]+/).filter(Boolean);
  if (!words.length) return '';
  let raw = '';
  for (const word of words) {
    const idx = INVITE_MNEMONIC_WORDS.indexOf(word);
    if (idx < 0) return '';
    raw += INVITE_CODE_ALPHABET[idx];
  }
  if (!raw.includes('.')) return '';
  return `TCINV-${raw}`;
};

const collectInviteCandidates = (value) => {
  const text = String(value || '').trim();
  if (!text) return [];
  const candidates = [text];
  try {
    const decoded = decodeURIComponent(text);
    if (decoded && decoded !== text) candidates.push(decoded);
  } catch {
    // ignore invalid URI sequences
  }
  try {
    const url = new URL(text, window.location.href);
    for (const key of ['i', 'invite', 'code', 'mn', 'mnemonic']) {
      const param = url.searchParams.get(key);
      if (param) candidates.push(param);
    }
    if (url.hash) {
      candidates.push(url.hash.slice(1));
      try {
        const decodedHash = decodeURIComponent(url.hash.slice(1));
        if (decodedHash && decodedHash !== url.hash.slice(1)) candidates.push(decodedHash);
      } catch {
        // ignore invalid URI sequences
      }
    }
  } catch {
    // not a URL, keep original candidate only
  }
  return candidates;
};

const extractInviteCode = (value) => {
  for (const candidate of collectInviteCandidates(value)) {
    const rawCode = extractRawInviteCode(candidate);
    if (rawCode) return rawCode;
  }
  for (const candidate of collectInviteCandidates(value)) {
    const mnemonicCode = decodeInviteMnemonic(candidate);
    if (mnemonicCode) return mnemonicCode;
  }
  return '';
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

const extractShortInviteCode = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  const candidates = collectInviteCandidates(text);
  for (const candidate of candidates) {
    const normalized = String(candidate || '').trim().replace(/^#/, '');
    const direct = normalized.match(/^(?:s|short)=([A-Za-z0-9]{6,16})$/i);
    if (direct) return direct[1];
    try {
      const url = new URL(normalized, window.location.href);
      const code = url.searchParams.get('s') || url.searchParams.get('short') || '';
      if (/^[A-Za-z0-9]{6,16}$/.test(code)) return code;
    } catch {
      // ignore
    }
  }
  return '';
};

const resolveShortInviteCode = async (shortCode) => {
  const code = String(shortCode || '').trim();
  if (!/^[A-Za-z0-9]{6,16}$/.test(code)) return null;
  try {
    const response = await fetch(`/api/invite-resolve?code=${encodeURIComponent(code)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const inviteCode = extractInviteCode(data?.inviteCode || '');
    const groupId = sanitizeGroupId(data?.groupId || '');
    if (!inviteCode || !groupId) return null;
    return {
      inviteCode,
      groupId,
      shortCode: typeof data?.shortCode === 'string' ? data.shortCode : code,
      expiresAt: typeof data?.expiresAt === 'number' ? data.expiresAt : null,
      maxUses: Number.isFinite(Number(data?.maxUses)) ? Number(data.maxUses) : null,
      usedCount: Number.isFinite(Number(data?.usedCount)) ? Number(data.usedCount) : 0,
      pendingCount: Number.isFinite(Number(data?.pendingCount)) ? Number(data.pendingCount) : 0,
    };
  } catch {
    return null;
  }
};

const groupPreviewText = (groupId) => {
  const msg = lastMessageByGroup.value[groupId];
  if (!msg) return '';
  if (msg.payloadType === 'image') return msg.name ? `[图片] ${msg.name}` : '[图片]';
  if (msg.payloadType === 'audio') return `[语音] ${formatDurationMs(msg.audioDurationMs || 0)}`;
  if (msg.payloadType === 'pair') return '群聊邀请';
  if (msg.payloadType === 'invite') {
    const name = msg.inviteGroupName || msg.inviteGroup;
    return name ? `邀请加入 ${name}` : '群邀请';
  }
  if (msg.payloadType === 'system') return msg.systemTitle || '系统提醒';
  if (msg.payloadType === 'dm_limit_tip') return '私聊受限提醒';
  if (msg.payloadType === 'send_block_tip') return msg.tipTitle || '发送受阻提醒';
  const text = typeof msg.text === 'string' ? msg.text : '';
  return text.replace(/\s+/g, ' ').trim();
};

const groupPreviewTime = (groupId) => {
  const msg = lastMessageByGroup.value[groupId];
  if (!msg || !msg.ts) return '';
  return formatTime(msg.ts);
};

const describeReplyPayload = ({ payloadType = 'text', text = '', name = '', audioDurationMs = 0 } = {}) => {
  if (payloadType === 'image') return name ? `[图片] ${name}` : '[图片]';
  if (payloadType === 'audio') return `[语音] ${formatDurationMs(audioDurationMs || 0)}`;
  if (payloadType === 'invite') return '群邀请卡';
  if (payloadType === 'pair') return '群聊邀请';
  const normalizedText = String(text || '').replace(/\s+/g, ' ').trim();
  return normalizedText || '[消息]';
};

const normalizeReplyPayload = (reply) => {
  if (!reply || typeof reply !== 'object') return null;
  const msgId = typeof reply.msgId === 'string' ? reply.msgId.trim() : '';
  const sender = typeof reply.sender === 'string' ? reply.sender.trim() : '';
  if (!msgId || !sender) return null;
  const payloadType =
    reply.payloadType === 'image'
      ? 'image'
      : reply.payloadType === 'audio'
        ? 'audio'
        : reply.payloadType === 'invite'
          ? 'invite'
          : reply.payloadType === 'pair'
            ? 'pair'
            : 'text';
  const senderName = typeof reply.senderName === 'string' ? reply.senderName.trim().slice(0, 48) : '';
  const text = typeof reply.text === 'string' ? reply.text.trim().slice(0, REPLY_PREVIEW_MAX) : '';
  const name = typeof reply.name === 'string' ? reply.name.trim().slice(0, 80) : '';
  const audioDurationMs = Math.max(0, Number(reply.audioDurationMs) || 0);
  return {
    msgId,
    sender,
    senderName,
    payloadType,
    text: describeReplyPayload({ payloadType, text, name, audioDurationMs }).slice(0, REPLY_PREVIEW_MAX),
    name,
    audioDurationMs,
  };
};

const buildReplyPayloadFromMessage = (msg) => {
  if (!msg) return null;
  return normalizeReplyPayload({
    msgId: msg.msgId,
    sender: msg.sender,
    senderName: msg.sender === myUid.value ? (myNickname.value || '你') : displayNameForUid(msg.sender),
    payloadType: msg.payloadType,
    text: msg.payloadType === 'text' ? msg.text || '' : '',
    name: msg.payloadType === 'image' ? msg.name || '' : '',
    audioDurationMs: msg.payloadType === 'audio' ? Number(msg.audioDurationMs) || 0 : 0,
  });
};

const canReplyToMessage = (msg) => {
  if (!msg || !msg.msgId) return false;
  return !['system', 'dm_limit_tip', 'send_block_tip'].includes(msg.payloadType);
};

const replySenderLabel = (reply) => {
  const normalized = normalizeReplyPayload(reply);
  if (!normalized) return '消息';
  if (normalized.sender === myUid.value) return '你';
  return normalized.senderName || displayNameForUid(normalized.sender) || `用户 ${normalized.sender.slice(0, 6)}`;
};

const setReplyTarget = (msg) => {
  if (!canReplyToMessage(msg)) return;
  replyDraft.value = buildReplyPayloadFromMessage(msg);
  nextTick(() => {
    textInput.value?.focus();
  });
};

const clearReplyDraft = () => {
  replyDraft.value = null;
};

const currentReplyPayload = () => {
  return normalizeReplyPayload(replyDraft.value);
};

const jumpToMessage = (msgId) => {
  const id = typeof msgId === 'string' ? msgId.trim() : '';
  if (!id || !msgBox.value) return;
  const target = msgBox.value.querySelector(`[data-msg-id="${id}"]`);
  if (!(target instanceof HTMLElement)) return;
  target.scrollIntoView({ block: 'center', behavior: 'smooth' });
  target.classList.add('message-jump-highlight');
  window.setTimeout(() => {
    target.classList.remove('message-jump-highlight');
  }, 1400);
};

const joinByInviteCode = async () => {
  let code = extractInviteCode(inviteJoinInput.value);
  if (!code) {
    const shortCode = extractShortInviteCode(inviteJoinInput.value);
    const resolved = shortCode ? await resolveShortInviteCode(shortCode) : null;
    code = resolved?.inviteCode || '';
  }
  if (!code) {
    toast('请粘贴正确的邀请链接、助记词或邀请码。', 'info');
    return;
  }
  const gid = decodeInviteGroupId(code);
  if (!gid) {
    toast('无法解析邀请链接，请确认复制完整。', 'error');
    return;
  }

  if (hasJoinedGroup(gid)) {
    inviteJoinInput.value = '';
    openGroup(gid);
    return;
  }

  ensureGroupInList(gid);
  activeGroup.value = gid;
  const joinStatement = (window.prompt('可选：写一段入群说明（留空可跳过）', '') || '').trim().slice(0, 180);

  pendingJoin.value = { groupId: gid, inviteCode: code, select: true, groupName: '', joinStatement };
  if (powState.value.verified && ws && ws.readyState === WS_OPEN) {
    joinGroup(gid, code, { joinStatement });
    pendingJoin.value = { groupId: '', inviteCode: '', select: true, groupName: '', joinStatement: '' };
  } else {
    void startPowSolve();
  }

  inviteJoinInput.value = '';
};

const joinFromInvite = async (inviteCode) => {
  let code = extractInviteCode(inviteCode);
  if (!code) {
    const shortCode = extractShortInviteCode(inviteCode);
    const resolved = shortCode ? await resolveShortInviteCode(shortCode) : null;
    code = resolved?.inviteCode || '';
  }
  if (!code) return;
  inviteJoinInput.value = code;
  void joinByInviteCode();
};

const copyInviteFromMessage = async (inviteCode, inviteLink = '') => {
  const code = extractInviteCode(inviteCode);
  if (!code) {
    toast('邀请链接无效', 'error');
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

const collectOptionalInviteStatement = (groupId) => {
  const gid = sanitizeGroupId(groupId);
  if (!gid) return '';
  const meta = groupMetaMap.value[gid];
  if (!meta?.ownerUid || meta.ownerUid === myUid.value) return '';
  return (window.prompt('可选：写一段邀请说明（群主会在群里看到）', '') || '').trim().slice(0, 180);
};

const confirmInvitePicker = () => {
  const groupId = sanitizeGroupId(invitePickerGroupId.value);
  if (!groupId) {
    toast('请选择一个群组。', 'info');
    return;
  }
  if (!ws || ws.readyState !== WS_OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  if (!powState.value.verified) {
    toast('正在进行反机器人验证…', 'info');
    void startPowSolve();
    return;
  }

  const reqId = createReqId();
  const inviteStatement = collectOptionalInviteStatement(groupId);
  pendingInviteRequest.value = { reqId, groupId, mode: 'card' };
  invitePickerOpen.value = false;
  ws.send(JSON.stringify({ type: 'create_invite', groupId, ttlSec: 2 * 24 * 60 * 60, inviteStatement, reqId }));
};

const closeInvitePicker = () => {
  invitePickerOpen.value = false;
};

const ensureGroupInList = (groupId, name = '') => {
  if (!groupId) return;
  const existing = groups.value.find((g) => g.id === groupId);
  const metaName =
    !isDirectGroupId(groupId) && groupId !== SYSTEM_GROUP && groupId !== SYSTEM_NOTICE_GROUP
      ? (groupMetaMap.value[groupId]?.groupName || '').trim()
      : '';
  const nextName = isDirectGroupId(groupId)
    ? (name || nameForDirectGroup(groupId))
    : (metaName || name || groupId);
  if (!existing) {
    groups.value.push({ id: groupId, name: nextName });
    return;
  }
  if (nextName && nextName !== existing.name) {
    existing.name = nextName;
  }
};

const selectGroup = (groupId) => {
  const gid = sanitizeGroupId(groupId);
  if (!gid) return;
  if (mobileViewport.value && !mobileHistoryInternal.value && gid !== SYSTEM_NOTICE_GROUP) {
    scheduleMobileHistoryPush();
  }
  activeGroup.value = gid;
  if (gid !== SYSTEM_NOTICE_GROUP) {
    systemNoticeOpen.value = false;
  }
  showMobilePanel.value = false;
  nextTick(() => {
    scrollToBottom();
    maybeMarkActiveGroupSeen();
  });
};

const hasJoinedGroup = (groupId) => {
  const gid = sanitizeGroupId(groupId);
  return Boolean(gid && joinedGroups.has(gid));
};

const nameForDirectGroup = (groupId) => {
  if (!groupId || !groupId.startsWith('dm-')) return '';
  const ids = groupId.slice(3).split(':').filter(Boolean);
  if (ids.length !== 2) return '';
  const other = ids.find((id) => id !== myUid.value) || ids[0];
  if (!other || other === 'undefined') return '私聊';
  const label = displayNameForUid(other);
  const finalLabel = String(label || '').trim() || `用户 ${other.slice(0, 6)}`;
  return `私聊 · ${finalLabel}`;
};

const refreshDirectGroupNames = () => {
  groups.value = groups.value.map((group) => {
    if (!group || !isDirectGroupId(group.id)) return group;
    const nextName = nameForDirectGroup(group.id);
    return nextName && nextName !== group.name ? { ...group, name: nextName } : group;
  });
};

watch(
  () =>
    groups.value
      .filter((group) => group && isDirectGroupId(group.id))
      .map((group) => `${group.id}:${group.name || ''}`),
  () => {
    persistDirectGroups();
  }
);

watch(
  () =>
    groups.value
      .filter((group) => group && group.id && group.id !== SYSTEM_GROUP && group.id !== SYSTEM_NOTICE_GROUP && !isDirectGroupId(group.id))
      .map((group) => `${group.id}:${group.name || ''}`),
  () => {
    persistRegularGroups();
  }
);

watch(
  () => [mobileViewport.value, activeGroup.value, mobilePrimaryTab.value, systemNoticeOpen.value, groupManageOpen.value],
  () => {
    syncMobileHistory();
  },
  { flush: 'post' }
);

watch(
  mobileViewport,
  (isMobile) => {
    if (isMobile) {
      initializeMobileHistory();
      return;
    }
    mobileHistoryReady = false;
    pendingMobileHistoryMode = 'replace';
    lastMobileHistorySignature = '';
  }
);

watch(
  () =>
    Object.entries(groupMetaMap.value || {})
      .filter(([groupId]) => {
        const gid = sanitizeGroupId(groupId);
        return gid && gid !== SYSTEM_GROUP && gid !== SYSTEM_NOTICE_GROUP && !isDirectGroupId(gid);
      })
      .map(
        ([groupId, meta]) =>
          `${groupId}:${meta?.groupName || ''}:${meta?.ownerUid || ''}:${meta?.inviteApprovalRequired !== false}:${meta?.announcement || ''}`
      ),
  () => {
    persistGroupMeta();
  }
);

watch(
  () => savedGroupContacts.value.map((item) => `${item.id}:${item.name || ''}`),
  () => {
    persistSavedGroupContacts();
  }
);

watch(
  () =>
    Object.entries(pinnedGroups.value || {})
      .map(([groupId, pinnedAt]) => `${groupId}:${Number(pinnedAt) || 0}`)
      .sort(),
  () => {
    persistPinnedGroups();
  }
);

watch(
  () => activeGroup.value,
  () => {
    clearReplyDraft();
  }
);

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
  if (!ws || ws.readyState !== WS_OPEN) return;
  ws.send(JSON.stringify({ type: 'direct_start', groupId, targetUid }));
};

const startDirectChat = (user) => {
  if (!user || !user.uid || user.uid === myUid.value) return;
  if (user.canDirectRequest === false) {
    toast('对方仅接受通讯录私聊。', 'info');
    return;
  }
  if (!user.identityDh || !user.identitySign) {
    toast('对方身份信息未就绪。', 'error');
    return;
  }
  const groupId = buildDirectGroupId(myUid.value, user.uid);
  if (!groupId) return;
  ensureGroupInList(groupId, nameForDirectGroup(groupId));
  activeGroup.value = groupId;

  if (!ws || ws.readyState !== WS_OPEN) {
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

const buildShortInviteLink = (inviteCode, shortCode = '') => {
  const url = new URL(window.location.href);
  url.search = '';
  if (shortCode) {
    url.searchParams.set('s', shortCode);
    url.hash = '';
    return url.toString();
  }
  const mnemonic = encodeInviteMnemonic(inviteCode);
  url.hash = mnemonic ? `i=${mnemonic}` : inviteCode;
  return url.toString();
};

const clearInviteUrlFromAddressBar = () => {
  try {
    const url = new URL(window.location.href);
    let changed = false;
    for (const key of ['group', 'i', 'invite', 'code', 'mn', 'mnemonic', 's', 'short']) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (url.hash) {
      url.hash = '';
      changed = true;
    }
    if (!changed) return;
    const next = `${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ''}`;
    window.history.replaceState(window.history.state, '', next);
  } catch {
    // no-op
  }
};

const formatInviteLinkDisplay = (link) => {
  if (!link) return '';
  return link.replace(/^https?:\/\//, '');
};

const inviteTtlOptions = [
  { label: '1 小时', value: 60 * 60 },
  { label: '6 小时', value: 6 * 60 * 60 },
  { label: '1 天', value: 24 * 60 * 60 },
  { label: '3 天', value: 3 * 24 * 60 * 60 },
  { label: '7 天', value: 7 * 24 * 60 * 60 },
];

const inviteLinkForEntry = (entry) => {
  const inviteCode = extractInviteCode(entry?.inviteCode || '');
  const shortCode = typeof entry?.shortCode === 'string' ? entry.shortCode : '';
  return buildShortInviteLink(inviteCode, shortCode);
};

const inviteUsageLabel = (entry) => {
  const used = Number(entry?.usedCount) || 0;
  const pending = Number(entry?.pendingCount) || 0;
  const max = Number(entry?.maxUses) || 0;
  return `${used}${pending ? ` + ${pending} 待审` : ''} / ${max}`;
};

const inviteStatusLabel = (entry) => {
  const now = Date.now();
  if (Number(entry?.revokedAt) > 0) return '已吊销';
  if (Number(entry?.expiresAt) > 0 && Number(entry.expiresAt) <= now) return '已过期';
  const used = Number(entry?.usedCount) || 0;
  const max = Number(entry?.maxUses) || 0;
  if (max > 0 && used >= max) return '已用尽';
  return '生效中';
};

const defaultInviteDialogState = (groupId = '') => ({
  open: false,
  groupId,
  ttlSec: 2 * 24 * 60 * 60,
  maxUses: 10,
  inviteStatement: '',
  generatedInviteCode: '',
  generatedShortCode: '',
  generatedExpiresAt: null,
});

const pendingInviteRequest = ref({ reqId: '', groupId: '', mode: 'dialog' });

const requestGroupInviteSettings = (groupId = activeGroup.value) => {
  const gid = sanitizeGroupId(groupId);
  if (!gid || !ws || ws.readyState !== WS_OPEN) return;
  groupInviteSettingsLoading.value = true;
  groupInviteEntries.value = [];
  ws.send(JSON.stringify({ type: 'group_invite_settings', groupId: gid }));
};

const openInviteDialog = (groupId = activeGroup.value) => {
  const gid = sanitizeGroupId(groupId);
  if (!gid || gid === SYSTEM_GROUP || gid === SYSTEM_NOTICE_GROUP) {
    toast('请选择一个非系统群组再邀请。', 'info');
    return;
  }
  const previous = inviteDialog.value;
  inviteDialog.value = {
    ...defaultInviteDialogState(gid),
    open: true,
    ttlSec: previous.groupId === gid ? previous.ttlSec : 2 * 24 * 60 * 60,
    maxUses: previous.groupId === gid ? previous.maxUses : 10,
    inviteStatement: previous.groupId === gid ? previous.inviteStatement : '',
  };
  requestGroupInviteSettings(gid);
};

const closeInviteDialog = () => {
  inviteDialog.value = defaultInviteDialogState(inviteDialog.value.groupId || '');
  groupInviteSettingsLoading.value = false;
};

const createInviteFromDialog = () => {
  const groupId = sanitizeGroupId(inviteDialog.value.groupId);
  if (!groupId || groupId === SYSTEM_GROUP || groupId === SYSTEM_NOTICE_GROUP) {
    toast('请选择一个非系统群组再邀请。', 'info');
    return;
  }
  if (!ws || ws.readyState !== WS_OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  if (!powState.value.verified) {
    toast('正在进行反机器人验证…', 'info');
    void startPowSolve();
    return;
  }
  const reqId = createReqId();
  pendingInviteRequest.value = { reqId, groupId, mode: 'dialog' };
  inviteText.value = '生成邀请中...';
  if (isActiveGroupOwner.value) {
    ws.send(JSON.stringify({
      type: 'group_invite_policy_update',
      groupId,
      inviteApprovalRequired: activeGroupInviteApprovalRequired.value,
    }));
  }
  ws.send(JSON.stringify({
    type: 'create_invite',
    groupId,
    ttlSec: Number(inviteDialog.value.ttlSec) || 2 * 24 * 60 * 60,
    maxUses: Number(inviteDialog.value.maxUses) || 10,
    inviteStatement: String(inviteDialog.value.inviteStatement || '').trim().slice(0, 180),
    reqId,
  }));
};

const copyInviteDialogLink = async (entry = null) => {
  const inviteCode = extractInviteCode(entry?.inviteCode || inviteDialog.value.generatedInviteCode || '');
  const shortCode = typeof entry?.shortCode === 'string' && entry.shortCode
    ? entry.shortCode
    : inviteDialog.value.generatedShortCode || '';
  if (!inviteCode && !shortCode) {
    toast('暂无可复制的邀请链接。', 'info');
    return;
  }
  const link = buildShortInviteLink(inviteCode, shortCode);
  try {
    await navigator.clipboard.writeText(link);
    toast('邀请链接已复制。', 'info');
  } catch {
    toast('复制失败，请稍后重试。', 'error');
  }
};

const saveGroupInviteCard = (inviteUrl) => {
  if (!inviteUrl) return;
  const groupName = groupMetaMap.value[inviteDialog.value.groupId]?.groupName || activeGroupName.value || '群聊';
  const svgStr = generateInviteQRSvg(inviteUrl, 280);
  const cardW = 360;
  const cardH = 480;
  const canvas = document.createElement('canvas');
  canvas.width = cardW * 2;
  canvas.height = cardH * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, cardW, cardH);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, cardW, 56);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px -apple-system, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LINKCONNECT', cardW / 2, 36);

  const img = new Image();
  const blob = new Blob([svgStr], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  img.onload = () => {
    const qrSize = 200;
    const qrX = (cardW - qrSize) / 2;
    const qrY = 80;
    ctx.fillStyle = '#fff';
    roundRect(ctx, qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 12);
    ctx.fill();
    ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
    URL.revokeObjectURL(url);

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 14px -apple-system, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    const shortName = groupName.length > 18 ? groupName.slice(0, 18) + '…' : groupName;
    ctx.fillText(shortName, cardW / 2, qrY + qrSize + 36);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px -apple-system, "Segoe UI", sans-serif';
    ctx.fillText('扫码加入群聊', cardW / 2, qrY + qrSize + 60);

    canvas.toBlob((b) => {
      if (!b) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = `linkconnect-${groupName}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast('群名片已保存。', 'info');
    }, 'image/png');
  };
  img.src = url;
};

const saveInviteApprovalPolicy = () => {
  const groupId = sanitizeGroupId(activeGroup.value);
  if (!groupId || !isActiveGroupOwner.value) return;
  if (!ws || ws.readyState !== WS_OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  ws.send(JSON.stringify({
    type: 'group_invite_policy_update',
    groupId,
    inviteApprovalRequired: activeGroupInviteApprovalRequired.value,
  }));
};

const revokeGroupInvite = (inviteId) => {
  const groupId = sanitizeGroupId(activeGroup.value);
  if (!groupId || !inviteId) return;
  if (!ws || ws.readyState !== WS_OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  ws.send(JSON.stringify({ type: 'group_invite_revoke', groupId, inviteId }));
};

const revokeOwnGroupInvite = () => {
  const entry = myActiveGroupInvite.value;
  if (!entry) {
    toast('暂无有效的邀请链接。', 'info');
    return;
  }
  revokeGroupInvite(entry.inviteId);
};

const copyInviteLink = async () => {
  openInviteDialog(activeGroup.value);
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
  if (!ws || ws.readyState !== WS_OPEN) {
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
  const groupName = defaultGroupNameForMembers(myUid.value, targetUid);
  pendingPairGroup.value = { groupId, targetUid };
  ensureGroupInList(groupId, groupName);
  joinGroup(groupId, '', { select: false, groupName });
};

const requestPairInvite = (groupId, targetUid) => {
  if (!groupId || !targetUid) return;
  if (!ws || ws.readyState !== WS_OPEN) return;
  const reqId = createReqId();
  pendingPairInvite.value = { reqId, groupId, targetUid };
  ws.send(JSON.stringify({ type: 'create_invite', groupId, ttlSec: 2 * 24 * 60 * 60, reqId }));
};

const markPairStatus = (dmGroupId, pairGroupId, status) => {
  for (const msg of messages.value) {
    if (
      msg.groupId === dmGroupId &&
      msg.payloadType === 'pair' &&
      msg.pairGroupId === pairGroupId
    ) {
      msg.pairStatus = status;
    }
  }
};

const markPairAccepted = (dmGroupId, pairGroupId) => {
  markPairStatus(dmGroupId, pairGroupId, 'accepted');
};

const markPairDeclined = (dmGroupId, pairGroupId) => {
  markPairStatus(dmGroupId, pairGroupId, 'declined');
};

const acceptPairInvite = (msg) => {
  if (!msg || !msg.pairGroupId || !msg.pairInviteCode) return;
  if (!ws || ws.readyState !== WS_OPEN) {
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

const declinePairInvite = (msg) => {
  if (!msg || !msg.pairGroupId || msg.sender === myUid.value || msg.pairStatus !== 'pending') return;
  if (!ws || ws.readyState !== WS_OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  ws.send(
    JSON.stringify({
      type: 'pair_decline',
      dmGroupId: msg.groupId,
      groupId: msg.pairGroupId,
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

const getOrCreateDeviceSecret = () => {
  try {
    const cached = window.localStorage.getItem(DEVICE_SECRET_STORAGE_KEY);
    if (cached) return cached;
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    const secret = base64UrlFromBase64(arrayBufferToBase64(bytes.buffer));
    window.localStorage.setItem(DEVICE_SECRET_STORAGE_KEY, secret);
    return secret;
  } catch {
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    return base64UrlFromBase64(arrayBufferToBase64(bytes.buffer));
  }
};

const getStoredFingerprint = () => {
  try {
    return window.localStorage.getItem(DEVICE_FINGERPRINT_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

const setStoredFingerprint = (fingerprint) => {
  if (!fingerprint) return;
  try {
    window.localStorage.setItem(DEVICE_FINGERPRINT_STORAGE_KEY, fingerprint);
  } catch {
    // no-op
  }
};

const collectDeviceProfile = () => {
  const timezone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch {
      return '';
    }
  })();
  return {
    userAgent: navigator.userAgent || '',
    language: navigator.language || '',
    platform: navigator.platform || '',
    timezone,
    screen: typeof window.screen !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
    touch: navigator.maxTouchPoints > 0 ? 'touch' : 'pointer',
  };
};

const MNEMONIC_BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const MNEMONIC_BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const MNEMONIC_V2_VERSION = 2;
const LEGACY_BASE32_MNEMONIC_WORDS_ZH = ['白云', '青山', '春雨', '秋月', '星河', '晨风', '晚霞', '海潮', '松林', '竹影', '灯塔', '远舟', '长街', '归途', '麦田', '湖岸', '晨露', '霜叶', '微光', '暖阳', '银沙', '月湾', '山谷', '桥影', '晴空', '流萤', '星火', '云帆', '溪水', '林间', '海湾', '风铃'];
const LEGACY_BASE32_MNEMONIC_WORDS_EN = ['apple', 'bridge', 'candle', 'dawn', 'ember', 'forest', 'garden', 'harbor', 'island', 'jungle', 'kernel', 'lantern', 'meadow', 'needle', 'ocean', 'planet', 'quartz', 'ribbon', 'signal', 'timber', 'utopia', 'valley', 'willow', 'yonder', 'zephyr', 'anchor', 'blossom', 'compass', 'drizzle', 'feather', 'glacier', 'horizon'];
const MNEMONIC_WORDS_ZH = ['白云', '青山', '春雨', '秋月', '星河', '晨风', '晚霞', '海潮', '松林', '竹影', '灯塔', '远舟', '长街', '归途', '麦田', '湖岸', '晨露', '霜叶', '微光', '暖阳', '银沙', '月湾', '山谷', '桥影', '晴空', '流萤', '星火', '云帆', '溪水', '林间', '海湾', '风铃', '朝雾', '暮雪', '岚影', '云岫', '沙洲', '浅滩', '藤蔓', '荷塘', '柳岸', '鹭羽', '雁声', '舟歌', '岩泉', '霁色', '晓月', '晚灯', '烟岚', '石径', '茶山', '稻浪', '松涛', '花港', '潮汐', '星岬', '雪岭', '云桥', '溪谷', '月汀', '霞屿', '风汀', '竹溪', '川渡'];
const MNEMONIC_WORDS_EN = ['apple', 'bridge', 'candle', 'dawn', 'ember', 'forest', 'garden', 'harbor', 'island', 'jungle', 'kernel', 'lantern', 'meadow', 'needle', 'ocean', 'planet', 'quartz', 'ribbon', 'signal', 'timber', 'utopia', 'valley', 'willow', 'yonder', 'zephyr', 'anchor', 'blossom', 'compass', 'drizzle', 'feather', 'glacier', 'horizon', 'aurora', 'brook', 'clover', 'dune', 'elm', 'fjord', 'grove', 'heather', 'iris', 'jetty', 'lagoon', 'marble', 'north', 'orchid', 'prairie', 'quill', 'reef', 'spruce', 'tulip', 'upland', 'violet', 'wander', 'xylem', 'yearling', 'summit', 'thicket', 'vernal', 'wharf', 'amber', 'birch', 'cobalt', 'dew'];
const LEGACY_MNEMONIC_VERBS = ['安放', '编织', '穿过', '点亮', '翻阅', '回望', '唤醒', '记录', '看见', '靠近', '连接', '描摹', '凝望', '拼合', '轻放', '确认', '收拢', '推开', '望见', '系好', '校准', '延展', '拥抱', '折叠', '追随', '聆听', '守住', '取回', '刻下', '映照', '整理', '提醒'];
const LEGACY_MNEMONIC_ADJECTIVES = ['晨光', '薄雾', '长风', '赤砂', '春溪', '大海', '灯塔', '繁星', '高山', '河岸', '湖面', '极光', '静夜', '蓝桥', '密林', '暖阳', '平原', '轻舟', '秋叶', '群岛', '山谷', '霜雪', '松影', '晚霞', '微雨', '星门', '烟火', '银沙', '月湾', '云顶', '朝露', '竹影'];
const LEGACY_MNEMONIC_NOUNS = ['白鹭', '潮声', '船票', '灯芯', '风铃', '港湾', '海图', '花圃', '火种', '回声', '简报', '街灯', '鲸歌', '刻度', '蓝图', '铃铛', '罗盘', '旅店', '落叶', '木桥', '暖炉', '帆影', '蒲公', '桥洞', '泉水', '日记', '沙丘', '石阶', '树屋', '天幕', '邮票', '钟摆'];
const LEGACY_MNEMONIC_VERBS_EN = ['anchor', 'bind', 'carry', 'drift', 'echo', 'fold', 'gather', 'harbor', 'ignite', 'join', 'keep', 'launch', 'mend', 'notice', 'open', 'place', 'quiet', 'reach', 'shape', 'trace', 'unite', 'verify', 'wander', 'yield', 'zoom', 'absorb', 'balance', 'collect', 'direct', 'engrave', 'fasten', 'guard'];
const LEGACY_MNEMONIC_ADJECTIVES_EN = ['amber', 'bright', 'calm', 'deep', 'early', 'frozen', 'golden', 'hidden', 'ivory', 'jade', 'kind', 'lunar', 'mellow', 'narrow', 'opal', 'polar', 'quick', 'royal', 'silver', 'tidal', 'urban', 'velvet', 'wild', 'young', 'zesty', 'autumn', 'blended', 'crystal', 'distant', 'ember', 'fluent', 'gentle'];
const LEGACY_MNEMONIC_NOUNS_EN = ['apple', 'bridge', 'candle', 'dune', 'ember', 'feather', 'garden', 'harbor', 'island', 'journal', 'kernel', 'lantern', 'meadow', 'needle', 'ocean', 'pencil', 'quartz', 'ribbon', 'signal', 'timber', 'utopia', 'valley', 'window', 'yarrow', 'zephyr', 'anchor', 'blossom', 'compass', 'drizzle', 'forest', 'glacier', 'horizon'];

const bytesToHex = (bytes) => {
  return Array.from(bytes || []).map((value) => value.toString(16).padStart(2, '0')).join('');
};

const hexToBytes = (hex) => {
  const normalized = String(hex || '').trim();
  if (!/^[a-f0-9]+$/i.test(normalized) || normalized.length % 2 !== 0) return null;
  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    out[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return out;
};

const bytesToBase32 = (bytes) => {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += MNEMONIC_BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += MNEMONIC_BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
};

const base32ToBytes = (text) => {
  const normalized = String(text || '').replace(/[^A-Z2-7]/gi, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of normalized) {
    const idx = MNEMONIC_BASE32_ALPHABET.indexOf(ch);
    if (idx < 0) return null;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
};

const deriveDeviceTokenBytes = (secretBytes) => {
  const input = secretBytes instanceof Uint8Array ? secretBytes : null;
  if (!input || !input.length) return null;
  const out = new Uint8Array(24);
  let acc = 0x6d;
  for (let i = 0; i < out.length; i += 1) {
    const a = input[i % input.length];
    const b = input[(i * 5 + 1) % input.length];
    const c = input[(i * 11 + 7) % input.length];
    acc = (acc + a + ((b << 1) & 0xff) + i * 17) & 0xff;
    out[i] = (acc ^ b ^ ((c + i * 23) & 0xff)) & 0xff;
  }
  return out;
};

const deriveMnemonicChecksumByte = (secretBytes) => {
  const input = secretBytes instanceof Uint8Array ? secretBytes : null;
  if (!input || !input.length) return 0;
  let acc = 0xa7;
  for (let i = 0; i < input.length; i += 1) {
    acc = (acc ^ input[i] ^ ((i * 29) & 0xff)) & 0xff;
    acc = ((acc << 3) | (acc >>> 5)) & 0xff;
  }
  return acc;
};

const deriveDeviceTokenFromSecret = (deviceSecret) => {
  const secretBytes = base64UrlToBytes(deviceSecret);
  const tokenBytes = deriveDeviceTokenBytes(secretBytes);
  return tokenBytes ? bytesToHex(tokenBytes) : '';
};

const mnemonicWordsForLanguage = (language = 'zh') => {
  return language === 'en' ? MNEMONIC_WORDS_EN : MNEMONIC_WORDS_ZH;
};

const legacyBase32MnemonicWordsForLanguage = (language = 'zh') => {
  return language === 'en' ? LEGACY_BASE32_MNEMONIC_WORDS_EN : LEGACY_BASE32_MNEMONIC_WORDS_ZH;
};

const legacyMnemonicWordsetForLanguage = (language = 'zh') => {
  if (language === 'en') {
    return {
      verbs: LEGACY_MNEMONIC_VERBS_EN,
      adjectives: LEGACY_MNEMONIC_ADJECTIVES_EN,
      nouns: LEGACY_MNEMONIC_NOUNS_EN,
    };
  }
  return {
    verbs: LEGACY_MNEMONIC_VERBS,
    adjectives: LEGACY_MNEMONIC_ADJECTIVES,
    nouns: LEGACY_MNEMONIC_NOUNS,
  };
};

const encodeCredentialMnemonic = (deviceSecret, deviceToken, language = 'zh') => {
  const secretBytes = base64UrlToBytes(deviceSecret);
  if (!secretBytes || secretBytes.length !== 16) return '';
  const words = mnemonicWordsForLanguage(language);
  const derivedToken = deriveDeviceTokenFromSecret(deviceSecret);
  if (deviceToken && derivedToken && deviceToken !== derivedToken) return '';
  if (words.length !== 64) return '';
  const payload = new Uint8Array(18);
  payload[0] = MNEMONIC_V2_VERSION;
  payload[1] = deriveMnemonicChecksumByte(secretBytes);
  payload.set(secretBytes, 2);
  const base64url = base64UrlFromBase64(arrayBufferToBase64(payload.buffer));
  if (base64url.length < 12 || base64url.length > 24) return '';
  const mnemonicWords = [];
  for (let i = 0; i < base64url.length; i += 1) {
    const idx = MNEMONIC_BASE64URL_ALPHABET.indexOf(base64url[i]);
    if (idx < 0 || idx >= words.length) return '';
    mnemonicWords.push(words[idx]);
  }
  return mnemonicWords.join(' ');
};

const decodeCredentialMnemonic = (text, language = 'zh') => {
  const words = String(text || '').trim().split(/[\s/，、；;]+/).filter(Boolean);
  if (!words.length) return null;
  const dictionary = mnemonicWordsForLanguage(language);
  let base64url = '';
  let usedV2Dictionary = true;
  for (const word of words) {
    const idx = dictionary.indexOf(word);
    if (idx < 0) {
      usedV2Dictionary = false;
      break;
    }
    base64url += MNEMONIC_BASE64URL_ALPHABET[idx];
  }
  if (usedV2Dictionary && words.length >= 12 && words.length <= 24) {
    const bytes = base64UrlToBytes(base64url);
    if (bytes && bytes.length === 18 && bytes[0] === MNEMONIC_V2_VERSION) {
      const secretBytes = bytes.slice(2);
      const checksum = deriveMnemonicChecksumByte(secretBytes);
      if (bytes[1] === checksum) {
        const deviceSecret = base64UrlFromBase64(arrayBufferToBase64(secretBytes.buffer));
        return {
          deviceSecret,
          deviceToken: deriveDeviceTokenFromSecret(deviceSecret),
        };
      }
    }
  }
  const legacyBase32Dictionary = legacyBase32MnemonicWordsForLanguage(language);
  let base32 = '';
  for (const word of words) {
    const idx = legacyBase32Dictionary.indexOf(word);
    if (idx < 0) {
      return decodeLegacyCredentialMnemonic(text, language);
    }
    base32 += MNEMONIC_BASE32_ALPHABET[idx];
  }
  const bytes = base32ToBytes(base32);
  if (!bytes || bytes.length < 2) return null;
  const secretLength = bytes[0];
  const tokenLength = bytes[1];
  const totalLength = 2 + secretLength + tokenLength;
  if (secretLength > 0 && tokenLength > 0 && bytes.length >= totalLength) {
    const payload = bytes.slice(0, totalLength);
    return {
      deviceSecret: base64UrlFromBase64(arrayBufferToBase64(payload.slice(2, 2 + secretLength).buffer)),
      deviceToken: bytesToHex(payload.slice(2 + secretLength, totalLength)),
    };
  }
  if (bytes.length < 28) return null;
  const payload = bytes.slice(0, 28);
  return {
    deviceSecret: base64UrlFromBase64(arrayBufferToBase64(payload.slice(0, 16).buffer)),
    deviceToken: bytesToHex(payload.slice(16, 28)),
  };
};

const decodeLegacyCredentialMnemonic = (text, language = 'zh') => {
  const words = String(text || '').trim().split(/[\s/，、；;]+/).filter(Boolean);
  if (!words.length || words.length % 3 !== 0) return null;
  const wordset = legacyMnemonicWordsetForLanguage(language);
  let base32 = '';
  for (let i = 0; i < words.length; i += 3) {
    const a = wordset.verbs.indexOf(words[i]);
    const b = wordset.adjectives.indexOf(words[i + 1]);
    const c = wordset.nouns.indexOf(words[i + 2]);
    if (a < 0 || b < 0 || c < 0) return null;
    base32 += MNEMONIC_BASE32_ALPHABET[a];
    base32 += MNEMONIC_BASE32_ALPHABET[b];
    base32 += MNEMONIC_BASE32_ALPHABET[c];
  }
  const bytes = base32ToBytes(base32);
  if (!bytes || bytes.length < 28) return null;
  const payload = bytes.slice(0, 28);
  return {
    deviceSecret: base64UrlFromBase64(arrayBufferToBase64(payload.slice(0, 16).buffer)),
    deviceToken: bytesToHex(payload.slice(16, 28)),
  };
};

const buildIdentityCredentialText = ({ fingerprint = '', deviceSecret = '', deviceToken = '', createdAt = '', language = 'zh' } = {}) => {
  const recoveryCode = `${deviceSecret}.${deviceToken}`;
  const mnemonic = encodeCredentialMnemonic(deviceSecret, deviceToken, language);
  return [
    IDENTITY_CREDENTIAL_HEADER,
    'version: 2',
    `fingerprint: ${fingerprint}`,
    `created_at: ${createdAt || new Date().toISOString()}`,
    `mnemonic_language: ${language}`,
    `mnemonic: ${mnemonic}`,
    `device_secret: ${deviceSecret}`,
    `device_token: ${deviceToken}`,
    `recovery_code: ${recoveryCode}`,
    '',
    '说明：',
    '1. 这是恢复当前身份的凭证，请离线保存。',
    '2. 恢复时可直接粘贴整段文本，或只粘贴 recovery_code。',
  ].join('\n');
};

const openIdentityCredentialModal = ({ fingerprint = '', deviceSecret = '', deviceToken = '', firstBind = false } = {}) => {
  if (!deviceSecret || !deviceToken) return;
  const mnemonicZh = encodeCredentialMnemonic(deviceSecret, deviceToken, 'zh');
  const mnemonicEn = encodeCredentialMnemonic(deviceSecret, deviceToken, 'en');
  const fileTextZh = buildIdentityCredentialText({
    fingerprint,
    deviceSecret,
    deviceToken,
    createdAt: new Date().toISOString(),
    language: 'zh',
  });
  const fileTextEn = buildIdentityCredentialText({
    fingerprint,
    deviceSecret,
    deviceToken,
    createdAt: new Date().toISOString(),
    language: 'en',
  });
  identityCredentialModal.value = {
    open: true,
    fingerprint,
    mnemonicZh,
    mnemonicEn,
    fileTextZh,
    fileTextEn,
    language: identityMnemonicLanguage.value === 'en' ? 'en' : 'zh',
    firstBind,
  };
};

const closeIdentityCredentialModal = () => {
  identityCredentialModal.value = {
    open: false,
    fingerprint: '',
    mnemonicZh: '',
    mnemonicEn: '',
    fileTextZh: '',
    fileTextEn: '',
    language: identityMnemonicLanguage.value === 'en' ? 'en' : 'zh',
    firstBind: false,
  };
};

const downloadTextFile = (filename, text) => {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const downloadIdentityCredential = () => {
  if (!activeIdentityCredentialFileText.value) return;
  const suffix = (identityCredentialModal.value.fingerprint || 'credential').slice(0, 10);
  const lang = identityCredentialModal.value.language === 'en' ? 'en' : 'zh';
  downloadTextFile(`linkconnect-credential-${lang}-${suffix}.txt`, activeIdentityCredentialFileText.value);
};

const parseIdentityCredential = (raw) => {
  const text = String(raw || '').trim();
  if (!text) return null;
  for (const language of ['zh', 'en']) {
    const mnemonic = decodeCredentialMnemonic(text, language);
    if (mnemonic) {
      return mnemonic;
    }
  }
  const compact = text.replace(/\s+/g, '');
  const quickMatch = compact.match(/^([A-Za-z0-9_-]+)\.([A-Fa-f0-9]+)$/);
  if (quickMatch) {
    return { deviceSecret: quickMatch[1], deviceToken: quickMatch[2] };
  }

  const lines = text.split(/\r?\n/);
  const map = {};
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key) map[key] = value;
  }
  const mnemonicLanguage = map.mnemonic_language === 'en' ? 'en' : 'zh';
  const parsedMnemonic =
    decodeCredentialMnemonic(map.mnemonic || '', mnemonicLanguage) ||
    decodeCredentialMnemonic(map.mnemonic || '', mnemonicLanguage === 'en' ? 'zh' : 'en');
  if (parsedMnemonic) {
    return {
      fingerprint: map.fingerprint || '',
      ...parsedMnemonic,
    };
  }
  const recoveryCode = String(map.recovery_code || '').replace(/\s+/g, '');
  if (recoveryCode) {
    const recoveryMatch = recoveryCode.match(/^([A-Za-z0-9_-]+)\.([A-Fa-f0-9]+)$/);
    if (recoveryMatch) {
      return {
        fingerprint: map.fingerprint || '',
        deviceSecret: recoveryMatch[1],
        deviceToken: recoveryMatch[2],
      };
    }
  }
  if (map.device_secret && map.device_token) {
    return {
      fingerprint: map.fingerprint || '',
      deviceSecret: map.device_secret,
      deviceToken: map.device_token,
    };
  }
  return null;
};

const loadPersistedDirectGroups = (ownerUid = '') => {
  if (!ownerUid) return [];
  try {
    const raw = window.localStorage.getItem(DIRECT_GROUPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const payload = Array.isArray(parsed) ? { ownerUid: '', groups: parsed } : parsed;
    if (!payload || payload.ownerUid !== ownerUid || !Array.isArray(payload.groups)) return [];
    return payload.groups
      .map((item) => {
        const id = sanitizeGroupId(item?.id || '');
        const name = typeof item?.name === 'string' ? item.name.trim() : '';
        if (!id || !isDirectGroupId(id)) return null;
        return { id, name };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
};

const loadPersistedRegularGroups = (ownerUid = '') => {
  if (!ownerUid) return [];
  try {
    const raw = window.localStorage.getItem(REGULAR_GROUPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.ownerUid !== ownerUid || !Array.isArray(parsed.groups)) return [];
    return parsed.groups
      .map((item) => {
        const id = sanitizeGroupId(item?.id || '');
        const name = typeof item?.name === 'string' ? item.name.trim() : '';
        if (!id || id === SYSTEM_GROUP || id === SYSTEM_NOTICE_GROUP || isDirectGroupId(id)) return null;
        return { id, name };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
};

const loadPersistedGroupMeta = (ownerUid = '') => {
  if (!ownerUid) return {};
  try {
    const raw = window.localStorage.getItem(GROUP_META_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.ownerUid !== ownerUid || !parsed.groups || typeof parsed.groups !== 'object') return {};
    const out = {};
    for (const [groupId, meta] of Object.entries(parsed.groups)) {
      const gid = sanitizeGroupId(groupId);
      if (!gid || gid === SYSTEM_GROUP || gid === SYSTEM_NOTICE_GROUP || isDirectGroupId(gid)) continue;
      const groupName = typeof meta?.groupName === 'string' ? meta.groupName.trim() : '';
      const ownerUidValue = typeof meta?.ownerUid === 'string' ? meta.ownerUid.trim() : '';
      const announcement = typeof meta?.announcement === 'string' ? meta.announcement.trim().slice(0, GROUP_ANNOUNCEMENT_MAX) : '';
      const inviteApprovalRequired = meta?.inviteApprovalRequired !== false;
      out[gid] = {
        groupId: gid,
        groupName: groupName || gid,
        ownerUid: ownerUidValue,
        announcement,
        inviteApprovalRequired,
      };
    }
    return out;
  } catch {
    return {};
  }
};

const loadSavedGroupContacts = (ownerUid = '') => {
  if (!ownerUid) return [];
  try {
    const raw = window.localStorage.getItem(GROUP_CONTACTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.ownerUid !== ownerUid || !Array.isArray(parsed.groups)) return [];
    return parsed.groups
      .map((item) => {
        const id = sanitizeGroupId(item?.id || '');
        const name = typeof item?.name === 'string' ? item.name.trim() : '';
        if (!id || id === SYSTEM_GROUP || id === SYSTEM_NOTICE_GROUP || isDirectGroupId(id)) return null;
        return { id, name };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
};

const restoreSavedGroupContacts = () => {
  if (!myUid.value) return;
  savedGroupContacts.value = loadSavedGroupContacts(myUid.value);
};

const persistSavedGroupContacts = () => {
  if (!myUid.value) return;
  try {
    window.localStorage.setItem(
      GROUP_CONTACTS_STORAGE_KEY,
      JSON.stringify({
        ownerUid: myUid.value,
        groups: savedGroupContacts.value.slice(0, 48),
      })
    );
  } catch {
    // no-op
  }
};

const toggleCurrentGroupContact = () => {
  const gid = sanitizeGroupId(activeGroup.value);
  if (!gid || gid === SYSTEM_GROUP || gid === SYSTEM_NOTICE_GROUP || isDirectGroupId(gid)) return;
  if (currentGroupSavedToContacts.value) {
    savedGroupContacts.value = savedGroupContacts.value.filter((item) => item.id !== gid);
    toast('已从通讯录移除该群聊。', 'info');
    return;
  }
  const name = activeGroupName.value || gid;
  savedGroupContacts.value = [{ id: gid, name }, ...savedGroupContacts.value.filter((item) => item.id !== gid)];
  toast('已将该群聊加入通讯录。', 'info');
};

const persistDirectGroups = () => {
  if (!deviceFingerprint.value) return;
  try {
    const groupsToStore = groups.value
      .filter((group) => {
        if (!group || !isDirectGroupId(group.id)) return false;
        const ids = group.id.slice(3).split(':').filter(Boolean);
        return ids.includes(deviceFingerprint.value);
      })
      .map((group) => ({
        id: group.id,
        name: typeof group.name === 'string' ? group.name : '',
      }))
      .slice(0, 24);
    window.localStorage.setItem(
      DIRECT_GROUPS_STORAGE_KEY,
      JSON.stringify({
        ownerUid: deviceFingerprint.value,
        groups: groupsToStore,
      })
    );
  } catch {
    // no-op
  }
};

const persistRegularGroups = () => {
  const ownerUid = myUid.value || deviceFingerprint.value;
  if (!ownerUid) return;
  try {
    const groupsToStore = groups.value
      .filter((group) => group && group.id && group.id !== SYSTEM_GROUP && group.id !== SYSTEM_NOTICE_GROUP && !isDirectGroupId(group.id))
      .map((group) => ({
        id: group.id,
        name:
          (typeof groupMetaMap.value[group.id]?.groupName === 'string' && groupMetaMap.value[group.id].groupName.trim()) ||
          (typeof group.name === 'string' ? group.name : ''),
      }))
      .slice(0, 48);
    window.localStorage.setItem(
      REGULAR_GROUPS_STORAGE_KEY,
      JSON.stringify({
        ownerUid,
        groups: groupsToStore,
      })
    );
  } catch {
    // no-op
  }
};

const persistGroupMeta = () => {
  const ownerUid = myUid.value || deviceFingerprint.value;
  if (!ownerUid) return;
  try {
    const groups = {};
    for (const [groupId, meta] of Object.entries(groupMetaMap.value || {})) {
      const gid = sanitizeGroupId(groupId);
      if (!gid || gid === SYSTEM_GROUP || gid === SYSTEM_NOTICE_GROUP || isDirectGroupId(gid)) continue;
      const groupName = typeof meta?.groupName === 'string' ? meta.groupName.trim() : '';
      const ownerUidValue = typeof meta?.ownerUid === 'string' ? meta.ownerUid.trim() : '';
      groups[gid] = {
        groupName: groupName || gid,
        ownerUid: ownerUidValue,
        announcement: typeof meta?.announcement === 'string' ? meta.announcement.trim().slice(0, GROUP_ANNOUNCEMENT_MAX) : '',
        inviteApprovalRequired: meta?.inviteApprovalRequired !== false,
      };
    }
    window.localStorage.setItem(
      GROUP_META_STORAGE_KEY,
      JSON.stringify({
        ownerUid,
        groups,
      })
    );
  } catch {
    // no-op
  }
};

const loadPersistedPinnedGroups = (ownerUid = '') => {
  if (!ownerUid) return {};
  try {
    const raw = window.localStorage.getItem(GROUP_PIN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.ownerUid !== ownerUid || !parsed.pins || typeof parsed.pins !== 'object') return {};
    const out = {};
    for (const [groupId, pinnedAt] of Object.entries(parsed.pins)) {
      const gid = sanitizeGroupId(groupId);
      const ts = Math.max(0, Number(pinnedAt) || 0);
      if (!isRegularPinnedGroupId(gid) || !ts) continue;
      out[gid] = ts;
    }
    return out;
  } catch {
    return {};
  }
};

const persistPinnedGroups = () => {
  const ownerUid = myUid.value || deviceFingerprint.value;
  if (!ownerUid) return;
  try {
    const pins = {};
    for (const [groupId, pinnedAt] of Object.entries(pinnedGroups.value || {})) {
      const gid = sanitizeGroupId(groupId);
      const ts = Math.max(0, Number(pinnedAt) || 0);
      if (!isRegularPinnedGroupId(gid) || !ts) continue;
      pins[gid] = ts;
    }
    window.localStorage.setItem(
      GROUP_PIN_STORAGE_KEY,
      JSON.stringify({
        ownerUid,
        pins,
      })
    );
  } catch {
    // no-op
  }
};

const restorePersistedPinnedGroups = () => {
  if (!myUid.value) return;
  pinnedGroups.value = loadPersistedPinnedGroups(myUid.value);
};

const toggleGroupPinned = (groupId) => {
  const gid = sanitizeGroupId(groupId);
  if (!isRegularPinnedGroupId(gid)) return;
  const next = { ...pinnedGroups.value };
  if (next[gid]) {
    delete next[gid];
    toast('已取消群置顶。', 'info');
  } else {
    next[gid] = Date.now();
    toast('已置顶该群聊。', 'info');
  }
  pinnedGroups.value = next;
};

const toggleActiveGroupPinned = () => {
  toggleGroupPinned(activeGroup.value);
};

const clearPersistedDirectGroups = () => {
  try {
    window.localStorage.removeItem(DIRECT_GROUPS_STORAGE_KEY);
  } catch {
    // no-op
  }
};

const clearPersistedRegularGroups = () => {
  try {
    window.localStorage.removeItem(REGULAR_GROUPS_STORAGE_KEY);
  } catch {
    // no-op
  }
};

const clearPersistedGroupMeta = () => {
  try {
    window.localStorage.removeItem(GROUP_META_STORAGE_KEY);
  } catch {
    // no-op
  }
};

const restorePersistedDirectGroups = () => {
  if (!myUid.value) return;
  const restored = loadPersistedDirectGroups(myUid.value);
  for (const group of restored) {
    const targetUid = getDirectTargetUid(group.id);
    if (!targetUid) continue;
    ensureGroupInList(group.id, group.name || nameForDirectGroup(group.id));
  }
  if (restored.length) {
    refreshDirectGroupNames();
  }
};

const restorePersistedGroupMeta = () => {
  if (!myUid.value) return;
  const restored = loadPersistedGroupMeta(myUid.value);
  if (Object.keys(restored).length) {
    groupMetaMap.value = { ...restored, ...groupMetaMap.value };
  }
};

const restorePersistedRegularGroups = () => {
  if (!myUid.value) return;
  const restored = loadPersistedRegularGroups(myUid.value);
  for (const group of restored) {
    const persistedMetaName = groupMetaMap.value[group.id]?.groupName || '';
    ensureGroupInList(group.id, persistedMetaName || group.name || group.id);
  }
};

const autoRestoreOwnedGroups = () => {
  if (!powState.value.verified || !ws || ws.readyState !== WS_OPEN || !myUid.value) return;
  const now = Date.now();
  for (const group of groups.value) {
    const gid = sanitizeGroupId(group?.id);
    if (!gid || !isOwnedGroupByMe(gid) || hasJoinedGroup(gid)) continue;
    const lastAttempt = ownedGroupRestoreAttempts.get(gid) || 0;
    if (now - lastAttempt < 4000) continue;
    ownedGroupRestoreAttempts.set(gid, now);
    joinGroup(gid, '', {
      select: false,
      force: true,
      groupName: groupMetaMap.value[gid]?.groupName || group?.name || gid,
    });
  }
};

const autoRestoreDirectGroups = () => {
  if (!powState.value.verified || !ws || ws.readyState !== WS_OPEN || !myUid.value) return;
  const now = Date.now();
  for (const group of groups.value) {
    if (!group || !isDirectGroupId(group.id) || joinedGroups.has(group.id)) continue;
    const targetUid = getDirectTargetUid(group.id);
    if (!targetUid) continue;
    const lastAttempt = directRestoreAttempts.get(group.id) || 0;
    if (now - lastAttempt < 4000) continue;
    directRestoreAttempts.set(group.id, now);
    joinGroup(group.id, '', { select: false });
  }
};

const initDeviceFingerprint = async () => {
  if (deviceFingerprint.value) {
    myUid.value = deviceFingerprint.value;
    restorePersistedGroupMeta();
    restorePersistedDirectGroups();
    restorePersistedRegularGroups();
    restorePersistedPinnedGroups();
    restoreSavedGroupContacts();
    return;
  }
  const storedFingerprint = getStoredFingerprint();
  if (storedFingerprint) {
    deviceFingerprint.value = storedFingerprint;
    myUid.value = storedFingerprint;
    restorePersistedGroupMeta();
    restorePersistedDirectGroups();
    restorePersistedRegularGroups();
    restorePersistedPinnedGroups();
    restoreSavedGroupContacts();
  }
  getOrCreateDeviceSecret();
  registerDeviceFingerprint();
};

const getDeviceToken = () => {
  const derived = deriveDeviceTokenFromSecret(getOrCreateDeviceSecret());
  try {
    const cached = window.localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY) || '';
    if (derived && cached !== derived) {
      window.localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, derived);
    }
    return derived || cached;
  } catch {
    return derived;
  }
};

const setDeviceToken = (token) => {
  if (!token) return;
  try {
    window.localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, token);
  } catch {
    // no-op
  }
};

const resetDeviceBinding = ({ keepCredential = false } = {}) => {
  try {
    if (!keepCredential) {
      window.localStorage.removeItem(DEVICE_SECRET_STORAGE_KEY);
      window.localStorage.removeItem(DEVICE_TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(DEVICE_FINGERPRINT_STORAGE_KEY);
    }
  } catch {
    // no-op
  }
  clearPersistedDirectGroups();
  clearPersistedRegularGroups();
  clearPersistedGroupMeta();
  nicknameGuideOpen.value = false;
  nicknameGuidePending.value = false;
  closeIdentityCredentialModal();
  deviceBound.value = false;
  deviceFingerprint.value = '';
  myUid.value = '';
  myNickname.value = '';
  nicknameInput.value = '';
  pinnedGroups.value = {};
  clearReplyDraft();
  void initDeviceFingerprint();
};

const registerDeviceFingerprint = () => {
  if (!ws || ws.readyState !== WS_OPEN) return;
  const deviceSecret = getOrCreateDeviceSecret();
  const deviceToken = getDeviceToken();
  ws.send(
    JSON.stringify({
      type: 'set_device_fingerprint',
      deviceSecret,
      deviceProfile: collectDeviceProfile(),
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
  const updatedPeerMap = { ...peerIdentityMap.value };
  for (const user of validated) {
    const uid = typeof user?.uid === 'string' ? user.uid : '';
    const identityDh = typeof user?.identityDh === 'string' ? user.identityDh : '';
    const identitySign = typeof user?.identitySign === 'string' ? user.identitySign : '';
    if (!uid) continue;
    const previousDh = knownRemoteIdentityDh.get(uid) || '';
    if (previousDh && identityDh && previousDh !== identityDh) {
      dmSessions.delete(uid);
      startDmNegotiation(buildDirectGroupId(myUid.value, uid), uid);
    }
    if (identityDh) {
      knownRemoteIdentityDh.set(uid, identityDh);
    }
    updatedPeerMap[uid] = {
      identityDh,
      identitySign,
      identityValid: user.identityValid !== false,
    };
  }
  peerIdentityMap.value = updatedPeerMap;
};

const registerIdentity = async () => {
  if (!ws || ws.readyState !== WS_OPEN) return;
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
  if (!ws || ws.readyState !== WS_OPEN || !myPublicKeyBase64.value) return;
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
  const groupId = buildDirectGroupId(myUid.value, uid);
  const directKnown = Boolean(groupId && (joinedGroups.has(groupId) || groups.value.some((group) => group?.id === groupId)));
  let session = getDmSession(uid);
  if (session) {
    const sameRemoteIdentity = session.identityRemoteDh === identityDhBase64;
    const sameLocalIdentity = session.identitySelfDh === identityDhPublicBase64.value;
    if (sameRemoteIdentity && sameLocalIdentity) {
      return session;
    }
    dmSessions.delete(uid);
    startDmNegotiation(groupId, uid);
    session = null;
  }
  if (!identityDhBase64) return null;
  if (!session && directKnown) {
    startDmNegotiation(groupId, uid);
  }

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
    identityRemoteDh: identityDhBase64,
    identitySelfDh: identityDhPublicBase64.value,
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
  finishDmNegotiation(buildDirectGroupId(myUid.value, targetUid), targetUid);

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
  if (session) {
    const sameRemoteIdentity = session.identityRemoteDh === senderIdentityDh;
    const sameLocalIdentity = session.identitySelfDh === identityDhPublicBase64.value;
    if (!sameRemoteIdentity || !sameLocalIdentity) {
      dmSessions.delete(senderUid);
      startDmNegotiation(buildDirectGroupId(myUid.value, senderUid), senderUid);
      session = null;
    }
  }
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
  finishDmNegotiation(buildDirectGroupId(myUid.value, senderUid), senderUid);
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
  if (!ws || ws.readyState !== WS_OPEN) return;
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
    const peerKeys = peerIdentityMap.value[data.sender] || null;
    const senderIdentityDh =
      (peerKeys && peerKeys.identityDh) ||
      (typeof data.senderIdentityDh === 'string' ? data.senderIdentityDh : '');
    const senderIdentitySign =
      (peerKeys && peerKeys.identitySign) ||
      (typeof data.senderIdentitySign === 'string' ? data.senderIdentitySign : '');
    const senderIdentitySig =
      (typeof data.senderIdentitySig === 'string' ? data.senderIdentitySig : '');
    if (!senderIdentityDh || !senderIdentitySign || !senderIdentitySig) return null;
    const signatureOk = await verifySignature(senderIdentitySign, base64ToUint8(senderIdentityDh), senderIdentitySig);
    if (!signatureOk) return null;
    const previousDh = knownRemoteIdentityDh.get(data.sender) || '';
    if (previousDh && previousDh !== senderIdentityDh) {
      dmSessions.delete(data.sender);
      startDmNegotiation(sanitizeGroupId(data.groupId) || buildDirectGroupId(myUid.value, data.sender), data.sender);
    }
    knownRemoteIdentityDh.set(data.sender, senderIdentityDh);
    try {
      return await dmDecryptPayload(
        data.sender,
        senderIdentityDh,
        senderIdentitySign,
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

const outgoingStatusLabel = (msg) => {
  if (!msg || msg.sender !== myUid.value) return '';
  if (Array.isArray(msg.readBy) && msg.readBy.length) return '已读';
  if (msg.clientStatus === 'queued') return '待发送';
  if (msg.clientStatus === 'sending') return '发送中';
  if (msg.clientStatus === 'failed') return '失败';
  if (msg.clientStatus === 'sent') return '发送中';
  return '送达';
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
  if (!ws || ws.readyState !== WS_OPEN) return;
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

const pushSendBlockedTip = (groupId, { title, text, actions = [], dedupeKey = '' }) => {
  const gid = sanitizeGroupId(groupId) || SYSTEM_GROUP;
  const tipTitle = typeof title === 'string' && title.trim() ? title.trim() : '发送未完成';
  const tipText = typeof text === 'string' ? text.trim() : '';
  const tipKey = dedupeKey || `${tipTitle}|${tipText}`;
  const now = Date.now();
  const exists = messages.value.some(
    (msg) =>
      msg.payloadType === 'send_block_tip' &&
      (msg.groupId || SYSTEM_GROUP) === gid &&
      msg.tipKey === tipKey &&
      now - (msg.ts || 0) < 12_000
  );
  if (exists) return;

  messages.value.push({
    msgId: createMsgId(),
    payloadType: 'send_block_tip',
    sender: '系统消息',
    groupId: gid,
    text: '',
    tipTitle,
    tipText,
    tipActions: normalizeSystemActions(actions),
    tipKey,
    ts: now,
    read: true,
    localSeen: true,
    readBy: [],
    isSystem: true,
    systemAction: '',
    systemActionLabel: '',
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
      if (shouldDelayAudioBurnUntilPlaybackEnds(msg)) continue;
      sendReadReceipt(msg.sender, msg.msgId, gid);
      if (msg.burnAfterRead) {
        scheduleBurnMessage(msg);
      }
    }
  }
  clearUnread(gid);
};

const maybeMarkActiveGroupSeen = () => {
  if (document.hidden) return;
  if (!isNearBottom()) return;
  markGroupSeen(activeGroup.value);
};

const resetBannerSwipe = () => {
  bannerSwipe.value = { active: false, pointerId: null, startX: 0, startY: 0, dx: 0, dy: 0, axis: '' };
};

const startBannerSwipe = (event) => {
  if (!mobileViewport.value || !banner.value.open) return;
  const pointerType = typeof event?.pointerType === 'string' ? event.pointerType : '';
  if (pointerType && pointerType !== 'touch' && pointerType !== 'pen') return;
  if (typeof event?.button === 'number' && event.button !== 0) return;
  bannerSwipe.value = {
    active: true,
    pointerId: typeof event?.pointerId === 'number' ? event.pointerId : null,
    startX: Number(event?.clientX) || 0,
    startY: Number(event?.clientY) || 0,
    dx: 0,
    dy: 0,
    axis: '',
  };
  event.currentTarget?.setPointerCapture?.(event.pointerId);
};

const handleBannerSwipeMove = (event) => {
  if (!bannerSwipe.value.active) return;
  if (bannerSwipe.value.pointerId !== null && event?.pointerId !== bannerSwipe.value.pointerId) return;
  const rawDx = (Number(event?.clientX) || 0) - bannerSwipe.value.startX;
  const rawDy = (Number(event?.clientY) || 0) - bannerSwipe.value.startY;
  let axis = bannerSwipe.value.axis;
  if (!axis) {
    if (Math.abs(rawDx) < 8 && Math.abs(rawDy) < 8) return;
    axis = Math.abs(rawDx) > Math.abs(rawDy) ? 'x' : 'y';
  }
  if (axis === 'x') {
    bannerSwipe.value = { ...bannerSwipe.value, axis, dx: rawDx, dy: 0 };
    return;
  }
  bannerSwipe.value = { ...bannerSwipe.value, axis, dx: 0, dy: Math.min(0, rawDy) };
};

const cancelBannerSwipe = () => {
  resetBannerSwipe();
};

const endBannerSwipe = (event) => {
  if (!bannerSwipe.value.active) return;
  if (bannerSwipe.value.pointerId !== null && event?.pointerId !== bannerSwipe.value.pointerId) return;
  const shouldDismiss =
    Math.abs(Number(bannerSwipe.value.dx) || 0) >= 72 || (Number(bannerSwipe.value.dy) || 0) <= -56;
  resetBannerSwipe();
  if (shouldDismiss) {
    dismissBanner();
  }
};

const showBanner = ({ groupId, title, text, clickable = true }) => {
  resetBannerSwipe();
  banner.value = {
    open: true,
    groupId,
    title,
    text,
    clickable: clickable !== false,
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

const dismissBanner = () => {
  resetBannerSwipe();
  banner.value = { open: false, groupId: '', title: '', text: '', canEnableNotify: false, clickable: true };
};

const openBannerChat = () => {
  const gid = banner.value.groupId;
  if (!gid) return;
  dismissBanner();
  if (gid === SYSTEM_NOTICE_GROUP) {
    openSystemNoticePanel();
    return;
  }
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
    if (groupId === SYSTEM_NOTICE_GROUP) {
      openSystemNoticePanel();
    } else {
      openGroup(groupId);
    }
    notification.close();
  };
};

const handleVisibilityChange = () => {
  if (!document.hidden) {
    if (systemNoticeOpen.value) {
      clearUnread(SYSTEM_NOTICE_GROUP);
    }
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
  audioData = '',
  audioDurationMs = 0,
  audioWaveform = [],
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
  clientStatus = 'sending',
  clientError = '',
  outboxId = '',
  replyTo = null,
  burnAfterRead = false,
  burnAfterMs = 0,
}) => {
  messages.value.push({
    msgId,
    payloadType,
    sender: myUid.value,
    groupId,
    text,
    imageData,
    audioData,
    audioDurationMs: Number(audioDurationMs) || 0,
    audioWaveform: normalizeWaveform(audioWaveform, VOICE_WAVEFORM_SIZE),
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
    clientStatus,
    clientError,
    outboxId: outboxId || '',
    replyTo: normalizeReplyPayload(replyTo),
    burnAfterRead: Boolean(burnAfterRead),
    burnAfterMs: Number(burnAfterMs) || 0,
    audioListenedAt: 0,
    burnScheduledAt: 0,
    burnAt: 0,
  });
};

const findLocalOutgoing = (msgId) => {
  if (!msgId) return null;
  return messages.value.find((m) => m.msgId === msgId && m.sender === myUid.value) || null;
};

const pushOutgoingPayloadMessage = (msgId, payloadType, groupId, payload = {}, clientStatus = 'sending', clientError = '') => {
  const common = {
    msgId,
    groupId,
    clientStatus,
    clientError,
    outboxId: msgId,
    replyTo: normalizeReplyPayload(payload.replyTo),
    burnAfterRead: payload.burnAfterRead === true,
    burnAfterMs: payload.burnAfterMs || 0,
  };
  if (payloadType === 'image') {
    pushLocalMessage({
      ...common,
      payloadType: 'image',
      imageData: payload.imageData,
      name: payload.name,
    });
    return;
  }
  if (payloadType === 'audio') {
    pushLocalMessage({
      ...common,
      payloadType: 'audio',
      audioData: payload.audioData,
      audioDurationMs: payload.durationMs || 0,
      audioWaveform: payload.waveform || [],
      name: payload.name || '',
    });
    return;
  }
  if (payloadType === 'pair') {
    pushLocalMessage({
      ...common,
      payloadType: 'pair',
      pairGroupId: payload.pairGroupId || '',
      pairInviteCode: payload.pairInviteCode || '',
      pairInviteLink: payload.pairInviteLink || '',
      pairGroupName: payload.pairGroupName || '',
      pairStatus: payload.pairStatus || 'pending',
    });
    return;
  }
  if (payloadType === 'invite') {
    pushLocalMessage({
      ...common,
      payloadType: 'invite',
      text: payload.inviteGroup || '',
      inviteCode: payload.inviteCode || '',
      inviteLink: payload.inviteLink || '',
      inviteGroup: payload.inviteGroup || '',
      inviteGroupName: payload.inviteGroupName || '',
      expiresAt: payload.expiresAt || null,
    });
    return;
  }
  pushLocalMessage({
    ...common,
    payloadType: 'text',
    text: payload.text || '',
  });
};

const markOutgoingStatus = (msgId, status, errorText = '') => {
  const local = findLocalOutgoing(msgId);
  if (!local) return;
  local.clientStatus = status;
  if (errorText) {
    local.clientError = errorText;
  } else if (status !== 'failed') {
    local.clientError = '';
  }
};

const clearOutgoingAckTimeout = (msgId) => {
  const timer = outgoingAckTimers.get(msgId);
  if (!timer) return;
  window.clearTimeout(timer);
  outgoingAckTimers.delete(msgId);
};

const markOutgoingFailed = (msgId, errorText = '发送失败') => {
  clearOutgoingAckTimeout(msgId);
  markOutgoingStatus(msgId, 'failed', errorText);
  const item = findOutboxEntry(msgId);
  if (item) {
    item.retries = Number(item.retries || 0) + 1;
    persistOutboxQueue();
  }
};

const scheduleOutgoingAckTimeout = (msgId) => {
  if (!msgId) return;
  clearOutgoingAckTimeout(msgId);
  const timer = window.setTimeout(() => {
    const local = findLocalOutgoing(msgId);
    if (!local || local.clientStatus === 'delivered' || local.clientStatus === 'read') return;
    markOutgoingFailed(msgId, '发送超时，请检查网络后重新发送');
  }, OUTGOING_ACK_TIMEOUT_MS);
  outgoingAckTimers.set(msgId, timer);
};

const ensureFailedOutgoingMessage = (msgId, payloadType, groupId, payload, errorText) => {
  ensureOutboxEntry(groupId, payloadType, payload, msgId);
  if (findLocalOutgoing(msgId)) {
    markOutgoingFailed(msgId, errorText);
  } else {
    pushOutgoingPayloadMessage(msgId, payloadType, groupId, payload, 'failed', errorText);
  }
};

const normalizeSystemActions = (actions, fallbackAction = '', fallbackLabel = '') => {
  const out = [];
  if (Array.isArray(actions)) {
    for (const item of actions) {
      const action = typeof item?.action === 'string' ? item.action.trim() : '';
      if (!action) continue;
      const label = typeof item?.label === 'string' && item.label.trim() ? item.label.trim() : action;
      out.push({ ...item, action, label });
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

const pushSystemMessageToGroup = ({ groupId = SYSTEM_NOTICE_GROUP, title, text, action = '', actionLabel = '', actions = [], meta = {} }) => {
  const targetGroupId = sanitizeGroupId(groupId) || SYSTEM_NOTICE_GROUP;
  const normalizedActions = normalizeSystemActions(actions, action, actionLabel);
  messages.value.push({
    msgId: createMsgId(),
    payloadType: 'system',
    sender: '系统消息',
    groupId: targetGroupId,
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
  const onTargetOpen =
    targetGroupId === SYSTEM_NOTICE_GROUP
      ? systemNoticeOpen.value
      : activeGroup.value === targetGroupId;
  if (onTargetOpen && !document.hidden) {
    markGroupSeen(targetGroupId);
    return;
  }
  if (document.hidden || activeGroup.value !== targetGroupId || !isNearBottom()) {
    incrementUnread(targetGroupId);
    showBanner({
      groupId: targetGroupId,
      title: groups.value.find((g) => g.id === targetGroupId)?.name || targetGroupId,
      text: preview.slice(0, 80),
      clickable: targetGroupId !== SYSTEM_NOTICE_GROUP,
    });
    showSystemNotification(targetGroupId, preview.slice(0, 80));
    void playNotifySound();
  } else {
    markGroupSeen(targetGroupId);
  }
};

const pushSystemMessage = ({ title, text, action = '', actionLabel = '', actions = [], meta = {} }) => {
  pushSystemMessageToGroup({
    groupId: SYSTEM_NOTICE_GROUP,
    title,
    text,
    action,
    actionLabel,
    actions,
    meta,
  });
};

const handleSystemAction = (msg, actionItem = null) => {
  const action = typeof actionItem?.action === 'string' && actionItem.action
    ? actionItem.action
    : msg?.systemAction || '';
  if (!msg || !action) return;
  if (action === 'show_explanation') {
    openExplanationModal({
      title:
        (typeof actionItem?.title === 'string' && actionItem.title.trim()) ||
        msg?.systemTitle ||
        '原因说明',
      text:
        (typeof actionItem?.text === 'string' && actionItem.text.trim()) ||
        msg?.systemText ||
        '当前操作暂时无法完成。',
      tip: typeof actionItem?.tip === 'string' ? actionItem.tip.trim() : '',
    });
    return;
  }
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
    openSettingsPage();
    return;
  }
  if (action === 'open_home') {
    openGroup(SYSTEM_GROUP);
    return;
  }
  if (action === 'open_system_notice') {
    openSystemNoticePanel();
    return;
  }
  if (action === 'open_related_group') {
    const groupId = sanitizeGroupId(
      actionItem?.groupId || msg?.systemMeta?.groupId || msg?.systemMeta?.pairGroupId || ''
    );
    if (!groupId) return;
    closeSystemNoticePanel();
    openGroup(groupId);
    return;
  }
  if (action === 'create_group') {
    createGroup();
    return;
  }
  if (action === 'create_group_modal') {
    createGroup();
    return;
  }
  if (action === 'open_group_manage') {
    openGroupManage();
    return;
  }
  if (
    action === 'approve_group_invite' ||
    action === 'reject_group_invite' ||
    action === 'approve_group_join' ||
    action === 'reject_group_join'
  ) {
    const requestId =
      (typeof actionItem?.requestId === 'string' && actionItem.requestId) ||
      (typeof msg?.systemMeta?.requestId === 'string' ? msg.systemMeta.requestId : '');
    if (!requestId || !ws || ws.readyState !== WS_OPEN) return;
    ws.send(
      JSON.stringify({
        type: 'group_invite_approve',
        requestId,
        approve: action === 'approve_group_invite' || action === 'approve_group_join',
      })
    );
    return;
  }
  if (action === 'accept_direct_request' || action === 'decline_direct_request') {
    const requestId =
      (typeof actionItem?.requestId === 'string' && actionItem.requestId) ||
      (typeof msg?.systemMeta?.requestId === 'string' ? msg.systemMeta.requestId : '');
    respondDirectRequest(requestId, action === 'accept_direct_request');
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
    return;
  }
  if (action === 'retry_outbox') {
    retryOutbox();
    return;
  }
  if (action === 'leave_group') {
    leaveActiveGroup();
    return;
  }
  if (action === 'reconnect_now') {
    manualReconnect();
  }
};

const sendEncryptedPayload = async (payloadType, payload, options = {}) => {
  if (!ws || ws.readyState !== WS_OPEN) return false;

  const groupId = sanitizeGroupId(options.groupId || activeGroup.value) || SYSTEM_GROUP;
  const msgId = typeof options.msgId === 'string' && options.msgId ? options.msgId : createMsgId();
  if (isDirectGroupId(groupId)) {
    return sendDirectEncryptedPayload(payloadType, payload, groupId, { ...options, msgId });
  }
  if (!hasJoinedGroup(groupId)) {
    ensureOutboxEntry(groupId, payloadType, payload, msgId);
    if (!options.skipLocalPush) {
      pushOutgoingPayloadMessage(msgId, payloadType, groupId, payload, 'queued');
    } else {
      markOutgoingStatus(msgId, 'queued');
    }
    pushSendBlockedTip(groupId, {
      title: '群聊正在恢复',
      text: '恢复完成后会自动重发。',
      dedupeKey: `group-restore-pending-${groupId}`,
    });
    toast('群聊成员资格尚在恢复中。', 'info');
    return false;
  }
  const serverPayloadType = payloadType === 'image' ? 'image' : payloadType === 'audio' ? 'audio' : 'text';

  // 获取群组所有成员公钥
  let allRecipients = [];
  try {
    const pubKeys = await fetchGroupPublicKeys(groupId);
    for (const [uid, pubKey] of Object.entries(pubKeys)) {
      if (uid !== myUid.value && typeof pubKey === 'string' && pubKey.length > 0) {
        allRecipients.push({ uid, publicKey: pubKey });
      }
    }
  } catch { /* best effort */ }

  // 没有可投递对象也直接发，服务端会存离线队列
  if (!allRecipients.length) {
    ensureOutboxEntry(groupId, payloadType, payload, msgId);
    ws.send(
      JSON.stringify({
        type: 'chat',
        msgId,
        reqId: msgId,
        groupId,
        payloadType: serverPayloadType,
        iv: '',
        ciphertext: '',
        keys: {},
        mimeType: payload.mimeType || null,
        name: payload.name || null,
        burnAfterRead: payload.burnAfterRead === true,
        burnAfterMs: Number(payload.burnAfterMs) || 0,
      })
    );
    if (!options.skipLocalPush) {
      pushOutgoingPayloadMessage(msgId, payloadType, groupId, payload, 'sending');
    } else {
      markOutgoingStatus(msgId, 'sending');
    }
    scheduleOutgoingAckTimeout(msgId);
    scrollToBottom();
    return true;
  }

  const encrypted = await encryptPayloadForRecipients(payload, allRecipients);
  ensureOutboxEntry(groupId, payloadType, payload, msgId);

  ws.send(
    JSON.stringify({
      type: 'chat',
      msgId,
      reqId: msgId,
      groupId,
      payloadType: serverPayloadType,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
      keys: encrypted.keys,
      mimeType: payload.mimeType || null,
      name: payload.name || null,
      burnAfterRead: payload.burnAfterRead === true,
      burnAfterMs: Number(payload.burnAfterMs) || 0,
    })
  );

  if (!options.skipLocalPush) {
    pushOutgoingPayloadMessage(msgId, payloadType, groupId, payload, 'sending');
  } else {
    markOutgoingStatus(msgId, 'sending');
  }
  scheduleOutgoingAckTimeout(msgId);

  scrollToBottom();
  return true;
};

const sendDirectEncryptedPayload = async (payloadType, payload, groupId, options = {}) => {
  const msgId = typeof options.msgId === 'string' && options.msgId ? options.msgId : createMsgId();
  const targetUid = getDirectTargetUid(groupId);
  if (!targetUid) {
    ensureFailedOutgoingMessage(msgId, payloadType, groupId, payload, '私聊对象不存在，请稍候再试');
    pushSendBlockedTip(groupId, {
      title: '发送失败：私聊对象不存在',
      text: '当前私聊会话信息不完整，请重新发起私聊。',
      actions: [{ action: 'open_home', label: '返回首页' }],
      dedupeKey: `dm-target-missing-${groupId}`,
    });
    toast('无法找到私聊对象。', 'error');
    return false;
  }

  if (isDmLocked(groupId)) {
    ensureFailedOutgoingMessage(msgId, payloadType, groupId, payload, '私聊受限，请等待回复后重试');
    pushDmLimitTip(groupId, targetUid);
    toast('你不在对方通讯录：请等待对方回复，或先申请加入对方通讯录。', 'info');
    return false;
  }

  const peerKeys = peerIdentityMap.value[targetUid] || null;
  if (!peerKeys || !peerKeys.identityDh || !peerKeys.identitySign) {
    ensureFailedOutgoingMessage(msgId, payloadType, groupId, payload, '对方身份未就绪，请稍候再试');
    pushSendBlockedTip(groupId, {
      title: '发送未完成：对方身份未就绪',
      text: '对方可能尚未加入同一群组，身份信息不可用，请稍后重试。',
      dedupeKey: `dm-target-identity-not-ready-${targetUid}`,
    });
    toast('对方身份信息未就绪。', 'error');
    return false;
  }
  if (peerKeys.identityValid === false) {
    ensureFailedOutgoingMessage(msgId, payloadType, groupId, payload, '对方身份校验失败，无法发送');
    pushSendBlockedTip(groupId, {
      title: '发送已拦截：身份校验失败',
      text: '检测到对方身份签名异常，已阻止发送以保护安全。',
      actions: [{ action: 'open_home', label: '返回首页' }],
      dedupeKey: `dm-target-identity-invalid-${targetUid}`,
    });
    toast('对方身份签名无效，无法安全通信。', 'error');
    return false;
  }

  const encrypted = await dmEncryptPayload(targetUid, peerKeys.identityDh, payload);
  if (!encrypted) {
    ensureFailedOutgoingMessage(msgId, payloadType, groupId, payload, '本地加密失败，请稍候再试');
    pushSendBlockedTip(groupId, {
      title: '发送失败：加密异常',
      text: '本地加密失败，请稍后重试。',
      dedupeKey: `dm-encrypt-fail-${groupId}`,
    });
    toast('私聊加密失败。', 'error');
    return false;
  }

  const serverPayloadType = payloadType === 'image' ? 'image' : payloadType === 'audio' ? 'audio' : 'text';
  ensureOutboxEntry(groupId, payloadType, payload, msgId);

  ws.send(
    JSON.stringify({
      type: 'chat',
      msgId,
      reqId: msgId,
      groupId,
      payloadType: serverPayloadType,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
      keys: { [targetUid]: encrypted.header },
      encType: 'dm',
      burnAfterRead: payload.burnAfterRead === true,
      burnAfterMs: Number(payload.burnAfterMs) || 0,
    })
  );

  if (!options.skipLocalPush) {
    pushOutgoingPayloadMessage(msgId, payloadType, groupId, payload, 'sending');
  } else {
    markOutgoingStatus(msgId, 'sending');
  }
  scheduleOutgoingAckTimeout(msgId);

  markDmOutgoing(groupId);
  scrollToBottom();
  return true;
};

const queueOutgoingMessage = (payloadType, payload, groupId) => {
  const gid = sanitizeGroupId(groupId) || SYSTEM_GROUP;
  const msgId = enqueueOutbox(gid, payloadType, payload);
  pushOutgoingPayloadMessage(msgId, payloadType, gid, payload, 'queued');
  return msgId;
};

const flushOutbox = async () => {
  if (isFlushingOutbox.value) return;
  pruneOutboxQueue();
  if (!outboxQueue.value.length) return;
  if (!ws || ws.readyState !== WS_OPEN || !powState.value.verified) return;
  isFlushingOutbox.value = true;
  try {
    let idx = 0;
    while (idx < outboxQueue.value.length) {
      const item = outboxQueue.value[idx];
      if (!item) {
        idx += 1;
        continue;
      }
      if (!isDirectGroupId(item.groupId) && !hasJoinedGroup(item.groupId)) {
        idx += 1;
        continue;
      }
      const local = findLocalOutgoing(item.msgId);
      if (local?.clientStatus === 'sending') {
        idx += 1;
        continue;
      }
      markOutgoingStatus(item.msgId, 'sending');
      const ok = await sendEncryptedPayload(item.payloadType, item.payload, {
        groupId: item.groupId,
        msgId: item.msgId,
        skipLocalPush: Boolean(findLocalOutgoing(item.msgId)),
      });
      if (ok) {
        idx += 1;
        continue;
      }
      idx += 1;
      if (!ws || ws.readyState !== WS_OPEN) break;
    }
  } finally {
    isFlushingOutbox.value = false;
  }
};

const retryOutbox = () => {
  if (!ws || ws.readyState !== WS_OPEN || !powState.value.verified) {
    manualReconnect();
  }
  void flushOutbox();
};

const retryMessage = (msg) => {
  if (!msg || !msg.msgId) return;
  const existing = outboxQueue.value.find((item) => item.msgId === msg.msgId);
  if (!existing) return;
  markOutgoingStatus(msg.msgId, 'queued');
  if (!ws || ws.readyState !== WS_OPEN || !powState.value.verified) {
    manualReconnect();
  }
  void flushOutbox();
};

const handleSend = async () => {
  const gid = sanitizeGroupId(activeGroup.value) || SYSTEM_GROUP;
  const text = inputMsg.value.trim();
  const replyTo = currentReplyPayload();
  if (!text) {
    toast('请输入消息内容。', 'info');
    return;
  }

  // ===== 预检（不修改 UI）=====
  if (!ws || ws.readyState !== WS_OPEN) {
    // 离线：入队列 + 立即显示
    const msgId = queueOutgoingMessage('text', {
      kind: 'text', text, replyTo,
      burnAfterRead: burnAfterReadEnabled.value,
      burnAfterMs: burnAfterReadEnabled.value ? estimateReadDurationMs({ text, payloadType: 'text' }) : 0,
    }, gid);
    pushOutgoingPayloadMessage(msgId, 'text', gid, { text, replyTo }, 'queued');
    inputMsg.value = '';
    clearReplyDraft();
    scrollToBottom();
    return;
  }
  if (!powState.value.verified) {
    pushSendBlockedTip(gid, {
      title: '发送前需安全验证',
      text: '系统正在进行反机器人校验，校验完成后可继续发送。',
      actions: [
        buildExplanationAction({
          label: '为什么要验证',
          title: '为什么发送前要验证',
          text: '当前连接需要重新完成安全校验，系统会借此识别异常脚本或刷消息行为，避免群聊被滥用。',
          tip: '保持页面在线，等待校验完成后再发送即可。',
        }),
      ],
      dedupeKey: 'send-pow-required',
    });
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

  // ===== 关键：先清空输入框 + 立即把消息 push 到 UI =====
  const msgId = createMsgId();
  const payload = {
    kind: 'text', text, replyTo,
    burnAfterRead: burnAfterReadEnabled.value,
    burnAfterMs: burnAfterReadEnabled.value ? estimateReadDurationMs({ text, payloadType: 'text' }) : 0,
  };

  inputMsg.value = '';
  clearReplyDraft();

  // 立即将消息显示在 UI（状态为 sending，带 loading spinner）
  pushOutgoingPayloadMessage(msgId, 'text', gid, payload, 'sending');
  scrollToBottom();

  // 后台异步加密发送，不阻塞 UI
  void sendEncryptedPayload('text', payload, { msgId, skipLocalPush: true }).then((ok) => {
    if (!ok) {
      // sendEncryptedPayload 内部已经处理了失败状态
    }
  });
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
  const replyTo = currentReplyPayload();

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

    if (!ws || ws.readyState !== WS_OPEN) {
      queueOutgoingMessage(
        'image',
        {
          kind: 'image',
          imageData: prepared.dataUrl,
          mimeType: prepared.mimeType,
          name: file.name,
          replyTo,
          burnAfterRead: burnAfterReadEnabled.value,
          burnAfterMs: burnAfterReadEnabled.value
            ? estimateReadDurationMs({ payloadType: 'image', imageData: prepared.dataUrl, name: file.name })
            : 0,
        },
        sanitizeGroupId(activeGroup.value) || SYSTEM_GROUP
      );
      clearReplyDraft();
      return;
    }

    const ok = await sendEncryptedPayload('image', {
      kind: 'image',
      imageData: prepared.dataUrl,
      mimeType: prepared.mimeType,
      name: file.name,
      replyTo,
      burnAfterRead: burnAfterReadEnabled.value,
      burnAfterMs: burnAfterReadEnabled.value
        ? estimateReadDurationMs({ payloadType: 'image', imageData: prepared.dataUrl, name: file.name })
        : 0,
    });
    if (!ok) {
      toast('图片发送未完成。', 'info');
    } else {
      clearReplyDraft();
    }
  } catch {
    alert('图片处理失败，请重试。');
  } finally {
    isSendingImage.value = false;
  }
};

const joinGroup = (groupId, inviteCode = '', options = {}) => {
  const gid = sanitizeGroupId(groupId);
  if (!gid) return;
  const groupName = typeof options?.groupName === 'string' ? options.groupName.trim() : '';
  const joinStatement = typeof options?.joinStatement === 'string' ? options.joinStatement.trim().slice(0, 180) : '';
  const shouldSelect = options?.select !== false;
  const forceJoin = options?.force === true;
  const code = extractInviteCode(inviteCode || '');
  const shouldRequestJoin = forceJoin || !hasJoinedGroup(gid);
  if (shouldSelect) {
    selectGroup(gid);
  }
  ensureGroupInList(gid, groupName || nameForDirectGroup(gid));

  if (gid === SYSTEM_NOTICE_GROUP) {
    return;
  }

  if (!ws || ws.readyState !== WS_OPEN) return;

  if (!powState.value.verified) {
    if (isDirectGroupId(gid)) {
      const targetUid = getDirectTargetUid(gid);
      if (targetUid) {
        pendingDirect.value = { groupId: gid, targetUid };
      }
    } else {
      pendingJoin.value = { groupId: gid, inviteCode: inviteCode || '', select: shouldSelect, groupName, joinStatement };
    }
    toast('正在进行反机器人验证…', 'info');
    void startPowSolve();
    return;
  }

  if (isDirectGroupId(gid)) {
    if (shouldRequestJoin) {
      const targetUid = getDirectTargetUid(gid);
      if (targetUid) {
        sendDirectStart(gid, targetUid);
      }
    }
    return;
  }

  if (!shouldRequestJoin) {
    return;
  }

  ws.send(
    JSON.stringify({
      type: 'join_group',
      groupId: gid,
      inviteCode: code || undefined,
      groupName: groupName || undefined,
      joinStatement: joinStatement || undefined,
    })
  );
};

const openGroup = (groupId) => {
  const gid = sanitizeGroupId(groupId);
  if (!gid) return;
  const existing = groups.value.find((group) => group?.id === gid);
  if (gid === SYSTEM_GROUP) {
    systemNoticeOpen.value = false;
    mobileDrawerMode.value = 'home';
    if (mobileViewport.value) {
      mobilePrimaryTab.value = 'messages';
    }
    selectGroup(gid);
    return;
  }
  if (gid === SYSTEM_NOTICE_GROUP) {
    ensureGroupInList(gid, '系统消息');
    openSystemNoticePanel();
    return;
  }
  systemNoticeOpen.value = false;
  ensureGroupInList(gid, isDirectGroupId(gid) ? nameForDirectGroup(gid) : (existing?.name || ''));
  mobileDrawerMode.value = 'group';
  selectGroup(gid);
  if (isDirectGroupId(gid) && !hasJoinedGroup(gid)) {
    joinGroup(gid, '', { select: false });
  }
};

const closeGroupQuickMenu = () => {
  groupQuickMenu.value = { open: false, groupId: '', x: 0, y: 0, mobile: false };
};

const handleGroupContextMenu = (event, groupId) => {
  event?.preventDefault?.();
  if (mobileViewport.value) return;
  openGroupQuickMenu(event, groupId);
};

const preventNativeContextMenu = (event) => {
  event?.preventDefault?.();
};

const openGroupQuickMenu = (event, groupId, options = {}) => {
  const gid = sanitizeGroupId(groupId);
  if (!canOpenGroupQuickMenu(gid)) return;
  const mobile = options.mobile === true || mobileViewport.value === true;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
  const menuWidth = 192;
  const menuHeight = canLeaveGroup(gid) ? 112 : 64;
  const rawX = Number(options.x ?? event?.clientX) || 0;
  const rawY = Number(options.y ?? event?.clientY) || 0;
  const x = mobile || !viewportWidth ? 0 : Math.min(Math.max(12, rawX), Math.max(12, viewportWidth - menuWidth - 12));
  const y = mobile || !viewportHeight ? 0 : Math.min(Math.max(12, rawY), Math.max(12, viewportHeight - menuHeight - 12));
  groupQuickMenu.value = { open: true, groupId: gid, x, y, mobile };
};

const toggleQuickMenuGroupPinned = () => {
  const gid = sanitizeGroupId(groupQuickMenu.value.groupId);
  if (!gid) return;
  toggleGroupPinned(gid);
  closeGroupQuickMenu();
};

const startGroupLongPress = (event, groupId) => {
  resetGroupLongPress();
  const gid = sanitizeGroupId(groupId);
  if (!canOpenGroupQuickMenu(gid)) return;
  const pointerType = typeof event?.pointerType === 'string' ? event.pointerType : '';
  if (pointerType && pointerType !== 'touch' && pointerType !== 'pen') return;
  event?.preventDefault?.();
  const clientX = Number(event?.clientX) || 0;
  const clientY = Number(event?.clientY) || 0;
  groupLongPressTimer = window.setTimeout(() => {
    groupLongPressTimer = 0;
    suppressGroupClickUntil = Date.now() + 500;
    suppressGroupClickGroupId = gid;
    openGroupQuickMenu(null, gid, { mobile: true, x: clientX, y: clientY });
  }, 450);
};

const cancelGroupLongPress = () => {
  resetGroupLongPress();
};

const handleGroupListPrimaryAction = (groupId) => {
  const gid = sanitizeGroupId(groupId);
  if (!gid) return;
  if (suppressGroupClickGroupId === gid && Date.now() < suppressGroupClickUntil) {
    suppressGroupClickGroupId = '';
    return;
  }
  closeGroupQuickMenu();
  openGroup(gid);
};

const removeGroupFromSession = (groupId) => {
  const gid = sanitizeGroupId(groupId);
  if (!gid || gid === SYSTEM_GROUP || gid === SYSTEM_NOTICE_GROUP) return;
  directRestoreAttempts.delete(gid);
  ownedGroupRestoreAttempts.delete(gid);
  joinedGroups.delete(gid);
  groups.value = groups.value.filter((group) => group.id !== gid || group.id === SYSTEM_GROUP || group.id === SYSTEM_NOTICE_GROUP);
  const nextMeta = { ...groupMetaMap.value };
  delete nextMeta[gid];
  groupMetaMap.value = nextMeta;
  if (groupQuickMenu.value.groupId === gid) {
    closeGroupQuickMenu();
  }
  if (leaveGroupDialog.value.groupId === gid) {
    leaveGroupDialog.value = { open: false, groupId: '', name: '', ownerAction: 'inherit', successorUid: '', successorName: '' };
  }
  if (activeGroup.value === gid) {
    groupManageOpen.value = false;
    openGroup(SYSTEM_GROUP);
  }
};

const getPendingLeaveGroupId = (reqId) => {
  if (!reqId) return '';
  return pendingLeaveRequests.get(reqId) || '';
};

const clearPendingLeaveRequest = (reqId) => {
  const gid = getPendingLeaveGroupId(reqId);
  if (reqId) {
    pendingLeaveRequests.delete(reqId);
  }
  return gid;
};

const promptLeaveGroup = (groupId) => {
  const gid = sanitizeGroupId(groupId);
  if (!canLeaveGroup(gid)) return;
  leaveGroupDialog.value = {
    open: true,
    groupId: gid,
    name: groupDisplayName(gid, gid),
    ownerAction: 'inherit',
    successorUid: '',
    successorName: '',
  };
  if (isOwnedGroupByMe(gid)) {
    requestGroupMembersForGroup(gid);
  }
  closeGroupQuickMenu();
};

const closeLeaveGroupDialog = () => {
  leaveGroupDialog.value = { open: false, groupId: '', name: '', ownerAction: 'inherit', successorUid: '', successorName: '' };
};

const createGroup = () => {
  createGroupModal.value.open = true;
  if (!createGroupModal.value.name) {
    createGroupModal.value.name = '';
  }
};

const closeCreateGroupModal = () => {
  createGroupModal.value = { open: false, name: createGroupModal.value.name || '' };
};

const submitCreateGroup = () => {
  const name = createGroupModal.value.name.trim();
  if (!name) return;
  const gid = generateTimeGroupId();
  createGroupModal.value.open = false;
  createGroupModal.value.name = '';
  joinGroup(gid, '', { groupName: name });
};

const openGroupManage = () => {
  const gid = sanitizeGroupId(activeGroup.value);
  if (!gid || gid === SYSTEM_GROUP || gid === SYSTEM_NOTICE_GROUP || isDirectGroupId(gid)) {
    return;
  }
  if (mobileViewport.value) {
    scheduleMobileHistoryPush();
  }
  groupManageOpen.value = true;
  const meta = groupMetaMap.value[gid];
  groupRenameInput.value = meta?.groupName || activeGroupName.value;
  groupAnnouncementInput.value = typeof meta?.announcement === 'string' ? meta.announcement : '';
  requestGroupMembers();
};

const requestGroupMembers = () => {
  requestGroupMembersForGroup(activeGroup.value);
};

const requestGroupMembersForGroup = (groupId) => {
  const gid = sanitizeGroupId(groupId);
  if (!gid || !ws || ws.readyState !== WS_OPEN) {
    groupMembersLoading.value = false;
    return;
  }
  groupMembersLoading.value = true;
  ws.send(JSON.stringify({ type: 'group_members', groupId: gid }));
};

const renameActiveGroup = () => {
  const gid = sanitizeGroupId(activeGroup.value);
  const groupName = groupRenameInput.value.trim();
  if (!gid || !groupName) {
    toast('请输入群名称。', 'info');
    return;
  }
  if (!ws || ws.readyState !== WS_OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  ws.send(JSON.stringify({ type: 'group_rename', groupId: gid, groupName }));
};

const saveGroupAnnouncement = () => {
  const gid = sanitizeGroupId(activeGroup.value);
  if (!gid) return;
  if (!ws || ws.readyState !== WS_OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  ws.send(
    JSON.stringify({
      type: 'group_announcement_update',
      groupId: gid,
      announcement: groupAnnouncementInput.value.trim(),
    })
  );
};

const setLocalActiveGroupInviteApprovalRequired = (checked) => {
  const gid = sanitizeGroupId(activeGroup.value);
  if (!gid) return;
  const prev = groupMetaMap.value[gid] || { groupId: gid, groupName: activeGroupName.value || gid, ownerUid: '' };
  groupMetaMap.value = {
    ...groupMetaMap.value,
    [gid]: {
      ...prev,
      inviteApprovalRequired: checked === true,
    },
  };
};

const kickGroupMember = (targetUid) => {
  const gid = sanitizeGroupId(activeGroup.value);
  if (!gid || !targetUid) return;
  if (!ws || ws.readyState !== WS_OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  ws.send(JSON.stringify({ type: 'group_kick', groupId: gid, targetUid }));
};

const leaveActiveGroup = () => {
  const gid = sanitizeGroupId(activeGroup.value);
  if (!canLeaveGroup(gid)) return;
  promptLeaveGroup(gid);
};

const confirmLeaveGroup = () => {
  const gid = sanitizeGroupId(leaveGroupDialog.value.groupId);
  if (!canLeaveGroup(gid)) {
    closeLeaveGroupDialog();
    return;
  }
  if (!ws || ws.readyState !== WS_OPEN) {
    toast('连接未就绪，稍后重试。', 'error');
    return;
  }
  const reqId = `leave-${createMsgId()}`;
  pendingLeaveRequests.set(reqId, gid);
  const ownerAction = leaveGroupDialogIsOwner.value
    ? (leaveGroupDialog.value.ownerAction === 'dissolve' ? 'dissolve' : 'inherit')
    : undefined;
  ws.send(JSON.stringify({ type: 'leave_group', groupId: gid, reqId, ownerAction }));
  closeLeaveGroupDialog();
};

// 获取群组所有成员公钥（含离线成员，用于离线消息加密）
// 群组公钥缓存（避免每次发送都请求）
const groupPublicKeysCache = new Map(); // groupId -> { keys, ts }
const GROUP_PUBKEYS_TTL = 60_000; // 60 秒缓存

const fetchGroupPublicKeys = async (groupId) => {
  const cached = groupPublicKeysCache.get(groupId);
  if (cached && (Date.now() - cached.ts) < GROUP_PUBKEYS_TTL) {
    return cached.keys;
  }
  try {
    const httpUrl = resolveHttpUrl();
    const resp = await fetch(`${httpUrl}/api/group-public-keys?groupId=${encodeURIComponent(groupId)}`);
    if (!resp.ok) return cached?.keys || {};
    const result = await resp.json();
    const keys = result.ok && result.publicKeys ? result.publicKeys : {};
    groupPublicKeysCache.set(groupId, { keys, ts: Date.now() });
    return keys;
  } catch {
    return cached?.keys || {};
  }
};

const resolveWsUrl = () => {
  const configuredUrl = import.meta.env.VITE_WS_URL;
  if (typeof configuredUrl === 'string' && configuredUrl.trim()) {
    return configuredUrl.trim();
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
};

const resolveHttpUrl = () => {
  const configuredUrl = import.meta.env.VITE_WS_URL;
  if (typeof configuredUrl === 'string' && configuredUrl.trim()) {
    // ws://host → http://host, wss://host → https://host
    return configuredUrl.trim().replace(/^ws/, 'http');
  }
  return window.location.origin;
};

const connectWS = ({ isReconnect = false, force = false } = {}) => {
  const offlineNow = typeof navigator !== 'undefined' && navigator.onLine === false;
  networkOnline.value = !offlineNow;
  if (offlineNow) {
    connectionState.value = 'offline';
    return;
  }
  if (!force && ws && (ws.readyState === WS_OPEN || ws.readyState === WS_CONNECTING)) {
    return;
  }
  if (force && ws && ws.readyState === WS_CONNECTING) {
    try {
      ws.close(4001, 'Reconnect requested');
    } catch {
      // no-op
    }
  }
  resetReconnectTimer();
  resetGroupLongPress();
  closeGroupQuickMenu();
  closeLeaveGroupDialog();
  ownedGroupRestoreAttempts.clear();
  pendingLeaveRequests.clear();
  joinedGroups.clear();
  joinedGroups.add(SYSTEM_GROUP);
  joinedGroups.add(SYSTEM_NOTICE_GROUP);
  myPrivateKey.value = null;
  myPublicKeyBase64.value = '';
  identitySignKeyPair.value = null;
  identitySignPublicBase64.value = '';
  identityDhKeyPair.value = null;
  identityDhPublicBase64.value = '';
  importedPublicKeyCache.clear();
  dmSessions.clear();
  powUid.value = '';
  const socket = createTransportSocket(resolveWsUrl(), resolveHttpUrl());
  const connectionSeq = ++wsConnectionSeq;
  ws = socket;
  connectionState.value = 'connecting';
  socket.connect(); // 启动 Transport 连接
  if (!isReconnect) {
    resetReconnectState();
  }
  powState.value = { nonce: '', difficulty: 0, verified: false, solving: false };
  powSolveToken += 1;

  socket.onopen = () => {
    if (ws !== socket || connectionSeq !== wsConnectionSeq) return;
    connectionState.value = 'verifying';
  };

  socket.onmessage = async (event) => {
    if (ws !== socket || connectionSeq !== wsConnectionSeq) return;
    let data;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }

    if (data.type === 'pong') {
      lastPongAt = Date.now();
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
        nicknameGuidePending.value = true;
        if (typeof data.fingerprint === 'string' && data.fingerprint) {
          setStoredFingerprint(data.fingerprint);
        }
        openIdentityCredentialModal({
          fingerprint: typeof data.fingerprint === 'string' ? data.fingerprint : '',
          deviceSecret: getOrCreateDeviceSecret(),
          deviceToken: data.deviceToken,
          firstBind: data.firstBind === true,
        });
        toast('设备已绑定。', 'info');
      }
      return;
    }

    if (data.type === 'device_fingerprint_registered') {
      if (typeof data.fingerprint === 'string' && data.fingerprint) {
        deviceFingerprint.value = data.fingerprint;
        myUid.value = data.fingerprint;
        setStoredFingerprint(data.fingerprint);
        restorePersistedGroupMeta();
        restorePersistedDirectGroups();
        restorePersistedRegularGroups();
        restorePersistedPinnedGroups();
        restoreSavedGroupContacts();
      }
      deviceBound.value = true;
      autoRestoreOwnedGroups();
      requestContacts();
      return;
    }

    if (data.type === 'device_token_synced') {
      if (typeof data.deviceToken === 'string' && data.deviceToken) {
        setDeviceToken(data.deviceToken);
      }
      return;
    }

    if (data.type === 'nickname_state') {
      const nickname = typeof data.nickname === 'string' ? data.nickname : '';
      myNickname.value = nickname;
      if (!nicknameSaving.value || !nicknameInput.value.trim() || nicknameInput.value.trim() === nickname) {
        nicknameInput.value = nickname;
      }
      nicknameSaving.value = false;
      refreshDirectGroupNames();
      if (nicknameGuidePending.value && nickname) {
        nicknameGuideOpen.value = true;
        settingsOpen.value = false;
      }
      return;
    }

    if (data.type === 'nickname_updated') {
      const nickname = typeof data.nickname === 'string' ? data.nickname : '';
      myNickname.value = nickname;
      nicknameInput.value = nickname;
      nicknameSaving.value = false;
      refreshDirectGroupNames();
      if (nicknameGuideOpen.value || nicknameGuidePending.value) {
        closeNicknameGuide();
      }
      toast('昵称已更新。', 'info');
      pushSystemMessage({
        title: '昵称已更新',
        text: `当前昵称：${nickname}`,
        action: 'open_home',
        actionLabel: '返回首页',
      });
      return;
    }

    if (data.type === 'dm_pref_state') {
      dmContactsOnly.value = data.contactsOnly !== false;
      dmPreferenceSaving.value = false;
      return;
    }

    if (data.type === 'contacts_list') {
      contactsLoading.value = false;
      contacts.value = Array.isArray(data.contacts) ? data.contacts : [];
      refreshDirectGroupNames();
      return;
    }

    if (data.type === 'direct_request_pending') {
      pushSystemMessage({
        title: '私聊请求已发送',
        text: '对方尚未同意，待接受后才会建立私聊窗口。',
        action: 'show_explanation',
        actionLabel: '为什么要等待',
        actions: [
          buildExplanationAction({
            label: '为什么要等待',
            title: '为什么私聊请求要等待',
            text: '陌生人私聊现在采用"先请求、后建立会话"的方式，只有对方明确接受后才会创建私聊窗口。',
            tip: '如果你们已经互加通讯录，对方接受后会立即进入正常私聊。',
          }),
        ],
        meta: { kind: 'direct_request_pending', requestId: typeof data.requestId === 'string' ? data.requestId : '' },
      });
      toast('私聊请求已发送。', 'info');
      return;
    }

    if (data.type === 'direct_request') {
      const fromUid = typeof data.fromUid === 'string' ? data.fromUid : '';
      const fromNickname = typeof data.fromNickname === 'string' ? data.fromNickname : '';
      const requestId = typeof data.requestId === 'string' ? data.requestId : '';
      const fromLabel = fromNickname || `用户 ${fromUid.slice(0, 6)}`;
      pushSystemMessage({
        title: '收到私聊请求',
        text: `${fromLabel} 想和你建立临时私聊。接受后才会创建私聊窗口。`,
        actions: [
          { action: 'accept_direct_request', label: '接受', requestId },
          { action: 'decline_direct_request', label: '拒绝', requestId },
        ],
        meta: { kind: 'direct_request', requestId, peerUid: fromUid, peerNickname: fromNickname, groupId: typeof data.groupId === 'string' ? data.groupId : '' },
      });
      toast('收到私聊请求。', 'info');
      return;
    }

    if (data.type === 'direct_request_result') {
      const approved = data.approved === true;
      const who = typeof data.targetUid === 'string' ? data.targetUid : '';
      pushSystemMessage({
        title: approved ? '私聊请求已通过' : '私聊请求已拒绝',
        text: approved
          ? `设备 ${who.slice(0, 6) || who} 已接受你的私聊请求。`
          : `设备 ${who.slice(0, 6) || who} 拒绝了你的私聊请求。`,
        meta: { kind: 'direct_request_result', peerUid: who, groupId: typeof data.groupId === 'string' ? data.groupId : '' },
      });
      toast(approved ? '对方已接受私聊请求。' : '对方拒绝了私聊请求。', approved ? 'info' : 'error');
      return;
    }

    if (data.type === 'system_notice') {
      const groupId = sanitizeGroupId(data.groupId) || SYSTEM_NOTICE_GROUP;
      const title = typeof data.title === 'string' ? data.title : '系统提醒';
      const text = typeof data.text === 'string' ? data.text : '';
      const action = typeof data.action === 'string' ? data.action : '';
      const actionLabel = typeof data.actionLabel === 'string' ? data.actionLabel : '';
      const actions = Array.isArray(data.actions) ? data.actions : [];
      const meta = data.meta && typeof data.meta === 'object' ? data.meta : {};
      if (groupId !== SYSTEM_NOTICE_GROUP) {
        ensureGroupInList(groupId);
      }
      pushSystemMessageToGroup({
        groupId,
        title,
        text,
        action,
        actionLabel,
        actions,
        meta,
      });
      return;
    }

    if (data.type === 'invite_join_approval_pending') {
      const pendingGroupId = sanitizeGroupId(data.groupId) || sanitizeGroupId(activeGroup.value) || SYSTEM_GROUP;
      joinApprovalPendingGroup.value = pendingGroupId;
      toast('入群申请已提交，等待群主确认。', 'info');
      pushSendBlockedTip(pendingGroupId, {
        title: '入群审批中',
        text: '该邀请由普通成员生成，当前入群需要群主确认。等待通过后会自动进入群聊。',
        dedupeKey: `join-approval-pending-${typeof data.requestId === 'string' ? data.requestId : ''}`,
      });
      return;
    }

    if (data.type === 'invite_approval_pending') {
      pushSystemMessage({
        title: '邀请审批中',
        text: '你的邀请请求已提交给群主，等待确认。',
        action: 'show_explanation',
        actionLabel: '为什么要审批',
        actions: [
          buildExplanationAction({
            label: '为什么要审批',
            title: '为什么这里需要群主审批',
            text: '当前群聊的邀请链接只能由群主直接生成，或由群主审批后代为生成，以免普通成员随意扩散邀请。',
            tip: '等待群主通过后再重试，或者请群主直接为你生成邀请链接。',
          }),
        ],
        meta: { kind: 'approval_pending', requestId: typeof data.requestId === 'string' ? data.requestId : '' },
      });
      return;
    }

    if (data.type === 'invite_approval_request') {
      const requestId = typeof data.requestId === 'string' ? data.requestId : '';
      const groupName = typeof data.groupName === 'string' ? data.groupName : (typeof data.groupId === 'string' ? data.groupId : '群聊');
      const requesterNickname = typeof data.requesterNickname === 'string' ? data.requesterNickname : '';
      const requesterUid = typeof data.requesterUid === 'string' ? data.requesterUid : '';
      const requesterStatement = typeof data.requesterStatement === 'string' ? data.requesterStatement.trim() : '';
      const inviterNickname = typeof data.inviterNickname === 'string' ? data.inviterNickname : '';
      const inviterUid = typeof data.inviterUid === 'string' ? data.inviterUid : '';
      const inviterStatement = typeof data.inviterStatement === 'string' ? data.inviterStatement.trim() : '';
      const requester = requesterNickname || `用户 ${requesterUid.slice(0, 6) || requesterUid}`;
      const inviter = inviterNickname || `用户 ${inviterUid.slice(0, 6) || inviterUid}`;
      pendingInviteApprovals.value = [
        { requestId, groupId: data.groupId || '', groupName, requesterUid, requesterNickname },
        ...pendingInviteApprovals.value.filter((item) => item.requestId !== requestId),
      ];
      pushSystemMessageToGroup({
        groupId: sanitizeGroupId(data.groupId) || SYSTEM_NOTICE_GROUP,
        title: '入群待审批',
        text: `${requester} 想加入"${groupName}"。邀请人：${inviter}${requesterStatement ? `；申请说明：${requesterStatement}` : ''}${inviterStatement ? `；邀请说明：${inviterStatement}` : ''}`,
        actions: [
          { action: 'approve_group_join', label: '同意', requestId },
          { action: 'reject_group_join', label: '拒绝', requestId },
        ],
        meta: {
          kind: 'group_join_request',
          requestId,
          groupId: data.groupId || '',
          groupName,
          requesterUid,
          requesterNickname,
          requesterStatement,
          inviterUid,
          inviterNickname,
          inviterStatement,
        },
      });
      return;
    }

    if (data.type === 'invite_approval_result') {
      const requestId = typeof data.requestId === 'string' ? data.requestId : '';
      const approved = data.approved === true;
      if (!approved && pendingInviteRequest.value.reqId) {
        pendingInviteRequest.value = { reqId: '', groupId: '', mode: 'dialog' };
        inviteText.value = '邀请新人';
      }
      if (!approved && joinApprovalPendingGroup.value) {
        joinApprovalPendingGroup.value = '';
      }
      pendingInviteApprovals.value = pendingInviteApprovals.value.filter((item) => item.requestId !== requestId);
      toast(approved ? '群主已通过入群申请。' : '群主拒绝了本次入群申请。', approved ? 'info' : 'error');
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
            meta: { kind: 'contact_request', requestId, peerUid: fromUid },
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
            meta: { kind: 'contact_result', peerUid: who },
          });
        } else {
          pushSystemMessage({
            title: '通讯录已建立',
            text: `你于 ${formatDateTime(eventTs)} 同意了设备 ${who} 的通讯录申请，双方已互为通讯录。`,
            meta: { kind: 'contact_result', peerUid: who },
          });
        }
      } else if (status === 'declined') {
        const who = peerUid || outgoingReq?.targetUid || '对方设备';
        toast(wasOutgoing ? '对方拒绝了通讯录请求。' : '已拒绝通讯录请求。', 'error');
        if (wasOutgoing) {
          pushSystemMessage({
            title: '通讯录申请被拒绝',
            text: `设备 ${who} 于 ${formatDateTime(eventTs)} 拒绝了你的通讯录申请。`,
            meta: { kind: 'contact_result', peerUid: who },
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
        refreshDirectGroupNames();
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
        refreshDirectGroupNames();
        toast('已移除联系人。', 'info');
      }
      return;
    }

    if (data.type === 'contacts_migrate_code') {
      migrationCode.value = typeof data.code === 'string' ? data.code : '';
      migrationExpiresAt.value = typeof data.expiresAt === 'number' ? data.expiresAt : 0;
      migrationConfirm.value = {
        code: '',
        fromFingerprintShort: '',
        fromOs: '',
        fromLocation: '',
        transferNickname: true,
        oldNickname: '',
      };
      setMigrationStatus('success', '迁移码已生成，10 分钟内有效。请在旧设备输入并授权。');
      toast('迁移码已生成。', 'info');
      return;
    }

    if (data.type === 'contacts_migrate_waiting') {
      const transferNickname = data.transferNickname !== false;
      setMigrationStatus(
        'info',
        transferNickname ? '旧设备已授权（含昵称转让），等待新设备确认…' : '旧设备已授权，等待新设备确认…'
      );
      pushSystemMessage({
        title: '设备迁移已授权',
        text: transferNickname ? '等待新设备确认后将完成迁移，昵称将一并转让。' : '等待新设备确认后将完成迁移。',
        meta: { kind: 'migration_waiting' },
      });
      return;
    }

    if (data.type === 'contacts_migrate_request') {
      const fromOs = typeof data.fromOs === 'string' ? data.fromOs : '';
      const fromLocation = typeof data.fromLocation === 'string' ? data.fromLocation : '';
      const fromText = [fromOs, fromLocation].filter((v) => v && v !== 'Unknown').join(' · ');
      const transferNickname = data.transferNickname !== false;
      const oldNickname = typeof data.oldNickname === 'string' ? data.oldNickname : '';
      migrationConfirm.value = {
        code: typeof data.code === 'string' ? data.code : '',
        fromFingerprintShort: typeof data.fromFingerprintShort === 'string' ? data.fromFingerprintShort : '',
        fromOs,
        fromLocation,
        transferNickname,
        oldNickname,
      };
      setMigrationStatus(
        'info',
        transferNickname ? '旧设备已授权（含昵称转让），请在新设备确认迁移。' : '旧设备已授权，请在新设备确认迁移。'
      );
      pushSystemMessage({
        title: '设备迁移确认',
        text: fromText
          ? `旧设备（${fromText}）已授权，请在新设备点击确认完成迁移${transferNickname ? '并接收昵称' : ''}。`
          : `旧设备已授权，请在新设备点击确认完成迁移${transferNickname ? '并接收昵称' : ''}。`,
        action: 'confirm_migration',
        actionLabel: '确认迁移',
        meta: { kind: 'migration_request', code: migrationConfirm.value.code, peerNickname: oldNickname || '', peerUid: typeof data.fromFingerprintShort === 'string' ? data.fromFingerprintShort : '' },
      });
      return;
    }

    if (data.type === 'contacts_migrate_done') {
      contactsLoading.value = false;
      const count = typeof data.count === 'number' ? data.count : 0;
      const transferredNickname = typeof data.transferredNickname === 'string' ? data.transferredNickname : '';
      setMigrationStatus(
        'success',
        transferredNickname
          ? `设备迁移完成，共 ${count} 条联系人，昵称"${transferredNickname}"已转让到当前设备。`
          : `设备迁移完成，共 ${count} 条联系人。新设备可刷新通讯录确认。`
      );
      toast(`设备迁移完成（${count} 条）。`, 'info');
      pushSystemMessage({
        title: '设备迁移完成',
        text: transferredNickname
          ? `已同步 ${count} 位联系人，昵称"${transferredNickname}"已完成转让。`
          : `已同步 ${count} 位联系人。`,
        meta: { kind: 'migration_done', peerNickname: transferredNickname },
      });
      migrationCode.value = '';
      migrationExpiresAt.value = 0;
      migrationInput.value = '';
      migrationConfirm.value = {
        code: '',
        fromFingerprintShort: '',
        fromOs: '',
        fromLocation: '',
        transferNickname: true,
        oldNickname: '',
      };
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
      const recoveredAfterReconnect = reconnectAttempt.value > 0;
      powState.value.verified = true;
      powState.value.solving = false;
      connectionState.value = 'connected';
      resetReconnectState();
      startHeartbeat();
      if (recoveredAfterReconnect) {
        toast('连接已恢复。', 'info');
      }

      if (pendingDirect.value.groupId && pendingDirect.value.targetUid) {
        sendDirectStart(pendingDirect.value.groupId, pendingDirect.value.targetUid);
        pendingDirect.value = { groupId: '', targetUid: '' };
      } else if (pendingJoin.value.groupId) {
        joinGroup(pendingJoin.value.groupId, pendingJoin.value.inviteCode, {
          select: pendingJoin.value.select,
          groupName: pendingJoin.value.groupName || '',
          joinStatement: pendingJoin.value.joinStatement || '',
        });
        pendingJoin.value = { groupId: '', inviteCode: '', select: true, groupName: '', joinStatement: '' };
      }
      if (deviceBound.value) {
        requestContacts();
      }
      if (pendingPairGroup.value.targetUid && !pendingPairGroup.value.groupId) {
        sendPairGroupCard(pendingPairGroup.value.targetUid);
      }
      autoRestoreOwnedGroups();
      autoRestoreDirectGroups();
      return;
    }

    if (data.type === 'status') {
      const rawUsers = Array.isArray(data.users) ? data.users : [];
      const self = rawUsers.find((u) => u && typeof u.uid === 'string' && u.uid === myUid.value);
      if (self && typeof self.nickname === 'string') {
        myNickname.value = self.nickname;
        if (!nicknameSaving.value || !nicknameInput.value.trim()) {
          nicknameInput.value = self.nickname;
        }
      }
      void validateIdentities(rawUsers);
      importedPublicKeyCache.clear();
      // Cache peer identity keys from status broadcast for DM encryption
      const nextPeerMap = {};
      for (const u of rawUsers) {
        if (!u || typeof u.uid !== 'string' || !u.uid) continue;
        const identityDh = typeof u.identityDh === 'string' ? u.identityDh : '';
        const identitySign = typeof u.identitySign === 'string' ? u.identitySign : '';
        if (identityDh || identitySign) {
          nextPeerMap[u.uid] = { identityDh, identitySign, identityValid: u.identityValid !== false };
        }
      }
      peerIdentityMap.value = nextPeerMap;
      autoRestoreOwnedGroups();
      refreshDirectGroupNames();
      autoRestoreDirectGroups();
      return;
    }

    if (data.type === 'group_meta_updated') {
      const gid = sanitizeGroupId(data.groupId);
      if (!gid) return;
      const groupName = typeof data.groupName === 'string' ? data.groupName : gid;
      const ownerUid = typeof data.ownerUid === 'string' ? data.ownerUid : '';
      upsertGroupMeta(
        gid,
        groupName,
        ownerUid,
        data.inviteApprovalRequired === true,
        typeof data.announcement === 'string' ? data.announcement : null
      );
      if (groupManageOpen.value && activeGroup.value === gid) {
        groupAnnouncementInput.value =
          typeof data.announcement === 'string' ? data.announcement : (groupAnnouncementInput.value || '');
        requestGroupMembers();
      }
      toast('群信息已更新。', 'info');
      return;
    }

    if (data.type === 'group_members') {
      groupMembersLoading.value = false;
      const members = Array.isArray(data.members) ? data.members : [];
      groupMembers.value = members.map((m) => {
        const uid = typeof m.uid === 'string' ? m.uid : '';
        return {
          uid,
          uidShort: uid ? uid.slice(0, 8) : '未知',
          nickname: typeof m.nickname === 'string' ? m.nickname : '',
          os: typeof m.os === 'string' ? m.os : '',
          location: typeof m.location === 'string' ? m.location : '',
          isOwner: m.isOwner === true,
        };
      });
      const gid = sanitizeGroupId(data.groupId);
      if (gid) {
        upsertGroupMeta(
          gid,
          typeof data.groupName === 'string' ? data.groupName : gid,
          typeof data.ownerUid === 'string' ? data.ownerUid : '',
          data.inviteApprovalRequired === true,
          typeof data.announcement === 'string' ? data.announcement : null
        );
        if (leaveGroupDialog.value.open && leaveGroupDialog.value.groupId === gid) {
          leaveGroupDialog.value = {
            ...leaveGroupDialog.value,
            successorUid: typeof data.successorUid === 'string' ? data.successorUid : '',
            successorName: typeof data.successorNickname === 'string' ? data.successorNickname : '',
          };
        }
        if (groupManageOpen.value && activeGroup.value === gid) {
          groupAnnouncementInput.value =
            typeof data.announcement === 'string' ? data.announcement : (groupAnnouncementInput.value || '');
        }
      }
      return;
    }

    if (data.type === 'group_invite_settings') {
      groupInviteSettingsLoading.value = false;
      const gid = sanitizeGroupId(data.groupId);
      if (!gid) return;
      upsertGroupMeta(
        gid,
        groupMetaMap.value[gid]?.groupName || groups.value.find((group) => group.id === gid)?.name || gid,
        typeof data.ownerUid === 'string' ? data.ownerUid : '',
        data.inviteApprovalRequired === true,
        typeof data.announcement === 'string' ? data.announcement : null
      );
      groupInviteEntries.value = Array.isArray(data.invites)
        ? data.invites.map((item) => ({
            inviteId: typeof item?.inviteId === 'string' ? item.inviteId : '',
            groupId: gid,
            inviteCode: typeof item?.inviteCode === 'string' ? item.inviteCode : '',
            shortCode: typeof item?.shortCode === 'string' ? item.shortCode : '',
            creatorUid: typeof item?.creatorUid === 'string' ? item.creatorUid : '',
            creatorNickname: typeof item?.creatorNickname === 'string' ? item.creatorNickname : '',
            creatorStatement: typeof item?.creatorStatement === 'string' ? item.creatorStatement : '',
            createdAt: typeof item?.createdAt === 'number' ? item.createdAt : 0,
            expiresAt: typeof item?.expiresAt === 'number' ? item.expiresAt : 0,
            maxUses: Number(item?.maxUses) || 0,
            usedCount: Number(item?.usedCount) || 0,
            pendingCount: Number(item?.pendingCount) || 0,
            revokedAt: Number(item?.revokedAt) || 0,
          }))
        : [];
      return;
    }

    if (data.type === 'group_kicked') {
      const gid = sanitizeGroupId(data.groupId);
      if (gid) {
        removeGroupFromSession(gid);
      }
      toast('你已被移出群聊。', 'info');
      return;
    }

    if (data.type === 'group_dissolved') {
      const gid = sanitizeGroupId(data.groupId);
      if (gid) {
        removeGroupFromSession(gid);
      }
      toast('群聊已解散。', 'info');
      return;
    }

    if (data.type === 'group_left') {
      const reqId = typeof data.reqId === 'string' ? data.reqId : '';
      const gid = sanitizeGroupId(data.groupId) || clearPendingLeaveRequest(reqId);
      if (gid) {
        clearPendingLeaveRequest(reqId);
        removeGroupFromSession(gid);
      }
      toast('你已退出群聊。', 'info');
      return;
    }

    if (data.type === 'group_kick_result') {
      if (data.success === true) {
        toast('成员已移出群聊。', 'info');
        requestGroupMembers();
      }
      return;
    }

    if (data.type === 'group_joined') {
      const gid = sanitizeGroupId(data.groupId);
      if (gid && joinApprovalPendingGroup.value === gid) {
        joinApprovalPendingGroup.value = '';
      }
      directRestoreAttempts.delete(gid);
      ownedGroupRestoreAttempts.delete(gid);
      const directName = nameForDirectGroup(gid);
      const groupName = typeof data.groupName === 'string' && data.groupName ? data.groupName : directName;
      ensureGroupInList(gid, groupName);
      upsertGroupMeta(
        gid,
        groupName || gid,
        typeof data.ownerUid === 'string' ? data.ownerUid : '',
        data.inviteApprovalRequired === true,
        typeof data.announcement === 'string' ? data.announcement : null
      );
      const silent = data.silent === true || data.reqId === 'restore_dm';
      if (silent && isDirectGroupId(gid)) {
        startDmNegotiation(gid, getDirectTargetUid(gid));
      }
      if (gid && !joinedGroups.has(gid)) {
        joinedGroups.add(gid);
        if (!silent && gid !== SYSTEM_GROUP && gid !== SYSTEM_NOTICE_GROUP) {
          const name = groups.value.find((g) => g.id === gid)?.name || gid;
          toast(`已加入群组：${name}`, 'info');
        }
      }
      clearUnread(gid);
      if (gid && pendingJoin.value.groupId === gid && pendingJoin.value.inviteCode) {
        clearInviteUrlFromAddressBar();
        pendingJoin.value = { groupId: '', inviteCode: '', select: true, groupName: '', joinStatement: '' };
      }
      if (pendingPairGroup.value.groupId && pendingPairGroup.value.groupId === gid) {
        const targetUid = pendingPairGroup.value.targetUid;
        pendingPairGroup.value = { groupId: '', targetUid: '' };
        requestPairInvite(gid, targetUid);
      }
      return;
    }

    if (data.type === 'dm_resync') {
      const gid = sanitizeGroupId(data.groupId);
      const peerUid = typeof data.peerUid === 'string' ? data.peerUid : '';
      if (gid && isDirectGroupId(gid)) {
        ensureGroupInList(gid);
        startDmNegotiation(gid, peerUid || getDirectTargetUid(gid));
      }
      return;
    }

    if (data.type === 'invite_created') {
      const groupId = sanitizeGroupId(data.groupId);
      const inviteCode = extractInviteCode(data.inviteCode);
      const shortCode = typeof data.shortCode === 'string' ? data.shortCode : '';
      const expiresAt = typeof data.expiresAt === 'number' ? data.expiresAt : null;
      const maxUses = Number(data.maxUses) || 0;
      const reqId = typeof data.reqId === 'string' ? data.reqId : '';
      const mode = pendingInviteRequest.value.mode || 'dialog';

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

        const shortLink = buildShortInviteLink(inviteCode, shortCode);
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
            replyTo: currentReplyPayload(),
          },
          dmGroupId
        );
        if (ok) {
          clearReplyDraft();
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

      pendingInviteRequest.value = { reqId: '', groupId: '', mode: 'dialog' };

      if (!groupId || !inviteCode) {
        inviteText.value = '邀请新人';
        toast('邀请生成失败，请重试。', 'error');
        return;
      }

      if (mode === 'card') {
        const shortLink = buildShortInviteLink(inviteCode, shortCode);
        const groupName = groups.value.find((g) => g.id === groupId)?.name || groupId;
        const ok = await sendEncryptedPayload('invite', {
          kind: 'invite',
          inviteCode,
          inviteLink: shortLink,
          inviteGroup: groupId,
          inviteGroupName: groupName,
          expiresAt,
          replyTo: currentReplyPayload(),
        });
        if (ok) {
          clearReplyDraft();
          toast('已发送群邀请卡片。', 'info');
        }
        return;
      }

      inviteDialog.value = {
        ...inviteDialog.value,
        open: true,
        groupId: groupId || inviteDialog.value.groupId,
        generatedInviteCode: inviteCode,
        generatedShortCode: shortCode,
        generatedExpiresAt: expiresAt,
        maxUses: maxUses || inviteDialog.value.maxUses,
      };
      requestGroupInviteSettings(groupId);
      inviteText.value = '邀请新人';
      toast('短链接已生成。', 'info');

      return;
    }

    if (data.type === 'error') {
      const code = typeof data.code === 'string' ? data.code : 'ERROR';
      const message = typeof data.message === 'string' ? data.message : '请求失败';
      const reqId = typeof data.reqId === 'string' ? data.reqId : '';
      const currentGroupId = sanitizeGroupId(activeGroup.value) || SYSTEM_GROUP;
      const pendingLeaveGroupId = getPendingLeaveGroupId(reqId);
      const markFailedByReqId = (errorText = '') => {
        if (!reqId || !findLocalOutgoing(reqId)) return;
        markOutgoingFailed(reqId, errorText || '发送失败');
      };
      dmPreferenceSaving.value = false;
      if (code.startsWith('GROUP_')) {
        groupMembersLoading.value = false;
      }
      if (code.startsWith('INVITE_') || code === 'SERVER_CONFIG_ERROR') {
        groupInviteSettingsLoading.value = false;
      }

      if (code === 'POW_REQUIRED') {
        powState.value.verified = false;
        markFailedByReqId('安全验证未完成，请稍候');
        pushSendBlockedTip(sanitizeGroupId(activeGroup.value) || SYSTEM_GROUP, {
          title: '发送前需安全验证',
          text: '连接已重置，需重新完成反机器人校验后再发送。',
          actions: [
            buildExplanationAction({
              label: '为什么要验证',
              title: '为什么发送前要重新验证',
              text: '当前连接已经重置，系统要求重新完成一次安全校验，避免异常连接继续发送消息。',
              tip: '稍等校验完成后再发送，消息内容不需要重写。',
            }),
          ],
          dedupeKey: 'error-pow-required',
        });
        void startPowSolve();
        toast('正在进行反机器人验证…', 'info');
        return;
      }

      if (code === 'INVITE_REQUIRED') {
        pushSendBlockedTip(currentGroupId, {
          title: '入群失败',
          text: '该群组需要邀请链接，请使用有效短链接或助记词链接加入。',
          dedupeKey: 'error-invite-required',
        });
        toast('该群组需要邀请链接才能加入。请使用有效短链接或助记词链接。', 'error');
        return;
      }

      if (code === 'INVITE_FORBIDDEN_GROUP') {
        pushSendBlockedTip(currentGroupId, {
          title: '当前群聊不能邀请',
          text: '系统通知会话和私聊窗口不支持生成邀请链接。',
          actions: [
            buildExplanationAction({
              label: '为什么不能邀请',
              title: '为什么这里不能生成邀请',
              text: '当前会话属于系统通知或双人私聊，这两类会话不是可扩员的普通群聊，所以系统不会为它们生成邀请链接。',
              tip: '先切换到普通群聊，再使用"邀请新人"创建可分享的助记词链接。',
            }),
          ],
          dedupeKey: 'error-invite-forbidden-group',
        });
        toast('当前会话不支持邀请新人。', 'info');
        return;
      }

      if (code === 'INVITE_LIMIT_REACHED') {
        toast('当前群的有效邀请链接过多，请先吊销旧链接。', 'error');
        return;
      }

      if (code === 'INVITE_ALREADY_EXISTS') {
        inviteText.value = '邀请新人';
        toast('你已有一个有效的邀请链接，请先撤销后再生成新的。', 'info');
        requestGroupInviteSettings(activeGroup.value);
        return;
      }

      if (code === 'INVITE_EXHAUSTED') {
        toast('该邀请链接已达到人数上限。', 'error');
        return;
      }

      if (code === 'SERVER_CONFIG_ERROR') {
        toast('服务端邀请配置缺失，请先部署后端最新版本。', 'error');
        return;
      }

      if (code === 'USER_OFFLINE') {
        pushSendBlockedTip(currentGroupId, {
          title: '对方不在线',
          text: '目标用户当前不在线，请稍后重试。',
          dedupeKey: 'error-user-offline',
        });
        toast('对方当前不在线，无法发起临时对话。', 'error');
        return;
      }

      if (code === 'DM_CONTACTS_ONLY') {
        toast('对方仅接受通讯录私聊。', 'info');
        return;
      }

      if (code === 'DIRECT_REQUEST_EXPIRED') {
        toast('私聊请求已过期，请重新发起。', 'error');
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
        markFailedByReqId('设备未绑定');
        pushSendBlockedTip(sanitizeGroupId(activeGroup.value) || SYSTEM_GROUP, {
          title: '发送失败：未完成设备绑定',
          text: '请先完成设备绑定，再进行私聊或通讯录操作。',
          actions: [{ action: 'open_contacts', label: '打开通讯录' }],
          dedupeKey: 'error-device-bind-required',
        });
        toast('请先完成设备绑定后再发起私聊。', 'error');
        return;
      }

      if (code === 'DM_WAIT_REPLY') {
        markFailedByReqId('请等待对方回复后重试');
        const gid = isDirectGroupId(activeGroup.value) ? activeGroup.value : '';
        if (gid) {
          setDmLock(gid, true);
          pushDmLimitTip(gid, getDirectTargetUid(gid));
        }
        toast('你不在对方通讯录：请等待对方回复，或先申请加入对方通讯录。', 'info');
        return;
      }

      if (code === 'RATE_LIMIT') {
        markFailedByReqId('发送过快，请稍候再试');
        pushSendBlockedTip(sanitizeGroupId(activeGroup.value) || SYSTEM_GROUP, {
          title: '发送过于频繁',
          text: '消息发送太快了，请稍候片刻再试。',
          dedupeKey: 'error-rate-limit',
        });
        toast('发送过快，请稍后重试。', 'info');
        return;
      }

      if (code === 'NO_RECIPIENT') {
        markFailedByReqId('当前群组暂无在线成员');
        pushSendBlockedTip(sanitizeGroupId(activeGroup.value) || SYSTEM_GROUP, {
          title: '发送未完成',
          text: '当前群组没有可接收消息的在线成员，请稍后再试。',
          dedupeKey: 'error-no-recipient',
        });
        toast('当前群组暂无可接收消息的在线成员。', 'info');
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

      if (code === 'CONTACT_ALREADY_MUTUAL') {
        toast('双方已互为通讯录，无需重复申请。', 'info');
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
        nicknameSaving.value = false;
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

      if (code === 'NICKNAME_INVALID') {
        nicknameSaving.value = false;
        toast('昵称不合法，请使用 1-24 个可见字符。', 'error');
        return;
      }

      if (code === 'NICKNAME_TAKEN') {
        nicknameSaving.value = false;
        toast('昵称已被占用，请换一个。', 'error');
        return;
      }

      if (code === 'INVITE_INVALID') {
        pushSendBlockedTip(currentGroupId, {
          title: '群邀请失效',
          text: '该邀请已失效，请重新发起。',
          dedupeKey: 'error-invite-invalid',
        });
        toast('群聊邀请已失效，请重新发起。', 'error');
        return;
      }

      if (code === 'GROUP_OWNER_REQUIRED') {
        pushSendBlockedTip(currentGroupId, {
          title: '权限不足',
          text: '该操作仅群主可执行。',
          dedupeKey: 'error-group-owner-required',
        });
        toast('该操作仅群主可执行。', 'error');
        return;
      }

      if (code === 'GROUP_RENAME_FORBIDDEN') {
        pushSendBlockedTip(currentGroupId, {
          title: '无法修改群名',
          text: '当前群类型不支持重命名。',
          dedupeKey: 'error-group-rename-forbidden',
        });
        toast('当前群类型不支持改名。', 'error');
        return;
      }

      if (code === 'GROUP_KICK_TARGET_MISSING') {
        pushSendBlockedTip(currentGroupId, {
          title: '移出失败',
          text: '目标成员不在群内或已离开。',
          dedupeKey: 'error-group-kick-target',
        });
        toast('目标成员不在群内。', 'error');
        return;
      }

      if (code === 'GROUP_OWNER_CANNOT_LEAVE') {
        clearPendingLeaveRequest(reqId);
        closeLeaveGroupDialog();
        toast('当前版本未携带群主退出方式，请重试。', 'error');
        return;
      }

      if (code === 'GROUP_OWNER_LEAVE_MODE_REQUIRED') {
        clearPendingLeaveRequest(reqId);
        toast('请先选择解散群聊或顺位继承。', 'info');
        return;
      }

      if (code === 'GROUP_OWNER_INHERIT_NO_SUCCESSOR') {
        clearPendingLeaveRequest(reqId);
        toast('群内没有可继承的新群主，请改为解散群聊。', 'error');
        return;
      }

      if (code === 'GROUP_LEAVE_FORBIDDEN') {
        clearPendingLeaveRequest(reqId);
        closeLeaveGroupDialog();
        toast('当前群类型不支持退出。', 'error');
        return;
      }

      if (code === 'NOT_IN_GROUP' && pendingLeaveGroupId) {
        clearPendingLeaveRequest(reqId);
        removeGroupFromSession(pendingLeaveGroupId);
        toast('你已不在该群聊，已从列表移除。', 'info');
        return;
      }

      if (code === 'INVITE_APPROVAL_INVALID') {
        pushSendBlockedTip(currentGroupId, {
          title: '审批已失效',
          text: '该邀请审批已过期或不存在。',
          dedupeKey: 'error-invite-approval-invalid',
        });
        toast('邀请审批已失效。', 'error');
        return;
      }

      if (code === 'NOT_IN_GROUP' && isDirectGroupId(currentGroupId)) {
        markFailedByReqId('私聊恢复中，请稍候');
        joinedGroups.delete(currentGroupId);
        joinGroup(currentGroupId, '', { select: false });
        pushSendBlockedTip(currentGroupId, {
          title: '正在恢复私聊',
          text: '刚完成重连，私聊会话正在重新接入，请稍候再发送一次。',
          dedupeKey: `error-dm-not-in-group-${currentGroupId}`,
        });
        toast('私聊会话正在恢复。', 'info');
        return;
      }

      if (pendingLeaveGroupId) {
        clearPendingLeaveRequest(reqId);
        closeLeaveGroupDialog();
      }

      nicknameSaving.value = false;
      markFailedByReqId(message || `操作失败：${code}`);
      pushSendBlockedTip(currentGroupId, {
        title: `操作失败：${code}`,
        text: message || '请求失败，请稍后重试。',
        actions: [
          buildExplanationAction({
            label: '为什么失败',
            title: `操作失败：${code}`,
            text: message || '系统没有返回更详细的原因，请稍后重试。',
            tip: '如果多次重复出现，可以先确认当前群聊类型、设备绑定状态和网络连接是否正常。',
          }),
        ],
        dedupeKey: `error-generic-${code}`,
      });
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
          : payload.kind === 'audio'
            ? `[语音] ${formatDurationMs(payload.durationMs || 0)}`
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
              : payload.kind === 'audio'
                ? 'audio'
              : payload.kind === 'invite'
                ? 'invite'
                : payload.kind === 'pair'
                  ? 'pair'
                  : 'text',
          sender: data.sender,
          groupId,
          text: payload.kind === 'text' ? payload.text || '' : '',
          imageData: payload.kind === 'image' ? payload.imageData || '' : '',
          audioData: payload.kind === 'audio' ? payload.audioData || '' : '',
          audioDurationMs: payload.kind === 'audio' ? Number(payload.durationMs) || 0 : 0,
          audioWaveform: payload.kind === 'audio' ? normalizeWaveform(payload.waveform, VOICE_WAVEFORM_SIZE) : [],
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
          replyTo: normalizeReplyPayload(payload.replyTo),
          burnAfterRead: payload.burnAfterRead === true,
          burnAfterMs: Number(payload.burnAfterMs) || 0,
          audioListenedAt: 0,
          burnScheduledAt: 0,
          burnAt: 0,
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
            clickable: groupId !== SYSTEM_NOTICE_GROUP,
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

    if (data.type === 'pair_declined') {
      const gid = sanitizeGroupId(data.groupId);
      const dmGroupId = sanitizeGroupId(data.dmGroupId);
      if (dmGroupId && gid) {
        markPairDeclined(dmGroupId, gid);
      }
      toast(data.from === myUid.value ? '你已拒绝该群聊邀请。' : '对方拒绝了该群聊邀请。', 'info');
      return;
    }

    if (data.type === 'sent_ack') {
      const local = messages.value.find((m) => m.msgId === data.msgId && m.sender === myUid.value);
      if (local && data.ts) {
        local.ts = data.ts;
      }
      clearOutgoingAckTimeout(data.msgId);
      if (local) {
        if (Number(data.delivered) > 0) {
          local.clientStatus = 'delivered';
          local.clientError = '';
          removeOutboxEntry(data.msgId);
          pruneOutboxQueue();
        } else {
          local.clientStatus = 'failed';
          local.clientError = '暂无接收者，请稍候再试';
        }
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
        local.clientStatus = 'read';
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
        if (local.burnAfterRead) {
          scheduleBurnMessage(local);
        }
      }
      return;
    }
  };

  socket.onclose = (event) => {
    stopHeartbeat();
    if (ws === socket) {
      ws = null;
    }
    if (connectionSeq !== wsConnectionSeq) return;
    const offlineNow = typeof navigator !== 'undefined' && navigator.onLine === false;
    networkOnline.value = !offlineNow;
    connectionState.value = offlineNow ? 'offline' : 'reconnecting';
    if (suppressReconnect.value) return;
    pushSendBlockedTip(sanitizeGroupId(activeGroup.value) || SYSTEM_GROUP, {
      title: '连接已断开',
      text: offlineNow
        ? '当前网络不可用，恢复后自动重连。'
        : '正在自动重连…',
      actions: [
        { action: 'reconnect_now', label: '立即重连' },
      ],
      dedupeKey: 'ws-closed',
    });
    scheduleReconnect(event?.reason || (offlineNow ? 'network-offline' : 'socket-closed'));
  };

  socket.onerror = () => {
    if (ws !== socket || connectionSeq !== wsConnectionSeq) return;
    connectionState.value = networkOnline.value ? 'reconnecting' : 'offline';
  };
};

onMounted(async () => {
  loadUiScaleSetting();
  loadSoundSetting();
  loadNotificationPrompt();
  loadSystemNotifySetting();
  loadTrustedKeys();
  loadOutboxQueue();
  pruneOutboxQueue();
  void initDeviceFingerprint();
  notificationAudio = new Audio(SOUND_URL);
  notificationAudio.preload = 'auto';
  const tryUnlock = () => {
    void unlockSound();
  };
  window.addEventListener('pointerdown', tryUnlock, { once: true, passive: true });
  window.addEventListener('keydown', tryUnlock, { once: true });

  // Service Worker 注册 + Push 状态检查
  void registerServiceWorker();
  void getPushStatus().then((status) => {
    pushStatus.value = status;
  });

  const url = new URL(window.location.href);
  const groupFromUrl = sanitizeGroupId(url.searchParams.get('group'));
  const inviteFromUrl = extractInviteCode(
    url.searchParams.get('i') || url.searchParams.get('invite') || url.searchParams.get('code') || ''
  );
  const shortInviteFromUrl = extractShortInviteCode(url.toString());
  const inviteFromHash = extractInviteCode(decodeURIComponent(url.hash || ''));
  if (inviteFromUrl || inviteFromHash || shortInviteFromUrl) {
    clearInviteUrlFromAddressBar();
  }
  const resolvedShortInvite = !inviteFromUrl && !inviteFromHash && shortInviteFromUrl
    ? await resolveShortInviteCode(shortInviteFromUrl)
    : null;
  const inviteOnly = inviteFromUrl || inviteFromHash || resolvedShortInvite?.inviteCode || '';
  const groupFromInviteOnly = inviteOnly && !groupFromUrl ? decodeInviteGroupId(inviteOnly) : '';

  if (groupFromUrl || groupFromInviteOnly) {
    const gid = groupFromUrl || groupFromInviteOnly;
    pendingJoin.value = { groupId: gid, inviteCode: inviteOnly, select: true, groupName: '', joinStatement: '' };
    activeGroup.value = gid;
    ensureGroupInList(gid);
  }

  // ?add=deviceId → 自动打开添加好友弹窗
  const addDeviceId = url.searchParams.get('add');
  if (addDeviceId && parseDeviceShareString(addDeviceId)) {
    url.searchParams.delete('add');
    window.history.replaceState({}, '', url.toString());
    // 延迟打开，等连接建立
    setTimeout(() => {
      addFriendDialog.value = { open: true, deviceIdInput: parseDeviceShareString(addDeviceId) || addDeviceId, error: '', mode: 'input' };
    }, 1500);
  }

  checkEnvironment();
  networkOnline.value = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  if (!isInsecureBrowser.value && networkOnline.value) {
    connectWS();
  } else if (!networkOnline.value) {
    connectionState.value = 'offline';
  }
  updateViewportState();
  if (mobileViewport.value) {
    initializeMobileHistory();
  }
  window.addEventListener('online', handleNetworkOnline);
  window.addEventListener('offline', handleNetworkOffline);
  window.addEventListener('popstate', handleMobilePopState);
  document.addEventListener('contextmenu', preventNativeContextMenu);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportResize);
  } else {
    window.addEventListener('resize', handleViewportResize);
  }
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onBeforeUnmount(() => {
  document.removeEventListener('contextmenu', preventNativeContextMenu);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('online', handleNetworkOnline);
  window.removeEventListener('offline', handleNetworkOffline);
  window.removeEventListener('popstate', handleMobilePopState);
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleViewportResize);
  } else {
    window.removeEventListener('resize', handleViewportResize);
  }
  for (const timer of burnTimers.values()) {
    window.clearTimeout(timer);
  }
  burnTimers.clear();
  for (const timer of outgoingAckTimers.values()) {
    window.clearTimeout(timer);
  }
  outgoingAckTimers.clear();
  if (burnTicker) {
    window.clearInterval(burnTicker);
    burnTicker = 0;
  }
  resetReconnectTimer();
  clearDmNegotiation();
  cleanupVoiceRecorder();
  stopAudioPlayback();
  if (voicePlaybackAudio) {
    voicePlaybackAudio.src = '';
    voicePlaybackAudio = null;
  }
});
</script>

<style scoped>
/* 细滚动条 */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
}
*::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
*::-webkit-scrollbar-track {
  background: transparent;
}
*::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 999px;
}
*::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}


.voice-recording-dot {
  animation: voice-recording-pulse 1s ease-in-out infinite;
}
@keyframes voice-recording-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.voice-active {
  border-color: rgba(239, 68, 68, 0.3) !important;
}
.chat-pattern {
  background-image:
    radial-gradient(circle at 25px 25px, rgba(148, 163, 184, 0.09) 2px, transparent 0),
    radial-gradient(circle at 75px 75px, rgba(148, 163, 184, 0.09) 2px, transparent 0);
  background-size: 100px 100px;
}

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.18);
}

button {
  transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease, background-color 140ms ease, border-color 140ms ease;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: saturate(1.03);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

.mobile-panel-overlay,
.mobile-side-drawer,
.system-notice-backdrop,
.system-notice-shell,
.dialog-backdrop,
.dialog-shell {
  will-change: transform, opacity;
}

.viewport-modal-scroll {
  position: relative;
  z-index: 10;
  display: flex;
  height: 100dvh;
  min-height: 100dvh;
  width: 100%;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding:
    max(0.75rem, env(safe-area-inset-top))
    0.75rem
    max(0.75rem, env(safe-area-inset-bottom));
}

.viewport-modal-panel,
.dialog-shell,
.system-notice-shell,
.mobile-side-drawer,
.device-kicked-panel {
  min-height: 0;
  max-height: calc(100dvh - max(1rem, env(safe-area-inset-top)) - max(1rem, env(safe-area-inset-bottom)));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.viewport-modal-panel,
.device-kicked-panel {
  position: relative;
  width: min(100%, var(--dialog-max, 32rem));
  background: rgba(255, 255, 255, 0.995);
}

.viewport-modal-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.system-notice-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.mobile-side-drawer {
  overflow-y: auto;
  overscroll-behavior: contain;
}

.connection-spinner {
  animation: connection-rotate 1.1s linear infinite;
}

.status-spinner {
  animation: connection-rotate 0.9s linear infinite;
}

.connection-dot-pulse {
  animation: connection-dot-pulse 1.35s ease-in-out infinite;
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

.message-jump-highlight .message-bubble,
.message-jump-highlight.message-bubble {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.22), 0 14px 30px rgba(59, 130, 246, 0.14);
}

.message-bubble {
  max-width: min(34rem, 82vw);
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.message-bubble:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
}

.voice-message-card {
  min-width: min(16rem, 68vw);
}

.voice-play-button {
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.14);
}

.voice-waveform-bar {
  width: 3px;
  border-radius: 999px;
  transform-origin: center bottom;
  transition: height 180ms ease, opacity 180ms ease, background-color 180ms ease;
}

.voice-waveform-bar-idle {
  background: rgba(100, 116, 139, 0.35);
}

.voice-waveform-bar-active {
  background: rgba(15, 23, 42, 0.75);
}

.voice-waveform-bar-outgoing {
  background: rgba(255, 255, 255, 0.38);
}

.voice-waveform-bar-outgoing-active {
  background: rgba(255, 255, 255, 0.92);
}

.voice-waveform-bar-live {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(59, 130, 246, 0.35));
}

.voice-composer-shell {
  transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease, background 220ms ease;
}

.voice-mobile-panel {
  background:
    radial-gradient(circle at 82% 18%, rgba(251, 191, 36, 0.16), transparent 26%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
}

.voice-mobile-bar {
}

.voice-status-title,
.voice-status-subtitle {
  word-break: break-word;
}

.voice-status-subtitle {
  line-height: 1.45;
}

.voice-shell-requesting {
  background:
    radial-gradient(circle at 18% 22%, rgba(125, 211, 252, 0.18), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.98));
}

.voice-shell-recording {
  background:
    radial-gradient(circle at 85% 22%, rgba(251, 191, 36, 0.18), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.96));
  box-shadow: 0 22px 56px rgba(15, 23, 42, 0.14);
}

.voice-shell-encoding,
.voice-shell-sending {
  background:
    radial-gradient(circle at 82% 18%, rgba(59, 130, 246, 0.2), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(239, 246, 255, 0.96));
}

.voice-recorder-action {
  background: linear-gradient(135deg, #0f172a, #334155);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.2);
}

.voice-recorder-dot {
  animation: voice-recorder-pulse 1.2s ease-in-out infinite;
}

.voice-waiting-dot {
  height: 7px;
  width: 7px;
  border-radius: 999px;
  background: #0f172a;
  opacity: 0.22;
  animation: voice-waiting-bounce 1.15s ease-in-out infinite;
}

.voice-waiting-dot:nth-child(2) {
  animation-delay: 120ms;
}

.voice-waiting-dot:nth-child(3) {
  animation-delay: 240ms;
}

.voice-start-button {
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
}

.group-quick-trigger {
  -webkit-touch-callout: none;
  user-select: none;
  touch-action: manipulation;
}

.ui-scale-small .avatar {
  transform: scale(0.94);
}

.ui-scale-large .avatar {
  transform: scale(1.06);
}

.ui-scale-small .message-bubble {
  max-width: min(31rem, 80vw);
}

.ui-scale-large .message-bubble {
  max-width: min(38rem, 84vw);
}

.ui-scale-small .voice-message-card {
  min-width: min(14rem, 66vw);
}

.ui-scale-large .voice-message-card {
  min-width: min(18rem, 72vw);
}

.banner-pop-enter-active,
.banner-pop-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms ease-out;
}

.banner-pop-enter-from,
.banner-pop-leave-to {
  opacity: 0;
  transform: translate3d(0, -6px, 0);
}

.banner-pop-enter-to,
.banner-pop-leave-from {
  opacity: 1;
}

.status-strip-enter-active,
.status-strip-leave-active {
  transition:
    opacity 220ms ease,
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.status-strip-enter-from,
.status-strip-leave-to {
  opacity: 0;
  transform: translate3d(0, -10px, 0);
}

.dm-negotiation-enter-active,
.dm-negotiation-leave-active {
  transition:
    opacity 240ms ease,
    transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
}

.dm-negotiation-enter-from,
.dm-negotiation-leave-to {
  opacity: 0;
  transform: translate3d(0, -8px, 0) scale(0.985);
}

.dm-negotiation-orb {
  position: relative;
  display: inline-flex;
  height: 18px;
  width: 18px;
  align-items: center;
  justify-content: center;
}

.dm-negotiation-core,
.dm-negotiation-wave {
  position: absolute;
  border-radius: 999px;
}

.dm-negotiation-core {
  height: 6px;
  width: 6px;
  background: currentColor;
  opacity: 0.95;
}

.dm-negotiation-wave {
  inset: 1px;
  border: 1.5px solid currentColor;
  opacity: 0.18;
  animation: dm-negotiation-wave 1.5s ease-out infinite;
}

.dm-negotiation-wave-delay {
  animation-delay: 0.42s;
}

.mobile-drawer-enter-active .mobile-panel-overlay,
.mobile-drawer-leave-active .mobile-panel-overlay,
.notice-panel-enter-active .system-notice-backdrop,
.notice-panel-leave-active .system-notice-backdrop,
.dialog-pop-enter-active .dialog-backdrop,
.dialog-pop-leave-active .dialog-backdrop {
  transition: opacity 260ms ease;
}

.mobile-drawer-enter-from .mobile-panel-overlay,
.mobile-drawer-leave-to .mobile-panel-overlay,
.notice-panel-enter-from .system-notice-backdrop,
.notice-panel-leave-to .system-notice-backdrop,
.dialog-pop-enter-from .dialog-backdrop,
.dialog-pop-leave-to .dialog-backdrop {
  opacity: 0;
}

.mobile-drawer-enter-active .mobile-side-drawer,
.mobile-drawer-leave-active .mobile-side-drawer {
  transition:
    opacity 280ms ease,
    transform 460ms cubic-bezier(0.22, 1, 0.36, 1);
}

.mobile-drawer-enter-from .mobile-side-drawer,
.mobile-drawer-leave-to .mobile-side-drawer {
  opacity: 0;
  transform: translate3d(-24px, 0, 0) scale(0.985);
}

.notice-panel-enter-active .system-notice-shell,
.notice-panel-leave-active .system-notice-shell,
.dialog-pop-enter-active .dialog-shell,
.dialog-pop-leave-active .dialog-shell {
  transition:
    opacity 280ms ease,
    transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
}

.notice-panel-enter-from .system-notice-shell,
.notice-panel-leave-to .system-notice-shell,
.dialog-pop-enter-from .dialog-shell,
.dialog-pop-leave-to .dialog-shell {
  opacity: 0;
}

.notice-panel-enter-from .system-notice-shell,
.notice-panel-leave-to .system-notice-shell {
  transform: translate3d(18px, 0, 0) scale(0.985);
}

.dialog-pop-enter-from .dialog-shell,
.dialog-pop-leave-to .dialog-shell {
  transform: translate3d(0, 18px, 0) scale(0.985);
}

@media (max-width: 767px) {
  .viewport-modal-scroll {
    align-items: flex-start;
    justify-content: flex-start;
    padding-left: 0;
    padding-right: 0.75rem;
  }

  .viewport-modal-panel,
  .device-kicked-panel {
    width: min(92vw, var(--dialog-max, 24rem));
    margin-left: 0;
    border-radius: 0 28px 28px 0;
    animation: mobile-panel-in 240ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .dialog-shell {
    width: min(92vw, 24rem);
    max-width: min(92vw, 24rem);
    margin-left: 0;
    border-radius: 0 28px 28px 0;
  }

  .system-notice-shell {
    max-width: min(88vw, 22rem);
  }

  .mobile-side-drawer {
    border-radius: 0 30px 30px 0;
  }

  .notice-panel-enter-from .system-notice-shell,
  .notice-panel-leave-to .system-notice-shell,
  .dialog-pop-enter-from .dialog-shell,
  .dialog-pop-leave-to .dialog-shell {
    transform: translate3d(-18px, 0, 0) scale(0.985);
  }
}

@media (min-width: 768px) {
  .notice-panel-enter-from .system-notice-shell,
  .notice-panel-leave-to .system-notice-shell {
    transform: translate3d(0, 10px, 0) scale(0.98);
  }

  .dialog-pop-enter-from .dialog-shell,
  .dialog-pop-leave-to .dialog-shell {
    transform: translate3d(0, 10px, 0) scale(0.98);
  }
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

@keyframes connection-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes connection-dot-pulse {
  0%,
  100% {
    transform: scale(0.92);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.12);
    opacity: 1;
  }
}

@keyframes dm-negotiation-wave {
  0% {
    transform: scale(0.58);
    opacity: 0.34;
  }
  70% {
    transform: scale(1.18);
    opacity: 0;
  }
  100% {
    transform: scale(1.18);
    opacity: 0;
  }
}

@keyframes voice-waiting-bounce {
  0%, 80%, 100% {
    opacity: 0.22;
    transform: translateY(0) scale(0.9);
  }
  40% {
    opacity: 0.82;
    transform: translateY(-2px) scale(1.04);
  }
}

@keyframes voice-recorder-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(0.92);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.18);
  }
}

@keyframes mobile-panel-in {
  from {
    opacity: 0.72;
    transform: translate3d(-24px, 0, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .message-item {
    animation: none;
  }
  .message-bubble {
    transition: none;
  }
  .voice-waveform-bar,
  .voice-composer-shell,
  .voice-waiting-dot,
  .voice-recorder-dot,
  .dm-negotiation-wave {
    animation: none;
    transition: none;
  }
}

@media (min-width: 640px) {
  .viewport-modal-scroll {
    padding:
      max(1rem, env(safe-area-inset-top))
      1rem
      max(1rem, env(safe-area-inset-bottom));
  }
}

.mobile-safe-footer {
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
}

.keyboard-open .mobile-safe-footer {
  padding-bottom: calc(0.35rem + env(safe-area-inset-bottom));
}

.keyboard-open header p.text-xs,
.keyboard-open header p.text-\[11px\] {
  display: none;
}

.viewport-narrow .message-bubble {
  max-width: 80vw;
}

@media (max-width: 768px) {
  .mobile-header-shell {
    padding: 0.7rem 0.9rem;
  }

  .mobile-content-shell {
    padding: 0.75rem 0.75rem 0.9rem;
  }

  .mobile-root-stack {
    gap: 0.5rem;
    padding-bottom: 0.6rem;
  }

  .mobile-root-card {
    border-radius: 16px;
    padding: 0.65rem;
  }

  .mobile-root-card p.text-sm.font-semibold,
  .mobile-message-row p.text-sm.font-semibold,
  .mobile-panel-action-title {
    font-size: 0.875rem;
  }

  .mobile-root-card p.text-xs,
  .mobile-message-row .text-xs {
    line-height: 1.25rem;
  }

  .mobile-message-toolbar input,
  .mobile-message-toolbar button {
    min-height: 2.65rem;
    padding-left: 0.9rem;
    padding-right: 0.9rem;
    font-size: 0.875rem;
  }

  .mobile-message-row {
    gap: 0.75rem;
    padding-top: 0.85rem;
    padding-bottom: 0.85rem;
  }

  .mobile-message-row .avatar {
    height: 2.75rem;
    width: 2.75rem;
    font-size: 0.8rem;
  }

  .mobile-side-drawer {
    width: min(82vw, 19rem);
    border-radius: 24px;
  }

  .mobile-panel-action {
    min-height: 3.25rem;
    padding: 0.7rem 0.75rem;
  }

  .mobile-panel-list .group-quick-trigger {
    margin-bottom: 0.5rem;
    padding: 0.75rem;
  }

  .mobile-bottom-tabs {
    padding: 0.35rem 0.5rem;
  }

  .mobile-bottom-tab {
    border-radius: 0.5rem;
    padding: 0.3rem 0.25rem;
    font-size: 0.625rem;
  }

  .mobile-footer-shell {
    padding: 0.5rem 0.6rem calc(env(safe-area-inset-bottom) + 0.5rem);
  }

  .mobile-voice-panel {
    border-radius: 24px;
    padding: 0.9rem;
  }

  .voice-mobile-bar {
    min-height: 42px;
    gap: 0.65rem;
    padding: 0.55rem 0.8rem;
  }

  .voice-composer-shell {
    min-height: 42px;
    gap: 0.5rem;
    border-radius: 20px;
    padding: 0.45rem 0.6rem;
  }
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
