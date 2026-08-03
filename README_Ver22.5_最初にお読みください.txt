古堅南FC AI Coach Ver.22.5 公開安定版（混在なし）

【主な修正】
・画面表記とBUILDを Ver.22.5 / 22.5-20260803 に統一
・index.html 内に残っていた VERSION 22.3 を 22.5 に修正
・古いService WorkerとCache Storageを起動時に自動解除
・cache-reset.html を Ver.22.5対応へ更新
・manifest.webmanifest を Ver.22.5へ更新
・.nojekyll を追加
・404.html を追加
・live-match-v225.css / live-match-v225.js を追加

【重要】
この版は古い画面が残る問題を防ぐため、公開確認を優先しService Workerの再登録を停止しています。
GitHub Pagesの「Runner not acquired」「Internal server error」はGitHub側の障害であり、このZIPだけでは回避できません。Actionsが緑色になった後に公開サイトを確認してください。

【上書き方法】
1. このフォルダ内をすべて選択
2. GitHub Desktopの Show in Finder で開いた furgen-minami-fc 内へ貼り付け
3. 「すべて置き換える」
4. Summary: Ver22.5 公開安定版
5. Commit to main → Push origin
6. Actionsが緑色になった後、公開URLを開く
7. 古い表示の場合は /cache-reset.html を一度開く
