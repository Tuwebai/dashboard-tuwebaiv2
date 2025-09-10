import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitHubIntegration } from './GitHubIntegration';
// import { LinkedInIntegration } from './LinkedInIntegration'; // Comentado temporalmente
import { Users } from 'lucide-react';

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
