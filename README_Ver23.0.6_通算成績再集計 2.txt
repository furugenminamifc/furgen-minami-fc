古堅南FC AI Coach Ver.23.0.6
通算成績 試合履歴再集計版
BUILD: 23.0.6-20260804-history-recalc

修正内容
・一覧、詳細、ランキング、レポート、AI分析が同じtotals関数を使用
・選手編集画面の「出場」も一覧と同じ通算値を表示
・同一選手・同一試合の重複recordsは1試合として集計
・matchesに存在しない不整合recordsを集計対象から除外
・出場、得点、アシスト、警告、退場を共通処理で再計算
・通算欄は自動集計表示として読み取り専用
・選手情報保存時に自動集計値をpast_*へ二重保存しない
・移行済みの過去成績は基礎値として保持
・新しい試合記録はrecordsから自動加算

GitHub Desktop Summary
Ver23.0.6 通算成績 試合履歴再集計

確認URL
https://furugenminamifc.github.io/furgen-minami-fc/?build=2306
