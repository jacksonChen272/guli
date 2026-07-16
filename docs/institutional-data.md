# TWSE 官方三大法人盤後資料

## 官方端點

- 市場金額總計：`https://www.twse.com.tw/rwd/zh/fund/BFI82U`
- 個股買賣超：`https://www.twse.com.tw/rwd/zh/fund/T86`

同步腳本 `scripts/fetch-twse-institutional.mjs` 使用 Node.js 內建 `fetch`，尋找最近 14 天內 BFI82U 與 T86 同時可用的最近交易日。前端不呼叫上述端點，只透過 `InstitutionRepository` 讀取 GitHub Pages 內的靜態 JSON。

## 欄位與單位

| GULI 欄位 | BFI82U／T86 欄位 | 單位 |
|---|---|---|
| `marketTotals.foreign` | 外資及陸資（不含外資自營商）買進／賣出／差額 | 新臺幣元 |
| `marketTotals.trust` | 投信買進／賣出／差額 | 新臺幣元 |
| `marketTotals.dealer` | 自營商自行買賣 + 自營商避險 | 新臺幣元 |
| `marketTotals.total` | 合計 | 新臺幣元 |
| `foreignNetShares` | 外陸資買賣超股數（不含外資自營商） | 股 |
| `trustNetShares` | 投信買賣超股數 | 股 |
| `dealerNetShares` | 自營商買賣超股數 | 股 |
| `totalNetShares` | 三大法人買賣超股數 | 股 |

UI 才將市場金額除以 100,000,000 顯示億元，將個股股數除以 1,000 顯示張。JSON 不混用元、億元、股或張。

## 靜態輸出與安全性

- `public/data/twse-institutional/latest.json`
- `public/data/twse-institutional/index.json`
- `public/data/twse-institutional/history/YYYY-MM-DD.json`

所有檔案先寫入暫存檔，驗證完成後才 rename。同步失敗、回應不是 JSON、HTTP 錯誤或資料驗證失敗時，既有有效檔案不會被覆蓋。同日期會更新同一筆 index，不會重複新增。

## 已知限制

- 僅保留四碼上市普通股；ETF、ETN、債券、特別股等商品不進入個股排行。
- 資料是盤後資料，不是即時行情。
- 官方單日法人資料會附加到 Decision Trace，但 `decision-v1.0` 沒有法人單日權重，因此分數公式不變。
- 既有健康分數仍使用集中 Mock 法人歷史；UI 與官方單日資料分區顯示。
