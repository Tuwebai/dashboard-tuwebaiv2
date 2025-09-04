import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trash2, 
  RefreshCw, 
  Database, 
  Memory, 
  Clock, 
  Tag, 
  BarChart3,
  Settings,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useCache } from '@/lib/cacheManager';
import { toast } from '@/hooks/use-toast';

// =====================================================
// COMPONENTE DE GESTIÓN DE CACHE
// =====================================================

interface CacheManagerProps {
  className?: string;
}

export default function CacheManager({ className = '' }: CacheManagerProps) {
  const cache = useCache();
  const [stats, setStats] = useState(cache.getStats());
  const [autoCleanup, setAutoCleanup] = useState(true);
  const [maxMemoryItems, setMaxMemoryItems] = useState(100);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [isLoading, setIsLoading] = useState(false);

  // Actualizar estadísticas
  const updateStats = () => {
    setStats(cache.getStats());
  };

  // Actualizar estadísticas periódicamente
  useEffect(() => {
    if (!cache.isReady) return;

    updateStats();
    const interval = setInterval(updateStats, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [cache.isReady, refreshInterval]);

  // Limpiar cache expirado automáticamente
  useEffect(() => {
    if (!autoCleanup || !cache.isReady) return;

    const interval = setInterval(() => {
      cache.clearExpired();
      updateStats();
    }, 60000); // Cada minuto

    return () => clearInterval(interval);
  }, [autoCleanup, cache.isReady]);

  // Funciones de gestión
  const handleClearAll = async () => {
    setIsLoading(true);
    try {
      await cache.clear();
      updateStats();
      toast({
        title: "Cache limpiado",
        description: "Se ha eliminado todo el contenido del cache",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo limpiar el cache",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearExpired = async () => {
    setIsLoading(true);
    try {
      await cache.clearExpired();
      updateStats();
      toast({
        title: "Cache expirado limpiado",
        description: "Se han eliminado los elementos expirados",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo limpiar el cache expirado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearByTags = async (tags: string[]) => {
    setIsLoading(true);
    try {
      await cache.clearByTags(tags);
      updateStats();
      toast({
        title: "Cache limpiado por tags",
        description: `Se han eliminado elementos con tags: ${tags.join(', ')}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo limpiar el cache por tags",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCache = () => {
    // Implementar exportación de cache
    toast({
      title: "Exportación",
      description: "Funcionalidad de exportación en desarrollo",
    });
  };

  const handleImportCache = () => {
    // Implementar importación de cache
    toast({
      title: "Importación",
      description: "Funcionalidad de importación en desarrollo",
    });
  };

  // Formatear tamaño
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formatear porcentaje
  const formatPercentage = (value: number): string => {
    return (value * 100).toFixed(1) + '%';
  };

  if (!cache.isReady) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Inicializando cache...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Gestión de Cache</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
            <TabsTrigger value="management">Gestión</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Memory className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Elementos en Cache</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.items}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Tamaño Total</span>
                  </div>
                  <div className="text-2xl font-bold">{formatSize(stats.size)}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Tasa de Aciertos</span>
                  <Badge variant={stats.hitRate > 0.8 ? "default" : stats.hitRate > 0.5 ? "secondary" : "destructive"}>
                    {formatPercentage(stats.hitRate)}
                  </Badge>
                </div>
                <Progress value={stats.hitRate * 100} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Aciertos: {stats.hits}</span>
                  <span>Fallos: {stats.misses}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex space-x-2">
              <Button
                onClick={handleClearExpired}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <Clock className="h-4 w-4 mr-2" />
                Limpiar Expirados
              </Button>
              <Button
                onClick={handleClearAll}
                disabled={isLoading}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar Todo
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Rendimiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Aciertos</span>
                    <span className="font-medium">{stats.hits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Fallos</span>
                    <span className="font-medium">{stats.misses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Tasa de Aciertos</span>
                    <span className="font-medium">{formatPercentage(stats.hitRate)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Almacenamiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Elementos</span>
                    <span className="font-medium">{stats.items}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Tamaño</span>
                    <span className="font-medium">{formatSize(stats.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Promedio por Item</span>
                    <span className="font-medium">
                      {stats.items > 0 ? formatSize(stats.size / stats.items) : '0 B'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="management" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Acciones de Limpieza</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleClearExpired}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Limpiar Elementos Expirados
                  </Button>
                  <Button
                    onClick={() => handleClearByTags(['temp', 'session'])}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Limpiar por Tags (temp, session)
                  </Button>
                  <Button
                    onClick={handleClearAll}
                    disabled={isLoading}
                    variant="destructive"
                    className="w-full justify-start"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar Todo el Cache
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Importar/Exportar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleExportCache}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Cache
                  </Button>
                  <Button
                    onClick={handleImportCache}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Cache
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Configuración Automática</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Limpieza Automática</div>
                      <div className="text-sm text-muted-foreground">
                        Limpiar elementos expirados automáticamente
                      </div>
                    </div>
                    <Switch
                      checked={autoCleanup}
                      onCheckedChange={setAutoCleanup}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Límites de Memoria</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Elementos Máximos en Memoria</span>
                      <span className="text-sm text-muted-foreground">{maxMemoryItems}</span>
                    </div>
                    <Slider
                      value={[maxMemoryItems]}
                      onValueChange={(value) => setMaxMemoryItems(value[0])}
                      max={1000}
                      min={10}
                      step={10}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Actualización de Estadísticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Intervalo de Actualización</span>
                      <span className="text-sm text-muted-foreground">{refreshInterval}s</span>
                    </div>
                    <Slider
                      value={[refreshInterval]}
                      onValueChange={(value) => setRefreshInterval(value[0])}
                      max={300}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}