古堅南FC AI Coach Ver.23.2.2
records全件取得 緊急復旧版
BUILD: 23.2.2-20260805-records-pagination-recovery

原因
Supabaseの1回の取得上限により、records 6,210件のうち最初の1,000件だけが読み込まれていました。

修正
・recordsを1,000件ずつページ分割して全件取得
・matchesも1,000件ずつ全件取得
・recordsの各行をそのまま通算成績へ反映
・同じrecord idが重複した場合だけ除外
・既存recordsの削除・更新・移行を一切行わない
・画面に読み込んだrecords件数を表示
・キャッシュ識別子を23.2.2へ更新

確認ポイント
画面上部に「records 6,210件を全件読み込み済み」と表示されること。
その後、選手一覧の出場数が以前の通算値へ戻ること。

GitHub Desktop Summary
Ver23.2.2 records全件取得 緊急復旧版

確認URL
https://furugenminamifc.github.io/furgen-minami-fc/?build=2322
