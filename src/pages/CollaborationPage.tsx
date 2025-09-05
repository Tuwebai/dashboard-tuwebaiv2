import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

import { 
  MessageSquare, 
  FileText, 
  CheckSquare, 
  Users, 
  Calendar, 
  Upload, 
  Download, 
  Trash2, 
  Edit, 
  Plus, 
  Send,
  Video,
  Phone,
  Share2,
  Star,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Paperclip,
  Smile,
  Mic,
  ScreenShare,
  UserPlus,
  Settings,
  BarChart3,
  Activity,
  Zap,
  Code,
  Monitor,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  MousePointer,
  GitBranch,
  GitCommit,
  GitPullRequest,
  History,
  Search,
  Replace,
  Copy,
  Save,
  Languages,
  UserMinus
} from 'lucide-react';

// Import collaboration components
import CollaborationTools from '@/components/CollaborationTools';
import RealTimeCollaboration from '@/components/RealTimeCollaboration';

import { formatDateSafe } from '@/utils/formatDateSafe';

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
  tags: string[];
  attachments: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
  comments: Array<{
    id: string;
    text: string;
    author: string;
    authorName: string;
    timestamp: string;
  }>;
}

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'client';
  timestamp: string;
  read: boolean;
  type: 'text' | 'file' | 'image' | 'system';
  attachments?: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
  reactions: {
    [key: string]: string[]; // emoji: [userId1, userId2]
  };
}

interface File {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  projectId: string;
  phaseKey: string;
  version: number;
  description?: string;
  tags: string[];
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

const CollaborationPage = React.memo(() => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, projects, loading, error, refreshData } = useApp();
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
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [chatRoomId, setChatRoomId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    assignee: '',
    dueDate: '',
    phaseKey: ''
  });
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Files state
  const [files, setFiles] = useState<File[]>([]);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);
  const [openFileMenuId, setOpenFileMenuId] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<File | null>(null);

  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentPhase, setCommentPhase] = useState('');

  // Voice/Video call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [callParticipants, setCallParticipants] = useState<string[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Collaboration tools state
  const [participants, setParticipants] = useState<string[]>([]);
  const [isCursorSharing, setIsCursorSharing] = useState(false);
  const [isPresenceVisible, setIsPresenceVisible] = useState(true);
  const [notifications, setNotifications] = useState(true);

  // 1. Estado para edición de tarea
  const [editTaskModalOpen, setEditTaskModalOpen] = useState(false);
  const [editTaskData, setEditTaskData] = useState<Task | null>(null);

  // 2. Función para abrir modal de edición
  const openEditTaskModal = (task: Task) => {
    setEditTaskData(task);
    setEditTaskModalOpen(true);
  };

  // 3. Función para guardar cambios de edición
  const saveEditTask = async () => {
    if (!editTaskData) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: editTaskData.title,
          description: editTaskData.description,
          priority: editTaskData.priority,
          status: editTaskData.status,
          dueDate: editTaskData.dueDate,
          phaseKey: editTaskData.phaseKey,
          updatedAt: new Date().toISOString()
        })
        .eq('id', editTaskData.id);
      
      if (error) throw error;
      
      toast({ title: 'Tarea actualizada', description: 'Los cambios han sido guardados.' });
      setEditTaskModalOpen(false);
      setEditTaskData(null);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar la tarea', variant: 'destructive' });
    }
  };

  // 1. Formularios y modales oscuros pero no transparentes
  // Cambiar clases de fondo de todos los DialogContent y CardContent de formularios y modales a bg-zinc-900/95 o bg-background
  // 2. Archivos: menú real en vez de '...'
  // 3. Actividad: Información de Sesión real y menú de configuración
  // Estado para modal de configuración de sesión
  const [sessionConfigOpen, setSessionConfigOpen] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('Activa');
  const [sessionParticipants, setSessionParticipants] = useState(participants);
  const sessionStart = project?.createdAt || new Date().toISOString();
  const sessionId = projectId;

  // Find project by ID
  useEffect(() => {
    async function fetchProjectById() {
      if (!projectId) return;
      // Si ya está en projects, úsalo
      const foundProject = projects.find(p => p.id === projectId);
      if (foundProject) {
        setProject(foundProject);
      } else if (user?.role === 'admin') {
        // Si es admin, busca el proyecto por ID en Supabase
        const { data: projectData, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();
        
        if (error || !projectData) {
          setProject(null);
        } else {
          setProject(projectData);
        }
      } else {
        setProject(null);
      }
    }
    fetchProjectById();
  }, [projectId, projects, user]);

  // Load collaboration data
  useEffect(() => {
    if (!project || !user) return;

    const loadCollaborationData = async () => {
      try {
        // Load chat room
        const { data: chatRooms, error: chatError } = await supabase
          .from('chatRooms')
          .select('*')
          .eq('projectId', projectId)
          .contains('participants', [user.email]);
        
        if (chatError) throw chatError;
        
        if (chatRooms && chatRooms.length > 0) {
          const room = chatRooms[0];
          setChatRoomId(room.id);
          
          // Load messages
          const { data: messagesData, error: messagesError } = await supabase
            .from('chatMessages')
            .select('*')
            .eq('chatRoomId', room.id)
            .order('timestamp', { ascending: true });
          
          if (messagesError) throw messagesError;
          
          const messages = messagesData || [];
          setMessages(messages);
          setCollaborationStats(prev => ({ ...prev, totalMessages: messages.length }));
        } else {
          // Create new chat room
          const { data: newRoom, error: createError } = await supabase
            .from('chatRooms')
            .insert({
              projectId,
              participants: [user.email, 'tuwebai@gmail.com'],
              createdAt: new Date().toISOString(),
              unreadCount: 0
            })
            .select()
            .single();
          
          if (createError) throw createError;
          setChatRoomId(newRoom.id);
        }

        // Load tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('projectId', projectId)
          .order('createdAt', { ascending: false });
        
        if (tasksError) throw tasksError;
        
        const tasks = tasksData || [];
        setTasks(tasks);
        
        const completed = tasks.filter(t => t.status === 'completed').length;
        setCollaborationStats(prev => ({ 
          ...prev, 
          totalTasks: tasks.length,
          completedTasks: completed
        }));

        // Load files
        const { data: filesData, error: filesError } = await supabase
          .from('projectFiles')
          .select('*')
          .eq('projectId', projectId)
          .order('uploadedAt', { ascending: false });
        
        if (filesError) throw filesError;
        
        const files = filesData || [];
        setFiles(files);
        setCollaborationStats(prev => ({ ...prev, filesUploaded: files.length }));

        // Load comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*')
          .eq('projectId', projectId)
          .order('timestamp', { ascending: false });
        
        if (commentsError) throw commentsError;
        
        const comments = commentsData || [];
        setComments(comments);
        setCollaborationStats(prev => ({ ...prev, totalComments: comments.length }));

        // Initialize participants
        setParticipants([user.email, 'tuwebai@gmail.com']);

      } catch (error) {
        console.error('Error loading collaboration data:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos de colaboración',
          variant: 'destructive'
        });
      }
    };

    loadCollaborationData();
  }, [project, user, projectId]);

  // Auto-scroll to bottom of chat (SIN SMOOTH PARA MÓVILES)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !chatRoomId || !user) return;

    try {
      const { error } = await supabase
        .from('chatMessages')
        .insert({
          text: newMessage.trim(),
          senderId: user.email,
          senderName: user.name,
          senderRole: user.role,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'text',
          chatRoomId
        });
      
      if (error) throw error;

      setNewMessage('');

      setNewMessage('');
      setIsTyping(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive'
      });
    }
  };

  // Create task
  const createTask = async () => {
    if (!newTask.title.trim() || !projectId || !user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          ...newTask,
          status: 'pending',
          projectId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
          attachments: [],
          comments: []
        });
      
      if (error) throw error;

      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        assignee: '',
        dueDate: '',
        phaseKey: ''
      });
      setIsTaskModalOpen(false);

      toast({
        title: 'Tarea creada',
        description: 'La tarea ha sido creada exitosamente'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la tarea',
        variant: 'destructive'
      });
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status,
          updatedAt: new Date().toISOString()
        })
        .eq('id', taskId);
      
      if (error) throw error;

      toast({
        title: 'Tarea actualizada',
        description: `La tarea ha sido marcada como ${status}`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la tarea',
        variant: 'destructive'
      });
    }
  };

  // Upload file
  const uploadFile = async (file: globalThis.File) => {
    if (!projectId || !user) return;

    try {
      setUploadingFile({
        id: '',
        name: file.name,
        url: '',
        size: file.size,
        type: file.type,
        uploadedBy: user.email,
        uploadedByName: user.name,
        uploadedAt: new Date().toISOString(),
        projectId: projectId,
        phaseKey: 'general',
        version: 1,
        description: '',
        tags: []
      });
      setFileUploadProgress(0);

      // Simulate file upload progress
      const interval = setInterval(() => {
        setFileUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      // Create file record in Supabase
      const { error } = await supabase
        .from('projectFiles')
        .insert({
          name: file.name,
          url: URL.createObjectURL(file), // In production, upload to Supabase Storage
          size: file.size,
          type: file.type,
          uploadedBy: user.email,
          uploadedByName: user.name,
          uploadedAt: new Date().toISOString(),
          projectId,
          phaseKey: 'general',
          version: 1,
          description: '',
          tags: []
        });
      
      if (error) throw error;

      setUploadingFile(null);
      setFileUploadProgress(0);

      toast({
        title: 'Archivo subido',
        description: 'El archivo ha sido subido exitosamente'
      });
    } catch (error) {
      setUploadingFile(null);
      setFileUploadProgress(0);
      toast({
        title: 'Error',
        description: 'No se pudo subir el archivo',
        variant: 'destructive'
      });
    }
  };

  // Add comment to phase
  const addCommentToPhase = async (phaseKey: string) => {
    if (!newComment.trim() || !projectId || !user) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          text: newComment.trim(),
          authorId: user.email,
          authorName: user.name,
          authorRole: user.role,
          timestamp: new Date().toISOString(),
          projectId,
          phaseKey,
          parentId: null,
          replies: [],
          reactions: {},
          mentions: [],
          isEdited: false
        });
      
      if (error) throw error;

      setNewComment('');
      setCommentPhase('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo agregar el comentario',
        variant: 'destructive'
      });
    }
  };

  // Add participant
  const addParticipant = (email: string) => {
    if (!participants.includes(email)) {
      setParticipants([...participants, email]);
      toast({
        title: 'Participante agregado',
        description: `${email} se unió a la colaboración`
      });
    }
  };

  // Remove participant
  const removeParticipant = (email: string) => {
    setParticipants(participants.filter(p => p !== email));
    toast({
      title: 'Participante removido',
      description: `${email} fue removido de la colaboración`
    });
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando colaboración...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Proyecto no encontrado</h3>
          <p className="text-muted-foreground">El proyecto que buscas no existe o no tienes permisos para acceder.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Colaboración - {project.name}</h1>
          <p className="text-muted-foreground">Trabaja en equipo con tu proyecto</p>
        </div>
        
        {/* Call controls */}
        <div className="flex items-center gap-2">
          
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mensajes</p>
                <p className="text-2xl font-bold">{collaborationStats.totalMessages}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tareas</p>
                <p className="text-2xl font-bold">{collaborationStats.completedTasks}/{collaborationStats.totalTasks}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Archivos</p>
                <p className="text-2xl font-bold">{collaborationStats.filesUploaded}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progreso</p>
                <p className="text-2xl font-bold">{collaborationStats.projectProgress}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Collaboration Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Tareas
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Archivos
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Comentarios
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Actividad
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat del Proyecto
                {typingUsers.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {typingUsers.join(', ')} está escribiendo...
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto space-y-4 mb-4 p-4 border rounded-lg">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.email ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user?.email
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {/* Avatar clickeable */}
                        <div 
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-200 hover:scale-110 ${
                            message.senderId === user?.email
                              ? 'bg-white/20 text-white'
                              : 'bg-primary/20 text-primary'
                          }`}
                          onClick={() => {
                            if (message.senderId === user?.email) {
                              // Si es el usuario actual, ir a su perfil
                              window.location.href = '/perfil';
                            } else {
                              // Si es otro usuario, mostrar información o ir a su perfil
                              toast({
                                title: 'Perfil de Usuario',
                                description: `Ver perfil de ${message.senderName}`,
                                variant: 'default'
                              });
                            }
                          }}
                          title={message.senderId === user?.email ? 'Ver mi perfil' : `Ver perfil de ${message.senderName}`}
                        >
                          {message.senderName?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium">{message.senderName}</span>
                        <span className="text-xs opacity-70">
                          {formatDateSafe(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Escribe un mensaje..."
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tareas del Proyecto</h3>
            <Button onClick={() => setIsTaskModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <Card key={task.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(task.status)}
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Estado: {task.assigneeName}</span>
                    <span>Vence: {formatDateSafe(task.dueDate)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select
                      value={task.status}
                      onValueChange={(value: Task['status']) => updateTaskStatus(task.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="in-progress">En Progreso</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button variant="ghost" size="sm" onClick={() => openEditTaskModal(task)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Archivos del Proyecto</h3>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadFile(file);
                }}
                className="w-64"
              />
              {uploadingFile && (
                <div className="flex items-center gap-2">
                  <Progress value={fileUploadProgress} className="w-24" />
                  <span className="text-xs">{fileUploadProgress}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <Card key={file.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Subido por {file.uploadedByName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 relative">
                      <Button variant="ghost" size="sm" onClick={() => window.open(file.url, '_blank')}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setOpenFileMenuId(openFileMenuId === file.id ? null : file.id)}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      {openFileMenuId === file.id && (
                        <div className="absolute right-0 top-8 z-20 w-48 rounded-md bg-white shadow-lg border border-slate-200">
                          <button className="block w-full text-left px-4 py-2 hover:bg-slate-100" onClick={() => { window.open(file.url, '_blank'); setOpenFileMenuId(null); }}>Descargar</button>
                          {user.email === file.uploadedBy && (
                            <button className="block w-full text-left px-4 py-2 text-red-500 hover:bg-slate-100" onClick={async () => { 
  const { error } = await supabase
    .from('projectFiles')
    .delete()
    .eq('id', file.id);
  
  if (error) {
    toast({ title: 'Error', description: 'No se pudo eliminar el archivo', variant: 'destructive' });
  } else {
    toast({ title: 'Archivo eliminado' });
  }
  setOpenFileMenuId(null); 
}}>Eliminar</button>
                          )}
                          <button className="block w-full text-left px-4 py-2 hover:bg-zinc-800" onClick={() => { setFileDetails(file); setOpenFileMenuId(null); }}>Ver detalles</button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Comentarios por Fase</h3>
            <div className="flex items-center gap-2">
              <Select value={commentPhase} onValueChange={setCommentPhase}>
                <SelectTrigger className="w-40">
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
              >
                <Send className="h-4 w-4 mr-2" />
                Comentar
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {commentPhase && (
              <Card>
                <CardContent className="p-4">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={`Agregar comentario en ${commentPhase}...`}
                    className="mb-4"
                  />
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {comments
                .filter(comment => !commentPhase || comment.phaseKey === commentPhase)
                .map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {comment.authorName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{comment.authorName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateSafe(comment.timestamp)}
                            </span>
                            {comment.phaseKey && (
                              <Badge variant="outline">{comment.phaseKey}</Badge>
                            )}
                          </div>
                          <p className="text-sm">{comment.text}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Información de Sesión</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div><b>ID de Sesión:</b> {sessionId}</div>
                <div><b>Iniciada:</b> {formatDateSafe(sessionStart)}</div>
                <div><b>Participantes:</b> {sessionParticipants.length}</div>
                <div><b>Estado:</b> {sessionStatus}</div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => setSessionConfigOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" /> Configuración
                </Button>
              </div>
            </CardContent>
          </Card>
          <RealTimeCollaboration projectId={projectId!} />
        </TabsContent>
      </Tabs>

      {/* Task Modal */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle>Crear Nueva Tarea</DialogTitle>
            <DialogDescription>
              Agrega una nueva tarea al proyecto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título de la tarea"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción de la tarea"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={newTask.priority} onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
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
                <Label htmlFor="dueDate">Fecha límite</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="phase">Fase</Label>
              <Select value={newTask.phaseKey} onValueChange={(value) => setNewTask(prev => ({ ...prev, phaseKey: value }))}>
                <SelectTrigger>
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
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createTask} disabled={!newTask.title.trim()}>
                Crear Tarea
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de edición de tarea */}
      <Dialog open={editTaskModalOpen} onOpenChange={setEditTaskModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle>Editar Tarea</DialogTitle>
            <DialogDescription>Modifica los campos de la tarea y guarda los cambios.</DialogDescription>
          </DialogHeader>
          {editTaskData && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  value={editTaskData.title}
                  onChange={e => setEditTaskData({ ...editTaskData, title: e.target.value })}
                  placeholder="Título de la tarea"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={editTaskData.description}
                  onChange={e => setEditTaskData({ ...editTaskData, description: e.target.value })}
                  placeholder="Descripción de la tarea"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-priority">Prioridad</Label>
                  <Select value={editTaskData.priority} onValueChange={value => setEditTaskData({ ...editTaskData, priority: value as Task['priority'] })}>
                    <SelectTrigger>
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
                  <Label htmlFor="edit-status">Estado</Label>
                  <Select value={editTaskData.status} onValueChange={value => setEditTaskData({ ...editTaskData, status: value as Task['status'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="in-progress">En Progreso</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-dueDate">Fecha límite</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={editTaskData.dueDate}
                  onChange={e => setEditTaskData({ ...editTaskData, dueDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-phase">Fase</Label>
                <Select value={editTaskData.phaseKey} onValueChange={value => setEditTaskData({ ...editTaskData, phaseKey: value })}>
                  <SelectTrigger>
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
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditTaskModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={saveEditTask}>
                  Guardar Cambios
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para detalles de archivo */}
      <Dialog open={!!fileDetails} onOpenChange={() => setFileDetails(null)}>
        <DialogContent className="max-w-md bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle>Detalles del Archivo</DialogTitle>
          </DialogHeader>
          {fileDetails && (
            <div className="space-y-2">
              <div><b>Nombre:</b> {fileDetails.name}</div>
              <div><b>Tipo:</b> {fileDetails.type}</div>
              <div><b>Tamaño:</b> {(fileDetails.size / 1024 / 1024).toFixed(2)} MB</div>
              <div><b>Subido por:</b> {fileDetails.uploadedByName}</div>
              <div><b>Fecha de subida:</b> {formatDateSafe(fileDetails.uploadedAt)}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de configuración de sesión */}
      <Dialog open={sessionConfigOpen} onOpenChange={setSessionConfigOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle>Configuración de Sesión</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button className="w-full" onClick={() => { setSessionStatus('Finalizada'); setSessionConfigOpen(false); }}>Cerrar sesión actual</Button>
            {user.role === 'admin' && (
              <Button className="w-full" onClick={() => { setSessionParticipants([]); setSessionConfigOpen(false); }}>Expulsar participantes</Button>
            )}
            <Button className="w-full" onClick={() => toast({ title: 'Historial', description: 'Función de historial real pendiente' })}>Ver historial de actividad</Button>
            <Button className="w-full" onClick={() => { setSessionStatus(sessionStatus === 'Activa' ? 'Finalizada' : 'Activa'); setSessionConfigOpen(false); }}>Cambiar estado de la sesión ({sessionStatus === 'Activa' ? 'Finalizada' : 'Activa'})</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

CollaborationPage.displayName = 'CollaborationPage';

export default CollaborationPage; 
