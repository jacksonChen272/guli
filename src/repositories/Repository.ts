import type { CacheState } from '../cache/Cache'
import type { DataResult } from '../types/api'

export interface RepositoryReadOptions { forceRefresh?: boolean }
export interface RepositoryDiagnostics { name: string; cacheState: CacheState; lastReadAt?: string; cacheKey?: string }
export interface Repository<TData, TQuery = void> {
  read(query: TQuery, options?: RepositoryReadOptions): Promise<DataResult<TData>>
  refresh(query: TQuery): Promise<DataResult<TData>>
  invalidate(query?: TQuery): void
  getDiagnostics(): RepositoryDiagnostics
}
