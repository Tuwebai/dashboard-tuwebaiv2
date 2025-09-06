import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'loading';
  message: string;
  data?: any;
}

export const ConnectionTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    const tests: TestResult[] = [];

    // Test 1: Conexión básica a Supabase
    tests.push({
      test: 'Conexión a Supabase',
      status: 'loading',
      message: 'Probando conexión...'
    });
    setResults([...tests]);

    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) {
        tests[0] = {
          test: 'Conexión a Supabase',
          status: 'error',
          message: `Error: ${error.message}`
        };
      } else {
        tests[0] = {
          test: 'Conexión a Supabase',
          status: 'success',
          message: 'Conexión exitosa'
        };
      }
    } catch (error) {
      tests[0] = {
        test: 'Conexión a Supabase',
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Desconocido'}`
      };
    }
    setResults([...tests]);

    // Test 2: Consulta de usuarios
    tests.push({
      test: 'Consulta de usuarios',
      status: 'loading',
      message: 'Probando consulta de usuarios...'
    });
    setResults([...tests]);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, role, created_at')
        .limit(5);
      
      if (error) {
        tests[1] = {
          test: 'Consulta de usuarios',
          status: 'error',
          message: `Error: ${error.message}`,
          data: error
        };
      } else {
        tests[1] = {
          test: 'Consulta de usuarios',
          status: 'success',
          message: `Usuarios obtenidos: ${data?.length || 0}`,
          data: data
        };
      }
    } catch (error) {
      tests[1] = {
        test: 'Consulta de usuarios',
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Desconocido'}`
      };
    }
    setResults([...tests]);

    // Test 3: Consulta de proyectos
    tests.push({
      test: 'Consulta de proyectos',
      status: 'loading',
      message: 'Probando consulta de proyectos...'
    });
    setResults([...tests]);

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, created_at')
        .limit(5);
      
      if (error) {
        tests[2] = {
          test: 'Consulta de proyectos',
          status: 'error',
          message: `Error: ${error.message}`,
          data: error
        };
      } else {
        tests[2] = {
          test: 'Consulta de proyectos',
          status: 'success',
          message: `Proyectos obtenidos: ${data?.length || 0}`,
          data: data
        };
      }
    } catch (error) {
      tests[2] = {
        test: 'Consulta de proyectos',
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Desconocido'}`
      };
    }
    setResults([...tests]);

    // Test 4: Consulta de tickets
    tests.push({
      test: 'Consulta de tickets',
      status: 'loading',
      message: 'Probando consulta de tickets...'
    });
    setResults([...tests]);

    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, title, created_at')
        .limit(5);
      
      if (error) {
        tests[3] = {
          test: 'Consulta de tickets',
          status: 'error',
          message: `Error: ${error.message}`,
          data: error
        };
      } else {
        tests[3] = {
          test: 'Consulta de tickets',
          status: 'success',
          message: `Tickets obtenidos: ${data?.length || 0}`,
          data: data
        };
      }
    } catch (error) {
      tests[3] = {
        test: 'Consulta de tickets',
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Desconocido'}`
      };
    }
    setResults([...tests]);

    // Test 5: Consulta de ai_settings
    tests.push({
      test: 'Consulta de ai_settings',
      status: 'loading',
      message: 'Probando consulta de ai_settings...'
    });
    setResults([...tests]);

    try {
      const { data, error } = await supabase
        .from('ai_settings')
        .select('id, user_id, settings, created_at')
        .limit(5);
      
      if (error) {
        tests[4] = {
          test: 'Consulta de ai_settings',
          status: 'error',
          message: `Error: ${error.message}`,
          data: error
        };
      } else {
        tests[4] = {
          test: 'Consulta de ai_settings',
          status: 'success',
          message: `Configuraciones obtenidas: ${data?.length || 0}`,
          data: data
        };
      }
    } catch (error) {
      tests[4] = {
        test: 'Consulta de ai_settings',
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Desconocido'}`
      };
    }
    setResults([...tests]);

    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">OK</Badge>;
      case 'error':
        return <Badge variant="destructive">ERROR</Badge>;
      case 'loading':
        return <Badge variant="secondary" className="bg-blue-500">CARGANDO</Badge>;
      default:
        return <Badge variant="outline">UNKNOWN</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Prueba de Conectividad</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={runTests}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            {isRunning ? 'Probando...' : 'Probar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {results.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            <p>Haz clic en "Probar" para verificar la conectividad</p>
          </div>
        ) : (
          results.map((result, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(result.status)}
                <span className="text-sm font-medium">{result.test}</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(result.status)}
                <span className="text-xs text-muted-foreground">
                  {result.message}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
