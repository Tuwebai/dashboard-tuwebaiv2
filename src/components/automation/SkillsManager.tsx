import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  TrendingUp, 
  Users, 
  Target,
  Zap,
  CheckCircle
} from 'lucide-react';
import { useAutomation } from '@/hooks/useAutomation';
import { UserSkill } from '@/lib/automationService';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface SkillsManagerProps {
  userId?: string;
}

export const SkillsManager: React.FC<SkillsManagerProps> = ({ userId }) => {
  const { addUserSkill, updateUserSkill, getSkillAnalysis } = useAutomation();
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [skillAnalysis, setSkillAnalysis] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<UserSkill | null>(null);
  const [newSkill, setNewSkill] = useState({
    skill_name: '',
    proficiency_level: 1,
    experience_years: 0
  });

  const proficiencyLevels = [
    { value: 1, label: 'Principiante', color: 'bg-red-100 text-red-800' },
    { value: 2, label: 'Básico', color: 'bg-orange-100 text-orange-800' },
    { value: 3, label: 'Intermedio', color: 'bg-yellow-100 text-yellow-800' },
    { value: 4, label: 'Avanzado', color: 'bg-blue-100 text-blue-800' },
    { value: 5, label: 'Experto', color: 'bg-green-100 text-green-800' }
  ];

  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js',
    'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go',
    'SQL', 'MongoDB', 'PostgreSQL', 'Redis',
    'AWS', 'Azure', 'Docker', 'Kubernetes',
    'Diseño UX/UI', 'Figma', 'Adobe XD', 'Sketch',
    'Gestión de Proyectos', 'Scrum', 'Agile', 'Kanban',
    'Marketing Digital', 'SEO', 'SEM', 'Redes Sociales',
    'Ventas', 'Atención al Cliente', 'Comunicación',
    'Análisis de Datos', 'Excel', 'Power BI', 'Tableau'
  ];

  useEffect(() => {
    loadSkills();
    loadSkillAnalysis();
  }, [userId]);

  const loadSkills = async () => {
    try {
      setLoading(true);
      let query = supabase.from('user_skills').select('*');
      
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('proficiency_level', { ascending: false });
      
      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error('Error cargando habilidades:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las habilidades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSkillAnalysis = async () => {
    try {
      const analysis = await getSkillAnalysis();
      setSkillAnalysis(analysis);
    } catch (error) {
      console.error('Error cargando análisis de habilidades:', error);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.skill_name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la habilidad es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      await addUserSkill({
        user_id: userId || '',
        skill_name: newSkill.skill_name,
        proficiency_level: newSkill.proficiency_level,
        experience_years: newSkill.experience_years,
        last_used: new Date().toISOString()
      });

      setNewSkill({ skill_name: '', proficiency_level: 1, experience_years: 0 });
      setIsDialogOpen(false);
      loadSkills();
      loadSkillAnalysis();
    } catch (error) {
      console.error('Error agregando habilidad:', error);
    }
  };

  const handleUpdateSkill = async (skillId: string, updates: Partial<UserSkill>) => {
    try {
      await updateUserSkill(skillId, updates);
      setEditingSkill(null);
      loadSkills();
      loadSkillAnalysis();
    } catch (error) {
      console.error('Error actualizando habilidad:', error);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from('user_skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;

      toast({
        title: "Habilidad Eliminada",
        description: "La habilidad ha sido eliminada exitosamente",
      });

      loadSkills();
      loadSkillAnalysis();
    } catch (error) {
      console.error('Error eliminando habilidad:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la habilidad",
        variant: "destructive",
      });
    }
  };

  const getProficiencyColor = (level: number) => {
    const proficiency = proficiencyLevels.find(p => p.value === level);
    return proficiency?.color || 'bg-gray-100 text-gray-800';
  };

  const getProficiencyLabel = (level: number) => {
    const proficiency = proficiencyLevels.find(p => p.value === level);
    return proficiency?.label || 'Desconocido';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Gestión de Habilidades</h3>
          <p className="text-muted-foreground">
            Administra las habilidades del equipo para asignación inteligente
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Habilidad
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nueva Habilidad</DialogTitle>
              <DialogDescription>
                Añade una nueva habilidad al perfil del usuario
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="skill_name">Nombre de la Habilidad</Label>
                <Input
                  id="skill_name"
                  value={newSkill.skill_name}
                  onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                  placeholder="Ej: JavaScript, React, Diseño UX..."
                />
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-2">Habilidades comunes:</p>
                  <div className="flex flex-wrap gap-2">
                    {commonSkills.slice(0, 10).map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => setNewSkill({ ...newSkill, skill_name: skill })}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="proficiency_level">Nivel de Proficiencia</Label>
                <Select
                  value={newSkill.proficiency_level.toString()}
                  onValueChange={(value) => setNewSkill({ ...newSkill, proficiency_level: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {proficiencyLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value.toString()}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="experience_years">Años de Experiencia</Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  max="50"
                  value={newSkill.experience_years}
                  onChange={(e) => setNewSkill({ ...newSkill, experience_years: parseInt(e.target.value) || 0 })}
                />
              </div>
              <Button onClick={handleAddSkill} className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Agregar Habilidad
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas de Habilidades */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Habilidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skills.length}</div>
            <p className="text-xs text-muted-foreground">
              Habilidades registradas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nivel Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {skills.length > 0 
                ? (skills.reduce((sum, skill) => sum + skill.proficiency_level, 0) / skills.length).toFixed(1)
                : '0'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Proficiencia promedio
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Experiencia Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {skills.reduce((sum, skill) => sum + skill.experience_years, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Años de experiencia
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Habilidades */}
      <Card>
        <CardHeader>
          <CardTitle>Habilidades del Usuario</CardTitle>
          <CardDescription>
            Gestiona las habilidades y niveles de proficiencia
          </CardDescription>
        </CardHeader>
        <CardContent>
          {skills.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay habilidades registradas</h3>
              <p className="text-muted-foreground mb-4">
                Agrega habilidades para habilitar la asignación inteligente de tareas
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primera Habilidad
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {skills.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium">{skill.skill_name}</h4>
                      <Badge className={getProficiencyColor(skill.proficiency_level)}>
                        {getProficiencyLabel(skill.proficiency_level)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        Nivel {skill.proficiency_level}/5
                      </span>
                      <span className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {skill.experience_years} años
                      </span>
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Último uso: {new Date(skill.last_used).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-2">
                      <Progress 
                        value={(skill.proficiency_level / 5) * 100} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSkill(skill)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSkill(skill.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Análisis de Habilidades del Equipo */}
      {skillAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Análisis del Equipo</CardTitle>
            <CardDescription>
              Estadísticas de habilidades a nivel de equipo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {skillAnalysis.slice(0, 10).map((skill) => (
                <div key={skill.skill_name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{skill.skill_name}</h4>
                    <Badge variant="outline">
                      {skill.total_users} usuarios
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Proficiencia promedio: {skill.avg_proficiency}/5</span>
                      <span>Experiencia total: {skill.total_experience} años</span>
                    </div>
                    <Progress 
                      value={(skill.avg_proficiency / 5) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Edición */}
      {editingSkill && (
        <Dialog open={!!editingSkill} onOpenChange={() => setEditingSkill(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Habilidad</DialogTitle>
              <DialogDescription>
                Modifica los detalles de la habilidad
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_skill_name">Nombre de la Habilidad</Label>
                <Input
                  id="edit_skill_name"
                  value={editingSkill.skill_name}
                  onChange={(e) => setEditingSkill({ ...editingSkill, skill_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_proficiency_level">Nivel de Proficiencia</Label>
                <Select
                  value={editingSkill.proficiency_level.toString()}
                  onValueChange={(value) => setEditingSkill({ ...editingSkill, proficiency_level: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {proficiencyLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value.toString()}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_experience_years">Años de Experiencia</Label>
                <Input
                  id="edit_experience_years"
                  type="number"
                  min="0"
                  max="50"
                  value={editingSkill.experience_years}
                  onChange={(e) => setEditingSkill({ ...editingSkill, experience_years: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => handleUpdateSkill(editingSkill.id, editingSkill)}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingSkill(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
