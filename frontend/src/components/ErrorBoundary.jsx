import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[NexusFlow ErrorBoundary] Caught render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-12 bg-[#895129] rounded-2xl border border-red-400/40 text-white shadow-xl text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-300 mx-auto" />
          <h2 className="text-lg font-bold text-white">Something went wrong in this view</h2>
          <p className="text-xs text-[#DDD2C0] leading-relaxed">
            {this.state.error?.message || 'A rendering error occurred while displaying intelligence data.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 bg-[#9E6237] hover:bg-[#B36F3E] text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-2 border border-white/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Dashboard</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

