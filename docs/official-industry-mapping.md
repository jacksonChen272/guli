# GULI 官方產業分類

## 官方來源

- 主要來源：臺灣證券交易所 OpenAPI「上市公司基本資料」`https://openapi.twse.com.tw/v1/opendata/t187ap03_L`。
- 備援來源：公開資訊觀測站 Open Data CSV `https://mopsfin.twse.com.tw/opendata/t187ap03_L.csv`。
- 更新腳本：`npm run data:twse:industries`。

兩個來源皆屬 TWSE 官方公開資料。本流程不使用第三方網站，也不以公司名稱猜測產業。

## 範圍與排除

資料先與 `twse-stocks/latest.json` 的正式 universe 交叉驗證，只納入：

- 市場為 TWSE。
- 股票代號為 4 碼數字。
- `instrumentType` 為 `stock`。

ETF、ETN、權證、特別股、受益憑證、TDR／代碼 91、無效代號與未知工具均不會被納入普通股產業覆蓋率。官方欄位缺失或代碼尚未支援時保留 `null`，畫面顯示「未分類」。

## 欄位對應

| TWSE 原始欄位 | GULI 欄位 | 說明 |
| --- | --- | --- |
| 出表日期 | `effectiveDate` | 民國日期正規化為 `YYYY-MM-DD` |
| 公司代號 | `symbol` | 僅 4 碼上市普通股 |
| 公司簡稱／公司名稱 | `name` | 保留官方名稱 |
| 產業別 | `industryCode` | 正規化為兩碼字串 |
| 產業別代碼表 | `industryName` | 使用 TWSE 官方分類名稱 |

`fetchedAt` 是 GULI 同步時間，`effectiveDate` 是來源資料有效日，兩者不可混用。

## 資料流程

```text
TWSE OpenAPI ──失敗──> MOPS CSV
      │                  │
      └──── 正規化／驗證 ┘
                  │
          暫存檔寫入＋重讀
                  │
     public/data/twse-industries/*
                  │
      Provider → Repository → UI
                  │
     Heatmap / Industry Snapshot
```

腳本具有逾時、重試、Content-Type 檢查、JSON／CSV 解析、UTF-8 與 conflict marker 保護。新資料驗證失敗時不會覆蓋上一份有效 JSON。

## 覆蓋率與狀態

- `Official`：全部普通股都有官方分類。
- `Mixed`：官方分類為主，少數股票使用明確標示的 GULI 衍生群組。
- `Partial`：仍有未分類股票。
- stale：分類有效日距目前超過 45 個日曆日；週末不會單獨被判為錯誤。

Heatmap 同時揭露普通股總數、官方分類、衍生分類、未分類與各自覆蓋率。Industry Snapshot 的 Technical／Decision 平均只使用實際 join 成功的樣本，缺值不會填 0。

## 已知限制

- 本版只有 TWSE 上市普通股，不包含 TPEX 上櫃市場。
- 公司基本資料為定期更新，不是即時行情。
- 產業強度、Technical、Decision、風險與 Snapshot 分數仍是 GULI 固定規則推導，不是 TWSE 官方評等。
