export type DataTrustStatus = 'Official' | 'Mixed' | 'Mock' | 'Fallback' | 'Stale' | 'Missing'
export type DataSourceKind = 'official' | 'derived' | 'mock' | 'fallback' | 'missing'
export interface DataTrustReport { status: DataTrustStatus; sources: DataSourceKind[]; stale: boolean; message: string; disclaimerRequired: boolean }
