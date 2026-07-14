# TWSE Market Overview

## 資料流程

1. `scripts/fetch-twse-market.mjs` 從 TWSE 官方 OpenAPI 讀取三份盤後資料。
2. 腳本處理欄位別名、逗號、正負號及民國日期。
3. 驗證日期、指數、漲跌、成交金額、家數、來源與抓取時間。
4. 驗證成功後先寫暫存檔，再原子性 rename 成 `public/data/twse-market-overview.json`。
5. 前端 `TWSEProvider` 只讀取 `${import.meta.env.BASE_URL}data/twse-market-overview.json`。
6. `MarketRepository` 合併官方市場欄位與未接入的 Mock 欄位。

## 欄位與單位

- `tradeDate`：`YYYY-MM-DD`。
- `indexValue`、`change`：指數點。
- `changePercent`：百分比數值，例如 `0.06` 代表 `0.06%`。
- `tradingAmount`：新臺幣元。UI 顯示時除以 `100,000,000` 轉為億元。
- 漲跌家數缺少或日期不同時為 `null`，不會填入零。

## Fallback 與 stale

- JSON 不存在、格式錯誤或驗證失敗時，Repository 回退至 Mock，並保留結構化 warning。
- 交易日期距台北目前日期超過兩個工作日即標示 stale；週六、週日不會單獨被視為錯誤。
- stale 資料仍可顯示，但必須附警示。
- 同步失敗不會覆寫上一份有效 JSON，也不會讓 React 畫面白屏。

## 已知限制

- `twtazu_od` 可能晚於其他盤後端點更新；日期不同時漲跌家數會顯示缺值。
- GitHub cron 不保證準時啟動。
- 本資料非盤中即時行情，不構成投資建議。
