import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public props: Props;
  public state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="py-16 max-w-lg mx-auto px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 shadow-sm border border-amber-200">
            <AlertTriangle className="w-7 h-7 text-amber-700" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">
            {this.props.fallbackTitle || 'A Minor Note Went Out of Tune'}
          </h2>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            {this.props.fallbackMessage || 'We encountered an unexpected issue while rendering this section. Your account and progress remain safe.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Section</span>
            </button>
            <button
              onClick={() => { window.location.href = '/app'; }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </button>
          </div>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 text-red-800 text-left text-xs font-mono overflow-auto max-h-40 border border-red-200">
              {this.state.error.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
