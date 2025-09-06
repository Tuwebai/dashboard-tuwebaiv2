import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Key, 
  Database, 
  Globe,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export const DiagnosticPanel: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);

    const results: DiagnosticResult[] = [];

    // 1. Verificar API Key de Gemini
    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!apiKey || apiKey.trim() === '') {
        results.push({
          test: 'API Key de Gemini',
          status: 'error',
          message: 'API key no configurada',
          details: 'Agrega REACT_APP_GEMINI_API_KEY a tu archivo .env'
        });
      } else if (apiKey.length < 20) {
        results.push({
          test: 'API Key de Gemini',
          status: 'warning',
          message: 'API key parece inválida',
          details: 'La API key debe tener al menos 20 caracteres'
        });
      } else {
        results.push({
          test: 'API Key de Gemini',
          status: 'success',
          message: 'API key configurada correctamente',
          details: `Longitud: ${apiKey.length} caracteres`
        });
      }
    } catch (error) {
      results.push({
        test: 'API Key de Gemini',
        status: 'error',
        message: 'Error verificando API key',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }

    // 2. Verificar conexión a Supabase
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) {
        results.push({
          test: 'Conexión a Supabase',
          status: 'error',
          message: 'Error conectando a Supabase',
          details: error.message
        });
      } else {
        results.push({
          test: 'Conexión a Supabase',
          status: 'success',
          message: 'Conexión a Supabase exitosa',
          details: 'Base de datos accesible'
        });
      }
    } catch (error) {
      results.push({
        test: 'Conexión a Supabase',
        status: 'error',
        message: 'Error de conexión a Supabase',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }

    // 3. Verificar tablas de Websy AI
    try {
      const { data: chatHistory, error: chatError } = await supabase
        .from('chat_history')
        .select('count')
        .limit(1);
      
      if (chatError) {
        results.push({
          test: 'Tabla chat_history',
          status: 'error',
          message: 'Tabla chat_history no existe',
          details: 'Ejecuta el script SQL/create_websy_ai_tables.sql'
        });
      } else {
        results.push({
          test: 'Tabla chat_history',
          status: 'success',
          message: 'Tabla chat_history existe',
          details: 'Tabla creada correctamente'
        });
      }
    } catch (error) {
      results.push({
        test: 'Tabla chat_history',
        status: 'error',
        message: 'Error verificando tabla chat_history',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }

    // 4. Verificar tablas de conversaciones
    try {
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('count')
        .limit(1);
      
      if (convError) {
        results.push({
          test: 'Tabla conversations',
          status: 'error',
          message: 'Tabla conversations no existe',
          details: 'Ejecuta el script SQL/create_websy_ai_tables.sql'
        });
      } else {
        results.push({
          test: 'Tabla conversations',
          status: 'success',
          message: 'Tabla conversations existe',
          details: 'Tabla creada correctamente'
        });
      }
    } catch (error) {
      results.push({
        test: 'Tabla conversations',
        status: 'error',
        message: 'Error verificando tabla conversations',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }

    // 5. Verificar tablas de mensajes
    try {
      const { data: messages, error: msgError } = await supabase
        .from('conversation_messages')
        .select('count')
        .limit(1);
      
      if (msgError) {
        results.push({
          test: 'Tabla conversation_messages',
          status: 'error',
          message: 'Tabla conversation_messages no existe',
          details: 'Ejecuta el script SQL/create_websy_ai_tables.sql'
        });
      } else {
        results.push({
          test: 'Tabla conversation_messages',
          status: 'success',
          message: 'Tabla conversation_messages existe',
          details: 'Tabla creada correctamente'
        });
      }
    } catch (error) {
      results.push({
        test: 'Tabla conversation_messages',
        status: 'error',
        message: 'Error verificando tabla conversation_messages',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }

    // 6. Verificar tablas de configuración
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('ai_settings')
        .select('count')
        .limit(1);
      
      if (settingsError) {
        results.push({
          test: 'Tabla ai_settings',
          status: 'error',
          message: 'Tabla ai_settings no existe',
          details: 'Ejecuta el script SQL/create_websy_ai_tables.sql'
        });
      } else {
        results.push({
          test: 'Tabla ai_settings',
          status: 'success',
          message: 'Tabla ai_settings existe',
          details: 'Tabla creada correctamente'
        });
      }
    } catch (error) {
      results.push({
        test: 'Tabla ai_settings',
        status: 'error',
        message: 'Error verificando tabla ai_settings',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }

    // 7. Verificar conectividad a Gemini API
    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (apiKey && apiKey.length > 20) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (response.ok) {
          results.push({
            test: 'Conectividad a Gemini API',
            status: 'success',
            message: 'Conexión a Gemini API exitosa',
            details: 'API accesible y funcionando'
          });
        } else {
          results.push({
            test: 'Conectividad a Gemini API',
            status: 'error',
            message: 'Error conectando a Gemini API',
            details: `Status: ${response.status} ${response.statusText}`
          });
        }
      } else {
        results.push({
          test: 'Conectividad a Gemini API',
          status: 'warning',
          message: 'No se puede probar conectividad',
          details: 'API key no configurada o inválida'
        });
      }
    } catch (error) {
      results.push({
        test: 'Conectividad a Gemini API',
        status: 'error',
        message: 'Error de conectividad a Gemini API',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">OK</Badge>;
      case 'error':
        return <Badge variant="destructive">ERROR</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500">WARNING</Badge>;
      default:
        return <Badge variant="outline">UNKNOWN</Badge>;
    }
  };

  const successCount = diagnostics.filter(d => d.status === 'success').length;
  const errorCount = diagnostics.filter(d => d.status === 'error').length;
  const warningCount = diagnostics.filter(d => d.status === 'warning').length;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="h-4 w-4" />
            Diagnóstico del Sistema
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnostics}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            {isRunning ? 'Verificando...' : 'Verificar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-lg font-bold text-green-600">{successCount}</div>
            <div className="text-xs text-green-600">Exitosos</div>
          </div>
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-lg font-bold text-yellow-600">{warningCount}</div>
            <div className="text-xs text-yellow-600">Advertencias</div>
          </div>
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-lg font-bold text-red-600">{errorCount}</div>
            <div className="text-xs text-red-600">Errores</div>
          </div>
        </div>

        {/* Resultados */}
        <div className="space-y-2">
          {diagnostics.map((diagnostic, index) => (
            <Alert key={index} className="p-3">
              <div className="flex items-start gap-3">
                {getStatusIcon(diagnostic.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{diagnostic.test}</span>
                    {getStatusBadge(diagnostic.status)}
                  </div>
                  <AlertDescription className="text-xs">
                    {diagnostic.message}
                  </AlertDescription>
                  {diagnostic.details && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {diagnostic.details}
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          ))}
        </div>

        {/* Recomendaciones */}
        {errorCount > 0 && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-sm">
              <strong>Acción requerida:</strong> Hay {errorCount} error(es) que deben solucionarse antes de que Websy AI funcione correctamente.
            </AlertDescription>
          </Alert>
        )}

        {warningCount > 0 && errorCount === 0 && (
          <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-sm">
              <strong>Advertencia:</strong> Hay {warningCount} advertencia(s) que podrían afectar el funcionamiento.
            </AlertDescription>
          </Alert>
        )}

        {successCount === diagnostics.length && diagnostics.length > 0 && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-sm">
              <strong>¡Excelente!</strong> Todos los sistemas están funcionando correctamente.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
