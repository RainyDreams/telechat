#!/bin/bash
# PR 创建前检查 — 防冲突、防构建失败
# 用法: bash scripts/pre-pr-check.sh

set -e

echo "=== 1. Fetch latest main ==="
git fetch origin main
BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
echo "  Behind main: $BEHIND commits"

if [ "$BEHIND" -gt 0 ]; then
  echo "  ⚠️  main 有 $BEHIND 个新提交，正在 rebase..."
  git rebase origin/main
  echo "  ✅ rebase 完成"
fi

echo ""
echo "=== 2. Changed files vs main ==="
git diff origin/main --stat || echo "  (no changes)"

echo ""
echo "=== 3. Hot zone check ==="
CHANGED=$(git diff origin/main --name-only 2>/dev/null || true)
HIT=0
for file in $CHANGED; do
  if [ "$file" = "src/App.vue" ]; then
    LINES=$(git diff origin/main -- src.App.vue 2>/dev/null | grep "^@@" | head -10 || true)
    echo "  App.vue changed:"
    echo "  $LINES" | sed 's/^/    /'
    if echo "$LINES" | grep -qE "@@.*109[0-9]|@@.*23[0-3][0-9]|@@.*48|@@.*6[0-9]"; then
      echo "  🔴 警告：改动触及热区（Debug Panel / Toast），可能冲突！"
      HIT=1
    fi
  fi
done
if [ "$HIT" -eq 0 ]; then
  echo "  ✅ 无热区冲突"
fi

echo ""
echo "=== 4. Build check ==="
if npm run build > /dev/null 2>&1; then
  echo "  ✅ build 成功"
else
  echo "  ❌ build 失败！请修复后再提交 PR"
  exit 1
fi

echo ""
echo "=== ✅ All checks passed ==="
echo "可以安全创建 PR 了。"
