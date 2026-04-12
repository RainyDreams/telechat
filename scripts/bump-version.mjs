#!/usr/bin/env node
/**
 * 自动版本号脚本
 * 格式：YYYY.M.X.N
 *   YYYY = 年份
 *   M    = 月份（无前导零）
 *   X    = 当月构建序号（自增）
 *   N    = 小补丁号（默认 0，可通过 PATCH=xxx 覆盖）
 *
 * 用法：
 *   node scripts/bump-version.mjs          # 自增序号，补丁=0
 *   PATCH=3 node scripts/bump-version.mjs  # 自增序号，补丁=3
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const statePath = join(root, 'version-state.json');
const pkgPath = join(root, 'package.json');

// 读取状态
let state = { month: '', seq: 0 };
try {
  state = JSON.parse(readFileSync(statePath, 'utf8'));
} catch {
  // 首次运行
}

// 计算当前月份标识
const now = new Date();
const currentMonth = `${now.getFullYear()}.${now.getMonth() + 1}`;

// 递增序号
if (state.month === currentMonth) {
  state.seq += 1;
} else {
  state.month = currentMonth;
  state.seq = 1;
}

// 补丁号
const patch = process.env.PATCH || '0';

// 组装版本号
const version = `${currentMonth}.${state.seq}.${patch}`;

// 更新 package.json
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

// 保存状态
writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');

console.log(`[version] ${version}`);
