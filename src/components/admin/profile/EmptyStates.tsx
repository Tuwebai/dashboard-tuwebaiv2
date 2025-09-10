import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Github, 
  Linkedin, 
  RefreshCw, 
  AlertCircle, 
  WifiOff,
  Database,
  UserX,
  Code2,
  Briefcase
} from 'lucide-react';

interface EmptyStateProps {
  type: 'github' | 'linkedin' | 'no-data' | 'error' | 'offline';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  action,
  icon
}) => {
  const getDefaultIcon = () => {
    switch (type) {
      case 'github':
        return <Github className="w-12 h-12 text-muted-foreground" />;
      case 'linkedin':
        return <Linkedin className="w-12 h-12 text-muted-foreground" />;
      case 'no-data':
        return <Database className="w-12 h-12 text-muted-foreground" />;
      case 'error':
        return <AlertCircle className="w-12 h-12 text-red-500" />;
      case 'offline':
        return <WifiOff className="w-12 h-12 text-muted-foreground" />;
      default:
        return <UserX className="w-12 h-12 text-muted-foreground" />;
    }
  };

  return (
    <Card className="border-dashed border-2 border-muted-foreground/25">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4">
          {icon || getDefaultIcon()}
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
        {action && (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Empty states específicos para GitHub
export const GitHubEmptyStates = {
  noConnection: (onConnect?: () => void) => (
    <EmptyState
      type="github"
      title="No conectado a GitHub"
      description="Conecta tu cuenta de GitHub para ver tus repositorios, estadísticas de contribuciones y actividad de desarrollo."
      action={onConnect ? {
        label: "Conectar con GitHub",
        onClick: onConnect
      } : undefined}
    />
  ),
  noRepos: () => (
    <EmptyState
      type="github"
      title="No hay repositorios"
      description="No se encontraron repositorios públicos en tu cuenta de GitHub. Crea tu primer repositorio para comenzar."
      action={{
        label: "Ver en GitHub",
        onClick: () => window.open('https://github.com/new', '_blank')
      }}
    />
  ),
  noStats: () => (
    <EmptyState
      type="github"
      title="Sin estadísticas"
      description="No hay suficientes datos para mostrar estadísticas de contribuciones. Haz algunos commits para ver tu actividad."
      icon={<Code2 className="w-12 h-12 text-muted-foreground" />}
    />
  ),
  error: (error: string, onRetry: () => void) => (
    <EmptyState
      type="error"
      title="Error al cargar datos de GitHub"
      description={`No se pudieron cargar los datos: ${error}`}
      action={{
        label: "Reintentar",
        onClick: onRetry
      }}
    />
  )
};

// Empty states específicos para LinkedIn
export const LinkedInEmptyStates = {
  noConnection: () => (
    <EmptyState
      type="linkedin"
      title="No conectado a LinkedIn"
      description="Conecta tu cuenta de LinkedIn para mostrar tu perfil profesional, experiencia laboral y habilidades."
      action={{
        label: "Conectar con LinkedIn",
        onClick: () => {} // Se pasará desde el componente padre
      }}
    />
  ),
  noExperience: () => (
    <EmptyState
      type="linkedin"
      title="Sin experiencia laboral"
      description="No se encontró información de experiencia laboral en tu perfil de LinkedIn. Actualiza tu perfil para mostrar tu experiencia."
      action={{
        label: "Ver perfil en LinkedIn",
        onClick: () => window.open('https://linkedin.com/in/me', '_blank')
      }}
    />
  ),
  noSkills: () => (
    <EmptyState
      type="linkedin"
      title="Sin habilidades"
      description="No se encontraron habilidades en tu perfil de LinkedIn. Agrega tus habilidades principales para mostrarlas aquí."
      action={{
        label: "Editar perfil",
        onClick: () => window.open('https://linkedin.com/in/me', '_blank')
      }}
    />
  ),
  error: (error: string, onRetry: () => void) => (
    <EmptyState
      type="error"
      title="Error al cargar datos de LinkedIn"
      description={`No se pudieron cargar los datos: ${error}`}
      action={{
        label: "Reintentar",
        onClick: onRetry
      }}
    />
  )
};

// Empty states generales
export const GeneralEmptyStates = {
  offline: () => (
    <EmptyState
      type="offline"
      title="Sin conexión a internet"
      description="Verifica tu conexión a internet para cargar los datos de las integraciones sociales."
      action={{
        label: "Reintentar",
        onClick: () => window.location.reload()
      }}
    />
  ),
  noData: (type: string) => (
    <EmptyState
      type="no-data"
      title={`Sin datos de ${type}`}
      description={`No hay datos disponibles para mostrar en este momento. Intenta actualizar la página.`}
      action={{
        label: "Actualizar",
        onClick: () => window.location.reload()
      }}
    />
  )
};
