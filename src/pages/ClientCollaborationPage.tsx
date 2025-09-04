import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
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
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  file_url?: string;
  file_name?: string;
  role: string;
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

export default function ClientCollaborationPage() {
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

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);

  // Files state
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState<globalThis.File | null>(null);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);

  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentPhase, setCommentPhase] = useState('');

  // Collaboration state
  const [participants, setParticipants] = useState<string[]>([]);
  
  // User avatars state
  const [userAvatars, setUserAvatars] = useState<Record<string, { avatar_url?: string; full_name?: string; email?: string }>>({});
  
  // Initialize current user avatar
  useEffect(() => {
    if (user) {
      setUserAvatars(prev => ({
        ...prev,
        [user.id]: {
          avatar: user.avatar,
          full_name: user.full_name,
          email: user.email
        }
      }));
    }
  }, [user]);

  // Find project by ID
  useEffect(() => {
    if (!projectId) return;
    
    // Primero buscar en el contexto local
    let foundProject = projects.find(p => p.id === projectId);
    
    if (foundProject) {
      setProject(foundProject);
    } else {
      // Si no está en el contexto, buscar directamente en la base de datos
      const loadProjectFromDatabase = async () => {
        try {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

          if (error || !data) {
            setProject(null);
            toast({
              title: 'Error',
              description: 'Proyecto no encontrado o no tienes acceso',
              variant: 'destructive'
            });
            navigate('/dashboard');
            return;
          }

          // Verificar que el usuario tenga acceso al proyecto
          if (data.created_by === user?.id || user?.role === 'admin') {
            setProject(data);
          } else {
            setProject(null);
            toast({
              title: 'Error',
              description: 'No tienes permisos para acceder a este proyecto',
              variant: 'destructive'
            });
            navigate('/dashboard');
          }
        } catch (error) {
          console.error('Error cargando proyecto:', error);
          setProject(null);
          toast({
            title: 'Error',
            description: 'Error al cargar el proyecto',
            variant: 'destructive'
          });
          navigate('/dashboard');
        }
      };

      loadProjectFromDatabase();
    }
  }, [projectId, projects, navigate, user?.id, user?.role]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      // Usar setTimeout para asegurar que el DOM se haya actualizado
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [messages]);

  // Load collaboration data
  useEffect(() => {
    if (!project || !user) return;

    const loadCollaborationData = async () => {
      try {
        // Cargar mensajes del chat
        const { data: chatData } = await supabase
          .from('project_messages')
          .select('*')
          .eq('project_id', project.id)
          .order('created_at', { ascending: true });

        if (chatData) {
          setMessages(chatData);
        }

        // Cargar tareas del proyecto
        const { data: tasksData } = await supabase
          .from('project_tasks')
          .select('*')
          .eq('project_id', project.id);

        if (tasksData) {
          setTasks(tasksData);
        }

        // Cargar archivos del proyecto
        const { data: filesData } = await supabase
          .from('project_files')
          .select('*')
          .eq('project_id', project.id)
          .order('uploaded_at', { ascending: false });

        if (filesData) {
          setFiles(filesData);
        }

        // Cargar comentarios específicos por fases (mensajes que contienen [fase])
        const phaseComments = chatData?.filter((msg: any) => 
          msg.text && msg.text.includes('[') && msg.text.includes(']')
        ) || [];
        setComments(phaseComments);

        // Actualizar estadísticas
        updateCollaborationStats(chatData, tasksData, filesData, []);
        
        // Cargar avatares de usuarios
        loadUserAvatars(chatData);

      } catch (error) {
        console.error('Error cargando datos de colaboración:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos de colaboración',
          variant: 'destructive'
        });
      }
    };

    loadCollaborationData();
  }, [project, user]);

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
          
          if (!error && userData) {
            avatarsToLoad[userId] = {
              avatar_url: userData.avatar_url,
              full_name: userData.full_name,
              email: userData.email
            };
          } else {
            console.error(`Error fetching user ${userId}:`, error);
          }
        } catch (error) {
          console.error(`Error loading avatar for user ${userId}:`, error);
        }
      }
      
      if (Object.keys(avatarsToLoad).length > 0) {
        setUserAvatars(prev => ({ ...prev, ...avatarsToLoad }));
      }
    } catch (error) {
      console.error('Error loading user avatars:', error);
    }
  };

  // Update collaboration stats
  const updateCollaborationStats = (chatData: any[], tasksData: any[], filesData: any[], commentsData: any[]) => {
    const totalTasks = tasksData?.length || 0;
    const completedTasks = tasksData?.filter((t: any) => t.status === 'completed').length || 0;
    const totalMessages = chatData?.length || 0;
    const totalComments = commentsData?.length || 0; // Solo comentarios específicos por fases
    const filesUploaded = filesData?.length || 0;

    setCollaborationStats({
      totalMessages,
      totalComments,
      totalTasks,
      completedTasks,
      activeUsers: participants.length,
      lastActivity: new Date().toISOString(),
      projectProgress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      filesUploaded,
      timeSpent: 0
    });
  };

  // Send chat message
  const sendMessage = async () => {
    if (!newMessage.trim() || !project || !user) return;

    try {
      const messageData = {
        text: newMessage.trim(),
        sender: user.id,
        sender_name: user.full_name || user.email,
        project_id: project.id,
        type: 'text',
        role: 'cliente'
      };

      const { data: newMessageData, error: messageError } = await supabase
        .from('project_messages')
        .insert(messageData)
        .select()
        .single();

      if (messageError) {
        throw messageError;
      }

      // Agregar el mensaje inmediatamente al estado local
      if (newMessageData) {
        setMessages(prev => [...prev, newMessageData]);
        
        // Cargar avatar del remitente si no está en el estado
        if (!userAvatars[newMessageData.sender]) {
          loadUserAvatars([newMessageData]);
        }
      }

             // Enviar notificación al admin
       try {
         await supabase.from('notifications').insert({
           user_id: project.created_by,
           sender_id: user.id,
           sender_name: user.full_name || user.email,
           project_name: project.name
         });
         
         const notificationData = {
           user_id: project.created_by, // ID del admin
           title: 'Nuevo mensaje en proyecto',
           message: `${user.full_name || user.email} ha enviado un mensaje en el proyecto "${project.name}"`,
           type: 'info',
           category: 'project',
           action_url: `/proyectos/${project.id}/colaboracion-admin`,
           metadata: {
             project_id: project.id,
             project_name: project.name,
             sender_id: user.id,
             sender_name: user.full_name || user.email
           }
         };
         

         
         await supabase
           .from('notifications')
           .insert(notificationData);
         

       } catch (notificationError) {
         console.error('❌ [ClientCollaborationPage] Error enviando notificación:', notificationError);
       }

      setNewMessage('');
      toast({
        title: 'Mensaje enviado',
        description: 'Tu mensaje se ha enviado correctamente'
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

  // Upload file
  const uploadFile = async (file: File) => {
    if (!project || !user) return;

    try {
      setUploadingFile(file);
      setFileUploadProgress(10);

      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${project.id}/${fileName}`;

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública del archivo
      const { data: urlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        throw new Error('No se pudo obtener la URL pública del archivo');
      }

      // Actualizar progreso
      setFileUploadProgress(90);

      // Guardar metadatos del archivo en la base de datos
      const fileData = {
        name: file.name,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type,
        uploaded_by: user.id,
        uploaded_by_name: user.full_name || user.email,
        project_id: project.id
      };

      const { error: fileError } = await supabase
        .from('project_files')
        .insert(fileData);
      
      if (fileError) {
        throw fileError;
      }
      
      setFileUploadProgress(100);
      setUploadingFile(null);
      
      // Enviar notificación al admin sobre el archivo subido
      try {
        const notificationData = {
          user_id: project.created_by, // ID del admin
          title: 'Nuevo archivo compartido',
          message: `${user.full_name || user.email} ha compartido un archivo: "${file.name}" en el proyecto "${project.name}"`,
          type: 'info',
          category: 'project',
          action_url: `/proyectos/${project.id}/colaboracion-admin`,
          metadata: {
             project_id: project.id,
             project_name: project.name,
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

      setTimeout(() => setFileUploadProgress(0), 1000);
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      setUploadingFile(null);
      setFileUploadProgress(0);
      toast({
        title: 'Error',
        description: 'No se pudo subir el archivo',
        variant: 'destructive'
      });
    }
  };

  // Los comentarios se manejan a través de los mensajes del chat
  const addCommentToPhase = async (phaseKey: string) => {
    if (!newComment.trim() || !phaseKey || !project) return;

    try {
      const messageData = {
        text: `[${phaseKey}] ${newComment.trim()}`,
        sender: user.id,
        sender_name: user.full_name || user.email,
        project_id: project.id,
        type: 'text',
        role: 'cliente'
      };

      const { data: newCommentData, error: messageError } = await supabase
        .from('project_messages')
        .insert(messageData)
        .select()
        .single();
      
      if (messageError) {
        throw messageError;
      }

      // Agregar el comentario al estado local
      if (newCommentData) {
        setComments(prev => [...prev, newCommentData]);
        // También agregar al chat para mantener sincronización
        setMessages(prev => [...prev, newCommentData]);
      }

      setNewComment('');
      setCommentPhase('');
      
      // Enviar notificación al admin sobre el comentario de fase
      try {
        const notificationData = {
          user_id: project.created_by, // ID del admin
          title: 'Nuevo comentario de fase',
          message: `${user.full_name || user.email} ha agregado un comentario a la fase "${phaseKey}" en el proyecto "${project.name}"`,
          type: 'info',
          category: 'project',
          action_url: `/proyectos/${project.id}/colaboracion-admin`,
          metadata: {
             project_id: project.id,
             project_name: project.name,
             phase_key: phaseKey,
             comment_text: newComment.trim(),
             sender_id: user.id,
             sender_name: user.full_name || user.email
           }
        };
        

        
        await supabase
          .from('notifications')
          .insert(notificationData);
       } catch (notificationError) {
         console.error('Error enviando notificación de comentario:', notificationError);
       }
      
      toast({
        title: 'Comentario agregado',
        description: 'El comentario se ha agregado correctamente'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo agregar el comentario',
        variant: 'destructive'
      });
    }
  };

  // Utility functions
  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <Image className="h-8 w-8 text-blue-500" />;
    if (fileType.includes('video')) return <Video className="h-8 w-8 text-purple-500" />;
    if (fileType.includes('audio')) return <Music className="h-8 w-8 text-green-500" />;
    if (fileType.includes('code') || fileType.includes('text')) return <Code className="h-8 w-8 text-orange-500" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return <Presentation className="h-8 w-8 text-red-500" />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="h-8 w-8 text-gray-500" />;
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Check user authorization
  useEffect(() => {
    if (!user || (user.role !== 'client' && user.role !== 'user')) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  // Si no hay usuario o no es autorizado, mostrar loading
  if (!user || (user.role !== 'client' && user.role !== 'user')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header con diseño claro */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Colaboración - {project.name}</h1>
                <p className="text-slate-600 mt-2">Espacio de trabajo colaborativo para tu proyecto</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1 bg-slate-100 text-slate-700 border-slate-200">
                <Users className="h-3 w-3" />
                {participants.length} participantes
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards con diseño claro */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Mensajes</p>
                <p className="text-2xl font-bold text-slate-800">{collaborationStats.totalMessages}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Tareas</p>
                <p className="text-2xl font-bold text-slate-800">{collaborationStats.totalTasks}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Completadas</p>
                <p className="text-2xl font-bold text-slate-800">{collaborationStats.completedTasks}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Archivos</p>
                <p className="text-2xl font-bold text-slate-800">{collaborationStats.filesUploaded}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Comentarios</p>
                <p className="text-2xl font-bold text-slate-800">{collaborationStats.totalComments}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Progreso</p>
                <p className="text-2xl font-bold text-slate-800">{collaborationStats.totalTasks > 0 ? Math.round((collaborationStats.completedTasks / collaborationStats.totalTasks) * 100) : 0}%</p>
              </div>
              <CheckSquare className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* Main Content con diseño claro */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                         <TabsList className="grid w-full grid-cols-4 bg-slate-100 border border-slate-200">
               <TabsTrigger 
                 value="chat" 
                 className="flex items-center gap-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm font-medium"
               >
                 <MessageSquare className="h-4 w-4" />
                 Chat
               </TabsTrigger>
               <TabsTrigger 
                 value="tasks" 
                 className="flex items-center gap-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm font-medium"
               >
                 <CheckSquare className="h-4 w-4" />
                 Tareas
               </TabsTrigger>
               <TabsTrigger 
                 value="files" 
                 className="flex items-center gap-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm font-medium"
               >
                 <FileText className="h-4 w-4" />
                 Archivos
               </TabsTrigger>
               <TabsTrigger 
                 value="comments" 
                 className="flex items-center gap-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm font-medium"
               >
                 <MessageSquare className="h-4 w-4" />
                 Comentarios
               </TabsTrigger>
             </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat del Proyecto
                </h3>
                
                                 <div className="h-96 overflow-y-auto space-y-4 border border-slate-200 rounded-lg p-4 bg-white">
                   {messages.length > 0 ? (
                                                             messages.map((message) => {
                    const isOwnMessage = message.sender === user.id;
                    const userData = userAvatars[message.sender];
                    return (
                          <div key={message.id} className={`flex items-start gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                            <Avatar 
                              className={`w-8 h-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all duration-200 ${isOwnMessage ? 'ring-2 ring-blue-500' : 'ring-2 ring-slate-200'}`}
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
                              ) : null}
                              <AvatarFallback className={`text-sm font-medium ${
                                isOwnMessage ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {(userData?.full_name || userData?.email || message.sender_name || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                           <div className={`flex-1 min-w-0 ${isOwnMessage ? 'text-right' : ''}`}>
                             <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                               <span className="font-medium text-slate-800">{message.sender_name}</span>
                               <span className="text-xs text-slate-500">
                                 {formatDateSafe(message.created_at)}
                               </span>
                             </div>
                             <div className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                               isOwnMessage 
                                 ? 'bg-blue-500 text-white rounded-br-none' 
                                 : 'bg-slate-100 text-slate-800 rounded-bl-none'
                             }`}>
                               <p className="text-sm">{message.text}</p>
                             </div>
                           </div>
                         </div>
                       );
                     })
                   ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">No hay mensajes aún. ¡Sé el primero en escribir!</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex gap-2 mt-4">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Tareas del Proyecto
                </h3>
                
                <div className="space-y-3">
                  {tasks.length > 0 ? (
                    tasks.map((task) => (
                      <div key={task.id} className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusIcon(task.status)}
                              <h4 className="font-medium text-slate-800">{task.title}</h4>
                              <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span>Asignado a: {task.assigneeName}</span>
                              {task.dueDate && (
                                <span>Vence: {formatDateSafe(task.dueDate)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">No hay tareas asignadas aún</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Archivos del Proyecto
                  </h3>
                   
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadFile(file);
                      }}
                      className="hidden"
                      id="file-upload"
                    />
                    <Label 
                      htmlFor="file-upload" 
                      className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Subir Archivo
                    </Label>
                  </div>
                </div>

                {uploadingFile && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Upload className="h-4 w-4 text-blue-500 animate-pulse" />
                      <span className="text-sm font-medium text-blue-700">Subiendo {uploadingFile.name}...</span>
                    </div>
                    <Progress value={fileUploadProgress} className="h-2" />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {files.length > 0 ? (
                    files.map((file) => (
                      <div key={file.id} className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          {getFileIcon(file.type)}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-800 truncate mb-1">{file.name}</h4>
                            <p className="text-xs text-slate-500 mb-2">{formatFileSize(file.size)}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>Subido por: {file.uploadedByName}</span>
                              <span>•</span>
                              <span>{formatDateSafe(file.uploadedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(file.url, '_blank')}
                            className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = file.url;
                              a.download = file.name;
                              a.click();
                            }}
                            className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">No hay archivos subidos aún</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comentarios por Fase
                </h3>
                
                <div className="flex items-center gap-2 mb-4">
                  <Select value={commentPhase} onValueChange={setCommentPhase}>
                    <SelectTrigger className="w-40 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                      <SelectValue placeholder="Seleccionar fase" />
                    </SelectTrigger>
                    <SelectContent>
                      {project.fases?.map((fase: any) => (
                        <SelectItem key={fase.key} value={fase.key}>
                          {fase.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => addCommentToPhase(commentPhase)}
                    disabled={!newComment.trim() || !commentPhase}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Comentar
                  </Button>
                </div>

                {commentPhase && (
                  <div className="bg-white rounded-lg p-4 border border-slate-200 mb-4">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={`Agregar comentario en ${commentPhase}...`}
                      className="border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                )}

                                 <div className="space-y-3">
                   {comments
                     .filter(comment => !commentPhase || comment.text.includes(`[${commentPhase}]`))
                                          .map((comment) => {
                       const userData = userAvatars[comment.sender];
                       return (
                         <div key={comment.id} className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                           <div className="flex items-start gap-3">
                             <Avatar 
                               className="w-8 h-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all duration-200 ring-2 ring-slate-200"
                               onClick={() => {
                                 if (comment.sender === user.id) {
                                   // Si es el usuario actual, ir a su perfil
                                   navigate('/perfil');
                                 } else {
                                   // Si es otro usuario, ir a su perfil en modo solo lectura
                                   navigate(`/perfil/${comment.sender}`);
                                 }
                               }}
                             >
                               {userData?.avatar_url ? (
                                 <AvatarImage 
                                   src={userData.avatar_url} 
                                   alt={userData.full_name || userData.email || 'Usuario'}
                                   className="object-cover"
                                 />
                               ) : null}
                               <AvatarFallback className="bg-slate-100 text-slate-600 text-sm font-medium">
                                 {(userData?.full_name || userData?.email || comment.sender_name || 'U').charAt(0).toUpperCase()}
                               </AvatarFallback>
                             </Avatar>
                           </div>
                           <div className="flex-1">
                             <div className="flex items-center gap-2 mb-1">
                               <span className="font-medium text-slate-800">{comment.sender_name}</span>
                               <span className="text-xs text-slate-500">
                                 {formatDateSafe(comment.created_at)}
                               </span>
                               {comment.text.includes('[') && comment.text.includes(']') && (
                                 <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700 border-slate-200">
                                   {comment.text.match(/\[(.*?)\]/)?.[1]}
                                 </Badge>
                               )}
                             </div>
                             <p className="text-sm text-slate-700">{comment.text.replace(/\[.*?\]/, '').trim()}</p>
                           </div>
                         </div>
                       );
                     })}
                </div>
                
                                 {comments.length === 0 && (
                   <div className="text-center py-8">
                     <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                     <p className="text-slate-500">No hay comentarios aún</p>
                   </div>
                 )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
