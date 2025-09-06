import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  Users, 
  FolderOpen, 
  Ticket, 
  TrendingUp,
  RefreshCw,
  Info
} from 'lucide-react';

interface ContextData {
  projects: any[];
  users: any[];
  tickets: any[];
  timestamp: string;
}

interface ContextPanelProps {
  contextData: ContextData | null;
  onRefresh: () => void;
  loading?: boolean;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  contextData,
  onRefresh,
  loading = false
}) => {
  if (!contextData) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="h-4 w-4" />
            Contexto de Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground text-sm">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay datos disponibles</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="mt-2"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Cargar Datos
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = {
    totalProjects: contextData.projects.length,
    activeProjects: contextData.projects.filter(p => p.status === 'in_progress').length,
    completedProjects: contextData.projects.filter(p => p.status === 'completed').length,
    totalUsers: contextData.users.length,
    adminUsers: contextData.users.filter(u => u.role === 'admin').length,
    clientUsers: contextData.users.filter(u => u.role === 'cliente').length,
    totalTickets: contextData.tickets.length,
    openTickets: contextData.tickets.filter(t => t.status !== 'closed').length,
    urgentTickets: contextData.tickets.filter(t => t.priority === 'high' && t.status !== 'closed').length
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Contexto de Datos
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Proyectos */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Proyectos</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <Badge variant="secondary" className="text-xs">
                  {stats.totalProjects}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Activos:</span>
                <Badge variant="default" className="text-xs">
                  {stats.activeProjects}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completados:</span>
                <Badge variant="outline" className="text-xs">
                  {stats.completedProjects}
                </Badge>
              </div>
            </div>
          </div>

          {/* Usuarios */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Usuarios</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <Badge variant="secondary" className="text-xs">
                  {stats.totalUsers}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Admins:</span>
                <Badge variant="destructive" className="text-xs">
                  {stats.adminUsers}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Clientes:</span>
                <Badge variant="outline" className="text-xs">
                  {stats.clientUsers}
                </Badge>
              </div>
            </div>
          </div>

          {/* Tickets */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Ticket className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Tickets</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <Badge variant="secondary" className="text-xs">
                  {stats.totalTickets}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Abiertos:</span>
                <Badge variant="default" className="text-xs">
                  {stats.openTickets}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Urgentes:</span>
                <Badge variant="destructive" className="text-xs">
                  {stats.urgentTickets}
                </Badge>
              </div>
            </div>
          </div>

          {/* Última actualización */}
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Actualizado: {formatDate(contextData.timestamp)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sugerencias de consultas */}
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Consultas Sugeridas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• "Analiza los proyectos actuales"</p>
            <p>• "¿Qué desarrollador está menos ocupado?"</p>
            <p>• "Muestra métricas de esta semana"</p>
            <p>• "Revisa tickets urgentes"</p>
            <p>• "Genera reporte de progreso"</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
