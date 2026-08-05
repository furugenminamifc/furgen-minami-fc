古堅南FC AI Coach Ver.23.2 完全修正版
BUILD: 23.2-20260805-records-only-safe-final

【最重要】
既存のrecordsを削除・変更しません。
確認済みの6,210件を、そのまま唯一の通算成績データとして使用します。

修正内容
・通算成績はrecordsのみから100%自動計算
・matchesテーブルに存在しない過去recordsも集計対象
・playersの通算成績入力欄を廃止
・players保存時にpast_apps等を更新しない
・一覧、詳細、ランキング、AI分析が共通totals関数を使用
・出場、得点、アシスト、時間、警告、退場、MVPを共通集計
・同じ試合・同じ選手の重複recordsは最新1件のみ採用
・過去試合一括取込はrecordsが0件の新規環境だけ実行可能
・recordsが1件でも存在する場合は自動停止
・一括取込でplayersや既存試合を削除・変更しない

GitHub Desktop Summary
Ver23.2 完全修正版 records100パーセント自動集計

確認URL
https://furugenminamifc.github.io/furgen-minami-fc/?build=232safe
