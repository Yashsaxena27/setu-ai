import { Component, type ErrorInfo, type ReactNode } from "react";
import { FaExclamationTriangle, FaRedo } from "react-icons/fa";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Error caught by Setu AI ErrorBoundary:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-premium border border-[#0F172A]/10 space-y-6">
            <div className="h-16 w-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-200">
              <FaExclamationTriangle className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-[#0F172A]">Something went unexpected</h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Setu AI encountered a temporary issue rendering this view. Your session data remains safe.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left overflow-x-auto text-[11px] font-mono text-slate-600 max-h-32">
              {this.state.error?.message || "Unknown Application Error"}
            </div>

            <button
              onClick={this.handleRetry}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-sm py-3 px-6 rounded-full transition shadow-md cursor-pointer"
            >
              <FaRedo className="h-3.5 w-3.5" /> Refresh & Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
