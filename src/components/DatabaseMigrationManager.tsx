import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Key, 
  Search, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  RefreshCw,
  FileText,
  Shield,
  BarChart3,
  Settings
} from 'lucide-react';
import { databaseMigrations, MigrationResult } from '@/lib/databaseMigrations';
import { toast } from '@/hooks/use-toast';

interface DatabaseStatus {
  foreignKeys: any[];
  indexes: any[];
  triggers: any[];
  functions: any[];
}

export default function DatabaseMigrationManager() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    indexes: MigrationResult[];
    triggers: MigrationResult[];
    helperFunctions: MigrationResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  } | null>(null);
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Verificar estado actual de la base de datos
  const checkDatabaseStatus = async () => {
    try {
      const status = await databaseMigrations.checkDatabaseStatus();
      setDatabaseStatus(status);
    } catch (error) {
      console.error('Error verificando estado de la base de datos:', error);
      toast({
        title: 'Error',
        description: 'No se pudo verificar el estado de la base de datos',
        variant: 'destructive'
      });
    }
  };

  // Ejecutar todas las migraciones
  const runMigrations = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults(null);

    try {
      setCurrentStep('Iniciando migraciones...');
      setProgress(10);

      setCurrentStep('Creando foreign keys...');
      setProgress(20);

      setCurrentStep('Creando indexes...');
      setProgress(40);

      setCurrentStep('Creando funciones auxiliares...');
      setProgress(60);

      setCurrentStep('Creando triggers...');
      setProgress(80);

      setCurrentStep('Finalizando migraciones...');
      setProgress(90);

      const migrationResults = await databaseMigrations.runAllMigrations();
      setResults(migrationResults);
      setProgress(100);

      setCurrentStep('Migraciones completadas');
      
      toast({
        title: 'Migraciones completadas',
        description: `${migrationResults.summary.successful} exitosas, ${migrationResults.summary.failed} fallidas`,
        variant: migrationResults.summary.failed === 0 ? 'default' : 'destructive'
      });

      // Actualizar estado de la base de datos
      await checkDatabaseStatus();

    } catch (error) {
      console.error('Error ejecutando migraciones:', error);
      toast({
        title: 'Error en migraciones',
        description: 'Ocurrió un error durante la ejecución de las migraciones',
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
      setCurrentStep('');
      setProgress(0);
    }
  };

  // Ejecutar migraciones específicas
  const runSpecificMigration = async (type: 'indexes' | 'triggers' | 'helperFunctions') => {
    setIsRunning(true);
    setCurrentStep(`Ejecutando migración de ${type}...`);

    try {
      let results: MigrationResult[] = [];

      switch (type) {
        case 'indexes':
          results = await databaseMigrations.createIndexes();
          break;
        case 'triggers':
          results = await databaseMigrations.createTriggers();
          break;
        case 'helperFunctions':
          results = await databaseMigrations.createHelperFunctions();
          break;
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      toast({
        title: `Migración de ${type} completada`,
        description: `${successful} exitosas, ${failed} fallidas`,
        variant: failed === 0 ? 'default' : 'destructive'
      });

      // Actualizar estado
      await checkDatabaseStatus();

    } catch (error) {
      console.error(`Error ejecutando migración de ${type}:`, error);
      toast({
        title: 'Error en migración',
        description: `Ocurrió un error durante la migración de ${type}`,
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
      setCurrentStep('');
    }
  };

  // Cargar estado inicial
  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const getStatusColor = (type: string) => {
    if (!databaseStatus) return 'bg-gray-100 text-gray-800';
    
    const count = databaseStatus[type as keyof DatabaseStatus]?.length || 0;
    if (count === 0) return 'bg-red-100 text-red-800';
    if (count < 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusIcon = (type: string) => {
    if (!databaseStatus) return <Database className="h-4 w-4" />;
    
    const count = databaseStatus[type as keyof DatabaseStatus]?.length || 0;
    if (count === 0) return <AlertCircle className="h-4 w-4" />;
    if (count < 5) return <AlertCircle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestor de Migraciones de Base de Datos</h1>
          <p className="text-gray-600 mt-2">
            Gestiona la estructura y optimización de la base de datos de TuWebAI
          </p>
        </div>
        <Button
          onClick={checkDatabaseStatus}
          variant="outline"
          disabled={isRunning}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar Estado
        </Button>
      </div>

      {/* Estado actual */}
      {databaseStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Foreign Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon('foreignKeys')}
                <Badge variant="outline" className={getStatusColor('foreignKeys')}>
                  {databaseStatus.foreignKeys.length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Indexes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon('indexes')}
                <Badge variant="outline" className={getStatusColor('indexes')}>
                  {databaseStatus.indexes.length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Triggers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon('triggers')}
                <Badge variant="outline" className={getStatusColor('triggers')}>
                  {databaseStatus.triggers.length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Funciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon('functions')}
                <Badge variant="outline" className={getStatusColor('functions')}>
                  {databaseStatus.functions.length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progreso de migración */}
      {isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Ejecutando migraciones...</span>
            </CardTitle>
            <CardDescription>{currentStep}</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="w-full" />
          </CardContent>
        </Card>
      )}

      {/* Tabs de migraciones */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="indexes">Indexes</TabsTrigger>
          <TabsTrigger value="triggers">Triggers</TabsTrigger>
          <TabsTrigger value="functions">Funciones</TabsTrigger>
        </TabsList>

        {/* Resumen */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Acciones de Migración</CardTitle>
              <CardDescription>
                Ejecuta migraciones completas o específicas según tus necesidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={runMigrations}
                  disabled={isRunning}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Ejecutar Todas las Migraciones
                </Button>
                
                <Button
                  onClick={() => runSpecificMigration('indexes')}
                  disabled={isRunning}
                  variant="outline"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Solo Indexes
                </Button>
                
                <Button
                  onClick={() => runSpecificMigration('triggers')}
                  disabled={isRunning}
                  variant="outline"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Solo Triggers
                </Button>
                
                <Button
                  onClick={() => runSpecificMigration('helperFunctions')}
                  disabled={isRunning}
                  variant="outline"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Solo Funciones
                </Button>
              </div>

              {results && (
                <Alert>
                  <BarChart3 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Resumen de migraciones:</strong><br />
                    Total: {results.summary.total} | 
                    Exitosas: {results.summary.successful} | 
                    Fallidas: {results.summary.failed}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Indexes */}
        <TabsContent value="indexes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Indexes</CardTitle>
              <CardDescription>
                Optimizaciones para consultas frecuentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {databaseStatus?.indexes.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No se encontraron indexes. Ejecuta las migraciones para crearlos.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {databaseStatus?.indexes.map((idx, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-mono">{idx.indexname}</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Activo
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Triggers */}
        <TabsContent value="triggers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Triggers</CardTitle>
              <CardDescription>
                Automatización para mantener consistencia de datos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {databaseStatus?.triggers.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No se encontraron triggers. Ejecuta las migraciones para crearlos.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {databaseStatus?.triggers.map((trg, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-mono">{trg.trigger_name}</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Activo
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Funciones */}
        <TabsContent value="functions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Funciones Auxiliares</CardTitle>
              <CardDescription>
                Funciones PostgreSQL para lógica de negocio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {databaseStatus?.functions.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No se encontraron funciones. Ejecuta las migraciones para crearlas.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {databaseStatus?.functions.map((func, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-mono">{func.routine_name}</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Activo
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resultados detallados */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados Detallados de Migraciones</CardTitle>
            <CardDescription>
              Revisa el estado de cada migración ejecutada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="indexes" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="indexes">Indexes</TabsTrigger>
                <TabsTrigger value="triggers">Triggers</TabsTrigger>
                <TabsTrigger value="functions">Funciones</TabsTrigger>
              </TabsList>

              <TabsContent value="indexes">
                <div className="space-y-2">
                  {results.indexes.map((result, index) => (
                    <div key={index} className={`p-3 rounded-lg ${
                      result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={result.success ? 'text-green-800' : 'text-red-800'}>
                          {result.message}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="triggers">
                <div className="space-y-2">
                  {results.triggers.map((result, index) => (
                    <div key={index} className={`p-3 rounded-lg ${
                      result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={result.success ? 'text-green-800' : 'text-red-800'}>
                          {result.message}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="functions">
                <div className="space-y-2">
                  {results.helperFunctions.map((result, index) => (
                    <div key={index} className={`p-3 rounded-lg ${
                      result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={result.success ? 'text-green-800' : 'text-red-800'}>
                          {result.message}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Migraciones</CardTitle>
          <CardDescription>
            Documentación y recursos para las migraciones de base de datos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Script SQL Directo</h4>
              <p className="text-sm text-gray-600">
                Si prefieres ejecutar las migraciones directamente en Supabase, 
                usa el archivo <code className="bg-gray-100 px-1 rounded">database_migrations.sql</code>
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Verificación</h4>
              <p className="text-sm text-gray-600">
                Después de ejecutar las migraciones, verifica el estado 
                usando el botón "Actualizar Estado"
              </p>
            </div>
          </div>
          
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Las migraciones se ejecutan en tu base de datos de Supabase. 
              Asegúrate de tener una copia de seguridad antes de proceder.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
