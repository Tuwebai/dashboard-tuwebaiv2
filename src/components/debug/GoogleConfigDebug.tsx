import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { validateGoogleConfig, GOOGLE_CONFIG } from '@/lib/googleConfig';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const GoogleConfigDebug: React.FC = () => {
  const isConfigured = validateGoogleConfig();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Debug Google Config
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Client ID:</span>
            <Badge variant={isConfigured ? "default" : "destructive"}>
              {isConfigured ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              {isConfigured ? 'Configurado' : 'No configurado'}
            </Badge>
          </div>
          
          {isConfigured && (
            <div className="text-xs text-muted-foreground break-all">
              {GOOGLE_CONFIG.clientId}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Redirect URI:</span>
            <Badge variant="outline">
              {GOOGLE_CONFIG.redirectUri}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Scopes disponibles:</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Calendar: {GOOGLE_CONFIG.scopes.calendar}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Gmail: {GOOGLE_CONFIG.scopes.gmail}</span>
            </div>
          </div>
        </div>

        {!isConfigured && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Agrega <code>VITE_GOOGLE_CLIENT_ID</code> a tu archivo .env
            </p>
          </div>
        )}

        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          className="w-full"
        >
          Recargar Página
        </Button>
      </CardContent>
    </Card>
  );
};
