# 全市場技術索引

`npm run technical:index:generate` 只讀取已存在且通過驗證的 TWSE 官方歷史行情，輸出：

- `public/data/technical-index/latest.json`
- `public/data/technical-index/history/YYYY-MM-DD.json`
- `public/data/technical-index/index.json`

每檔包含收盤、成交量、MA5/10/20/60/120、RSI14、KD、MACD、布林通道、ATR14、20/60 日報酬、20 日波動率、均線斜率、固定訊號與 Technical Score。歷史不足時欄位保持 `null`，不以 0 或 Mock 補值。

智慧選股頁只載入 `technical-index/latest.json` 與預先產生的 screener JSON，不逐檔載入歷史檔；K 線只在快速分析 Drawer 或個股頁讀取單一股票。
