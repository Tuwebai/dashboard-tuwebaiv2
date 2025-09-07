import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  FileText, 
  CheckSquare, 
  Users, 
  Upload, 
  Download, 
  Send,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Image,
  Video,
  Music,
  Code,
  Archive,
  FileSpreadsheet,
  Presentation,
  Eye,
  Crown,
  Shield,
  Settings,
  BarChart3,
  Plus
} from 'lucide-react';
import { formatDateSafe } from '@/utils/formatDateSafe';
import { supabase } from '@/lib/supabase';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  assigneeName: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  phaseKey: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  sender_name: string;
  created_at: string;
  type: 'text' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  role: 'admin' | 'cliente';
}

interface ProjectFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  projectId: string;
}

interface CollaborationStats {
  totalMessages: number;
  totalComments: number;
  totalTasks: number;
  completedTasks: number;
  activeUsers: number;
  lastActivity: string;
  projectProgress: number;
  filesUploaded: number;
  timeSpent: number;
}

export default function AdminCollaborationPage() {
  const { theme } = useTheme();
  const { projectId } = useParams<{ projectId: string }>();
  const { user, projects } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  const [project, setProject] = useState<any>(null);
  const [collaborationStats, setCollaborationStats] = useState<CollaborationStats>({
    totalMessages: 0,
    totalComments: 0,
    totalTasks: 0,
    completedTasks: 0,
    activeUsers: 0,
    lastActivity: '',
    projectProgress: 0,
    filesUploaded: 0,
    timeSpent: 0
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    dueDate: '',
    assignee: ''
  });
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [userAvatars, setUserAvatars] = useState<Record<string, { avatar_url?: string; full_name?: string; email?: string }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar proyecto y datos de colaboración
  useEffect(() => {
    if (projectId) {
      loadProjectData();
      loadCollaborationData();
    }
  }, [projectId]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (messages.length > 0) {
      // Usar setTimeout para asegurar que el DOM se haya actualizado
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [messages]);

  // Initialize current user avatar
  useEffect(() => {
    if (user) {
      setUserAvatars(prev => ({
        ...prev,
        [user.id]: {
          avatar_url: user.avatar_url,
          full_name: user.full_name,
          email: user.email
        }
      }));
    }
  }, [user]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      
      // Cargar información del proyecto
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        // Manejar específicamente el error de proyecto no encontrado
        if (projectError.code === 'PGRST116') {
          toast({
            title: 'Proyecto no encontrado',
            description: 'El proyecto que buscas no existe o no tienes permisos para acceder a él.',
            variant: 'destructive'
          });
          // Redirigir al dashboard después de un breve delay
          setTimeout(() => {
            window.location.href = '/admin';
          }, 3000);
          return;
        }
        throw projectError;
      }

      if (!projectData) {
        toast({
          title: 'Proyecto no disponible',
          description: 'No se pudo encontrar la información del proyecto.',
          variant: 'destructive'
        });
        setTimeout(() => {
          window.location.href = '/admin';
        }, 3000);
        return;
      }

      setProject(projectData);

      // Cargar información del cliente creador
      if (projectData.created_by) {
        const { data: clientData, error: clientError } = await supabase
          .from('users')
          .select('*')
          .eq('id', projectData.created_by)
          .single();

        if (!clientError && clientData) {
          setClientInfo(clientData);
        }
      }
    } catch (error: any) {
      // Solo mostrar errores críticos en consola, no errores de "proyecto no encontrado"
      if (error?.code !== 'PGRST116') {
        console.error('Error crítico cargando proyecto:', error);
      }
      
      // Mostrar notificación amigable
      toast({
        title: 'Error al cargar el proyecto',
        description: 'Hubo un problema al cargar la información. Por favor, intenta nuevamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCollaborationData = async () => {
    try {
      // Cargar mensajes del chat
      const { data: messagesData, error: messagesError } = await supabase
        .from('project_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (!messagesError && messagesData) {
        setMessages(messagesData);
        // Cargar avatares de usuarios
        loadUserAvatars(messagesData);
      }

      // Cargar tareas
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!tasksError && tasksData) {
        setTasks(tasksData);
      }

      // Cargar archivos
      const { data: filesData, error: filesError } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!filesError && filesData) {
        setFiles(filesData);
      }

      // Calcular estadísticas
      calculateStats();
    } catch (error) {
      console.error('Error cargando datos de colaboración:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de colaboración',
        variant: 'destructive'
      });
    }
  };

  // Load user avatars for all participants in the chat
  const loadUserAvatars = async (chatData: any[]) => {
    if (!chatData || chatData.length === 0) return;
    
    try {
      const uniqueUserIds = [...new Set(chatData.map(msg => msg.sender))];
              const avatarsToLoad: Record<string, { avatar_url?: string; full_name?: string; email?: string }> = {};
      
      for (const userId of uniqueUserIds) {
        // Skip if we already have this user's data
        if (userAvatars[userId]) {
          continue;
        }
        
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('id, full_name, email, avatar_url')
            .eq('id', userId)
            .single();
          
          if (error) {
            console.error(`Error fetching user ${userId} for avatar:`, error);
          } else if (userData) {
            avatarsToLoad[userId] = {
              avatar_url: userData.avatar_url,
              full_name: userData.full_name,
              email: userData.email
            };
          }
        } catch (fetchError) {
          console.error(`Exception fetching user ${userId} for avatar:`, fetchError);
        }
      }
      
      if (Object.keys(avatarsToLoad).length > 0) {
        setUserAvatars(prev => ({ ...prev, ...avatarsToLoad }));
      }
    } catch (error) {
      console.error('Error in loadUserAvatars:', error);
    }
  };

  const calculateStats = () => {
    const totalMessages = messages.length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const filesUploaded = files.length;
    const lastActivity = messages.length > 0 ? messages[messages.length - 1]?.created_at : '';
    
    setCollaborationStats({
      totalMessages,
      totalComments: totalTasks,
      totalTasks,
      completedTasks,
      activeUsers: 2, // Admin + Cliente
      lastActivity,
      projectProgress: project?.progress || 0,
      filesUploaded,
      timeSpent: 0
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const messageData = {
        project_id: projectId,
        text: newMessage.trim(),
        sender: user.id,
        sender_name: user.full_name || user.email,
        type: 'text' as const,
        role: 'admin' as const
      };

      const { data, error } = await supabase
        .from('project_messages')
        .insert([messageData])
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);
      setNewMessage('');
      
      // Enviar notificación al cliente (solo para el cliente, no para el admin)
      try {
        // Crear notificación para el cliente
        const notificationData = {
          user_id: project?.created_by, // ID del cliente
          title: 'Nuevo mensaje del admin',
          message: `${user.full_name || user.email} ha enviado un mensaje en el proyecto "${project?.name}"`,
          type: 'info',
          category: 'project',
          action_url: `/proyectos/${projectId}/colaboracion-admin`,
          metadata: {
            project_id: projectId,
            project_name: project?.name,
            sender_id: user.id,
            sender_name: user.full_name || user.email
          }
        };
        

        
        await supabase
          .from('notifications')
          .insert(notificationData);
         

       } catch (notificationError) {
         console.error('❌ [AdminCollaborationPage] Error enviando notificación:', notificationError);
       }
      
      toast({
        title: 'Mensaje enviado',
        description: 'El mensaje se ha enviado correctamente al cliente'
      });
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive'
      });
    }
  };

  const createTask = async () => {
    if (!newTask.title.trim() || !user) return;

    try {
      const taskData = {
        project_id: projectId!,
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        priority: newTask.priority,
        due_date: newTask.dueDate,
        assignee: newTask.assignee || user.id,
        assignee_name: user.full_name || user.email,
        status: 'pending' as const,
        phase_key: 'general'
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => [data, ...prev]);
             setNewTask({
         title: '',
         description: '',
         priority: 'medium',
         dueDate: '',
         assignee: ''
       });
       setShowNewTaskForm(false);

       // Enviar notificación al cliente sobre la nueva tarea
       try {
         const notificationData = {
           user_id: project?.created_by, // ID del cliente
           title: 'Nueva tarea creada',
           message: `${user.full_name || user.email} ha creado una nueva tarea: "${newTask.title}" en el proyecto "${project?.name}"`,
           type: 'info',
           category: 'project',
           action_url: `/proyectos/${projectId}/colaboracion-admin`,
           metadata: {
             project_id: projectId,
             project_name: project?.name,
             task_id: data.id,
             task_title: newTask.title,
             sender_id: user.id,
             sender_name: user.full_name || user.email
           }
         };
         

         
         await supabase
           .from('notifications')
           .insert(notificationData);
       } catch (notificationError) {
         console.error('Error enviando notificación de tarea:', notificationError);
       }

       toast({
         title: 'Tarea creada',
         description: 'La tarea se ha creado correctamente'
       });
    } catch (error) {
      console.error('Error creando tarea:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la tarea',
        variant: 'destructive'
      });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

             setTasks(prev => prev.map(task => 
         task.id === taskId ? { ...task, status: newStatus } : task
       ));

       // Enviar notificación al cliente sobre el cambio de estado de la tarea
       try {
         const updatedTask = tasks.find(t => t.id === taskId);
         if (updatedTask) {
           const notificationData = {
             user_id: project?.created_by, // ID del cliente
             title: 'Estado de tarea actualizado',
             message: `La tarea "${updatedTask.title}" ha sido marcada como ${newStatus === 'completed' ? 'completada' : newStatus === 'in-progress' ? 'en progreso' : newStatus} en el proyecto "${project?.name}"`,
             type: 'success',
             category: 'project',
             action_url: `/proyectos/${projectId}/colaboracion-admin`,
             metadata: {
               project_id: projectId,
               project_name: project?.name,
               task_id: taskId,
               task_title: updatedTask.title,
               new_status: newStatus,
               sender_id: user.id,
               sender_name: user.full_name || user.email
             }
           };
           

           
           await supabase
             .from('notifications')
             .insert(notificationData);
         }
       } catch (notificationError) {
         console.error('Error enviando notificación de cambio de estado:', notificationError);
       }

       calculateStats();
    } catch (error) {
      console.error('Error actualizando tarea:', error);
    }
  };

  const uploadFile = async (file: File) => {
    if (!user || !projectId) return;

    try {
      setUploading(true);
      
      // Subir archivo a storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(`${projectId}/${fileName}`, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(`${projectId}/${fileName}`);

      // Guardar referencia en base de datos
      const fileData = {
        project_id: projectId,
        name: file.name,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type,
        uploaded_by: user.id,
        uploaded_by_name: user.full_name || user.email
      };

      const { data, error } = await supabase
        .from('project_files')
        .insert([fileData])
        .select()
        .single();

      if (error) throw error;

             setFiles(prev => [data, ...prev]);
       calculateStats();

       // Enviar notificación al cliente sobre el archivo subido
       try {
         const notificationData = {
           user_id: project?.created_by, // ID del cliente
           title: 'Nuevo archivo compartido',
           message: `${user.full_name || user.email} ha compartido un archivo: "${file.name}" en el proyecto "${project?.name}"`,
           type: 'info',
           category: 'project',
           action_url: `/proyectos/${projectId}/colaboracion-admin`,
           metadata: {
             project_id: projectId,
             project_name: project?.name,
             file_id: data.id,
             file_name: file.name,
             sender_id: user.id,
             sender_name: user.full_name || user.email
           }
         };
         

         
         await supabase
           .from('notifications')
           .insert(notificationData);
       } catch (notificationError) {
         console.error('Error enviando notificación de archivo:', notificationError);
       }

       toast({
         title: 'Archivo subido',
         description: 'El archivo se ha subido correctamente'
       });
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir el archivo',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-700';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-700';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700';
      case 'low': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-700';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-700';
      case 'in-progress': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-700';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700';
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-700';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando colaboración...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Proyecto no encontrado</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">El proyecto que buscas no existe o no tienes acceso.</p>
          <Button onClick={() => navigate('/admin')} variant="outline" className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Admin
              </Button>
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-600"></div>
              <div>
                <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  Colaboración: {project.name}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Colaborando con {clientInfo?.full_name || clientInfo?.email || 'Cliente'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400">
                <Crown className="h-3 w-3 mr-1" />
                Admin
              </Badge>
              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-700">
                <Shield className="h-3 w-3 mr-1" />
                {project.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Mensajes</p>
                <p className="text-2xl font-bold text-slate-800">{collaborationStats.totalMessages}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckSquare className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tareas</p>
                <p className="text-2xl font-bold text-slate-800">{collaborationStats.totalTasks}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Archivos</p>
                <p className="text-2xl font-bold text-slate-800">{collaborationStats.filesUploaded}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Progreso</p>
                <p className="text-2xl font-bold text-slate-800">{collaborationStats.projectProgress}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs principales */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <TabsTrigger value="chat" className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">
              <CheckSquare className="h-4 w-4" />
              Tareas
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">
              <FileText className="h-4 w-4" />
              Archivos
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">
              <BarChart3 className="h-4 w-4" />
              Resumen
            </TabsTrigger>
          </TabsList>

          {/* Tab Chat */}
          <TabsContent value="chat" className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Chat de Colaboración</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Comunícate directamente con el cliente sobre el proyecto
                </p>
              </div>
              
              {/* Mensajes */}
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">No hay mensajes aún. ¡Inicia la conversación!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.sender === user?.id;
                    const userData = userAvatars[message.sender];
                    return (
                      <div
                        key={message.id}
                        className={`flex items-start gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                      >
                        <Avatar 
                          className={`w-8 h-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-600 transition-all duration-200 ${isOwnMessage ? 'ring-2 ring-blue-500 dark:ring-blue-400' : 'ring-2 ring-slate-200 dark:ring-slate-600'}`}
                          onClick={() => {
                            if (isOwnMessage) {
                              // Si es el usuario actual, ir a su perfil
                              navigate('/perfil');
                            } else {
                              // Si es otro usuario, ir a su perfil en modo solo lectura
                              navigate(`/perfil/${message.sender}`);
                            }
                          }}
                        >
                          {userData?.avatar_url ? (
                            <AvatarImage
                              src={userData.avatar_url}
                              alt={userData.full_name || userData.email || 'Usuario'}
                              className="object-cover"
                            />
                          ) : (
                            <AvatarFallback className={`text-sm font-medium ${
                              isOwnMessage ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'
                            }`}>
                              {userData?.full_name?.charAt(0).toUpperCase() || message.sender_name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className={`flex-1 min-w-0 ${isOwnMessage ? 'text-right' : ''}`}>
                          <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                            <span className="font-medium text-slate-800 dark:text-slate-100">{message.sender_name}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDateSafe(message.created_at)}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                isOwnMessage
                                  ? 'border-blue-200 dark:border-blue-700 text-blue-100 dark:text-blue-400'
                                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {isOwnMessage ? 'Admin' : 'Cliente'}
                            </Badge>
                          </div>
                          <div className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwnMessage 
                              ? 'bg-blue-500 text-white rounded-br-none' 
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'
                          }`}>
                            <p className="text-sm">{message.text}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de mensaje */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab Tareas */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Gestión de Tareas</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Crea y gestiona tareas para el proyecto
                    </p>
                  </div>
                  <Button onClick={() => setShowNewTaskForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Tarea
                  </Button>
                </div>
              </div>

              {/* Lista de tareas */}
              <div className="p-4 space-y-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckSquare className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">No hay tareas creadas aún.</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 hover:shadow-sm transition-shadow bg-white dark:bg-slate-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-slate-800 dark:text-slate-100">{task.title}</h4>
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            <Badge className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{task.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                            <span>Asignado: {task.assigneeName}</span>
                            {task.dueDate && (
                              <span>Vence: {formatDateSafe(task.dueDate)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {task.status !== 'completed' && (
                            <Button
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, 'completed')}
                              className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {task.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTaskStatus(task.id, 'in-progress')}
                              className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab Archivos */}
          <TabsContent value="files" className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Archivos del Proyecto</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Comparte archivos y documentos con el cliente
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="max-w-xs bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                    />
                    {uploading && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
                        Subiendo...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Lista de archivos */}
              <div className="p-4">
                {files.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">No hay archivos compartidos aún.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 hover:shadow-sm transition-shadow bg-white dark:bg-slate-800"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-800 dark:text-slate-100 truncate">{file.name}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Subido por {file.uploadedByName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDateSafe(file.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(file.url, '_blank')}
                            className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(file.url, '_blank')}
                            className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Descargar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab Resumen */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Progreso del proyecto */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Progreso del Proyecto</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progreso General</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{project.progress || 0}%</span>
                    </div>
                    <Progress value={project.progress || 0} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{collaborationStats.totalTasks}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Total Tareas</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{collaborationStats.completedTasks}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Completadas</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actividad reciente */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Actividad Reciente</h3>
                <div className="space-y-3">
                  {messages.slice(-3).reverse().map((message) => (
                    <div key={message.id} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <MessageSquare className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                          {message.sender_name}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{message.text}</p>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDateSafe(message.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal Nueva Tarea */}
      {showNewTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Crear Nueva Tarea</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="task-title" className="text-slate-700 dark:text-slate-300">Título</Label>
                <Input
                  id="task-title"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título de la tarea"
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                />
              </div>
              
              <div>
                <Label htmlFor="task-description" className="text-slate-700 dark:text-slate-300">Descripción</Label>
                <Textarea
                  id="task-description"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción de la tarea"
                  rows={3}
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="task-priority" className="text-slate-700 dark:text-slate-300">Prioridad</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="task-due-date" className="text-slate-700 dark:text-slate-300">Fecha de vencimiento</Label>
                  <Input
                    id="task-due-date"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setShowNewTaskForm(false)}
                className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={createTask}
                disabled={!newTask.title.trim()}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
              >
                Crear Tarea
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
