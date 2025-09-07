import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Brain, 
  Search, 
  Clock, 
  MessageSquare, 
  Tag,
  Filter,
  X
} from 'lucide-react';
import { useWebsyMemory } from '@/hooks/useWebsyMemory';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const ConversationMemories: React.FC = () => {
  const { 
    conversationMemories, 
    isLoading 
  } = useWebsyMemory();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Filtrar memorias
  const filteredMemories = conversationMemories.filter(memory => {
    const matchesSearch = searchQuery === '' || 
      memory.context_summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.key_topics.some(topic => 
        topic.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesCategory = filterCategory === 'all' || 
      memory.key_topics.some(topic => 
        getCategoryFromTopic(topic) === filterCategory
      );
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryFromTopic = (topic: string): string => {
    const techTopics = ['react', 'typescript', 'api', 'database', 'frontend', 'backend'];
    const businessTopics = ['proyecto', 'cliente', 'reunión', 'presupuesto', 'timeline'];
    const processTopics = ['desarrollo', 'análisis', 'testing', 'deployment'];
    
    if (techTopics.some(tech => topic.toLowerCase().includes(tech))) return 'tecnologia';
    if (businessTopics.some(business => topic.toLowerCase().includes(business))) return 'negocio';
    if (processTopics.some(process => topic.toLowerCase().includes(process))) return 'proceso';
    return 'general';
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'tecnologia': return 'bg-blue-100 text-blue-800';
      case 'negocio': return 'bg-green-100 text-green-800';
      case 'proceso': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tecnologia': return '💻';
      case 'negocio': return '💼';
      case 'proceso': return '⚙️';
      default: return '📝';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Cargando memorias...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros y Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Memorias de Conversación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en memorias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory('all')}
              >
                Todas
              </Button>
              <Button
                variant={filterCategory === 'tecnologia' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory('tecnologia')}
              >
                💻 Tecnología
              </Button>
              <Button
                variant={filterCategory === 'negocio' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory('negocio')}
              >
                💼 Negocio
              </Button>
              <Button
                variant={filterCategory === 'proceso' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory('proceso')}
              >
                ⚙️ Proceso
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {filteredMemories.length} de {conversationMemories.length} memorias
          </div>
        </CardContent>
      </Card>

      {/* Lista de Memorias */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            {filteredMemories.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay memorias disponibles</p>
                <p className="text-sm">Las memorias se crean automáticamente durante las conversaciones</p>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {filteredMemories.map((memory) => (
                  <div
                    key={memory.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedMemory(memory)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-2">
                          {memory.context_summary}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(memory.updated_at), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            {memory.conversation_id}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-3">
                      {memory.key_topics.slice(0, 5).map((topic, index) => {
                        const category = getCategoryFromTopic(topic);
                        return (
                          <Badge
                            key={index}
                            variant="secondary"
                            className={`text-xs ${getCategoryColor(category)}`}
                          >
                            {getCategoryIcon(category)} {topic}
                          </Badge>
                        );
                      })}
                      {memory.key_topics.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{memory.key_topics.length - 5} más
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dialog de Detalle de Memoria */}
      <Dialog open={!!selectedMemory} onOpenChange={() => setSelectedMemory(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Detalle de Memoria
            </DialogTitle>
            <DialogDescription>
              Información completa de esta conversación
            </DialogDescription>
          </DialogHeader>
          
          {selectedMemory && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Resumen del Contexto</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  {selectedMemory.context_summary}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Temas Clave</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedMemory.key_topics.map((topic: string, index: number) => {
                    const category = getCategoryFromTopic(topic);
                    return (
                      <Badge
                        key={index}
                        variant="secondary"
                        className={`${getCategoryColor(category)}`}
                      >
                        {getCategoryIcon(category)} {topic}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Preferencias del Usuario</h4>
                <div className="bg-muted p-3 rounded-lg">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {JSON.stringify(selectedMemory.user_preferences, null, 2)}
                  </pre>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Creada: {formatDistanceToNow(new Date(selectedMemory.created_at), { 
                    addSuffix: true, 
                    locale: es 
                  })}
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  ID: {selectedMemory.conversation_id}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
