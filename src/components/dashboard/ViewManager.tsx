import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/Form';
import { DashboardView, Widget } from './DashboardGrid';
import { Save, Eye, Edit, Trash2, Copy, Star, Users, Calendar } from 'lucide-react';

export interface ViewManagerProps {
  views: DashboardView[];
  currentView?: DashboardView;
  userRole?: string;
  onSaveView: (view: DashboardView) => void;
  onLoadView: (viewId: string) => void;
  onDeleteView: (viewId: string) => void;
  onDuplicateView: (viewId: string) => void;
  onSetDefaultView: (viewId: string) => void;
  className?: string;
}

const ViewManager: React.FC<ViewManagerProps> = ({
  views,
  currentView,
  userRole,
  onSaveView,
  onLoadView,
  onDeleteView,
  onDuplicateView,
  onSetDefaultView,
  className
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingView, setEditingView] = useState<DashboardView | null>(null);
  const [newViewName, setNewViewName] = useState('');
  const [newViewDescription, setNewViewDescription] = useState('');
  const [newViewRole, setNewViewRole] = useState('');

  // Filter views by role
  const filteredViews = views.filter(view => 
    !view.role || view.role === userRole || userRole === 'admin'
  );

  const handleSaveNewView = () => {
    if (!newViewName.trim()) return;

    const newView: DashboardView = {
      id: `view-${Date.now()}`,
      name: newViewName,
      description: newViewDescription,
      widgets: currentView?.widgets || [],
      role: newViewRole || userRole,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onSaveView(newView);
    setShowSaveDialog(false);
    setNewViewName('');
    setNewViewDescription('');
    setNewViewRole('');
  };

  const handleEditView = (view: DashboardView) => {
    setEditingView(view);
    setNewViewName(view.name);
    setNewViewDescription(view.description || '');
    setNewViewRole(view.role || '');
    setShowEditDialog(true);
  };

  const handleUpdateView = () => {
    if (!editingView || !newViewName.trim()) return;

    const updatedView: DashboardView = {
      ...editingView,
      name: newViewName,
      description: newViewDescription,
      role: newViewRole || userRole,
      updatedAt: new Date()
    };

    onSaveView(updatedView);
    setShowEditDialog(false);
    setEditingView(null);
    setNewViewName('');
    setNewViewDescription('');
    setNewViewRole('');
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getRoleBadge = (role?: string) => {
    if (!role) return null;
    
    const roleColors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800',
      guest: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    );
  };

  return (
    <div className={className}>
      {/* Save New View Dialog */}
      {showSaveDialog && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Guardar Vista Actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Nombre de la vista"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="Mi vista personalizada"
                validationRules={{ required: true }}
              />
              <FormField
                label="Descripción"
                value={newViewDescription}
                onChange={(e) => setNewViewDescription(e.target.value)}
                placeholder="Descripción de esta vista..."
                multiline
                rows={3}
              />
              <div>
                <label className="block text-sm font-medium mb-1">Rol (opcional)</label>
                <select
                  value={newViewRole}
                  onChange={(e) => setNewViewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Todos los roles</option>
                  <option value="admin">Administrador</option>
                  <option value="manager">Gerente</option>
                  <option value="user">Usuario</option>
                  <option value="guest">Invitado</option>
                </select>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveNewView} disabled={!newViewName.trim()}>
                Guardar Vista
              </Button>
            </CardFooter>
          </Card>
        </Card>
      )}

      {/* Edit View Dialog */}
      {showEditDialog && editingView && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Editar Vista</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Nombre de la vista"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="Mi vista personalizada"
                validationRules={{ required: true }}
              />
              <FormField
                label="Descripción"
                value={newViewDescription}
                onChange={(e) => setNewViewDescription(e.target.value)}
                placeholder="Descripción de esta vista..."
                multiline
                rows={3}
              />
              <div>
                <label className="block text-sm font-medium mb-1">Rol</label>
                <select
                  value={newViewRole}
                  onChange={(e) => setNewViewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Todos los roles</option>
                  <option value="admin">Administrador</option>
                  <option value="manager">Gerente</option>
                  <option value="user">Usuario</option>
                  <option value="guest">Invitado</option>
                </select>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateView} disabled={!newViewName.trim()}>
                Actualizar Vista
              </Button>
            </CardFooter>
          </Card>
        </Card>
      )}

      {/* Views List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Vistas Guardadas</h3>
          <Button
            onClick={() => setShowSaveDialog(true)}
            leftIcon={<Save className="h-4 w-4" />}
            size="sm"
          >
            Nueva Vista
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredViews.map(view => (
            <Card
              key={view.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                currentView?.id === view.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onLoadView(view.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {view.name}
                      {view.isDefault && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                    </CardTitle>
                    {view.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {view.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditView(view);
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Editar vista"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateView(view.id);
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Duplicar vista"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteView(view.id);
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Eliminar vista"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>{view.widgets.length} widgets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {getRoleBadge(view.role)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Actualizado {formatDate(view.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadView(view.id);
                    }}
                    className="flex-1"
                  >
                    Cargar
                  </Button>
                  {!view.isDefault && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetDefaultView(view.id);
                      }}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredViews.length === 0 && (
          <Card className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No hay vistas guardadas</h3>
              <p className="text-muted-foreground mb-4">
                Guarda tu primera vista personalizada para comenzar.
              </p>
              <Button onClick={() => setShowSaveDialog(true)}>
                Crear Primera Vista
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export { ViewManager };
