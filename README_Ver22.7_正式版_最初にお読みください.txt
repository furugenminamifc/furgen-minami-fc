古堅南FC AI Coach Ver.22.7 完全安定版（正式版）
ビルド: 22.7-20260804-official
作成日: 2026-08-04

【主な修正】
・画面上部、タイトル、固定バッジをVer.22.7正式版へ統一
・CSS/JavaScript/manifest/configを正式版専用ファイル名へ変更
・旧Service Workerとブラウザキャッシュを起動時に解除
・不正な重複HTMLタグ（AI設定モーダル）を修正
・GitHub Pagesのプロジェクト配下で動作する相対パスを維持

【GitHubへ反映するとき】
1. このフォルダの「中身」をリポジトリ直下へすべて置き換えます。
2. GitHub Desktopで Summary に「Ver22.7 完全安定版 正式版」と入力します。
3. Commit to main → Push origin の順に押します。
4. Actionsのpages build and deploymentが緑色になった後、公開URLを開きます。
5. 古い表示の場合は cache-reset-official.html を一度開きます。

【確認用表示】
画面上部: Ver.22.7 完全安定版（正式版）
画面下部: 22.7-20260804-official
