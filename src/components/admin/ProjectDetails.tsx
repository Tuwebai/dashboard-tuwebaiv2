import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Edit, 
  Trash2, 
  X, 
  Calendar, 
  Clock, 
  Code, 
  Settings,
  Users,
  FileText,
  GitBranch,
  GitCommit,
  History,
  Rocket,
  Activity,
  Folder,
  User,
  Plus,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  CheckCircle,
  AlertCircle,
  Send,
  Save
} from 'lucide-react';
import { Project } from '@/types/project.types';
import { formatDateSafe } from '@/utils/formatDateSafe';
import { VersionManagement } from './VersionManagement';
import FileManager from '@/components/FileManager';
import { userService } from '@/lib/supabaseService';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface ProjectDetailsProps {
  project: Project;
  onEdit: (project: Project) => void;
  onClose: () => void;
}

const ESTADOS_FASE = [
  { value: 'Pendiente', label: 'Pendiente', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { value: 'En Progreso', label: 'En Progreso', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'En Revisión', label: 'En Revisión', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'Aprobada', label: 'Aprobada', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'Bloqueada', label: 'Bloqueada', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'Terminado', label: 'Terminado', color: 'bg-purple-100 text-purple-800 border-purple-200' },
];

const ESTADOS_TAREA = [
  { value: 'pending', label: 'Pendiente', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { value: 'in_progress', label: 'En Progreso', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'review', label: 'En Revisión', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'completed', label: 'Completada', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'blocked', label: 'Bloqueada', color: 'bg-red-100 text-red-800 border-red-200' },
];

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project,
  onEdit,
  onClose
}) => {
  // Cast project to any to handle dynamic fases property
  const projectData = project as any;
  const { user } = useApp();
  const [creatorInfo, setCreatorInfo] = useState<{ full_name: string; email: string } | null>(null);
  
  // Estados para gestión de fases y tareas
  const [proyectoLocal, setProyectoLocal] = useState(project);
  const [expandedFases, setExpandedFases] = useState<Set<string>>(new Set());
  const [expandedTareas, setExpandedTareas] = useState<Set<string>>(new Set());
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [nuevaTarea, setNuevaTarea] = useState({
    titulo: '',
    descripcion: '',
    responsable: '',
    fechaLimite: '',
    prioridad: 'media'
  });
  const [editandoTarea, setEditandoTarea] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editandoFase, setEditandoFase] = useState<string | null>(null);
  const [nuevaFase, setNuevaFase] = useState({
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    estado: 'Pendiente'
  });
  const [faseEditando, setFaseEditando] = useState({
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    estado: 'Pendiente'
  });


  // Cargar información del creador del proyecto
  useEffect(() => {
    const loadCreatorInfo = async () => {
      // Validar que el proyecto tenga created_by
      if (!project.created_by || project.created_by.trim() === '') {
        // Proyecto no tiene created_by válido
        setCreatorInfo(null);
        return;
      }

      try {
        const creator = await userService.getUserById(project.created_by);
        if (creator && creator.id) {
          setCreatorInfo({
            full_name: creator.full_name || 'Usuario sin nombre',
            email: creator.email || 'sin-email@example.com'
          });
        } else {
          // Creador no encontrado
          setCreatorInfo({
            full_name: 'Usuario no encontrado',
            email: 'no-encontrado@example.com'
          });
        }
      } catch (error) {
        // Error cargando creador
        setCreatorInfo({
          full_name: 'Error al cargar',
          email: 'error@example.com'
        });
      }
    };

    loadCreatorInfo();
  }, [project.created_by, project.id]);

  // Actualizar proyectoLocal cuando cambie el prop project
  useEffect(() => {
    setProyectoLocal(project);
  }, [project]);

  // Suscripción a cambios en tiempo real del proyecto
  useEffect(() => {
    if (!project?.id) return;

    const channel = supabase
      .channel(`project-${project.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${project.id}`
        },
        (payload) => {
          const updatedProject = payload.new as any;
          setProyectoLocal(updatedProject);
          
          // Mostrar notificación de actualización
          toast({
            title: "Proyecto actualizado",
            description: "El proyecto se ha actualizado en tiempo real",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project?.id]);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'development':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'production':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'development':
        return 'Desarrollo';
      case 'production':
        return 'Producción';
      case 'paused':
        return 'Pausado';
      case 'maintenance':
        return 'Mantenimiento';
      default:
        return status;
    }
  };

  // Funciones de gestión de fases y tareas
  const toggleFase = (faseKey: string) => {
    const newExpanded = new Set(expandedFases);
    if (newExpanded.has(faseKey)) {
      newExpanded.delete(faseKey);
    } else {
      newExpanded.add(faseKey);
    }
    setExpandedFases(newExpanded);
  };

  const toggleTareas = (faseKey: string) => {
    const newExpanded = new Set(expandedTareas);
    if (newExpanded.has(faseKey)) {
      newExpanded.delete(faseKey);
    } else {
      newExpanded.add(faseKey);
    }
    setExpandedTareas(newExpanded);
  };

  const handleEstadoFase = async (faseKey: string, nuevoEstado: string) => {
    if (!user || user.role !== 'admin' || !projectData?.id) return;

    try {
      setLoading(true);
      const nuevasFases = ((proyectoLocal as any).fases || []).map((f: any) =>
        f.key === faseKey
          ? {
              ...f,
              estado: nuevoEstado,
              ultimoCambio: { 
                usuario: user.email, 
                fecha: new Date().toISOString() 
              }
            }
          : f
      );

      // Actualizar en Supabase
      const { error } = await supabase
        .from('projects')
        .update({ fases: nuevasFases })
        .eq('id', projectData.id);
      
      if (error) throw error;
      
      // Actualizar estado local inmediatamente
      const proyectoActualizado = { ...proyectoLocal, fases: nuevasFases };
      setProyectoLocal(proyectoActualizado);
      
      toast({
        title: "Estado actualizado",
        description: `Fase ${faseKey} actualizada a ${nuevoEstado}`,
      });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la fase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarFase = async () => {
    if (!nuevaFase.descripcion.trim() || !user || user.role !== 'admin' || !project?.id) return;

    try {
      setLoading(true);
      const faseKey = `fase_${Date.now()}`;
      const nuevaFaseCompleta = {
        key: faseKey,
        descripcion: nuevaFase.descripcion,
        fechaInicio: nuevaFase.fechaInicio,
        fechaFin: nuevaFase.fechaFin,
        estado: nuevaFase.estado,
        tareas: [],
        comentarios: [],
        creadoPor: user.email,
        fechaCreacion: new Date().toISOString()
      };

      const fasesActualizadas = [...((proyectoLocal as any).fases || []), nuevaFaseCompleta];
      
      // Actualizar en Supabase
      const { error } = await supabase
        .from('projects')
        .update({ fases: fasesActualizadas })
        .eq('id', projectData.id);
      
      if (error) throw error;
      
      // Actualizar estado local
      const proyectoActualizado = { ...proyectoLocal, fases: fasesActualizadas };
      setProyectoLocal(proyectoActualizado);
      
      // Limpiar formulario
      setNuevaFase({
        descripcion: '',
        fechaInicio: '',
        fechaFin: '',
        estado: 'Pendiente'
      });

      toast({
        title: "Fase agregada",
        description: "La fase se agregó correctamente y se sincronizó en tiempo real",
      });
    } catch (error) {
      console.error('Error agregando fase:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la fase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCrearFasesPorDefecto = async () => {
    if (!user || user.role !== 'admin' || !project?.id) return;

    try {
      setLoading(true);
      
      const fasesPorDefecto = [
        {
          key: 'ui',
          descripcion: 'Diseño de interfaz de usuario y experiencia visual del proyecto',
          fechaInicio: '',
          fechaFin: '',
          estado: 'Pendiente',
          tareas: [],
          comentarios: [],
          creadoPor: user.email,
          fechaCreacion: new Date().toISOString()
        },
        {
          key: 'maquetado',
          descripcion: 'Estructuración y maquetado de las páginas web',
          fechaInicio: '',
          fechaFin: '',
          estado: 'Pendiente',
          tareas: [],
          comentarios: [],
          creadoPor: user.email,
          fechaCreacion: new Date().toISOString()
        },
        {
          key: 'contenido',
          descripcion: 'Creación y optimización del contenido textual y multimedia',
          fechaInicio: '',
          fechaFin: '',
          estado: 'Pendiente',
          tareas: [],
          comentarios: [],
          creadoPor: user.email,
          fechaCreacion: new Date().toISOString()
        },
        {
          key: 'funcionalidades',
          descripcion: 'Desarrollo de funcionalidades y características interactivas',
          fechaInicio: '',
          fechaFin: '',
          estado: 'Pendiente',
          tareas: [],
          comentarios: [],
          creadoPor: user.email,
          fechaCreacion: new Date().toISOString()
        },
        {
          key: 'seo',
          descripcion: 'Optimización para motores de búsqueda y posicionamiento web',
          fechaInicio: '',
          fechaFin: '',
          estado: 'Pendiente',
          tareas: [],
          comentarios: [],
          creadoPor: user.email,
          fechaCreacion: new Date().toISOString()
        },
        {
          key: 'deploy',
          descripcion: 'Despliegue y puesta en producción del proyecto finalizado',
          fechaInicio: '',
          fechaFin: '',
          estado: 'Pendiente',
          tareas: [],
          comentarios: [],
          creadoPor: user.email,
          fechaCreacion: new Date().toISOString()
        }
      ];

      const fasesActualizadas = [...((proyectoLocal as any).fases || []), ...fasesPorDefecto];
      
      // Actualizar en Supabase
      const { error } = await supabase
        .from('projects')
        .update({ fases: fasesActualizadas })
        .eq('id', projectData.id);
      
      if (error) throw error;
      
      // Actualizar estado local
      const proyectoActualizado = { ...proyectoLocal, fases: fasesActualizadas };
      setProyectoLocal(proyectoActualizado);

      toast({
        title: "Fases creadas",
        description: "Se crearon las 6 fases por defecto del proyecto y se sincronizaron en tiempo real",
      });
    } catch (error) {
      console.error('Error creando fases por defecto:', error);
      toast({
        title: "Error",
        description: "No se pudieron crear las fases por defecto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditarFase = async (faseKey: string) => {
    if (!user || user.role !== 'admin' || !project?.id) return;

    try {
      setLoading(true);
      const fasesActualizadas = ((proyectoLocal as any).fases || []).map((f: any) =>
        f.key === faseKey
          ? {
              ...f,
              descripcion: faseEditando.descripcion,
              fechaInicio: faseEditando.fechaInicio,
              fechaFin: faseEditando.fechaFin,
              estado: faseEditando.estado,
              ultimaModificacion: {
                usuario: user.email,
                fecha: new Date().toISOString()
              }
            }
          : f
      );

      // Actualizar en Supabase
      const { error } = await supabase
        .from('projects')
        .update({ fases: fasesActualizadas })
        .eq('id', projectData.id);
      
      if (error) throw error;
      
      // Actualizar estado local
      const proyectoActualizado = { ...proyectoLocal, fases: fasesActualizadas };
      setProyectoLocal(proyectoActualizado);
      
      // Salir del modo edición
      setEditandoFase(null);
      setFaseEditando({
        descripcion: '',
        fechaInicio: '',
        fechaFin: '',
        estado: 'Pendiente'
      });

      toast({
        title: "Fase actualizada",
        description: "La fase se actualizó correctamente y se sincronizó en tiempo real",
      });
    } catch (error) {
      console.error('Error actualizando fase:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la fase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarFase = async (faseKey: string) => {
    if (!user || user.role !== 'admin' || !project?.id) return;

    try {
      setLoading(true);
      const fasesActualizadas = ((proyectoLocal as any).fases || []).filter((f: any) => f.key !== faseKey);

      // Actualizar en Supabase
      const { error } = await supabase
        .from('projects')
        .update({ fases: fasesActualizadas })
        .eq('id', projectData.id);
      
      if (error) throw error;
      
      // Actualizar estado local
      const proyectoActualizado = { ...proyectoLocal, fases: fasesActualizadas };
      setProyectoLocal(proyectoActualizado);

      toast({
        title: "Fase eliminada",
        description: "La fase se eliminó correctamente y se sincronizó en tiempo real",
      });
    } catch (error) {
      console.error('Error eliminando fase:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la fase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicionFase = (fase: any) => {
    setEditandoFase(fase.key);
    setFaseEditando({
      descripcion: fase.descripcion || '',
      fechaInicio: fase.fechaInicio || '',
      fechaFin: fase.fechaFin || '',
      estado: fase.estado || 'Pendiente'
    });
  };

  const handleAgregarTarea = async (faseKey: string) => {
    if (!nuevaTarea.titulo.trim() || !user || !project?.id) return;

    try {
      setLoading(true);
      
      const tareaId = `tarea_${Date.now()}`;
      const nuevaTareaCompleta = {
        id: tareaId,
        titulo: nuevaTarea.titulo,
        descripcion: nuevaTarea.descripcion,
        responsable: nuevaTarea.responsable,
        fechaLimite: nuevaTarea.fechaLimite,
        prioridad: nuevaTarea.prioridad,
        status: 'pending',
        creadoPor: user.email,
        fechaCreacion: new Date().toISOString()
      };

      // Actualizar las fases con la nueva tarea
      const fasesActualizadas = ((proyectoLocal as any).fases || []).map((fase: any) => {
        if (fase.key === faseKey) {
          return {
            ...fase,
            tareas: [...(fase.tareas || []), nuevaTareaCompleta]
          };
        }
        return fase;
      });

      // Actualizar en Supabase
      const { error } = await supabase
        .from('projects')
        .update({ fases: fasesActualizadas })
        .eq('id', projectData.id);
      
      if (error) throw error;
      
      // Actualizar estado local
      const proyectoActualizado = { ...proyectoLocal, fases: fasesActualizadas };
      setProyectoLocal(proyectoActualizado);

      // Limpiar formulario
      setNuevaTarea({
        titulo: '',
        descripcion: '',
        responsable: '',
        fechaLimite: '',
        prioridad: 'media'
      });

      toast({
        title: "Tarea agregada",
        description: "La tarea se agregó correctamente y se sincronizó en tiempo real",
      });
    } catch (error) {
      console.error('Error agregando tarea:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la tarea",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActualizarTarea = async (tareaId: string, updates: any) => {
    if (!project?.id) return;

    try {
      setLoading(true);
      
      // Actualizar las fases con la tarea modificada
      const fasesActualizadas = ((proyectoLocal as any).fases || []).map((fase: any) => {
        if (fase.tareas) {
          const tareasActualizadas = fase.tareas.map((tarea: any) => {
            if (tarea.id === tareaId) {
              return {
                ...tarea,
                ...updates,
                ultimaModificacion: {
                  usuario: user?.email,
                  fecha: new Date().toISOString()
                }
              };
            }
            return tarea;
          });
          return { ...fase, tareas: tareasActualizadas };
        }
        return fase;
      });

      // Actualizar en Supabase
      const { error } = await supabase
        .from('projects')
        .update({ fases: fasesActualizadas })
        .eq('id', projectData.id);
      
      if (error) throw error;
      
      // Actualizar estado local
      const proyectoActualizado = { ...proyectoLocal, fases: fasesActualizadas };
      setProyectoLocal(proyectoActualizado);

      toast({
        title: "Tarea actualizada",
        description: "La tarea se actualizó correctamente y se sincronizó en tiempo real",
      });
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarTarea = async (tareaId: string) => {
    if (!project?.id) return;

    try {
      setLoading(true);
      
      // Actualizar las fases removiendo la tarea
      const fasesActualizadas = ((proyectoLocal as any).fases || []).map((fase: any) => {
        if (fase.tareas) {
          const tareasActualizadas = fase.tareas.filter((tarea: any) => tarea.id !== tareaId);
          return { ...fase, tareas: tareasActualizadas };
        }
        return fase;
      });

      // Actualizar en Supabase
      const { error } = await supabase
        .from('projects')
        .update({ fases: fasesActualizadas })
        .eq('id', projectData.id);
      
      if (error) throw error;
      
      // Actualizar estado local
      const proyectoActualizado = { ...proyectoLocal, fases: fasesActualizadas };
      setProyectoLocal(proyectoActualizado);

      toast({
        title: "Tarea eliminada",
        description: "La tarea se eliminó correctamente y se sincronizó en tiempo real",
      });
    } catch (error) {
      console.error('Error eliminando tarea:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularProgresoFase = (faseKey: string) => {
    const fase = (proyectoLocal as any).fases?.find((f: any) => f.key === faseKey);
    if (!fase || !fase.tareas) return 0;
    
    const tareasCompletadas = fase.tareas.filter((t: any) => t.status === 'completed').length;
    return fase.tareas.length > 0 ? Math.round((tareasCompletadas / fase.tareas.length) * 100) : 0;
  };

  const calcularProgresoProyecto = () => {
    if (!(proyectoLocal as any).fases || (proyectoLocal as any).fases.length === 0) return 0;
    
    const progresoTotal = (proyectoLocal as any).fases.reduce((acc: number, fase: any) => {
      return acc + calcularProgresoFase(fase.key);
    }, 0);
    
    return Math.round(progresoTotal / (proyectoLocal as any).fases.length);
  };

  const getFaseStatusColor = (estado: string) => {
    const estadoObj = ESTADOS_FASE.find(e => e.value === estado);
    return estadoObj ? estadoObj.color : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTareaStatusColor = (status: string) => {
    const statusObj = ESTADOS_TAREA.find(s => s.value === status);
    return statusObj ? statusObj.color : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-lg w-full max-w-[99vw] sm:max-w-[98vw] md:max-w-[97vw] lg:max-w-[96vw] xl:max-w-[95vw] 2xl:max-w-[94vw] max-h-[98vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b border-slate-200 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 break-words">{project.name}</h2>
            <p className="text-slate-600 text-sm sm:text-base">Detalles del proyecto</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onEdit(project)}
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
            >
              <Edit className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="h-full">
            <TabsList className="grid w-full grid-cols-5 bg-white border-b border-slate-200">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 text-slate-700 hover:text-slate-900 text-xs sm:text-sm border-r border-slate-200">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Resumen</span>
              </TabsTrigger>
              <TabsTrigger value="phases" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 text-slate-700 hover:text-slate-900 text-xs sm:text-sm border-r border-slate-200">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Fases</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 text-slate-700 hover:text-slate-900 text-xs sm:text-sm border-r border-slate-200">
                <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Tareas</span>
              </TabsTrigger>
              <TabsTrigger value="files" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 text-slate-700 hover:text-slate-900 text-xs sm:text-sm border-r border-slate-200">
                <Folder className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Archivos</span>
              </TabsTrigger>
              <TabsTrigger value="metrics" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 text-slate-700 hover:text-slate-900 text-xs sm:text-sm">
                <Rocket className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Métricas</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab de Resumen */}
            <TabsContent value="overview" className="p-4 sm:p-6 h-full overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Información básica */}
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50 border-b border-slate-200">
                    <CardTitle className="text-slate-800 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Información Básica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Nombre</label>
                      <p className="text-slate-800 font-medium">{project.name}</p>
                    </div>
                    
                    {/* Información del creador - SIEMPRE VISIBLE */}
                    <div>
                      <label className="text-sm font-medium text-slate-600">Creado por</label>
                      {creatorInfo ? (
                        <div className="flex items-center gap-2 mt-1 p-2 bg-slate-50 rounded-lg border border-slate-200/50">
                          <User className="h-4 w-4 text-slate-500" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">
                              {creatorInfo.full_name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {creatorInfo.email}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1 p-2 bg-slate-50 rounded-lg border border-slate-200/50">
                          <User className="h-4 w-4 text-slate-400" />
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-400 italic">
                              Sin información de creador
                            </span>
                            <span className="text-xs text-slate-400">
                              No disponible
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-600">Descripción</label>
                      <p className="text-slate-700">
                        {project.description ? (
                          project.description
                        ) : (
                          <span className="italic text-slate-400">Sin descripción</span>
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-600">Estado</label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600">Creado</label>
                        <div className="flex items-center gap-1 mt-1 text-slate-600">
                          <Calendar className="h-3 w-3" />
                          {formatDateSafe(project.created_at)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">Actualizado</label>
                        <div className="flex items-center gap-1 mt-1 text-slate-600">
                          <Clock className="h-3 w-3" />
                          {formatDateSafe(project.updated_at)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tecnologías */}
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50 border-b border-slate-200">
                    <CardTitle className="text-slate-800 flex items-center gap-2">
                      <Code className="h-5 w-5 text-green-600" />
                      Tecnologías
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap gap-2">
                      {project.technologies && project.technologies.length > 0 ? (
                        project.technologies.map((tech, index) => (
                          <Badge key={index} variant="outline" className="border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100">
                            {tech}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-slate-500 italic">No hay tecnologías especificadas</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Repositorio - SIEMPRE VISIBLE */}
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50 border-b border-slate-200">
                    <CardTitle className="text-slate-800 flex items-center gap-2">
                      <GitBranch className="h-5 w-5 text-purple-600" />
                      Repositorio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {project.github_repository_url ? (
                      <div className="flex items-center gap-2">
                        <GitCommit className="h-4 w-4 text-slate-500" />
                        <a
                          href={project.github_repository_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline hover:no-underline font-medium"
                        >
                          {project.github_repository_url}
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-500">
                        <GitCommit className="h-4 w-4" />
                        <span className="italic">No hay repositorio configurado</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Variables de entorno */}
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50 border-b border-slate-200">
                    <CardTitle className="text-slate-800 flex items-center gap-2">
                      <Settings className="h-5 w-5 text-orange-600" />
                      Variables de Entorno
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {project.environment_variables && Object.keys(project.environment_variables).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(project.environment_variables).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-slate-700 font-mono text-sm font-medium">{key}</span>
                            <span className="text-slate-600 text-sm bg-white px-2 py-1 rounded border border-slate-200">
                              {typeof value === 'string' ? value : JSON.stringify(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">No hay variables de entorno configuradas</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab de Fases */}
            <TabsContent value="phases" className="h-full overflow-y-auto p-4 sm:p-6">
              <div className="space-y-6">
                {/* Métricas de Fases en Tiempo Real */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Fases</p>
                          <p className="text-2xl font-bold text-blue-800">
                            {(proyectoLocal as any).fases?.length || 0}
                          </p>
                        </div>
                        <Activity className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Completadas</p>
                          <p className="text-2xl font-bold text-green-800">
                            {(proyectoLocal as any).fases?.filter((f: any) => f.estado === 'completed').length || 0}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-yellow-600">En Progreso</p>
                          <p className="text-2xl font-bold text-yellow-800">
                            {(proyectoLocal as any).fases?.filter((f: any) => f.estado === 'in_progress').length || 0}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-600">Bloqueadas</p>
                          <p className="text-2xl font-bold text-red-800">
                            {(proyectoLocal as any).fases?.filter((f: any) => f.estado === 'blocked').length || 0}
                          </p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Progreso General del Proyecto */}
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50 border-b border-slate-200">
                    <CardTitle className="text-slate-800 flex items-center gap-2">
                      <Rocket className="h-5 w-5 text-blue-600" />
                      Progreso General del Proyecto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Progreso Total</span>
                        <span className="text-sm font-bold text-slate-800">
                          {calcularProgresoProyecto()}%
                        </span>
                      </div>
                      <Progress 
                        value={calcularProgresoProyecto()} 
                        className="h-3 bg-slate-200"
                      />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-slate-600">Fases: {(proyectoLocal as any).fases?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-slate-600">Completadas: {(proyectoLocal as any).fases?.filter((f: any) => f.estado === 'completed').length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Formulario para agregar nueva fase */}
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50 border-b border-slate-200">
                    <CardTitle className="text-slate-800 flex items-center gap-2">
                      <Plus className="h-5 w-5 text-blue-600" />
                      Agregar Nueva Fase
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-600">Descripción de la fase</label>
                          <Input
                            placeholder="Descripción de la fase"
                            value={nuevaFase.descripcion}
                            onChange={(e) => setNuevaFase({...nuevaFase, descripcion: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Estado</label>
                          <Select 
                            value={nuevaFase.estado} 
                            onValueChange={(value) => setNuevaFase({...nuevaFase, estado: value})}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ESTADOS_FASE.map((estado) => (
                                <SelectItem key={estado.value} value={estado.value}>
                                  {estado.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Fecha de inicio</label>
                          <Input
                            type="date"
                            value={nuevaFase.fechaInicio}
                            onChange={(e) => setNuevaFase({...nuevaFase, fechaInicio: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Fecha de fin</label>
                          <Input
                            type="date"
                            value={nuevaFase.fechaFin}
                            onChange={(e) => setNuevaFase({...nuevaFase, fechaFin: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={handleAgregarFase}
                        disabled={!nuevaFase.descripcion.trim() || loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Fase
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de fases existentes */}
                {(proyectoLocal as any).fases && (proyectoLocal as any).fases.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800">Fases del Proyecto</h3>
                    {(proyectoLocal as any).fases.map((fase: any) => {
                      const progreso = calcularProgresoFase(fase.key);
                      const isExpanded = expandedFases.has(fase.key);
                      const tareasExpanded = expandedTareas.has(fase.key);
                      
                      return (
                        <Card key={fase.key} className="bg-white border-slate-200 shadow-sm">
                          <CardHeader className="bg-slate-50 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleFase(fase.key)}
                                  className="p-1 text-slate-600 hover:text-slate-800"
                                >
                                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </Button>
                                <div>
                                  <CardTitle className="text-slate-800">{fase.descripcion}</CardTitle>
                                  <p className="text-sm text-slate-500">Clave: {fase.key}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Select 
                                  value={fase.estado} 
                                  onValueChange={(value) => handleEstadoFase(fase.key, value)}
                                  disabled={loading}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ESTADOS_FASE.map((estado) => (
                                      <SelectItem key={estado.value} value={estado.value}>
                                        {estado.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => iniciarEdicionFase(fase)}
                                    className="p-1 text-slate-600 hover:text-slate-800"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEliminarFase(fase.key)}
                                    className="p-1 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                <div className="text-right">
                                  <div className="text-sm font-medium text-slate-700">{progreso}%</div>
                                  <Progress value={progreso} className="w-20 h-2" />
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          
                          {isExpanded && (
                            <CardContent className="p-6 space-y-4">
                              {/* Formulario de edición de fase */}
                              {editandoFase === fase.key && (
                                <Card className="p-4 border border-blue-200 bg-blue-50">
                                  <div className="space-y-3">
                                    <h4 className="font-medium text-slate-800">Editar Fase</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <Input
                                        placeholder="Descripción de la fase"
                                        value={faseEditando.descripcion}
                                        onChange={(e) => setFaseEditando({...faseEditando, descripcion: e.target.value})}
                                      />
                                      <Select 
                                        value={faseEditando.estado} 
                                        onValueChange={(value) => setFaseEditando({...faseEditando, estado: value})}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {ESTADOS_FASE.map((estado) => (
                                            <SelectItem key={estado.value} value={estado.value}>
                                              {estado.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Input
                                        type="date"
                                        placeholder="Fecha de inicio"
                                        value={faseEditando.fechaInicio}
                                        onChange={(e) => setFaseEditando({...faseEditando, fechaInicio: e.target.value})}
                                      />
                                      <Input
                                        type="date"
                                        placeholder="Fecha de fin"
                                        value={faseEditando.fechaFin}
                                        onChange={(e) => setFaseEditando({...faseEditando, fechaFin: e.target.value})}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button 
                                        onClick={() => handleEditarFase(fase.key)}
                                        disabled={!faseEditando.descripcion.trim() || loading}
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                      >
                                        Guardar
                                      </Button>
                                      <Button 
                                        variant="outline"
                                        onClick={() => setEditandoFase(null)}
                                        size="sm"
                                      >
                                        Cancelar
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              )}
                              
                              {/* Comentarios */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-slate-800">Comentarios</h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleTareas(fase.key)}
                                    className="p-1 text-slate-600 hover:text-slate-800"
                                  >
                                    {tareasExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    Tareas
                                  </Button>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <Textarea
                                      placeholder="Agregar comentario..."
                                      value={nuevoComentario}
                                      onChange={(e) => setNuevoComentario(e.target.value)}
                                      className="flex-1"
                                    />
                                    <Button 
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                      <Send className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Tareas */}
                              {tareasExpanded && (
                                <div className="space-y-3">
                                  <h4 className="font-medium text-slate-800">Tareas</h4>
                                  
                                  {/* Agregar nueva tarea */}
                                  <Card className="p-4 border border-slate-200 bg-emerald-50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <Input
                                        placeholder="Título de la tarea"
                                        value={nuevaTarea.titulo}
                                        onChange={(e) => setNuevaTarea({...nuevaTarea, titulo: e.target.value})}
                                      />
                                      <Input
                                        placeholder="Responsable"
                                        value={nuevaTarea.responsable}
                                        onChange={(e) => setNuevaTarea({...nuevaTarea, responsable: e.target.value})}
                                      />
                                      <Input
                                        type="date"
                                        value={nuevaTarea.fechaLimite}
                                        onChange={(e) => setNuevaTarea({...nuevaTarea, fechaLimite: e.target.value})}
                                      />
                                      <Select 
                                        value={nuevaTarea.prioridad} 
                                        onValueChange={(value) => setNuevaTarea({...nuevaTarea, prioridad: value})}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="baja">Baja</SelectItem>
                                          <SelectItem value="media">Media</SelectItem>
                                          <SelectItem value="alta">Alta</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Textarea
                                      placeholder="Descripción de la tarea"
                                      value={nuevaTarea.descripcion}
                                      onChange={(e) => setNuevaTarea({...nuevaTarea, descripcion: e.target.value})}
                                      className="mt-3"
                                    />
                                    <Button 
                                      onClick={() => handleAgregarTarea(fase.key)}
                                      disabled={!nuevaTarea.titulo.trim() || loading}
                                      className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                                      size="sm"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Agregar Tarea
                                    </Button>
                                  </Card>

                                  {/* Lista de tareas */}
                                  <div className="space-y-2">
                                    {fase.tareas && fase.tareas.length > 0 ? (
                                      fase.tareas.map((tarea: any) => (
                                       <Card key={tarea.id} className="p-3 border border-slate-200 bg-white">
                                         {/* Formulario de edición de tarea */}
                                         {editandoTarea === tarea.id ? (
                                           <div className="space-y-3">
                                             <h4 className="font-medium text-slate-800">Editar Tarea</h4>
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                               <Input
                                                 placeholder="Título de la tarea"
                                                 value={tarea.titulo}
                                                 onChange={(e) => handleActualizarTarea(tarea.id, { titulo: e.target.value })}
                                               />
                                               <Input
                                                 placeholder="Responsable"
                                                 value={tarea.responsable}
                                                 onChange={(e) => handleActualizarTarea(tarea.id, { responsable: e.target.value })}
                                               />
                                               <Input
                                                 type="date"
                                                 value={tarea.fechaLimite}
                                                 onChange={(e) => handleActualizarTarea(tarea.id, { fechaLimite: e.target.value })}
                                               />
                                               <Select 
                                                 value={tarea.prioridad} 
                                                 onValueChange={(value) => handleActualizarTarea(tarea.id, { prioridad: value })}
                                               >
                                                 <SelectTrigger>
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="baja">Baja</SelectItem>
                                                   <SelectItem value="media">Media</SelectItem>
                                                   <SelectItem value="alta">Alta</SelectItem>
                                                 </SelectContent>
                                               </Select>
                                             </div>
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                               <Select 
                                                 value={tarea.status} 
                                                 onValueChange={(value) => handleActualizarTarea(tarea.id, { status: value })}
                                               >
                                                 <SelectTrigger>
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                   {ESTADOS_TAREA.map((estado) => (
                                                     <SelectItem key={estado.value} value={estado.value}>
                                                       {estado.label}
                                                     </SelectItem>
                                                   ))}
                                                 </SelectContent>
                                               </Select>
                                             </div>
                                             <Textarea
                                               placeholder="Descripción de la tarea"
                                               value={tarea.descripcion}
                                               onChange={(e) => handleActualizarTarea(tarea.id, { descripcion: e.target.value })}
                                             />
                                             <div className="flex gap-2">
                                               <Button 
                                                 onClick={() => setEditandoTarea(null)}
                                                 size="sm"
                                                 className="bg-blue-600 hover:bg-blue-700 text-white"
                                               >
                                                 Guardar
                                               </Button>
                                               <Button 
                                                 variant="outline"
                                                 onClick={() => setEditandoTarea(null)}
                                                 size="sm"
                                               >
                                                 Cancelar
                                               </Button>
                                             </div>
                                           </div>
                                         ) : (
                                           <div className="flex items-center justify-between">
                                             <div className="flex-1">
                                               <div className="font-medium text-slate-800">{tarea.titulo}</div>
                                               <div className="text-sm text-slate-600">{tarea.descripcion}</div>
                                               <div className="flex items-center gap-2 mt-1">
                                                 <Badge variant="outline" className="text-xs">{tarea.responsable}</Badge>
                                                 <Badge variant="outline" className="text-xs">{tarea.prioridad}</Badge>
                                                 <Badge className={`text-xs ${getTareaStatusColor(tarea.status)}`}>
                                                   {ESTADOS_TAREA.find(s => s.value === tarea.status)?.label}
                                                 </Badge>
                                               </div>
                                             </div>
                                             <div className="flex items-center gap-2">
                                               <Button 
                                                 variant="ghost" 
                                                 size="sm" 
                                                 onClick={() => setEditandoTarea(tarea.id)}
                                                 className="text-slate-600 hover:text-slate-800"
                                               >
                                                 <Edit className="h-4 w-4" />
                                               </Button>
                                               <Button 
                                                 variant="ghost" 
                                                 size="sm" 
                                                 onClick={() => handleEliminarTarea(tarea.id)}
                                                 className="text-red-600 hover:text-red-700"
                                               >
                                                 <Trash2 className="h-4 w-4" />
                                               </Button>
                                             </div>
                                           </div>
                                         )}
                                       </Card>
                                      ))
                                    ) : (
                                      <div className="text-center py-8 px-6">
                                        <div className="w-12 h-12 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                                          <CheckSquare className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <h4 className="text-lg font-semibold text-slate-800 mb-2">
                                          Sin tareas asignadas
                                        </h4>
                                        <p className="text-slate-600 mb-4 max-w-sm mx-auto">
                                          Esta fase aún no tiene tareas específicas asignadas. Las tareas se definirán según el progreso del proyecto.
                                        </p>
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 max-w-sm mx-auto">
                                          <p className="text-sm text-emerald-700">
                                            <strong>Próximamente:</strong> Se agregarán tareas detalladas para esta fase
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab de Tareas */}
            <TabsContent value="tasks" className="h-full overflow-y-auto p-4 sm:p-6">
              <div className="space-y-6">
                {/* Header de Tareas */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Gestión de Tareas</h3>
                    <p className="text-slate-600">Administra todas las tareas del proyecto de forma centralizada</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm text-slate-600">Total de tareas</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {(proyectoLocal as any).fases?.reduce((acc: number, fase: any) => acc + (fase.tareas?.length || 0), 0) || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filtros y búsqueda */}
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600 mb-2 block">Buscar tarea</label>
                        <Input
                          placeholder="Buscar por título o descripción..."
                          className="border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600 mb-2 block">Filtrar por fase</label>
                        <Select>
                          <SelectTrigger className="border-slate-200">
                            <SelectValue placeholder="Todas las fases" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas las fases</SelectItem>
                            {(proyectoLocal as any).fases?.map((fase: any) => (
                              <SelectItem key={fase.key} value={fase.key}>
                                {fase.descripcion}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600 mb-2 block">Filtrar por estado</label>
                        <Select>
                          <SelectTrigger className="border-slate-200">
                            <SelectValue placeholder="Todos los estados" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            {ESTADOS_TAREA.map((estado) => (
                              <SelectItem key={estado.value} value={estado.value}>
                                {estado.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600 mb-2 block">Filtrar por prioridad</label>
                        <Select>
                          <SelectTrigger className="border-slate-200">
                            <SelectValue placeholder="Todas las prioridades" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas las prioridades</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="baja">Baja</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de tareas por fase */}
                {(proyectoLocal as any).fases && (proyectoLocal as any).fases.length > 0 ? (
                  <div className="space-y-6">
                    {(proyectoLocal as any).fases.map((fase: any) => {
                      const tareas = fase.tareas || [];
                      if (tareas.length === 0) return null;

                      return (
                        <Card key={fase.key} className="bg-white border-slate-200 shadow-sm">
                          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Activity className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <CardTitle className="text-lg text-slate-800">{fase.descripcion}</CardTitle>
                                  <p className="text-sm text-slate-500">{tareas.length} tareas</p>
                                </div>
                              </div>
                              <Badge className={getFaseStatusColor(fase.estado)}>
                                {fase.estado}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              {tareas.map((tarea: any) => (
                                <Card key={tarea.id} className="p-4 border border-slate-200 bg-gradient-to-r from-white to-slate-50 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-semibold text-slate-800">{tarea.titulo}</h4>
                                        <Badge className={`text-xs ${getTareaStatusColor(tarea.status)}`}>
                                          {ESTADOS_TAREA.find(s => s.value === tarea.status)?.label}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {tarea.prioridad}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-slate-600 mb-3">{tarea.descripcion}</p>
                                      <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <div className="flex items-center gap-1">
                                          <User className="h-3 w-3" />
                                          <span>{tarea.responsable}</span>
                                        </div>
                                        {tarea.fechaLimite && (
                                          <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>{formatDateSafe(tarea.fechaLimite)}</span>
                                          </div>
                                        )}
                                        {tarea.fechaCreacion && (
                                          <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>Creada: {formatDateSafe(tarea.fechaCreacion)}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditandoTarea(tarea.id)}
                                        className="text-slate-600 hover:text-slate-800 transition-all duration-300 transform hover:scale-110"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEliminarTarea(tarea.id)}
                                        className="text-red-600 hover:text-red-700 transition-all duration-300 transform hover:scale-110"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Formulario de edición inline */}
                                  {editandoTarea === tarea.id && (
                                    <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                                      <h5 className="font-medium text-slate-800 mb-3">Editar Tarea</h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Input
                                          placeholder="Título de la tarea"
                                          value={tarea.titulo}
                                          onChange={(e) => handleActualizarTarea(tarea.id, { titulo: e.target.value })}
                                        />
                                        <Input
                                          placeholder="Responsable"
                                          value={tarea.responsable}
                                          onChange={(e) => handleActualizarTarea(tarea.id, { responsable: e.target.value })}
                                        />
                                        <Input
                                          type="date"
                                          value={tarea.fechaLimite}
                                          onChange={(e) => handleActualizarTarea(tarea.id, { fechaLimite: e.target.value })}
                                        />
                                        <Select 
                                          value={tarea.prioridad} 
                                          onValueChange={(value) => handleActualizarTarea(tarea.id, { prioridad: value })}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="baja">Baja</SelectItem>
                                            <SelectItem value="media">Media</SelectItem>
                                            <SelectItem value="alta">Alta</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Select 
                                          value={tarea.status} 
                                          onValueChange={(value) => handleActualizarTarea(tarea.id, { status: value })}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {ESTADOS_TAREA.map((estado) => (
                                              <SelectItem key={estado.value} value={estado.value}>
                                                {estado.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <Textarea
                                        placeholder="Descripción de la tarea"
                                        value={tarea.descripcion}
                                        onChange={(e) => handleActualizarTarea(tarea.id, { descripcion: e.target.value })}
                                        className="mt-3"
                                      />
                                      <div className="flex gap-2 mt-3">
                                        <Button 
                                          onClick={() => setEditandoTarea(null)}
                                          size="sm"
                                          className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 transform hover:scale-105"
                                        >
                                          <Save className="h-4 w-4 mr-2" />
                                          Guardar
                                        </Button>
                                        <Button 
                                          variant="outline"
                                          onClick={() => setEditandoTarea(null)}
                                          size="sm"
                                          className="transition-all duration-300 transform hover:scale-105"
                                        >
                                          Cancelar
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </Card>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-12 text-center">
                      <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                        <CheckSquare className="w-10 h-10 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">No hay tareas disponibles</h3>
                      <p className="text-slate-600 mb-6 max-w-md mx-auto">
                        Este proyecto aún no tiene tareas asignadas. Las tareas se crearán cuando se definan las fases del proyecto.
                      </p>
                      <Button 
                        onClick={() => {
                          // Cambiar a la pestaña de fases
                          const tabsList = document.querySelector('[role="tablist"]');
                          const phasesTab = tabsList?.querySelector('[value="phases"]') as HTMLElement;
                          phasesTab?.click();
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 transform hover:scale-105"
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Ir a Fases
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {(proyectoLocal as any).fases?.reduce((acc: number, fase: any) => acc + (fase.tareas?.filter((t: any) => t.status === 'completed').length || 0), 0) || 0}
                      </div>
                      <div className="text-sm text-blue-700">Completadas</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600 mb-1">
                        {(proyectoLocal as any).fases?.reduce((acc: number, fase: any) => acc + (fase.tareas?.filter((t: any) => t.status === 'in_progress').length || 0), 0) || 0}
                      </div>
                      <div className="text-sm text-yellow-700">En Progreso</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600 mb-1">
                        {(proyectoLocal as any).fases?.reduce((acc: number, fase: any) => acc + (fase.tareas?.filter((t: any) => t.status === 'blocked').length || 0), 0) || 0}
                      </div>
                      <div className="text-sm text-red-700">Bloqueadas</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-gray-600 mb-1">
                        {(proyectoLocal as any).fases?.reduce((acc: number, fase: any) => acc + (fase.tareas?.filter((t: any) => t.status === 'pending').length || 0), 0) || 0}
                      </div>
                      <div className="text-sm text-gray-700">Pendientes</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Tab de Archivos */}
            <TabsContent value="files" className="h-full overflow-y-auto p-0">
              <FileManager projectId={project.id} isAdmin={true} />
            </TabsContent>

            {/* Tab de Métricas */}
            <TabsContent value="metrics" className="h-full overflow-y-auto p-4 sm:p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b border-slate-200">
                      <CardTitle className="text-slate-800 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        Progreso General
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {calcularProgresoProyecto()}%
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${calcularProgresoProyecto()}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-sm text-slate-600 mt-2">
                          {(proyectoLocal as any).fases?.length || 0} fases • {(proyectoLocal as any).fases?.reduce((acc: number, fase: any) => acc + (fase.tareas?.length || 0), 0) || 0} tareas
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b border-slate-200">
                      <CardTitle className="text-slate-800 flex items-center gap-2">
                        <Users className="h-5 w-5 text-green-600" />
                        Actividad
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Fases Completadas</span>
                          <span className="font-medium text-slate-800">
                            {(proyectoLocal as any).fases?.filter((f: any) => f.estado === 'Terminado').length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Tareas Pendientes</span>
                          <span className="font-medium text-slate-800">
                            {(proyectoLocal as any).fases?.reduce((acc: number, fase: any) => acc + (fase.tareas?.filter((t: any) => t.status !== 'completed').length || 0), 0) || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Comentarios</span>
                          <span className="font-medium text-slate-800">
                            {(proyectoLocal as any).fases?.reduce((acc: number, fase: any) => acc + (fase.comentarios?.length || 0), 0) || 0}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b border-slate-200">
                      <CardTitle className="text-slate-800 flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-purple-600" />
                        Rendimiento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Tareas Completadas</span>
                          <span className="font-medium text-slate-800">
                            {(proyectoLocal as any).fases?.reduce((acc: number, fase: any) => acc + (fase.tareas?.filter((t: any) => t.status === 'completed').length || 0), 0) || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Tareas en Progreso</span>
                          <span className="font-medium text-slate-800">
                            {(proyectoLocal as any).fases?.reduce((acc: number, fase: any) => acc + (fase.tareas?.filter((t: any) => t.status === 'in_progress').length || 0), 0) || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Tareas Bloqueadas</span>
                          <span className="font-medium text-slate-800">
                            {(proyectoLocal as any).fases?.reduce((acc: number, fase: any) => acc + (fase.tareas?.filter((t: any) => t.status === 'blocked').length || 0), 0) || 0}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b border-slate-200">
                      <CardTitle className="text-slate-800">Resumen de Fases</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {(proyectoLocal as any).fases && (proyectoLocal as any).fases.length > 0 ? (
                          (proyectoLocal as any).fases.map((fase: any) => {
                            const progreso = calcularProgresoFase(fase.key);
                            return (
                              <div key={fase.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <span className="text-sm text-slate-600">{fase.descripcion || fase.key}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-20 h-2 bg-slate-200 rounded-full">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                      style={{ width: `${progreso}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium text-slate-700">{progreso}%</span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8">
                            <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-500">No hay fases definidas para este proyecto</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b border-slate-200">
                      <CardTitle className="text-slate-800">Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-slate-700">Proyecto iniciado</span>
                          <span className="text-slate-500 ml-auto">{formatDateSafe(project.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-slate-700">{(proyectoLocal as any).fases?.reduce((acc: number, fase: any) => acc + (fase.comentarios?.length || 0), 0) || 0} comentarios agregados</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-slate-700">{(proyectoLocal as any).fases?.reduce((acc: number, fase: any) => acc + (fase.tareas?.length || 0), 0) || 0} tareas creadas</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
