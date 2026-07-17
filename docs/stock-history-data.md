# TWSE 個股歷史行情

## 官方來源

- 端點：`https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY`
- 性質：臺灣證券交易所上市股票月成交資訊，非即時行情。
- 查詢參數：`date=YYYYMM01`、`stockNo=股票代號`、`response=json`。

## 欄位與單位

| GULI 欄位 | TWSE 欄位 | 單位 |
| --- | --- | --- |
| tradeDate | 日期 | YYYY-MM-DD |
| open/high/low/close | 開盤價／最高價／最低價／收盤價 | 新臺幣元 |
| change | 漲跌價差 | 新臺幣元，可正負 |
| volume | 成交股數 | 股 |
| tradingAmount | 成交金額 | 新臺幣元 |
| transactionCount | 成交筆數 | 筆 |

缺值使用 `null`，不以 0 或模擬值補齊。資料只保留實際交易日，依日期遞增並去除重複日期。

## 輸出

- `public/data/twse-stock-history/index.json`
- `public/data/twse-stock-history/latest.json`
- `public/data/twse-stock-history/stocks/{symbol}.json`

同步採暫存檔、重新解析驗證後 rename；失敗時不覆蓋既有有效資料。

