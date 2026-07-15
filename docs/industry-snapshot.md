# GULI Industry Snapshot Engine

Industry Snapshot 是每日盤後的產業強弱快照。版本 0.5.4 不串接個股、產業或法人外部 API；交易日期沿用 TWSE 市場總覽，產業、個股與法人數值來自集中管理的 Mock 輸入，所有來源都會寫入 `sources` 與 `warnings`。

## 分數

`strengthScore = capitalFlowScore × 30% + momentumScore × 25% + breadthScore × 20% + relativeStrengthScore × 15% + riskAdjustment × 10%`

分級為 81–100 強勢、66–80 偏強、51–65 中性、36–50 偏弱、0–35 弱勢。`riskScore` 表示風險程度，等於 `100 - riskAdjustment`。所有分數限制在 0–100，資料不足時使用中性分數並產生 warning，不把缺值偽裝成 0。

## JSON 與產生流程

執行 `npm run industry:snapshot:generate`，讀取 `public/data/twse-market-overview.json` 與 `public/data/industry-snapshot-input.json`，驗證後以暫存檔加 rename 原子寫入：

- `public/data/industry-history/YYYY-MM-DD.json`
- `public/data/industry-history/latest.json`
- `public/data/industry-history/index.json`

同日期重跑會取代該日期項目，不新增重複日期；其他日期不受影響。產生失敗時不覆蓋既有有效快照。

## Diff、Memory 與 fallback

Diff 比較相同產業的排名、強度、動能與資金分數，並列出新進／退出前五。Memory 僅用實際存在的 5、10、20 日快照計算常駐前五、落後、改善、下滑、平均強度與連續狀態，不補造交易日。

Market Snapshot 會優先讀取相同交易日期的 Industry Snapshot。若不存在或格式不相容，才回退既有市場分析輸入，並將來源標示為 `fallback`、加入 warning。

## 限制與聲明

目前產業分類、成分股報酬、法人買賣超、成交金額與健康分數均為 Mock／規則推導，不是即時行情，也不是 TWSE 官方產業資料。本內容僅供資訊參考，不構成投資建議。
