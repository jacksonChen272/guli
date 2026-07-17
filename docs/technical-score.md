# Technical Score technical-v1.0

Technical Score 是獨立衍生指標，不取代或修改 Decision Score、Health Score、Stock Snapshot Score。

權重：趨勢結構 30%、動能 20%、量能 15%、MACD 15%、相對位置 10%、風險控制 10%。趨勢使用價格與 MA20/MA60、均線斜率及 MA5/MA20；動能使用 RSI、KD、20 日報酬；量能使用量比與價格方向；相對位置使用布林通道；風險使用 ATR、波動率、RSI 過熱及均線跌破。

缺少因子時不填 0，而依可用權重重新正規化；可用權重低於 50% 時分數為 `null`。所有分數限制在 0–100，Confidence 反映可用權重並與分數分開。

分級：81–100 強勢、66–80 偏強、51–65 中性、36–50 偏弱、0–35 弱勢、null 資料不足。
