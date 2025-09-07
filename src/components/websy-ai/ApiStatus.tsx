import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  Activity,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApiKeyStatus {
  key: string;
  isActive: boolean;
  isRateLimited: boolean;
  lastUsed: Date | null;
  requestCount: number;
  estimatedRemaining: number;
  lastError: string | null;
}

interface ApiStatusProps {
  currentApiIndex: number;
  apiStatuses: ApiKeyStatus[];
  totalRequests: number;
  lastReset: Date;
  onResetToFirst: () => void;
  className?: string;
}

export const ApiStatus: React.FC<ApiStatusProps> = ({
  currentApiIndex,
  apiStatuses,
  totalRequests,
  lastReset,
  onResetToFirst,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getStatusIcon = (status: ApiKeyStatus, index: number) => {
    if (index === currentApiIndex) {
      return status.isRateLimited ? (
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
      ) : (
        <CheckCircle className="h-4 w-4 text-green-500" />
      );
    }
    
    if (status.isRateLimited) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    return <Activity className="h-4 w-4 text-gray-400" />;
  };

  const getStatusBadge = (status: ApiKeyStatus, index: number) => {
    if (index === currentApiIndex) {
      return status.isRateLimited ? (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Limitada
        </Badge>
      ) : (
        <Badge variant="default" className="text-xs bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Activa
        </Badge>
      );
    }
    
    if (status.isRateLimited) {
      return (
        <Badge variant="outline" className="text-xs text-red-500 border-red-500">
          <XCircle className="h-3 w-3 mr-1" />
          Limitada
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="text-xs text-gray-500">
        <Activity className="h-3 w-3 mr-1" />
        Disponible
      </Badge>
    );
  };

  const getUsagePercentage = (status: ApiKeyStatus) => {
    const total = status.requestCount + status.estimatedRemaining;
    if (total === 0) return 0;
    return Math.round((status.requestCount / total) * 100);
  };

  const formatLastUsed = (lastUsed: Date | null) => {
    if (!lastUsed) return 'Nunca';
    
    const now = new Date();
    const diffMs = now.getTime() - lastUsed.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `Hace ${diffDays}d`;
    if (diffHours > 0) return `Hace ${diffHours}h`;
    if (diffMins > 0) return `Hace ${diffMins}m`;
    return 'Ahora';
  };

  const formatLastReset = (lastReset: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - lastReset.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) return `Hace ${diffHours}h ${diffMins}m`;
    return `Hace ${diffMins}m`;
  };

  const activeApi = apiStatuses[currentApiIndex];
  const availableApis = apiStatuses.filter((_, index) => index !== currentApiIndex && !apiStatuses[index].isRateLimited).length;
  const limitedApis = apiStatuses.filter(status => status.isRateLimited).length;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Estado de APIs
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Resumen general */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {activeApi ? (activeApi.isRateLimited ? '⚠️' : '✅') : '❌'}
              </div>
              <div className="text-xs text-gray-500">API Actual</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {availableApis}
              </div>
              <div className="text-xs text-gray-500">Disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">
                {limitedApis}
              </div>
              <div className="text-xs text-gray-500">Limitadas</div>
            </div>
          </div>

          {/* API actual */}
          {activeApi && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(activeApi, currentApiIndex)}
                  <span className="font-medium text-sm">
                    API Key {currentApiIndex + 1}
                  </span>
                  {getStatusBadge(activeApi, currentApiIndex)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatLastUsed(activeApi.lastUsed)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Uso estimado</span>
                  <span>{getUsagePercentage(activeApi)}%</span>
                </div>
                <Progress 
                  value={getUsagePercentage(activeApi)} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{activeApi.requestCount} usadas</span>
                  <span>~{activeApi.estimatedRemaining} restantes</span>
                </div>
              </div>

              {activeApi.lastError && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600">
                  <strong>Último error:</strong> {activeApi.lastError}
                </div>
              )}
            </div>
          )}

          {/* Lista de todas las APIs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Todas las APIs</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="h-6 text-xs"
              >
                {showDetails ? 'Ocultar' : 'Ver detalles'}
              </Button>
            </div>

            {showDetails && (
              <div className="space-y-2">
                {apiStatuses.map((status, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg text-xs",
                      index === currentApiIndex 
                        ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                        : "bg-gray-50 dark:bg-gray-800"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status, index)}
                      <span className="font-medium">
                        API {index + 1}
                      </span>
                      {getStatusBadge(status, index)}
                    </div>
                    
                    <div className="flex items-center gap-3 text-gray-500">
                      <span>{status.requestCount} req</span>
                      <span>~{status.estimatedRemaining}</span>
                      <span>{formatLastUsed(status.lastUsed)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Estadísticas generales */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-gray-500">Total requests</div>
                <div className="font-semibold">{totalRequests}</div>
              </div>
              <div>
                <div className="text-gray-500">Último reset</div>
                <div className="font-semibold">{formatLastReset(lastReset)}</div>
              </div>
            </div>
          </div>

          {/* Botón de reset */}
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onResetToFirst}
              className="w-full text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Resetear a primera API
            </Button>
          </div>

          {/* Información adicional */}
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Sistema Multi-API</p>
                <p>
                  El sistema cambia automáticamente entre API keys cuando se alcanza el límite de solicitudes. 
                  Se resetea cada 24 horas.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
