import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  User, 
  Brain, 
  Settings, 
  Edit3, 
  Plus, 
  Trash2,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { useWebsyMemory } from '@/hooks/useWebsyMemory';
import { toast } from '@/hooks/use-toast';

export const UserProfilePanel: React.FC = () => {
  const { 
    userProfile, 
    updateUserProfile, 
    addToKnowledgeBase,
    knowledgeBase,
    isLoading 
  } = useWebsyMemory();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    work_patterns: [] as string[],
    preferred_communication_style: 'balanced',
    common_tasks: [] as string[],
    expertise_areas: [] as string[],
    project_contexts: [] as string[],
    learning_preferences: {} as Record<string, any>
  });
  
  const [newKnowledge, setNewKnowledge] = useState({
    title: '',
    content: '',
    category: '',
    tags: [] as string[]
  });
  
  const [showKnowledgeDialog, setShowKnowledgeDialog] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Inicializar datos de edición
  React.useEffect(() => {
    if (userProfile) {
      setEditData({
        work_patterns: userProfile.work_patterns || [],
        preferred_communication_style: userProfile.preferred_communication_style || 'balanced',
        common_tasks: userProfile.common_tasks || [],
        expertise_areas: userProfile.expertise_areas || [],
        project_contexts: userProfile.project_contexts || [],
        learning_preferences: userProfile.learning_preferences || {}
      });
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile(editData);
      setIsEditing(false);
      toast({
        title: "Perfil actualizado",
        description: "Tu perfil inteligente ha sido actualizado exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil.",
        variant: "destructive"
      });
    }
  };

  const handleAddKnowledge = async () => {
    if (!newKnowledge.title || !newKnowledge.content || !newKnowledge.category) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive"
      });
      return;
    }

    try {
      await addToKnowledgeBase(
        newKnowledge.title,
        newKnowledge.content,
        newKnowledge.category,
        newKnowledge.tags
      );
      
      setNewKnowledge({
        title: '',
        content: '',
        category: '',
        tags: []
      });
      setShowKnowledgeDialog(false);
      
      toast({
        title: "Conocimiento agregado",
        description: "Se ha agregado nuevo conocimiento a tu base de datos.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el conocimiento.",
        variant: "destructive"
      });
    }
  };

  const addTag = () => {
    if (newTag.trim() && !newKnowledge.tags.includes(newTag.trim())) {
      setNewKnowledge(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setNewKnowledge(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addArrayItem = (field: keyof typeof editData, value: string) => {
    if (value.trim() && !editData[field].includes(value.trim())) {
      setEditData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }));
    }
  };

  const removeArrayItem = (field: keyof typeof editData, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter(item => item !== value)
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Cargando perfil...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Perfil de Usuario */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil Inteligente
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            {isEditing ? 'Cancelar' : 'Editar'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {!userProfile ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay perfil disponible</p>
              <p className="text-sm">Websy aprenderá tus preferencias con el tiempo</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Patrones de Trabajo */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Patrones de Trabajo
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {editData.work_patterns.map((pattern, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {pattern}
                      {isEditing && (
                        <button
                          onClick={() => removeArrayItem('work_patterns', pattern)}
                          className="ml-1 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nuevo patrón"
                        className="w-32 h-8"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addArrayItem('work_patterns', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button size="sm" variant="outline" className="h-8">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Estilo de Comunicación */}
              <div>
                <Label className="text-sm font-medium">Estilo de Comunicación</Label>
                {isEditing ? (
                  <Select
                    value={editData.preferred_communication_style}
                    onValueChange={(value) => setEditData(prev => ({ ...prev, preferred_communication_style: value }))}
                  >
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detailed">Detallado</SelectItem>
                      <SelectItem value="concise">Conciso</SelectItem>
                      <SelectItem value="balanced">Equilibrado</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="mt-2">
                    {editData.preferred_communication_style}
                  </Badge>
                )}
              </div>

              {/* Áreas de Experticia */}
              <div>
                <Label className="text-sm font-medium">Áreas de Experticia</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {editData.expertise_areas.map((area, index) => (
                    <Badge key={index} variant="default" className="flex items-center gap-1">
                      {area}
                      {isEditing && (
                        <button
                          onClick={() => removeArrayItem('expertise_areas', area)}
                          className="ml-1 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nueva área"
                        className="w-32 h-8"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addArrayItem('expertise_areas', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button size="sm" variant="outline" className="h-8">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tareas Comunes */}
              <div>
                <Label className="text-sm font-medium">Tareas Comunes</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {editData.common_tasks.map((task, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {task}
                      {isEditing && (
                        <button
                          onClick={() => removeArrayItem('common_tasks', task)}
                          className="ml-1 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nueva tarea"
                        className="w-32 h-8"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addArrayItem('common_tasks', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button size="sm" variant="outline" className="h-8">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveProfile} className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Base de Conocimiento */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Base de Conocimiento
          </CardTitle>
          <Dialog open={showKnowledgeDialog} onOpenChange={setShowKnowledgeDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agregar Conocimiento</DialogTitle>
                <DialogDescription>
                  Agrega información útil que Websy puede usar para ayudarte mejor.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={newKnowledge.title}
                    onChange={(e) => setNewKnowledge(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ej: Configuración de React Router"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={newKnowledge.category}
                    onValueChange={(value) => setNewKnowledge(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tecnologia">Tecnología</SelectItem>
                      <SelectItem value="proceso">Proceso</SelectItem>
                      <SelectItem value="proyecto">Proyecto</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="content">Contenido</Label>
                  <Textarea
                    id="content"
                    value={newKnowledge.content}
                    onChange={(e) => setNewKnowledge(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Describe el conocimiento o información útil..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Etiquetas</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newKnowledge.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nueva etiqueta"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addTag();
                          }
                        }}
                        className="w-32 h-8"
                      />
                      <Button size="sm" variant="outline" onClick={addTag}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowKnowledgeDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddKnowledge}>
                  Agregar Conocimiento
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {knowledgeBase.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay conocimiento almacenado</p>
              <p className="text-sm">Agrega información útil para mejorar las respuestas de Websy</p>
            </div>
          ) : (
            <div className="space-y-3">
              {knowledgeBase.slice(0, 5).map((item) => (
                <div key={item.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.content.substring(0, 100)}...
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                        {item.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {knowledgeBase.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  Y {knowledgeBase.length - 5} más...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
