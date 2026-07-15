# GULI Decision Engine

## 定位

Decision Engine v1.0 是固定規則分析引擎，不呼叫 OpenAI、Gemini、Claude 或其他生成式 AI。所有結果由可追溯因子、權重、來源與缺值規則計算，不使用 `Math.random`。

## 個股公式

| 因子 | 權重 | 主要來源 |
|---|---:|---|
| 既有健康分數 | 25% | 既有規則，含 Mock 歷史 |
| 當日價格強度 | 20% | Stock Snapshot 衍生 |
| 流動性 | 15% | Stock Snapshot 衍生 |
| 市場環境 | 15% | Market Decision |
| 產業環境 | 15% | 精確匹配時的 Industry Decision |
| 風險控制 | 10% | Stock Snapshot 風險規則 |

Decision Score 與健康分數、Stock Snapshot Score 是三個不同指標，UI 不會混為同一分數。產業 mapping 無法可靠確認時，產業因子為 `null`，不會以名稱猜測或填 0。

## 市場、產業與自選股

- 市場：市場溫度、指數動能、市場廣度、成交環境、風險分布。
- 產業：強度、動能、資金流、廣度、排名趨勢、風險控制。
- 自選股：個股決策平均、強勢比例、高風險比例、官方資料覆蓋、最佳與最弱股票。

## 缺值與權重

缺值保持 `null`。只要仍有有效核心因子，依可用權重重新正規化並在 `DecisionTrace.normalizationApplied` 標示；完全沒有有效因子時分數為 `null`、標籤為「資料不足」。

## Confidence

信心分數從 100 開始，依 Mock、fallback、missing、stale、歷史不足與 warnings 扣分。資料品質不會偷偷改寫 Decision Score，只影響 confidence，並保留扣分原因。

## 限制

目前沒有官方個股產業 mapping、即時行情、TPEX 與完整長期官方歷史。靜態 Decision 產檔不注入前端 Mock 健康分數，因此會清楚標示缺值並重算權重。本內容不構成投資建議。
