import type { MarketEvent, MarketSignal } from '../types/market'

export const mockSignals: MarketSignal[] = [
  { id: 'signal-1', type: '資金', title: 'AI 伺服器族群資金明顯升溫', description: '外資與投信同步回補，近五日資金動能排名市場第一。', intensity: 92, industries: ['AI 伺服器'] },
  { id: 'signal-2', type: '籌碼', title: 'PCB 連續三日獲法人買超', description: '高階材料與載板類股買盤集中，籌碼結構持續改善。', intensity: 86, industries: ['PCB'] },
  { id: 'signal-3', type: '風險', title: '航運資金流入力道下降', description: '短線漲幅收斂且外資轉為調節，留意量價背離。', intensity: 71, industries: ['航運'] },
  { id: 'signal-4', type: '產業', title: '金融族群出現輪動跡象', description: '大型金控量能溫和放大，資金由電子擴散至金融。', intensity: 67, industries: ['金融'] },
  { id: 'signal-5', type: '動能', title: '投信集中買超散熱族群', description: '散熱指標股動能加速，投信五日買超創近月高點。', intensity: 89, industries: ['散熱'] },
]

export const mockEvents: MarketEvent[] = [
  { id: 'event-1', time: '10:42', category: '籌碼', title: '外資連三日買超，AI 供應鏈重回資金核心', source: 'GULI Signal' },
  { id: 'event-2', time: '09:28', category: '產業', title: '先進封裝需求升溫，設備族群量能放大', source: 'Market Intel' },
  { id: 'event-3', time: '08:55', category: '總經', title: '美元指數回落，亞洲主要市場開盤走高', source: 'Macro Watch' },
]
