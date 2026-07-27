import { Component, type ErrorInfo, type ReactNode } from 'react'
import { DashboardCard } from '../dashboard/DashboardCard'
import { DashboardDataState } from '../dashboard/DashboardDataState'

interface Props {
  children: ReactNode
  title: string
  onRetry?: () => void
  resetKey?: string
}

interface State {
  error: Error | null
}

const MAX_RETRY_ATTEMPTS = 3

export class StockSectionErrorBoundary extends Component<Props, State> {
  state: State = { error: null }
  private retryAttempts = 0

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(`[StockPage:${this.props.title}]`, error.message, info.componentStack)
    }
  }

  componentDidUpdate(previousProps: Props) {
    if (previousProps.resetKey !== this.props.resetKey) {
      this.retryAttempts = 0
      if (this.state.error) this.setState({ error: null })
    }
  }

  private retry = () => {
    if (this.retryAttempts >= MAX_RETRY_ATTEMPTS) return
    this.retryAttempts += 1
    this.setState({ error: null })
    this.props.onRetry?.()
  }

  render() {
    if (this.state.error) {
      const canRetry = this.retryAttempts < MAX_RETRY_ATTEMPTS
      return (
        <DashboardCard
          title={this.props.title}
          eyebrow="SECTION RECOVERY"
          state="error"
          data-testid="stock-section-error"
        >
          <DashboardDataState
            loading={false}
            error={canRetry
              ? `此區塊暫時無法顯示；可重新嘗試（${this.retryAttempts + 1} / ${MAX_RETRY_ATTEMPTS}）。其他個股資訊仍可正常使用。`
              : '此區塊連續讀取失敗，已停止自動重試。請稍後重新整理頁面；其他個股資訊仍可正常使用。'}
            onRetry={canRetry ? this.retry : undefined}
          >
            <span />
          </DashboardDataState>
        </DashboardCard>
      )
    }

    return this.props.children
  }
}
