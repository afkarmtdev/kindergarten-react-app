import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  /** Optional fallback — defaults to a generic error card */
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => this.setState({ hasError: false, message: '' })

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-gray-100 mb-1">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
            {this.state.message || 'An unexpected error occurred. The page could not be displayed.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 bg-kinder-orange text-white rounded-xl font-semibold text-sm hover:bg-orange-600 transition-all"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
