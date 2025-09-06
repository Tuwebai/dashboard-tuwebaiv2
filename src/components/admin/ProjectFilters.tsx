import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Calendar } from 'lucide-react';
import { ProjectFilters, ProjectSort } from '@/types/project.types';
import { projectService } from '@/lib/projectService';
import { useTheme } from '@/contexts/ThemeContext';

interface ProjectFiltersProps {
  filters: ProjectFilters;
  sort: ProjectSort;
  onFiltersChange: (filters: ProjectFilters) => void;
  onSortChange: (sort: ProjectSort) => void;
  onClearFilters: () => void;
}

export const ProjectFiltersComponent: React.FC<ProjectFiltersProps> = ({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  onClearFilters
}) => {
  const { theme } = useTheme();
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Cargar tecnologías únicas
  useEffect(() => {
    const loadTechnologies = async () => {
      try {
        const techs = await projectService.getUniqueTechnologies();
        setTechnologies(techs.map(t => t.technology));
      } catch (error) {
        console.error('Error loading technologies:', error);
      }
    };
    loadTechnologies();
  }, []);

  const handleFilterChange = (key: keyof ProjectFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    });
  };

  const handleSortChange = (field: ProjectSort['field']) => {
    const newDirection = sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange({ field, direction: newDirection });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'development': return 'Desarrollo';
      case 'production': return 'Producción';
      case 'paused': return 'Pausado';
      case 'maintenance': return 'Mantenimiento';
      default: return status;
    }
  };

  const getSortLabel = (field: string) => {
    switch (field) {
      case 'name': return 'Nombre';
      case 'status': return 'Estado';
      case 'created_at': return 'Fecha de Creación';
      case 'updated_at': return 'Fecha de Actualización';
      default: return field;
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Búsqueda principal */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 h-4 w-4" />
              <Input
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Buscar proyectos por nombre o descripción..."
                className="pl-10 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={onClearFilters}
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}
          </div>

          {/* Filtros avanzados */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-600">
              {/* Filtro por estado */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado</label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los estados</SelectItem>
                    <SelectItem value="development">Desarrollo</SelectItem>
                    <SelectItem value="production">Producción</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por tecnología */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tecnología</label>
                <Select
                  value={filters.technology || ''}
                  onValueChange={(value) => handleFilterChange('technology', value)}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200">
                    <SelectValue placeholder="Todas las tecnologías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las tecnologías</SelectItem>
                    {technologies.map((tech) => (
                      <SelectItem key={tech} value={tech}>
                        {tech}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por fecha desde */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Desde</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 h-4 w-4" />
                  <Input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="pl-10 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Filtro por fecha hasta */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Hasta</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 h-4 w-4" />
                  <Input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="pl-10 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Ordenamiento */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-600">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Ordenar por:</span>
            <div className="flex gap-2">
              {[
                { field: 'name' as const, label: 'Nombre' },
                { field: 'status' as const, label: 'Estado' },
                { field: 'created_at' as const, label: 'Fecha de Creación' },
                { field: 'updated_at' as const, label: 'Fecha de Actualización' }
              ].map(({ field, label }) => (
                <Button
                  key={field}
                  variant={sort.field === field ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSortChange(field)}
                  className={
                    sort.field === field
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'
                  }
                >
                  {label}
                  {sort.field === field && (
                    <span className="ml-1">
                      {sort.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Filtros activos */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Filtros activos:</span>
              {filters.search && (
                <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700">
                  Búsqueda: "{filters.search}"
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="ml-1 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.status && (
                <Badge variant="secondary" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700">
                  Estado: {getStatusLabel(filters.status)}
                  <button
                    onClick={() => handleFilterChange('status', '')}
                    className="ml-1 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.technology && (
                <Badge variant="secondary" className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-700">
                  Tecnología: {filters.technology}
                  <button
                    onClick={() => handleFilterChange('technology', '')}
                    className="ml-1 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(filters.dateFrom || filters.dateTo) && (
                <Badge variant="secondary" className="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700">
                  Fecha: {filters.dateFrom || 'Inicio'} - {filters.dateTo || 'Fin'}
                  <button
                    onClick={() => {
                      handleFilterChange('dateFrom', '');
                      handleFilterChange('dateTo', '');
                    }}
                    className="ml-1 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
