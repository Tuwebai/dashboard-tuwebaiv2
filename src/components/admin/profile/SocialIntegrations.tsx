import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitHubIntegration } from './GitHubIntegration';
// import { LinkedInIntegration } from './LinkedInIntegration'; // Comentado temporalmente
import { Users, Settings, Shield } from 'lucide-react';

export const SocialIntegrations: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Users className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Integraciones Sociales</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Conecta tus perfiles de GitHub y LinkedIn para mostrar tu actividad profesional 
          y mantener tu perfil actualizado automáticamente.
        </p>
      </div>

      {/* Información de privacidad */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
            <Shield className="w-5 h-5" />
            <span>Privacidad y Seguridad</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
            <p>• Tus tokens de acceso se almacenan de forma encriptada en tu navegador</p>
            <p>• Solo tienes acceso a tus propios datos</p>
            <p>• Puedes desconectar las integraciones en cualquier momento</p>
            <p>• Los datos se actualizan automáticamente cada 30 minutos</p>
          </div>
        </CardContent>
      </Card>

      {/* Configuración requerida */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
            <Settings className="w-5 h-5" />
            <span>Configuración Requerida</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
              <div>
                <p className="font-medium">Para usar la integración de GitHub, necesitas configurar:</p>
              </div>
              <div className="space-y-2">
                <div className="space-y-1">
                  <p className="font-medium">GitHub OAuth App:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>VITE_GITHUB_CLIENT_ID</li>
                    <li>VITE_GITHUB_CLIENT_SECRET</li>
                    <li>VITE_ENCRYPTION_KEY (opcional, se genera automáticamente)</li>
                  </ul>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs font-medium mb-1">LinkedIn:</p>
                  <p className="text-xs">La integración de LinkedIn estará disponible próximamente.</p>
                </div>
              </div>
              <p className="text-xs mt-2">
                Consulta la documentación para obtener más información sobre cómo configurar la aplicación OAuth de GitHub.
              </p>
            </div>
        </CardContent>
      </Card>

      {/* Integraciones */}
      <div className="grid lg:grid-cols-2 gap-6">
        <GitHubIntegration />
        
        {/* LinkedIn - Próximamente */}
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-muted-foreground">
              <div className="w-5 h-5 bg-muted-foreground/25 rounded flex items-center justify-center">
                💼
              </div>
              <span>LinkedIn</span>
              <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200 px-2 py-1 rounded-full">
                Próximamente
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-muted-foreground/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">🚧</span>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground mb-2">
                  Integración de LinkedIn en desarrollo
                </h3>
                <p className="text-sm text-muted-foreground">
                  Estamos trabajando en la integración con LinkedIn para mostrar tu perfil profesional, 
                  experiencia laboral y conexiones.
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                Funcionalidades planificadas:
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <span>✓</span>
                  <span>Perfil profesional</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>✓</span>
                  <span>Experiencia laboral</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>✓</span>
                  <span>Habilidades</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>✓</span>
                  <span>Posts recientes</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer informativo */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="font-medium">¿Necesitas ayuda?</h3>
            <p className="text-sm text-muted-foreground">
              Si tienes problemas con las integraciones, revisa la configuración de OAuth 
              o contacta al administrador del sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
