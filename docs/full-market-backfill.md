# 全市場歷史行情回補

GULI 從 `public/data/twse-stocks/latest.json` 篩選四位數、`instrumentType === stock` 的上市普通股；ETF、ETN、權證、特殊受益證券、invalid 與 unknown 不進入回補名單。

使用 `npm run data:twse:history -- --all --offset 0 --batch-size 40 --target-days 250 --resume` 分批執行。也可使用 `--symbols 2330,2317`、`--retry-failed-only`、`--timeout`、`--retries` 與 `--rate-limit`。腳本依序請求 TWSE 官方 `STOCK_DAY` 月資料，不大量平行呼叫；寫檔採暫存檔後 rename，失敗不覆蓋有效檔案。

`public/data/twse-stock-history/backfill-progress.json` 只記錄作業進度，不是行情資料。GitHub Actions 的 Backfill workflow 預設每批 40 檔，完成後先驗證 JSON，再產生技術索引與選股結果。

歷史資料為盤後資料，不是即時行情；部分樣本不得描述為全市場完成。
