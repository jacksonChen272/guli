# Market Snapshot Engine

## 用途

Market Snapshot 將單一交易日的市場狀態保存為可回查、比較與統計的 JSON。它是市場回顧、股寶規則分析、分享卡及未來推播的資料基礎，不是即時行情資料庫。

## Schema

目前 `schemaVersion` 為 `1.0`。核心欄位包含交易日期、產生時間、市場狀態、溫度、信心程度、摘要、TWSE 市場總覽、強弱產業、風險、標籤、來源及 warnings。缺少數值一律使用 `null`，不以零代替。

## 產生流程

1. `npm run data:twse` 更新 TWSE 官方盤後市場總覽。
2. `npm run snapshot:generate` 驗證官方資料及 Snapshot 分析輸入。
3. 以來源的 `fetchedAt` 作為 `generatedAt`，確保同輸入可重現。
4. 先寫暫存檔再 rename，更新日期 JSON、`latest.json` 與 `index.json`。
5. 同日期重跑會取代同日期項目，不會新增重複 index。

## 資料來源與混合規則

- `official`：目前已接入的 TWSE 加權指數、漲跌、成交金額及可取得的市場廣度。
- `mock`：產業、法人、訊號與市場溫度。
- `derived`：市場狀態、信心程度、標題、風險與標籤。
- `fallback`：官方 JSON 無法使用時的回退狀態；腳本不會將 fallback 冒充官方 Snapshot。

## 歷史限制

系統只保存實際產生的 Snapshot，不回填或偽造過去 TWSE 官方資料。目前 Repository 內只有一個實際可用交易日，因此 Diff 顯示「尚無前一交易日資料可比較」，Market Memory 也會標示資料不足。

## GitHub Actions

平日盤後 workflow 依序執行資料同步、Snapshot 產生、測試與 build。只有市場 JSON 或 history 有變更時才 commit，失敗時不覆蓋有效 Snapshot。

GitHub cron 可能延遲；資料不是即時行情。所有內容僅供資訊參考，不構成投資建議。
