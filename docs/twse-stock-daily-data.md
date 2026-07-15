# TWSE 上市個股每日盤後資料

GULI v0.5.5-alpha.1 只接入臺灣證券交易所上市證券盤後日資料，不包含 TPEX、Yahoo、FinMind 或即時行情。

## 官方端點

- `https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL`：上市證券日成交資訊。
- `https://openapi.twse.com.tw/v1/exchangeReport/BWIBBU_ALL`：上市個股本益比；只用於補充 `peRatio`。

## 欄位 mapping

| TWSE | GULI | 單位 |
|---|---|---|
| Date | tradeDate | 民國年月日轉 `YYYY-MM-DD` |
| Code | symbol | 證券代號 |
| Name | name | 證券名稱 |
| TradeVolume | tradeVolume | 股 |
| Transaction | transactionCount | 筆 |
| TradeValue | tradeValue | 新臺幣元 |
| OpeningPrice | open | 元 |
| HighestPrice | high | 元 |
| LowestPrice | low | 元 |
| ClosingPrice | close | 元 |
| Change | change | 元 |
| PEratio | peRatio | 倍 |

`STOCK_DAY_ALL` 不提供最佳買價、買量、賣價與賣量，因此 `bidPrice`、`bidVolume`、`askPrice`、`askVolume` 保持 `null`，不填 0。

## 商品分類

分類採保守規則：四位數一般代號為 stock；`00` 開頭的基金代號為 ETF；`020` 六位數代號為 ETN；名稱具有「購」或「售」的證券為 warrant。無法可靠判定者保留 `unknown`，不進入個股健檢的正式報價層。

## 資料流程

`npm run data:twse:stocks` 使用 Node 內建 fetch、timeout、HTTP 與 Content-Type 檢查，正規化並驗證後，以暫存檔及 rename 寫入：

- `public/data/twse-stocks/latest.json`
- `public/data/twse-stocks/history/YYYY-MM-DD.json`
- `public/data/twse-stocks/index.json`

同日期重跑不會在 index 產生重複項目。同步或驗證失敗時不覆蓋上一份有效資料。

## Provider、fallback 與 stale

前端由 `TWSEStockProvider` 使用 `import.meta.env.BASE_URL` 讀取網站內靜態 JSON。`StockRepository` 將正式報價與既有資料分層：quote 為 official；法人為 mock；技術指標與健康分數為 derived。正式 JSON 不存在、schema 不相容、紀錄 invalid 或商品不是 stock 時，價格回退 Mock 並明確標示。

交易日期距目前超過四個日曆日才標示 stale，週末不會直接被視為錯誤。GitHub Actions cron 可能延遲，網站不宣稱固定時間更新。

## 限制

- 非即時行情。
- 不含上櫃市場。
- 最佳買賣價量無官方日成交欄位可用。
- 法人、技術歷史、支撐壓力、健康分數與產業比較仍為 Mock 或規則推導。
- 本內容僅供資訊參考，不構成投資建議。
