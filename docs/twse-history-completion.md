# TWSE 歷史行情完成計畫

## 官方來源與資料格式

GULI 使用臺灣證券交易所 `STOCK_DAY` 盤後端點，逐股票、逐月份取得實際交易日資料。每筆包含日期、開高低收、成交股數、成交金額、漲跌價差與成交筆數。資料單位完全保留 TWSE 回應：價格為新臺幣元、成交量為股、成交金額為新臺幣元、成交筆數為筆。

## 單一資料流

`TWSE → TwseHistoryFetcher → HistoryRetryQueue / HistoryRateLimiter → HistoryValidator → public/data/twse-stock-history/stocks → History Manifest → technical-v1.0 → Technical Manifest → RepositoryHub → UI`

不新增第二套 Provider 或 Repository。前端仍只透過 `TWSEStockHistoryProvider` 與 `StockHistoryRepository` 讀取 GitHub Pages 靜態 JSON。

## 回補策略

- 預設每批 20 檔、每請求 1.2 秒、批次間 7 秒。
- RATE_LIMIT、NETWORK_ERROR 等可重試錯誤使用 5、15、45 秒退避。
- 單檔失敗不阻止同批其他股票，失敗原因寫入 Progress、Manifest 與報告。
- 已達目標且最新交易日一致的有效檔案會略過；`--force-refresh` 才強制重讀。
- 新上市股票不足 300 個實際交易日標記 Partial；不複製其他股票、不補 Mock、不使用亂數。

## 分階段發布

先執行 20 檔，再依 100、300、600、全市場擴大。每階段檢查限流、失敗率、Git 儲存量、Pages 載入量、技術缺口與 Action 執行時間後才進下一階段。
