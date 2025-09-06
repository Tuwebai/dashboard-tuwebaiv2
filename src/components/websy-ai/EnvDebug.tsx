import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Copy, RefreshCw } from 'lucide-react';

export const EnvDebug: React.FC = () => {
  const [showDetails, setShowDetails] = React.useState(false);

  const envVars = {
    'VITE_GEMINI_API_KEY': import.meta.env.VITE_GEMINI_API_KEY,
    'REACT_APP_GEMINI_API_KEY': import.meta.env.REACT_APP_GEMINI_API_KEY,
    'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_ANON_KEY': import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (value: string | undefined) => {
    if (value && value.trim() !== '') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (value: string | undefined) => {
    if (value && value.trim() !== '') {
      return <Badge variant="default" className="bg-green-500">OK</Badge>;
    }
    return <Badge variant="destructive">NO</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Debug de Variables de Entorno</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            {showDetails ? 'Ocultar' : 'Mostrar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-2 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(value)}
              <span className="text-sm font-mono">{key}</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(value)}
              {value && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(value)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
        
        {showDetails && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Detalles:</h4>
            <div className="space-y-1 text-xs font-mono">
              {Object.entries(envVars).map(([key, value]) => (
                <div key={key}>
                  <span className="text-blue-600">{key}:</span>{' '}
                  <span className="text-gray-600">
                    {value ? `"${value.substring(0, 20)}${value.length > 20 ? '...' : ''}"` : 'undefined'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
