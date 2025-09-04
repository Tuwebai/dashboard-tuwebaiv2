import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DraggableWidget, Widget } from './DraggableWidget';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Save, Eye, Settings, Plus, Grid3X3 } from 'lucide-react';

export interface DashboardView {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  isDefault?: boolean;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardGridProps {
  initialWidgets?: Widget[];
  userRole?: string;
  onSaveView?: (view: DashboardView) => void;
  onLoadView?: (viewId: string) => void;
  savedViews?: DashboardView[];
}

const DashboardGrid: React.FC<DashboardGridProps> = ({
  initialWidgets = [],
  userRole,
  onSaveView,
  onLoadView,
  savedViews = []
}) => {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [newViewDescription, setNewViewDescription] = useState('');
  const [showViewsMenu, setShowViewsMenu] = useState(false);

  // Load saved views from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-views');
    if (saved) {
      try {
        const parsedViews = JSON.parse(saved);
        // Update timestamps
        const viewsWithDates = parsedViews.map((view: any) => ({
          ...view,
          createdAt: new Date(view.createdAt),
          updatedAt: new Date(view.updatedAt)
        }));
        // Load default view if available
        const defaultView = viewsWithDates.find((view: DashboardView) => view.isDefault);
        if (defaultView) {
          setWidgets(defaultView.widgets);
        }
      } catch (error) {
        console.error('Error loading saved views:', error);
      }
    }
  }, []);

  const moveWidget = (dragIndex: number, hoverIndex: number) => {
    setWidgets(prevWidgets => {
      const draggedWidget = prevWidgets[dragIndex];
      const newWidgets = [...prevWidgets];
      newWidgets.splice(dragIndex, 1);
      newWidgets.splice(hoverIndex, 0, draggedWidget);
      return newWidgets;
    });
  };

  const updateWidget = (updatedWidget: Widget) => {
    setWidgets(prevWidgets =>
      prevWidgets.map(widget =>
        widget.id === updatedWidget.id ? updatedWidget : widget
      )
    );
  };

  const configureWidget = (widget: Widget) => {
    // Open configuration modal/dialog
    console.log('Configure widget:', widget);
  };

  const saveCurrentView = () => {
    if (!newViewName.trim()) return;

    const newView: DashboardView = {
      id: `view-${Date.now()}`,
      name: newViewName,
      description: newViewDescription,
      widgets: [...widgets],
      role: userRole,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to localStorage
    const existingViews = JSON.parse(localStorage.getItem('dashboard-views') || '[]');
    const updatedViews = [...existingViews, newView];
    localStorage.setItem('dashboard-views', JSON.stringify(updatedViews));

    onSaveView?.(newView);
    setShowSaveDialog(false);
    setNewViewName('');
    setNewViewDescription('');
  };

  const loadView = (viewId: string) => {
    const saved = localStorage.getItem('dashboard-views');
    if (saved) {
      try {
        const views = JSON.parse(saved);
        const view = views.find((v: DashboardView) => v.id === viewId);
        if (view) {
          setWidgets(view.widgets);
          onLoadView?.(viewId);
        }
      } catch (error) {
        console.error('Error loading view:', error);
      }
    }
    setShowViewsMenu(false);
  };

  const resetToDefault = () => {
    const saved = localStorage.getItem('dashboard-views');
    if (saved) {
      try {
        const views = JSON.parse(saved);
        const defaultView = views.find((v: DashboardView) => v.isDefault);
        if (defaultView) {
          setWidgets(defaultView.widgets);
        } else {
          setWidgets(initialWidgets);
        }
      } catch (error) {
        setWidgets(initialWidgets);
      }
    } else {
      setWidgets(initialWidgets);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Dashboard Controls */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">Dashboard Personalizable</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowViewsMenu(!showViewsMenu)}
                  leftIcon={<Eye className="h-4 w-4" />}
                >
                  Vistas Guardadas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Guardar Vista
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefault}
                  leftIcon={<Grid3X3 className="h-4 w-4" />}
                >
                  Restablecer
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {widgets.filter(w => w.visible).length} widgets visibles
            </div>
          </div>
        </Card>

        {/* Views Menu */}
        {showViewsMenu && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Vistas Guardadas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedViews.map(view => (
                <div
                  key={view.id}
                  className="p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => loadView(view.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{view.name}</h4>
                    {view.isDefault && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Por defecto
                      </span>
                    )}
                  </div>
                  {view.description && (
                    <p className="text-xs text-muted-foreground mb-2">{view.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {view.widgets.length} widgets • {view.role || 'Todos los roles'}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Save View Dialog */}
        {showSaveDialog && (
          <Card className="p-6 max-w-md mx-auto">
            <h3 className="font-semibold mb-4">Guardar Vista Actual</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre de la vista</label>
                <input
                  type="text"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="Mi vista personalizada"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
                <textarea
                  value={newViewDescription}
                  onChange={(e) => setNewViewDescription(e.target.value)}
                  placeholder="Descripción de esta vista..."
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={saveCurrentView}
                  disabled={!newViewName.trim()}
                >
                  Guardar Vista
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Widget Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-min">
          {widgets.map((widget, index) => (
            <DraggableWidget
              key={widget.id}
              widget={widget}
              index={index}
              onMove={moveWidget}
              onUpdate={updateWidget}
              onConfigure={configureWidget}
              userRole={userRole}
            />
          ))}
        </div>

        {/* Empty State */}
        {widgets.length === 0 && (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <Grid3X3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No hay widgets configurados</h3>
              <p className="text-muted-foreground mb-4">
                Comienza agregando widgets a tu dashboard personalizado.
              </p>
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                Agregar Widget
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DndProvider>
  );
};

export { DashboardGrid };
