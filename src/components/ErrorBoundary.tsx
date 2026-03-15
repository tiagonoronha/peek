/**
 * Error boundary component that catches React rendering errors.
 * Displays a fallback UI with retry option instead of crashing the entire app.
 * @module components/ErrorBoundary
 */

import { Component, type ReactNode } from "react";
import { createLogger } from "@/shared";

const logger = createLogger("[ErrorBoundary]");

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error("Uncaught error:", error.message);
    logger.error("Component stack:", errorInfo.componentStack);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 p-8 text-center">
          <div className="text-red-400 text-lg font-medium">
            Something went wrong
          </div>
          <p className="text-neutral-400 text-sm max-w-md">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={this.handleRetry}
            className="mt-4 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-md text-sm text-neutral-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
