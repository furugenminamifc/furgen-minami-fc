/*
古堅南FC AI Coach Ver.20.1.2 データ読込修正版
既存 app-v2011.js を読み込み、既知の構文エラーを安全に修正して実行します。
*/
(function () {
  'use strict';

  const BUILD = '20.1.2-20260731';
  const SOURCE = './assets/js/app-v2011.js?build=' + BUILD;

  function showFatal(message) {
    console.error(message);
    const box = document.getElementById('message');
    if (box) {
      box.textContent = message;
      box.className = 'notice';
      box.classList.remove('hidden');
    } else {
      alert(message);
    }
  }

  async function start() {
    try {
      // 古いPWAキャッシュの影響を避ける
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(reg => reg.unregister().catch(() => false)));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key).catch(() => false)));
      }

      const response = await fetch(SOURCE, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('プログラム取得失敗 HTTP ' + response.status);
      }

      let code = await response.text();

      // Ver.20.1.1に存在する致命的な構文エラーを修正
      code = code.replace(
        /const\s+reg\s*=\s*await\s+await\s+reg\.update\(\)\s*;?/g,
        "/* Ver.20.1.2: 不正な service worker 更新処理を削除 */"
      );

      // 万一、別表記で残っている場合も修正
      code = code.replace(
        /await\s+await\s+reg\.update\(\)\s*;?/g,
        "/* Ver.20.1.2: 不正な service worker 更新処理を削除 */"
      );

      // 元プログラムをグローバルスコープで実行
      (0, eval)(code + '\n//# sourceURL=app-v2011-fixed.js');

      document.documentElement.dataset.build = BUILD;
      console.info('古堅南FC AI Coach Ver.20.1.2 起動完了', BUILD);
    } catch (error) {
      showFatal('データ読込修正版の起動に失敗しました：' + (error?.message || error));
    }
  }

  start();
})();
