import type { SnapshotSourceType } from '../../types/snapshot'
import { Badge } from '../ui/Badge'
export function SnapshotSourceBadge({ type }: { type: SnapshotSourceType }) { const meta = { official: ['官方 TWSE', 'brand'], mock: ['模擬資料', 'neutral'], derived: ['規則推導', 'info'], fallback: ['回退資料', 'warning'] } as const; return <Badge tone={meta[type][1]}>{meta[type][0]}</Badge> }
