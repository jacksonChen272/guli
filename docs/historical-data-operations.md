# 歷史行情維運

## 本機指令

- `npm run data:twse:history`：更新優先股票清單。
- `npm run data:twse:history:watchlist`：更新預設自選股。
- `npm run data:twse:history:all -- --offset 0 --batch-size 25`：分批補齊上市普通股。
- `npm run data:validate`：驗證 `public/data` 所有 JSON。

同步包含 timeout、最多三次 retry、請求間隔、逐股票 checkpoint 與增量合併。同股票同交易日只保留一筆；每完成一檔便原子寫入，因此中途中斷可安全重跑。

## GitHub Actions

- 日常資料 workflow 僅更新優先股票，不在每次 push 抓取全部上市股票。
- `backfill-stock-history.yml` 由人工輸入 offset、batch size 與 target days，逐批回補並上傳 log artifact。
- 無資料變更不 commit；同步失敗保留上一份有效 JSON。
- tests 與 build 前執行 `data:validate`，衝突標記、無效 UTF-8 replacement 字元、JSON parse 失敗、必要 schema 缺漏或重複日期都會阻擋發布。

TWSE 盤後資料可能延遲；週末顯示最近交易日屬正常，超過五個日曆日才標記可能 stale。

