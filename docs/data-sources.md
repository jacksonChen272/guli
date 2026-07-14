# GULI 資料來源

## 已啟用

| 資料 | 來源 | 單位 | 更新方式 |
|---|---|---|---|
| 加權指數、漲跌點、漲跌幅 | TWSE `MI_INDEX` | 點、百分比 | 週一至週五盤後同步 |
| 集中市場成交金額 | TWSE `FMTQIK` | 新臺幣元 | 週一至週五盤後同步 |
| 上漲、下跌、平盤家數 | TWSE `twtazu_od` | 家數 | 同交易日資料存在時使用 |

官方 API 文件：[臺灣證券交易所 OpenAPI](https://openapi.twse.com.tw/)。

## 仍為模擬資料

櫃買指數、外資、投信、自營商、個股、產業、資金輪動、訊號、事件、AI 規則輸入仍使用集中管理的 Mock Data。UI 會逐卡顯示「官方 TWSE」、「部分資料」、「回退資料」或「模擬資料」。

本產品不是即時行情服務。GitHub Actions 排程可能延遲，畫面以 JSON 內的 `tradeDate` 與 `fetchedAt` 為準。
