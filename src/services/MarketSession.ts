export type MarketSessionState = 'pre-open' | 'open' | 'post-close' | 'closed' | 'weekend'
export interface MarketSessionInfo { state: MarketSessionState; label: string; isTradingDay: boolean; taipeiTime: string }

export class MarketSession {
  getSession(now = new Date()): MarketSessionInfo { const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(now); const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''; const weekday = pick('weekday'); const minutes = Number(pick('hour')) * 60 + Number(pick('minute')); const isTradingDay = !['Sat', 'Sun'].includes(weekday); if (!isTradingDay) return { state: 'weekend', label: '週末休市', isTradingDay, taipeiTime: `${pick('hour')}:${pick('minute')}` }; const state: MarketSessionState = minutes >= 510 && minutes < 540 ? 'pre-open' : minutes >= 540 && minutes <= 810 ? 'open' : minutes > 810 && minutes < 1080 ? 'post-close' : 'closed'; const label = ({ 'pre-open': '盤前準備', open: '交易中', 'post-close': '盤後整理', closed: '休市', weekend: '週末休市' } satisfies Record<MarketSessionState, string>)[state]; return { state, label, isTradingDay, taipeiTime: `${pick('hour')}:${pick('minute')}` } }
}
export const marketSession = new MarketSession()
