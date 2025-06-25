import React from 'react';
import { logger } from '../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    logger.error('Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Store error details in state
    this.setState({
      error,
      errorInfo
    });

    // Report error to external service (Sentry, etc.) in production
    if (import.meta.env.MODE === 'production') {
      // window.Sentry?.captureException(error, {
      //   contexts: {
      //     react: {
      //       componentStack: errorInfo.componentStack
      //     }
      //   }
      // });
    }
  }

  handleReload = () => {
    // Reset error state and reload the component
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // If error persists, reload the page
    if (this.state.hasError) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI that matches the existing design
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#232323] to-[#2b2b2b] text-white flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-red-500/30 rounded-3xl p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Error Temporal</h2>
              <p className="text-gray-400 text-sm">
                Se ha producido un error inesperado. Nuestro equipo ha sido notificado.
              </p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition"
              >
                Intentar de Nuevo
              </button>
              
              <button 
                onClick={() => window.location.href = '/login'}
                className="w-full py-3 px-4 rounded-full border border-gray-600 text-gray-300 hover:bg-gray-800 transition"
              >
                Ir al Login
              </button>
            </div>
            
            {/* Show error details in development */}
            {import.meta.env.MODE === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-400">
                  Detalles del Error (Solo en desarrollo)
                </summary>
                <div className="mt-2 p-3 bg-gray-900 rounded text-xs font-mono text-red-400 overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div>
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for functional components
export const withErrorBoundary = (Component) => {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

export default ErrorBoundary; 