import { describe,expect,it } from 'vitest'
import { normalizeStockDailyRecord,normalizeStockNumber,normalizeTwseStockDate } from '../StockDailyNormalizer'
describe('StockDailyNormalizer',()=>{
  it('normalizes comma-separated trading values',()=>{expect(normalizeStockNumber('1,234,567')).toBe(1234567)})
  it('keeps missing values null instead of zero',()=>{expect(normalizeStockNumber('--')).toBeNull();expect(normalizeStockNumber('')).toBeNull()})
  it('normalizes ROC date to ISO date',()=>{expect(normalizeTwseStockDate('1150713')).toBe('2026-07-13')})
  it('normalizes TWSE field mapping and price direction',()=>{const record=normalizeStockDailyRecord({Date:'1150713',Code:'2330',Name:'台積電',TradeVolume:'1,200',TradeValue:'2,400',OpeningPrice:'100',HighestPrice:'105',LowestPrice:'99',ClosingPrice:'103',Change:'+3',Transaction:'80'},'2026-07-14T01:00:00.000Z',25);expect(record).toMatchObject({symbol:'2330',tradeDate:'2026-07-13',tradeVolume:1200,transactionCount:80,tradeValue:2400,open:100,high:105,low:99,close:103,changeDirection:'up',peRatio:25,instrumentType:'stock'})})
})
