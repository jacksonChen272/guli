# GULI 市場熱力圖

## 資料流程

每日資料 workflow 依序完成 TWSE 市場、個股、法人、歷史行情、Snapshot、Decision、Technical Index 與 Screener 後，執行 `npm run heatmap:generate`。腳本只讀取當日索引資料，不逐檔載入歷史行情，並原子寫入：

- `public/data/market-heatmap/latest.json`
- `public/data/market-heatmap/history/YYYY-MM-DD.json`
- `public/data/market-heatmap/index.json`

React 元件只透過 `MarketHeatmapRepository` 取得資料，不直接讀取 JSON。

## 面積與顏色

- 預設面積：TWSE 個股盤後成交金額。
- 可切換面積：成交量。
- 預設顏色：當日漲跌幅；台股紅漲、綠跌，接近平盤使用中性色。
- 可切換顏色：Technical Score、Decision Score。分數缺值保留 `null`，以中性色及「資料不足」呈現，不以 0 取代。
- 個股模式最多顯示成交金額前 100 檔，避免一次繪製過多節點。

## 產業 mapping 限制

產業分類優先沿用既有 Industry Snapshot 與既有 mapping，不依股票名稱猜測。未有可靠 mapping 的股票計入未分類數量，不會補造產業。

目前產業 mapping 含 Derived／Mock 成分，因此熱力圖整體標示為 Mixed 或 Partial，而非完全官方資料。畫面明確顯示已分類、未分類、全市場母體與覆蓋率；目前僅呈現已完成分類的實際樣本，不代表全部上市股票。

## 缺值與資料保護

- 價格、成交量、成交金額及分數缺值均保留 `null`。
- JSON 寫入前後皆執行 `JSON.parse`，並拒絕 Git conflict marker 與 Unicode replacement character。
- 相同輸入使用上游資料時間作為 `generatedAt`，產生相同輸出。
- 失敗時不覆蓋上一份有效資料。

本圖僅呈現資料分布與固定規則結果，不構成投資建議。
