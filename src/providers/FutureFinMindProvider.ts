import { FutureProviderBase } from './FutureProviderBase'
import type { ProviderDescriptor } from './ProviderTypes'
export class FutureFinMindProvider extends FutureProviderBase { readonly descriptor: ProviderDescriptor = { id: 'finmind', name: 'FinMind', description: '預留歷史行情、籌碼與基本面資料介面。', enabled: false, isMock: false } }
