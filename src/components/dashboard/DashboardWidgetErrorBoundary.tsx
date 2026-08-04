import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'
import { DashboardCard } from './DashboardCard'

interface Props {
  widgetId: string
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class DashboardWidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(`GULI Dashboard widget error: ${this.props.widgetId}`, error.message, info.componentStack)
    }
  }

  componentDidUpdate(previous: Props) {
    if (previous.widgetId !== this.props.widgetId && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <DashboardCard
        title="小工具暫時無法顯示"
        eyebrow="WIDGET UNAVAILABLE"
        state="error"
        contentClassName="p-5"
      >
        <div role="alert" className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-slate-400">
            此區塊讀取時發生問題，其他市場資訊仍可正常使用。
          </p>
          <Button
            type="button"
            variant="secondary"
            icon={<RefreshCw size={15} aria-hidden="true" />}
            onClick={() => this.setState({ hasError: false })}
          >
            重新載入區塊
          </Button>
        </div>
      </DashboardCard>
    )
  }
}
