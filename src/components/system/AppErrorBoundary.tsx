import { Component, type ErrorInfo, type ReactNode } from 'react'
import { PageErrorState } from './PageErrorState'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError(): State { return { hasError: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { if (import.meta.env.DEV) console.error('GULI page error', error.message, info.componentStack) }
  render() { return this.state.hasError ? <PageErrorState/> : this.props.children }
}
