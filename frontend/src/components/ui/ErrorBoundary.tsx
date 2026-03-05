import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

const CHUNK_RELOAD_KEY = 'chunk-reload-count'
const MAX_CHUNK_RELOADS = 2

interface Props {
  children: ReactNode
  /** Optional fallback — defaults to a generic error card */
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  message: string
  isReloading: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '', isReloading: false }

  static isChunkError(error: Error): boolean {
    return (
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Importing a module script failed') ||
      error.message.includes('error loading dynamically imported module') ||
      error.message.includes('Unable to preload CSS')
    )
  }

  static getDerivedStateFromError(error: Error): State {
    if (ErrorBoundary.isChunkError(error)) {
      const count = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0)
      if (count < MAX_CHUNK_RELOADS) {
        return { hasError: true, message: '', isReloading: true }
      }
    }
    return { hasError: true, message: error.message, isReloading: false }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (ErrorBoundary.isChunkError(error)) {
      const count = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0)
      if (count < MAX_CHUNK_RELOADS) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, String(count + 1))
        console.warn('[ErrorBoundary] Chunk load failure, reloading...', error.message)
        window.location.reload()
        return
      }
      // Retry limit reached — clear counter and fall through to error UI
      sessionStorage.removeItem(CHUNK_RELOAD_KEY)
    }
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY)
    this.setState({ hasError: false, message: '', isReloading: false })
  }

  render() {
    if (this.state.isReloading) return null

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
