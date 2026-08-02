#!/bin/bash
set -e

cd "$(dirname "$0")"

INDEX="index.html"
if [ ! -f "$INDEX" ]; then
  osascript -e 'display alert "index.html が見つかりません" message "この修正フォルダの中身を furgen-minami-fc フォルダへコピーしてから、もう一度実行してください。" as critical'
  exit 1
fi

BACKUP="index.html.backup-before-v2012"
[ -f "$BACKUP" ] || cp "$INDEX" "$BACKUP"

python3 <<'PY'
from pathlib import Path
import re

p = Path("index.html")
s = p.read_text(encoding="utf-8")

# 壊れたHTMLタグを修正
s = s.replace(
    '<div id="aiSettingsModal"<div id="aiSettingsModal" class="modal hidden">',
    '<div id="aiSettingsModal" class="modal hidden">'
)

# 既存の本体JSを修正版ローダーへ切替
s = re.sub(
    r'<script\s+src=["\']\./assets/js/app-v2011\.js\?build=[^"\']+["\']\s*></script>',
    '<script src="./assets/js/app-v2012-loader.js?build=20.1.2-20260731"></script>',
    s
)

# 既にクエリ無しの場合も対応
s = s.replace(
    '<script src="./assets/js/app-v2011.js"></script>',
    '<script src="./assets/js/app-v2012-loader.js?build=20.1.2-20260731"></script>'
)

# バージョン表示の誤上書き 19.0 を修正
s = s.replace("const VERSION = '19.0';", "const VERSION = '20.1';")

# ビルド番号を更新
s = s.replace('20.1.1-20260731', '20.1.2-20260731')
s = s.replace('Ver.20.1 完全完成版 / 20.1.2-20260731',
              'Ver.20.1.2 データ読込修正版 / 20.1.2-20260731')

p.write_text(s, encoding="utf-8")
PY

# Finderが作る不要ファイルは削除
find . -name '.DS_Store' -delete 2>/dev/null || true

osascript -e 'display alert "Ver.20.1.2 修正完了" message "GitHub Desktopへ戻り、変更をCommitしてPushしてください。"'
