古堅南FC AI Coach Ver.23.2.1
過去試合一括取込 完全修正版
BUILD: 23.2.1-20260805-legacy-import-supabase-fix

修正内容
・存在しない state.players / state.matches の参照を廃止
・実際の players / matches / records を使用
・過去試合をSupabase matchesへ保存
・選手記録をSupabase recordsへ保存
・大量データを分割保存
・取込状況とエラー内容を画面表示
・管理者・コーチのみ実行可能
・データベース側でも二重取込を検出
・取込完了後、playersの過去成績欄を0へ移行
・通算成績はrecordsから100%再計算

GitHub Desktop Summary
Ver23.2.1 過去試合一括取込 完全修正版

確認URL
https://furugenminamifc.github.io/furgen-minami-fc/?build=2321
