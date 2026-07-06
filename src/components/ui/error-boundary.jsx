import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6"
             style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
          <Card className="border-red-800 max-w-md" style={{ background: '#0f0f0f' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-400">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
              {this.state.error?.message && (
                <p className="text-xs text-gray-600 bg-gray-900 p-2 rounded">
                  {this.state.error.message}
                </p>
              )}
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;