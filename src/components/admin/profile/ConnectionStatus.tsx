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
          icon: (
            <svg height="16" aria-hidden="true" viewBox="0 0 24 24" version="1.1" width="16" data-view-component="true" className="octicon octicon-mark-github v-align-middle">
              <path fill="currentColor" d="M12 1C5.923 1 1 5.923 1 12c0 4.867 3.149 8.979 7.521 10.436.55.096.756-.233.756-.522 0-.262-.013-1.128-.013-2.049-2.764.509-3.479-.674-3.699-1.292-.124-.317-.66-1.293-1.127-1.554-.385-.207-.936-.715-.014-.729.866-.014 1.485.797 1.691 1.128.99 1.663 2.571 1.196 3.204.907.096-.715.385-1.196.701-1.471-2.448-.275-5.005-1.224-5.005-5.432 0-1.196.426-2.186 1.128-2.956-.111-.275-.496-1.402.11-2.915 0 0 .921-.288 3.024 1.128a10.193 10.193 0 0 1 2.75-.371c.936 0 1.871.123 2.75.371 2.104-1.43 3.025-1.128 3.025-1.128.605 1.513.221 2.64.111 2.915.701.77 1.127 1.747 1.127 2.956 0 4.222-2.571 5.157-5.019 5.432.399.344.743 1.004.743 2.035 0 1.471-.014 2.654-.014 3.025 0 .289.206.632.756.522C19.851 20.979 23 16.854 23 12c0-6.077-4.922-11-11-11Z"></path>
            </svg>
          ),
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
          <div className="text-sm">{providerInfo.icon}</div>
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
