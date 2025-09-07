import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarStatusProps {
  isAuthenticated: boolean;
  userInfo: { email: string; name: string } | null;
  onAuthenticate: () => void;
  onSignOut: () => void;
  isLoading?: boolean;
  className?: string;
}

export const CalendarStatus: React.FC<CalendarStatusProps> = ({
  isAuthenticated,
  userInfo,
  onAuthenticate,
  onSignOut,
  isLoading = false,
  className
}) => {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Google Calendar
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isAuthenticated ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <Badge variant="default" className="text-xs bg-green-500">
                Conectado
              </Badge>
            </div>
            
            {userInfo && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <div className="font-medium">{userInfo.name}</div>
                <div>{userInfo.email}</div>
                <div className="text-green-600 dark:text-green-400 mt-1">
                  ✓ Conectado automáticamente
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://calendar.google.com', '_blank')}
                className="flex-1 text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Abrir Calendar
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onSignOut}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Desconectar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <Badge variant="outline" className="text-xs text-blue-500 border-blue-500">
                    Conectando...
                  </Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <Badge variant="outline" className="text-xs text-red-500 border-red-500">
                    Desconectado
                  </Badge>
                </>
              )}
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {isLoading 
                ? "Conectando con Google Calendar..."
                : "Haz clic en 'Conectar' para acceder a tu Google Calendar"
              }
            </div>
            
            {!isLoading && (
              <Button
                variant="default"
                size="sm"
                onClick={onAuthenticate}
                className="w-full text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                Conectar Google Calendar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
