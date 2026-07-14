import { FutureProviderBase } from './FutureProviderBase'
import type { ProviderDescriptor } from './ProviderTypes'
export class FutureYahooProvider extends FutureProviderBase { readonly descriptor: ProviderDescriptor = { id: 'yahoo', name: 'Yahoo Finance', description: '預留補充行情與國際市場參考資料介面。', enabled: false, isMock: false } }
