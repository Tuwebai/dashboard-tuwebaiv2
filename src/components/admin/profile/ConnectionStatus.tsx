import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { ConnectionStatusSkeleton } from './SkeletonLoader';

interface ConnectionStatusProps {
  provider: 'github' | 'linkedin';
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  lastUpdate?: Date;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  provider,
  isConnected,
  isLoading,
  error,
  onConnect,
  onDisconnect,
  lastUpdate,
}) => {
  const getProviderInfo = () => {
    switch (provider) {
      case 'github':
        return {
          name: 'GitHub',
          icon: '🐙',
          color: 'bg-gray-900',
          textColor: 'text-white',
        };
      case 'linkedin':
        return {
          name: 'LinkedIn',
          icon: '💼',
          color: 'bg-blue-600',
          textColor: 'text-white',
        };
      default:
        return {
          name: 'Unknown',
          icon: '❓',
          color: 'bg-gray-500',
          textColor: 'text-white',
        };
    }
  };

  const providerInfo = getProviderInfo();

  if (isLoading) {
    return <ConnectionStatusSkeleton />;
  }

  return (
    <div className="flex items-center justify-between p-4 bg-card dark:bg-slate-800/50 rounded-lg border border-border/50 dark:border-slate-700/50">
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 ${providerInfo.color} rounded-full flex items-center justify-center`}>
          <span className="text-sm">{providerInfo.icon}</span>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-foreground">{providerInfo.name}</h3>
            {isConnected ? (
              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                <XCircle className="w-3 h-3 mr-1" />
                Desconectado
              </Badge>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-500 mt-1">{error}</p>
          )}
          {isConnected && lastUpdate && (
            <p className="text-xs text-muted-foreground">
              Última actualización: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {isConnected ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onDisconnect}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Desconectar'
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://${provider}.com`, '_blank')}
              className="flex items-center space-x-1"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Ver perfil</span>
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
};
