import type { ScreenerPreset } from '../../types/screener'

export const screenerPresets: ScreenerPreset[] = [
  { id: 'strong-trend', name: '強勢趨勢', description: '收盤站上中期均線、均線向上且動能未過熱。' },
  { id: 'breakout-volume', name: '突破量增', description: '價格站上 MA20，量比放大且 MACD 柱狀體改善。' },
  { id: 'macd-golden-cross', name: 'MACD 黃金交叉', description: '最近三個交易日出現黃金交叉，價格仍守住 MA20。' },
  { id: 'institution-technical', name: '法人與技術同步', description: '官方法人買超與技術結構同向，且資料日期在允許範圍。' },
  { id: 'oversold-rebound', name: '超跌反彈觀察', description: 'RSI 低檔且 KD 改善；僅列入高風險觀察，不代表買進建議。' },
  { id: 'low-volatility-trend', name: '低波動趨勢', description: '中期均線向上、波動率低於樣本中位數且 RSI 未過熱。' },
  { id: 'high-volume-momentum', name: '高成交動能', description: '量比至少兩倍、20 日報酬為正且收盤高於 MA20。' },
  { id: 'defensive-watch', name: '防守型觀察', description: '波動率偏低、收盤守住 MA60，且 RSI 位於 45–65。' },
  { id: 'high-risk-warning', name: '高風險警示', description: '過熱、高波動、跌破均線或法人賣超等固定風險規則。', riskOnly: true },
  { id: 'complete-data', name: '資料完整精選', description: '至少 250 個交易日，且技術、Decision 與日期一致性可用。' },
]

export const getScreenerPreset = (id: ScreenerPreset['id']) => screenerPresets.find((preset) => preset.id === id) ?? screenerPresets[0]
