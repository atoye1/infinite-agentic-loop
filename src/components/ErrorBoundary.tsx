import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided, otherwise use default
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI for Remotion
      return (
        <AbsoluteFill
          style={{
            backgroundColor: '#1a1a1a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <div
            style={{
              backgroundColor: '#d32f2f',
              padding: '20px 30px',
              borderRadius: 8,
              marginBottom: 20,
              textAlign: 'center',
              maxWidth: '80%',
            }}
          >
            <h2 style={{ margin: 0, marginBottom: 10, fontSize: 28 }}>
              Rendering Error
            </h2>
            <p style={{ margin: 0, fontSize: 16, opacity: 0.9 }}>
              An error occurred while rendering this frame
            </p>
          </div>
          
          <div
            style={{
              backgroundColor: '#333333',
              padding: 20,
              borderRadius: 4,
              maxWidth: '80%',
              maxHeight: '60%',
              overflow: 'auto',
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 10, fontSize: 18, color: '#ff9800' }}>
              Error Details:
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: 14, 
              fontFamily: 'monospace',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}>
              {this.state.error?.message || 'Unknown error'}
            </p>
            
            {this.state.errorInfo?.componentStack && (
              <>
                <h3 style={{ margin: '20px 0 10px 0', fontSize: 18, color: '#ff9800' }}>
                  Component Stack:
                </h3>
                <p style={{ 
                  margin: 0, 
                  fontSize: 12, 
                  fontFamily: 'monospace',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  color: '#cccccc',
                }}>
                  {this.state.errorInfo.componentStack}
                </p>
              </>
            )}
          </div>
          
          <div style={{ marginTop: 20, textAlign: 'center', color: '#999999' }}>
            <p style={{ margin: 0, fontSize: 14 }}>
              Check the console for additional details
            </p>
          </div>
        </AbsoluteFill>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier use
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...(props as P)} ref={ref} />
    </ErrorBoundary>
  ));
}

// Specialized error boundary for data processing errors
export const DataErrorBoundary: React.FC<{ children: ReactNode; dataSource?: string }> = ({ 
  children, 
  dataSource 
}) => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error(`Data processing error${dataSource ? ` from ${dataSource}` : ''}:`, error);
    console.error('Error info:', errorInfo);
  };

  const fallback = (
    <AbsoluteFill
      style={{
        backgroundColor: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: '#f57c00',
          padding: '20px 30px',
          borderRadius: 8,
          marginBottom: 20,
          textAlign: 'center',
          maxWidth: '80%',
        }}
      >
        <h2 style={{ margin: 0, marginBottom: 10, fontSize: 28 }}>
          Data Processing Error
        </h2>
        <p style={{ margin: 0, fontSize: 16, opacity: 0.9 }}>
          {dataSource 
            ? `Failed to process data from ${dataSource}`
            : 'Failed to process chart data'
          }
        </p>
      </div>
      
      <div style={{ textAlign: 'center', color: '#cccccc' }}>
        <p style={{ margin: 0, fontSize: 16, marginBottom: 10 }}>
          Please check:
        </p>
        <ul style={{ textAlign: 'left', fontSize: 14, lineHeight: 1.5 }}>
          <li>CSV file format and structure</li>
          <li>Date column format matches configuration</li>
          <li>Value columns contain numeric data</li>
          <li>File paths are correct and accessible</li>
        </ul>
      </div>
    </AbsoluteFill>
  );

  return (
    <ErrorBoundary fallback={fallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};