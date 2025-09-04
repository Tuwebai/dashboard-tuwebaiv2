import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Globe, 
  ShoppingCart, 
  Briefcase, 
  User, 
  MessageSquare, 
  Smartphone, 
  Laptop, 
  Palette, 
  Code, 
  Database, 
  Zap, 
  Home,
  Search,
  Check
} from 'lucide-react';
import { PROJECT_TYPES, getTypesByCategory, getSuggestedTypes, ProjectType } from '@/utils/projectTypeDetector';

interface ProjectTypeSelectorProps {
  selectedType?: string;
  onTypeSelect: (type: ProjectType) => void;
  projectData?: {
    name: string;
    description?: string;
    technologies?: string[];
  };
  className?: string;
}

// Mapeo de iconos
const iconMap = {
  Globe,
  ShoppingCart,
  Briefcase,
  User,
  MessageSquare,
  Smartphone,
  Laptop,
  Palette,
  Code,
  Database,
  Zap,
  Home
};

export default function ProjectTypeSelector({ 
  selectedType, 
  onTypeSelect, 
  projectData,
  className = '' 
}: ProjectTypeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestedTypes, setSuggestedTypes] = useState<ProjectType[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const categories = getTypesByCategory();
  const allCategories = ['all', ...Object.keys(categories)];

  // Generar sugerencias basadas en los datos del proyecto
  useEffect(() => {
    if (projectData) {
      const searchText = `${projectData.name} ${projectData.description || ''} ${(projectData.technologies || []).join(' ')}`;
      const suggestions = getSuggestedTypes(searchText, 3);
      setSuggestedTypes(suggestions);
    }
  }, [projectData]);

  // Filtrar tipos por búsqueda y categoría
  const filteredTypes = PROJECT_TYPES.filter(type => {
    const matchesSearch = searchTerm === '' || 
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || type.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleTypeSelect = (type: ProjectType) => {
    onTypeSelect(type);
    setShowSuggestions(false);
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Home;
    return <IconComponent className="h-4 w-4" />;
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20',
      green: 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20',
      purple: 'bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20',
      pink: 'bg-pink-500/10 text-pink-600 border-pink-500/20 hover:bg-pink-500/20',
      orange: 'bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20',
      indigo: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/20',
      cyan: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 hover:bg-cyan-500/20',
      rose: 'bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20',
      emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20',
      amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20',
      violet: 'bg-violet-500/10 text-violet-600 border-violet-500/20 hover:bg-violet-500/20',
      slate: 'bg-slate-500/10 text-slate-600 border-slate-500/20 hover:bg-slate-500/20'
    };
    return colorMap[color] || colorMap.slate;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Sugerencias automáticas */}
      {suggestedTypes.length > 0 && !selectedType && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            💡 Tipos sugeridos para tu proyecto:
          </Label>
          <div className="flex flex-wrap gap-2">
            {suggestedTypes.map((type) => (
              <Button
                key={type.id}
                variant="outline"
                size="sm"
                onClick={() => handleTypeSelect(type)}
                className={`${getColorClasses(type.color)} border transition-all duration-200 hover:scale-105`}
              >
                {getIconComponent(type.icon)}
                <span className="ml-2">{type.name}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Búsqueda */}
      <div className="space-y-2">
        <Label htmlFor="type-search" className="text-sm font-medium text-slate-700">
          Buscar tipo de proyecto:
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            id="type-search"
            placeholder="Escribe para buscar tipos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filtros por categoría */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">Categorías:</Label>
        <div className="flex flex-wrap gap-2">
          {allCategories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="text-xs"
            >
              {category === 'all' ? 'Todos' : category}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista de tipos */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          Selecciona un tipo de proyecto:
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {filteredTypes.map((type) => (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
                selectedType === type.name ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => handleTypeSelect(type)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${getColorClasses(type.color)}`}>
                      {getIconComponent(type.icon)}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">{type.name}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">
                        {type.category}
                      </Badge>
                    </div>
                  </div>
                  {selectedType === type.name && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {type.description}
                </p>
                {type.keywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {type.keywords.slice(0, 3).map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {type.keywords.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{type.keywords.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tipo seleccionado */}
      {selectedType && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Tipo seleccionado: {selectedType}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
