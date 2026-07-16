import { useCallback, useEffect, useState } from 'react'
import { repositoryHub } from '../repositories/RepositoryHub'
import { useWatchlistStore } from '../stores/watchlistStore'
import type { WatchlistDashboardData } from '../types/watchlistDashboard'

export function useWatchlistDashboard() {
  const items = useWatchlistStore((state) => state.items)
  const [revision, setRevision] = useState(0)
  const [data, setData] = useState<WatchlistDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const reload = useCallback(() => {
    repositoryHub.watchlistDashboard.invalidate()
    setRevision((value) => value + 1)
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    repositoryHub.watchlistDashboard.getDashboard().then((result) => {
      if (active) setData(result)
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : '智慧自選股資料讀取失敗。')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [items, revision])

  return { data, loading, error, reload }
}
