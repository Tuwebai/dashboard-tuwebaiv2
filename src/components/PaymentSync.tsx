import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  Zap,
  ExternalLink,
  Info
} from 'lucide-react';
import { mercadopagoSyncService, SyncResult } from '@/lib/mercadopagoSyncService';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';

interface SyncStats {
  totalPayments: number;
  syncedPayments: number;
  pendingPayments: number;
  lastSync: string | null;
}

export default function PaymentSync() {
  const { user } = useApp();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (user?.email) {
      loadSyncStats();
      checkConnection();
    }
  }, [user?.email]);

  const loadSyncStats = async () => {
    try {
      setHasError(false);
      const stats = await mercadopagoSyncService.getSyncStats(user!.email);
      setSyncStats(stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setHasError(true);
      // Crear estadísticas por defecto cuando no hay pagos
      setSyncStats({
        totalPayments: 0,
        syncedPayments: 0,
        pendingPayments: 0,
        lastSync: null
      });
    }
  };

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const isConnected = await mercadopagoSyncService.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  const handleSync = async () => {
    if (!user?.email || isSyncing) return;

    setIsSyncing(true);
    setLastSyncResult(null);

    try {
      const result = await mercadopagoSyncService.syncPayments(user.email);
      setLastSyncResult(result);
      
      if (result.success) {
        toast({
          title: "Sincronización exitosa",
          description: result.message,
          variant: "default",
        });
      } else {
      toast({
          title: "Error en sincronización",
        description: result.message,
          variant: "destructive",
      });
      }

      // Recargar estadísticas
      await loadSyncStats();
      
    } catch (error) {
      const errorResult: SyncResult = {
        success: false,
        syncedPayments: 0,
        errors: [error.message],
        message: 'Error inesperado durante la sincronización'
      };
      setLastSyncResult(errorResult);
      
      toast({
        title: "Error crítico",
        description: "Error inesperado durante la sincronización",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-100 text-green-700 border-green-200';
      case 'disconnected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Conectado';
      case 'disconnected': return 'Desconectado';
      default: return 'Verificando...';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'disconnected': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} horas`;
    
    return date.toLocaleDateString('es-ES');
  };

  const getSyncProgress = () => {
    if (!syncStats || syncStats.totalPayments === 0) return 0;
    return (syncStats.syncedPayments / syncStats.totalPayments) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Estado de conexión */}
      <Card className="bg-white rounded-2xl shadow-lg border border-slate-200/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Estado de Conexión
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getConnectionStatusIcon()}
              <span className="text-slate-700">Conexión con MercadoPago</span>
          </div>
            <Badge variant="secondary" className={getConnectionStatusColor()}>
              {getConnectionStatusText()}
          </Badge>
        </div>
          
          {connectionStatus === 'disconnected' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No se puede conectar con MercadoPago. Verifica la configuración del token de acceso.
              </AlertDescription>
            </Alert>
          )}
        
        <div className="flex gap-2">
          <Button 
              variant="outline"
              size="sm"
              onClick={checkConnection}
              disabled={connectionStatus === 'checking'}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`} />
              Verificar Conexión
          </Button>
          
          <Button 
            variant="outline"
              size="sm"
              onClick={() => window.open('https://www.mercadopago.com.ar/developers', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
              Documentación API
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas de sincronización */}
      <Card className="bg-white rounded-2xl shadow-lg border border-slate-200/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Estadísticas de Sincronización
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {syncStats ? (
            <>
              {syncStats.totalPayments === 0 ? (
                <div className="text-center py-8">
                  <Info className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    No hay pagos registrados
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Cuando realices pagos a través de MercadoPago, aparecerán aquí automáticamente.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                    <span className="text-sm font-medium">Estado:</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      Sin pagos
                    </Badge>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-800">{syncStats.totalPayments}</div>
                      <div className="text-sm text-slate-600">Total de Pagos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{syncStats.syncedPayments}</div>
                      <div className="text-sm text-slate-600">Sincronizados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{syncStats.pendingPayments}</div>
                      <div className="text-sm text-slate-600">Pendientes</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Progreso de sincronización</span>
                      <span className="text-slate-800 font-medium">{Math.round(getSyncProgress())}%</span>
                    </div>
                    <Progress value={getSyncProgress()} className="h-2" />
                  </div>
                </>
              )}
              
              <div className="text-sm text-slate-600">
                <span className="font-medium">Última sincronización:</span> {formatLastSync(syncStats.lastSync)}
              </div>
            </>
          ) : hasError ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Error al cargar estadísticas
              </h3>
              <p className="text-slate-600 mb-4">
                No se pudieron cargar las estadísticas de pagos. Esto puede ser normal si no hay pagos registrados.
              </p>
              <Button
                variant="outline"
                onClick={loadSyncStats}
                className="mx-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
          </Button>
        </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-600 mt-2">Cargando estadísticas...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón de sincronización */}
      <Card className="bg-white rounded-2xl shadow-lg border border-slate-200/50">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Sincronizar Pagos
              </h3>
              <p className="text-slate-600">
                {syncStats && syncStats.totalPayments === 0 
                  ? "Busca pagos pendientes en MercadoPago para sincronizar con este dashboard"
                  : "Sincroniza automáticamente los pagos realizados en MercadoPago con este dashboard"
                }
              </p>
            </div>
            
            <Button
              size="lg"
              onClick={handleSync}
              disabled={isSyncing || connectionStatus === 'disconnected'}
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:to-red-600 shadow-lg text-white font-medium px-8"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Pagos'}
            </Button>
            
            {connectionStatus === 'disconnected' && (
              <p className="text-sm text-red-600">
                No se puede sincronizar sin conexión a MercadoPago
              </p>
            )}
        </div>
      </CardContent>
    </Card>

      {/* Resultado de la última sincronización */}
      {lastSyncResult && (
        <Card className={`bg-white rounded-2xl shadow-lg border ${
          lastSyncResult.success ? 'border-green-200' : 'border-red-200'
        }`}>
          <CardHeader className="pb-4">
            <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${
              lastSyncResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {lastSyncResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Resultado de la Sincronización
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 rounded-lg ${
              lastSyncResult.success ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <p className={`font-medium ${
                lastSyncResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {lastSyncResult.message}
              </p>
              
              {lastSyncResult.syncedPayments > 0 && (
                <p className="text-green-700 mt-2">
                  ✅ {lastSyncResult.syncedPayments} pagos sincronizados exitosamente
                </p>
              )}
              
              {lastSyncResult.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-red-700 font-medium mb-2">Errores encontrados:</p>
                  <ul className="text-red-600 text-sm space-y-1">
                    {lastSyncResult.errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="text-sm text-slate-600">
              <span className="font-medium">Timestamp:</span> {new Date().toLocaleString('es-ES')}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
