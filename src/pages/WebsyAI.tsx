import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Bot, 
  Settings, 
  Trash2, 
  Plus, 
  Search,
  Download,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Menu,
  Sun,
  Moon,
  Edit3,
  // Removidos - ahora están en configuración
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useMultiAI } from '@/hooks/useMultiAI';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useChatHistory, ChatMessage, Conversation } from '@/hooks/useChatHistory';
import { useAISettings } from '@/hooks/useAISettings';
import { MessageBubble } from '@/components/websy-ai/MessageBubble';
import { useNavigate } from 'react-router-dom';
import websyAvatar from '@/assets/websyavatar.png';
import websyAvatarDark from '@/assets/websyparamodooscuro.png';
import { TypingIndicator } from '@/components/websy-ai/TypingIndicator';
import { ThinkingIndicator } from '@/components/websy-ai/ThinkingIndicator';
import { CleanResponse } from '@/components/websy-ai/CleanResponse';
import { ChatInput } from '@/components/websy-ai/ChatInput';
import { AISettingsModal } from '@/components/websy-ai/AISettingsModal';
// Removidos - ahora están en configuración
import { supabase } from '@/lib/supabase';

const WebsyAI: React.FC = () => {
  const { user } = useApp();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // Forzar modo oscuro en WebsyAI - persistente
  useEffect(() => {
    // Forzar tema oscuro en localStorage
    localStorage.setItem('theme', 'dark');
    
    // Aplicar tema oscuro al documento
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    
    // Si el tema no es oscuro, cambiarlo
    if (theme !== 'dark') {
      toggleTheme();
    }
  }, []);
  
  // Seleccionar avatar según el tema
  const websyAvatarSrc = theme === 'dark' ? websyAvatarDark : websyAvatar;
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [conversationToRename, setConversationToRename] = useState<Conversation | null>(null);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  // Removido sidebarView - ahora solo conversaciones
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Google Calendar - Solo inicializar cuando se necesite
  const {
    isAuthenticated: isCalendarAuthenticated,
    userInfo: calendarUserInfo,
    authenticate: authenticateCalendar,
    signOut: signOutCalendar,
    isLoading: calendarLoading,
    initializeService
  } = useGoogleCalendar(user);

  // Hooks - Sistema Multi-API
  const { 
    sendMessage, 
    isLoading, 
    error,
    currentApiIndex,
    apiStatuses,
    totalRequests,
    lastReset,
    resetToFirstApi
  } = useMultiAI({
    temperature: 0.7,
    maxTokens: 2048,
    enableLogging: true,
    resetIntervalHours: 24,
    isCalendarAuthenticated,
    calendarUserInfo
  });

  const {
    conversations,
    currentMessages,
    currentConversationId,
    loading: chatLoading,
    error: chatError,
    loadConversations,
    loadMessages,
    createConversation,
    saveMessage,
    deleteConversation,
    searchConversations,
    setCurrentConversationId,
    setCurrentMessages
  } = useChatHistory();

  const {
    settings,
    loading: settingsLoading,
    updateSetting
  } = useAISettings();


  // Enviar mensaje
  const handleSendMessage = useCallback(async (message: string, attachments?: any[]) => {
    if (!user) {
      toast({
        title: "Error de autenticación",
        description: "No se pudo identificar al usuario. Inicia sesión nuevamente.",
        variant: "destructive"
      });
      return;
    }

    if (!message || message.trim() === '') {
      toast({
        title: "Mensaje vacío",
        description: "Por favor escribe un mensaje antes de enviar.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Mostrar indicador de pensamiento inmediatamente
      setIsThinking(true);
      setAiResponse('');

      // Guardar mensaje del usuario
      const userMessageId = await saveMessage(message, false, currentConversationId, attachments);
      
      // Marcar mensaje del usuario como nuevo
      if (userMessageId) {
        setNewMessageIds(prev => new Set(prev).add(userMessageId));
      }

      // Enviar a Gemini AI con los mensajes actuales (que ya incluyen el mensaje del usuario)
      const response = await sendMessage(
        message,
        currentMessages,
        'general',
        undefined,
        attachments
      );

      // Cambiar a modo streaming
      setIsThinking(false);
      setIsStreaming(true);
      setStreamingText('');
      setAiResponse(response);

      // Simular streaming progresivo
      const words = response.split(' ');
      const delay = 1000 / 30; // 30 palabras por segundo (más rápido)
      
      for (let i = 0; i <= words.length; i++) {
        const partialText = words.slice(0, i).join(' ');
        setStreamingText(partialText);
        
        if (i < words.length) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // Finalizar streaming
      setIsStreaming(false);
      setStreamingText('');

      // Guardar respuesta de la IA
      const aiMessageId = await saveMessage(response, true, currentConversationId);
      
      // Marcar mensaje de IA como nuevo
      if (aiMessageId) {
        setNewMessageIds(prev => new Set(prev).add(aiMessageId));
      }

    } catch (error) {
      setIsThinking(false);
      setIsStreaming(false);
      setStreamingText('');
      setAiResponse('');
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      toast({
        title: "Error al enviar mensaje",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [user, currentConversationId, currentMessages, saveMessage, sendMessage]);

  // Crear nueva conversación
  const handleNewConversation = useCallback(async () => {
    if (!user) return;

    try {
      const conversationId = await createConversation('Nueva conversación');
      if (conversationId) {
        setCurrentConversationId(conversationId);
        setCurrentMessages([]);
        // Limpiar estados de IA
        setAiResponse('');
        setIsStreaming(false);
        setStreamingText('');
        setIsThinking(false);
        setNewMessageIds(new Set());
        toast({
          title: "Nueva conversación",
          description: "Conversación creada exitosamente"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la conversación",
        variant: "destructive"
      });
    }
  }, [user, createConversation]);

  const handleSearchChats = useCallback(() => {
    setSidebarCollapsed(false);
    // Enfocar el campo de búsqueda después de que se abra el sidebar
    setTimeout(() => {
      const searchInput = document.querySelector('input[placeholder*="buscar"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }, 300);
  }, []);

  const handleQuickAction = useCallback((message: string) => {
    if (!message.trim()) return;
    
    // Crear mensaje del usuario
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      message: message,
      isAI: false,
      timestamp: new Date(),
      attachments: [],
      contextData: null
    };

    // Agregar mensaje del usuario inmediatamente
    setCurrentMessages(prev => [...prev, userMessage]);
    
    // Enviar mensaje a Websy AI
    handleSendMessage(message);
  }, [currentConversationId, handleSendMessage]);

  // Eliminar conversación
  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    try {
      await deleteConversation(conversationId);
      toast({
        title: "Conversación eliminada",
        description: "La conversación ha sido eliminada"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la conversación",
        variant: "destructive"
      });
    }
  }, [deleteConversation]);

  // Función para abrir el diálogo de renombrar
  const handleRenameConversation = useCallback((conversation: Conversation) => {
    setConversationToRename(conversation);
    setNewConversationTitle(conversation.title);
    setRenameDialogOpen(true);
  }, []);

  // Función para confirmar el renombrado
  const handleConfirmRename = useCallback(async () => {
    if (!conversationToRename || !newConversationTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: newConversationTitle.trim() })
        .eq('id', conversationToRename.id);

      if (error) throw error;

      // Recargar conversaciones para actualizar la lista
      await loadConversations();
      
      setRenameDialogOpen(false);
      setConversationToRename(null);
      setNewConversationTitle('');
      
      toast({
        title: "Conversación renombrada",
        description: "El nombre de la conversación ha sido actualizado."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo renombrar la conversación. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  }, [conversationToRename, newConversationTitle, loadConversations]);

  // Cargar conversación
  const handleLoadConversation = useCallback(async (conversationId: string) => {
    try {
      await loadMessages(conversationId);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la conversación",
        variant: "destructive"
      });
    }
  }, [loadMessages]);

  // Reintentar última respuesta de IA
  const handleRetryMessage = useCallback(async (messageId?: string) => {
    if (!user || currentMessages.length === 0) return;

    // Si se proporciona un messageId específico, encontrar ese mensaje
    let lastUserMessage: ChatMessage | undefined;
    let lastAIIndex = -1;

    if (messageId) {
      // Buscar el mensaje específico por ID
      const messageIndex = currentMessages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) return;
      
      // Buscar el mensaje del usuario anterior a este mensaje de IA
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (!currentMessages[i].isAI) {
          lastUserMessage = currentMessages[i];
          break;
        }
      }
      lastAIIndex = messageIndex;
    } else {
      // Comportamiento original: encontrar el último mensaje del usuario
      lastUserMessage = [...currentMessages].reverse().find(msg => !msg.isAI);
      if (!lastUserMessage) return;

      // Encontrar el índice del último mensaje de IA
      lastAIIndex = currentMessages.map((msg, index) => ({ msg, index }))
        .reverse()
        .find(({ msg }) => msg.isAI)?.index ?? -1;
    }
    
    if (lastAIIndex === -1 || !lastUserMessage) return;

    try {
      // Eliminar solo el mensaje de IA específico
      const messagesWithoutLastAI = currentMessages.slice(0, lastAIIndex);

      // Actualizar mensajes locales inmediatamente
      setCurrentMessages(messagesWithoutLastAI);

      // Mostrar indicador de escritura
      setIsTyping(true);

      // Reenviar el último mensaje del usuario
      const aiResponse = await sendMessage(
        lastUserMessage.message,
        messagesWithoutLastAI,
        'general',
        undefined,
        lastUserMessage.attachments
      );

      // Guardar nueva respuesta de la IA
      const aiMessageId = await saveMessage(aiResponse, true, currentConversationId);
      
      // Marcar mensaje de IA como nuevo
      if (aiMessageId) {
        setNewMessageIds(prev => new Set(prev).add(aiMessageId));
      }

      setIsTyping(false);

      toast({
        title: "Respuesta regenerada",
        description: "Websy AI ha generado una nueva respuesta"
      });
    } catch (error) {
      setIsTyping(false);
      toast({
        title: "Error",
        description: "No se pudo regenerar la respuesta. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  }, [user, currentMessages, sendMessage, saveMessage, currentConversationId, setNewMessageIds]);

  // Iniciar edición de mensaje
  const handleStartEdit = useCallback((messageId: string) => {
    setEditingMessageId(messageId);
  }, []);

  // Cancelar edición
  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
  }, []);

  // Editar mensaje del admin
  const handleEditMessage = useCallback(async (messageId: string, newMessage: string) => {
    if (!user || user.email !== 'tuwebai@gmail.com') return;

    try {
      // Actualizar el mensaje en el estado local
      setCurrentMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? { ...msg, message: newMessage, timestamp: new Date() }
            : msg
        )
      );

      // Si hay una respuesta de IA después de este mensaje, eliminarla
      const messageIndex = currentMessages.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        const messagesAfter = currentMessages.slice(messageIndex + 1);
        const aiResponseIndex = messagesAfter.findIndex(msg => msg.isAI);
        
        if (aiResponseIndex !== -1) {
          const actualAIIndex = messageIndex + 1 + aiResponseIndex;
          setCurrentMessages(prevMessages => 
            prevMessages.filter((_, index) => index !== actualAIIndex)
          );
        }
      }

      // Cerrar modo edición
      setEditingMessageId(null);

      // Enviar el mensaje editado
      await sendMessage(newMessage, []);

      toast({
        title: "Mensaje editado",
        description: "El mensaje ha sido actualizado y enviado"
      });
    } catch (error) {
      console.error('Error al editar mensaje:', error);
      toast({
        title: "Error",
        description: "No se pudo editar el mensaje",
        variant: "destructive"
      });
    }
  }, [currentMessages, sendMessage, user]);

  // Scroll automático al final
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  }, []);

  // Scroll instantáneo para typewriter (más fluido)
  const scrollToBottomInstant = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'auto',
        block: 'end',
        inline: 'nearest'
      });
    }
  }, []);

  // Efectos
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isTyping, scrollToBottom]);

  // Scroll automático durante la escritura del typewriter
  useEffect(() => {
    if (isTyping) {
      const interval = setInterval(() => {
        scrollToBottom();
      }, 50); // Scroll cada 50ms durante la escritura para mayor fluidez
      
      return () => clearInterval(interval);
    }
  }, [isTyping, scrollToBottom]);

  // Scroll automático cuando se muestra "pensando"
  useEffect(() => {
    if (isThinking) {
      scrollToBottom();
    }
  }, [isThinking, scrollToBottom]);

  // Scroll automático durante streaming
  useEffect(() => {
    if (isStreaming) {
      scrollToBottom();
    }
  }, [isStreaming, streamingText, scrollToBottom]);

  // Callback para scroll durante typewriter con debounce
  const handleTypewriterProgress = useCallback(() => {
    // Usar scroll instantáneo para typewriter (más fluido)
    requestAnimationFrame(() => {
      scrollToBottomInstant();
    });
  }, [scrollToBottomInstant]);

  // Cargar mensajes cuando cambie la conversación
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
      // Limpiar mensajes nuevos al cambiar de conversación
      setNewMessageIds(new Set());
      // Limpiar respuesta de IA
      setAiResponse('');
      setIsStreaming(false);
      setStreamingText('');
    }
  }, [currentConversationId]); // Remover loadMessages de las dependencias

  // Verificar si es admin
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground">
              Solo los administradores pueden acceder a Websy AI.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div 
      className="fixed inset-0 flex flex-col"
      style={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        backgroundColor: 'var(--bg-elevated-secondary, #181818)'
      }}
    >
      <div 
        className="flex-shrink-0 px-4 py-3 border-b"
        style={{
          position: 'relative',
          zIndex: 60,
          minHeight: '70px',
          backgroundColor: 'var(--bg-elevated-secondary, #181818)',
          borderColor: 'var(--border-default, #ffffff26)'
        }}
      >
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="h-8 w-8 p-0 hover:bg-muted dark:hover:bg-slate-800 dark:text-slate-300"
              title="Volver al dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <img 
              src={websyAvatarSrc} 
              alt="Websy AI" 
              className="h-8 w-8 rounded object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Websy AI
              </h1>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground/80">
                Asistente de IA para administración de proyectos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="h-8 px-3 text-sm dark:border-slate-600 dark:hover:bg-slate-800 dark:text-slate-300"
            >
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Configuración</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewConversation}
              className="h-8 px-3 text-sm dark:border-slate-600 dark:hover:bg-slate-800 dark:text-slate-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nueva</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0" style={{ height: 'calc(100vh - 90px)' }}>
        {/* Botones flotantes cuando está colapsado */}
        {sidebarCollapsed && (
          <div className="w-12 flex-shrink-0 flex flex-col">
            <div className="flex-shrink-0 px-2 py-3 border-r bg-background dark:bg-slate-900 space-y-2">
              {/* Botón de expandir sidebar - PRIMERO */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarCollapsed(false)}
                className="w-full h-8 p-0 bg-background border shadow-sm sidebar-button"
                title="Abrir barra lateral"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                  <path d="M6.83496 3.99992C6.38353 4.00411 6.01421 4.0122 5.69824 4.03801C5.31232 4.06954 5.03904 4.12266 4.82227 4.20012L4.62207 4.28606C4.18264 4.50996 3.81498 4.85035 3.55859 5.26848L3.45605 5.45207C3.33013 5.69922 3.25006 6.01354 3.20801 6.52824C3.16533 7.05065 3.16504 7.71885 3.16504 8.66301V11.3271C3.16504 12.2712 3.16533 12.9394 3.20801 13.4618C3.25006 13.9766 3.33013 14.2909 3.45605 14.538L3.55859 14.7216C3.81498 15.1397 4.18266 15.4801 4.62207 15.704L4.82227 15.79C5.03904 15.8674 5.31234 15.9205 5.69824 15.9521C6.01398 15.9779 6.383 15.986 6.83398 15.9902L6.83496 3.99992ZM18.165 11.3271C18.165 12.2493 18.1653 12.9811 18.1172 13.5702C18.0745 14.0924 17.9916 14.5472 17.8125 14.9648L17.7295 15.1415C17.394 15.8 16.8834 16.3511 16.2568 16.7353L15.9814 16.8896C15.5157 17.1268 15.0069 17.2285 14.4102 17.2773C13.821 17.3254 13.0893 17.3251 12.167 17.3251H7.83301C6.91071 17.3251 6.17898 17.3254 5.58984 17.2773C5.06757 17.2346 4.61294 17.1508 4.19531 16.9716L4.01855 16.8896C3.36014 16.5541 2.80898 16.0434 2.4248 15.4169L2.27051 15.1415C2.03328 14.6758 1.93158 14.167 1.88281 13.5702C1.83468 12.9811 1.83496 12.2493 1.83496 11.3271V8.66301C1.83496 7.74072 1.83468 7.00898 1.88281 6.41985C1.93157 5.82309 2.03329 5.31432 2.27051 4.84856L2.4248 4.57317C2.80898 3.94666 3.36012 3.436 4.01855 3.10051L4.19531 3.0175C4.61285 2.83843 5.06771 2.75548 5.58984 2.71281C6.17898 2.66468 6.91071 2.66496 7.83301 2.66496H12.167C13.0893 2.66496 13.821 2.66468 14.4102 2.71281C15.0069 2.76157 15.5157 2.86329 15.9814 3.10051L16.2568 3.25481C16.8833 3.63898 17.394 4.19012 17.7295 4.84856L17.8125 5.02531C17.9916 5.44285 18.0745 5.89771 18.1172 6.41985C18.1653 7.00898 18.165 7.74072 18.165 8.66301V11.3271ZM8.16406 15.995H12.167C13.1112 15.995 13.7794 15.9947 14.3018 15.9521C14.8164 15.91 15.1308 15.8299 15.3779 15.704L15.5615 15.6015C15.9797 15.3451 16.32 14.9774 16.5439 14.538L16.6299 14.3378C16.7074 14.121 16.7605 13.8478 16.792 13.4618C16.8347 12.9394 16.835 12.2712 16.835 11.3271V8.66301C16.835 7.71885 16.8347 7.05065 16.792 6.52824C16.7605 6.14232 16.7073 5.86904 16.6299 5.65227L16.5439 5.45207C16.32 5.01264 15.9796 4.64498 15.5615 4.3886L15.3779 4.28606C15.1308 4.16013 14.8165 4.08006 14.3018 4.03801C13.7794 3.99533 13.1112 3.99504 12.167 3.99504H8.16406C8.16407 3.99667 8.16504 3.99829 8.16504 3.99992L8.16406 15.995Z"></path>
                </svg>
              </Button>

              {/* Botón de crear nuevo chat - SEGUNDO */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewConversation}
                className="w-full h-8 p-0 bg-background border shadow-sm sidebar-button"
                title="Nuevo chat"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                  <path d="M2.6687 11.333V8.66699C2.6687 7.74455 2.66841 7.01205 2.71655 6.42285C2.76533 5.82612 2.86699 5.31731 3.10425 4.85156L3.25854 4.57617C3.64272 3.94975 4.19392 3.43995 4.85229 3.10449L5.02905 3.02149C5.44666 2.84233 5.90133 2.75849 6.42358 2.71582C7.01272 2.66769 7.74445 2.66797 8.66675 2.66797H9.16675C9.53393 2.66797 9.83165 2.96586 9.83179 3.33301C9.83179 3.70028 9.53402 3.99805 9.16675 3.99805H8.66675C7.7226 3.99805 7.05438 3.99834 6.53198 4.04102C6.14611 4.07254 5.87277 4.12568 5.65601 4.20313L5.45581 4.28906C5.01645 4.51293 4.64872 4.85345 4.39233 5.27149L4.28979 5.45508C4.16388 5.7022 4.08381 6.01663 4.04175 6.53125C3.99906 7.05373 3.99878 7.7226 3.99878 8.66699V11.333C3.99878 12.2774 3.99906 12.9463 4.04175 13.4688C4.08381 13.9833 4.16389 14.2978 4.28979 14.5449L4.39233 14.7285C4.64871 15.1465 5.01648 15.4871 5.45581 15.7109L5.65601 15.7969C5.87276 15.8743 6.14614 15.9265 6.53198 15.958C7.05439 16.0007 7.72256 16.002 8.66675 16.002H11.3337C12.2779 16.002 12.9461 16.0007 13.4685 15.958C13.9829 15.916 14.2976 15.8367 14.5447 15.7109L14.7292 15.6074C15.147 15.3511 15.4879 14.9841 15.7117 14.5449L15.7976 14.3447C15.8751 14.128 15.9272 13.8546 15.9587 13.4688C16.0014 12.9463 16.0017 12.2774 16.0017 11.333V10.833C16.0018 10.466 16.2997 10.1681 16.6667 10.168C17.0339 10.168 17.3316 10.4659 17.3318 10.833V11.333C17.3318 12.2555 17.3331 12.9879 17.2849 13.5771C17.2422 14.0993 17.1584 14.5541 16.9792 14.9717L16.8962 15.1484C16.5609 15.8066 16.0507 16.3571 15.4246 16.7412L15.1492 16.8955C14.6833 17.1329 14.1739 17.2354 13.5769 17.2842C12.9878 17.3323 12.256 17.332 11.3337 17.332H8.66675C7.74446 17.332 7.01271 17.3323 6.42358 17.2842C5.90135 17.2415 5.44665 17.1577 5.02905 16.9785L4.85229 16.8955C4.19396 16.5601 3.64271 16.0502 3.25854 15.4238L3.10425 15.1484C2.86697 14.6827 2.76534 14.1739 2.71655 13.5771C2.66841 12.9879 2.6687 12.2555 2.6687 11.333ZM13.4646 3.11328C14.4201 2.334 15.8288 2.38969 16.7195 3.28027L16.8865 3.46485C17.6141 4.35685 17.6143 5.64423 16.8865 6.53613L16.7195 6.7207L11.6726 11.7686C11.1373 12.3039 10.4624 12.6746 9.72827 12.8408L9.41089 12.8994L7.59351 13.1582C7.38637 13.1877 7.17701 13.1187 7.02905 12.9707C6.88112 12.8227 6.81199 12.6134 6.84155 12.4063L7.10132 10.5898L7.15991 10.2715C7.3262 9.53749 7.69692 8.86241 8.23218 8.32715L13.2791 3.28027L13.4646 3.11328ZM15.7791 4.2207C15.3753 3.81702 14.7366 3.79124 14.3035 4.14453L14.2195 4.2207L9.17261 9.26856C8.81541 9.62578 8.56774 10.0756 8.45679 10.5654L8.41772 10.7773L8.28296 11.7158L9.22241 11.582L9.43433 11.543C9.92426 11.432 10.3749 11.1844 10.7322 10.8271L15.7791 5.78027L15.8552 5.69629C16.185 5.29194 16.1852 4.708 15.8552 4.30371L15.7791 4.2207Z"></path>
                </svg>
              </Button>

              {/* Botón de buscar chats - TERCERO */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSearchChats}
                className="w-full h-8 p-0 bg-background border shadow-sm sidebar-button"
                title="Buscar chats"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                  <path d="M14.0857 8.74999C14.0857 5.80355 11.6972 3.41503 8.75073 3.41503C5.80429 3.41503 3.41577 5.80355 3.41577 8.74999C3.41577 11.6964 5.80429 14.085 8.75073 14.085C11.6972 14.085 14.0857 11.6964 14.0857 8.74999ZM15.4158 8.74999C15.4158 10.3539 14.848 11.8245 13.9041 12.9746L13.9705 13.0303L16.9705 16.0303L17.0564 16.1338C17.2269 16.3919 17.1977 16.7434 16.9705 16.9707C16.7432 17.1975 16.3925 17.226 16.1345 17.0557L16.03 16.9707L13.03 13.9707L12.9753 13.9033C11.8253 14.8472 10.3547 15.415 8.75073 15.415C5.06975 15.415 2.08569 12.431 2.08569 8.74999C2.08569 5.06901 5.06975 2.08495 8.75073 2.08495C12.4317 2.08495 15.4158 5.06901 15.4158 8.74999Z"></path>
                </svg>
              </Button>
            </div>
          </div>
        )}

        <div 
          className={`${sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-80'} transition-all duration-300 border-r flex-shrink-0 flex flex-col`}
          style={{
            backgroundColor: 'var(--sidebar-surface-primary, #171717)',
            borderColor: 'var(--border-default, #ffffff26)',
            width: sidebarCollapsed ? '0' : 'var(--sidebar-width, 260px)'
          }}
        >
          <div className="flex-shrink-0 px-4 py-3 border-b">
            <div className="flex items-center justify-between mb-3">
              <h3 
                className="text-sm font-medium"
                style={{ color: 'var(--sidebar-title-primary, #f0f0f080)' }}
              >
                Chats
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarCollapsed(true)}
                  className="h-8 w-8 p-0 bg-background border shadow-sm sidebar-button"
                  title="Cerrar barra lateral"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                    <path d="M6.83496 3.99992C6.38353 4.00411 6.01421 4.0122 5.69824 4.03801C5.31232 4.06954 5.03904 4.12266 4.82227 4.20012L4.62207 4.28606C4.18264 4.50996 3.81498 4.85035 3.55859 5.26848L3.45605 5.45207C3.33013 5.69922 3.25006 6.01354 3.20801 6.52824C3.16533 7.05065 3.16504 7.71885 3.16504 8.66301V11.3271C3.16504 12.2712 3.16533 12.9394 3.20801 13.4618C3.25006 13.9766 3.33013 14.2909 3.45605 14.538L3.55859 14.7216C3.81498 15.1397 4.18266 15.4801 4.62207 15.704L4.82227 15.79C5.03904 15.8674 5.31234 15.9205 5.69824 15.9521C6.01398 15.9779 6.383 15.986 6.83398 15.9902L6.83496 3.99992ZM18.165 11.3271C18.165 12.2493 18.1653 12.9811 18.1172 13.5702C18.0745 14.0924 17.9916 14.5472 17.8125 14.9648L17.7295 15.1415C17.394 15.8 16.8834 16.3511 16.2568 16.7353L15.9814 16.8896C15.5157 17.1268 15.0069 17.2285 14.4102 17.2773C13.821 17.3254 13.0893 17.3251 12.167 17.3251H7.83301C6.91071 17.3251 6.17898 17.3254 5.58984 17.2773C5.06757 17.2346 4.61294 17.1508 4.19531 16.9716L4.01855 16.8896C3.36014 16.5541 2.80898 16.0434 2.4248 15.4169L2.27051 15.1415C2.03328 14.6758 1.93158 14.167 1.88281 13.5702C1.83468 12.9811 1.83496 12.2493 1.83496 11.3271V8.66301C1.83496 7.74072 1.83468 7.00898 1.88281 6.41985C1.93157 5.82309 2.03329 5.31432 2.27051 4.84856L2.4248 4.57317C2.80898 3.94666 3.36012 3.436 4.01855 3.10051L4.19531 3.0175C4.61285 2.83843 5.06771 2.75548 5.58984 2.71281C6.17898 2.66468 6.91071 2.66496 7.83301 2.66496H12.167C13.0893 2.66496 13.821 2.66468 14.4102 2.71281C15.0069 2.76157 15.5157 2.86329 15.9814 3.10051L16.2568 3.25481C16.8833 3.63898 17.394 4.19012 17.7295 4.84856L17.8125 5.02531C17.9916 5.44285 18.0745 5.89771 18.1172 6.41985C18.1653 7.00898 18.165 7.74072 18.165 8.66301V11.3271ZM8.16406 15.995H12.167C13.1112 15.995 13.7794 15.9947 14.3018 15.9521C14.8164 15.91 15.1308 15.8299 15.3779 15.704L15.5615 15.6015C15.9797 15.3451 16.32 14.9774 16.5439 14.538L16.6299 14.3378C16.7074 14.121 16.7605 13.8478 16.792 13.4618C16.8347 12.9394 16.835 12.2712 16.835 11.3271V8.66301C16.835 7.71885 16.8347 7.05065 16.792 6.52824C16.7605 6.14232 16.7073 5.86904 16.6299 5.65227L16.5439 5.45207C16.32 5.01264 15.9796 4.64498 15.5615 4.3886L15.3779 4.28606C15.1308 4.16013 14.8165 4.08006 14.3018 4.03801C13.7794 3.99533 13.1112 3.99504 12.167 3.99504H8.16406C8.16407 3.99667 8.16504 3.99829 8.16504 3.99992L8.16406 15.995Z"></path>
                  </svg>
                </Button>
              </div>
            </div>
          </div>
          
           <div className="flex-1 overflow-y-auto">
             <div className="p-3 space-y-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`sidebar-chat-item group ${
                      currentConversationId === conversation.id ? 'selected' : ''
                    }`}
                    onClick={() => handleLoadConversation(conversation.id)}
                  >
                     <div className="chat-title">
                       <p 
                         className="font-medium"
                         style={{ 
                           color: 'rgb(255, 255, 255)',
                           fontSize: '14px',
                           lineHeight: '20px',
                           fontFamily: 'ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"'
                         }}
                       >
                         {conversation.title}
                       </p>
                     </div>
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={(e) => e.stopPropagation()}
                           className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                           style={{ 
                             color: 'rgba(255, 255, 255, 0.6)',
                             fontSize: '14px'
                           }}
                         >
                           <MoreHorizontal className="h-4 w-4" />
                         </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end" className="w-48">
                         <DropdownMenuItem
                           onClick={(e) => {
                             e.stopPropagation();
                             handleRenameConversation(conversation);
                           }}
                           className="cursor-pointer"
                         >
                           <Edit3 className="h-4 w-4 mr-2" />
                           Renombrar
                         </DropdownMenuItem>
                         <DropdownMenuItem
                           onClick={(e) => {
                             e.stopPropagation();
                             handleDeleteConversation(conversation.id);
                           }}
                           className="cursor-pointer text-destructive focus:text-destructive"
                         >
                           <Trash2 className="h-4 w-4 mr-2" />
                           Eliminar
                         </DropdownMenuItem>
                       </DropdownMenuContent>
                     </DropdownMenu>
                  </div>
               ))}
             </div>
          </div>
        </div>

        <div 
          className="flex-1 flex flex-col min-w-0"
          style={{ 
            height: 'calc(100vh - 70px)',
            backgroundColor: 'var(--bg-elevated-secondary, #181818)'
          }}
        >
          <div 
            className="flex-1 overflow-y-auto"
            style={{ 
              height: 'calc(100vh - 150px)',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-elevated-secondary, #181818)'
            }}
          >
            <div 
              className="max-w-4xl mx-auto px-4 py-6"
              style={{
                backgroundColor: 'var(--bg-elevated-secondary, #181818)'
              }}
            >
              {currentMessages.length === 0 && !isTyping && (
                <div 
                  className="text-center py-12"
                  style={{ color: 'var(--text-secondary, #f3f3f3)' }}
                >
                  <div className="flex justify-center mb-6">
                    <img 
                      src={websyAvatarSrc} 
                      alt="Websy AI" 
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  </div>
                  <h2 className="text-2xl font-semibold mb-3 text-foreground dark:text-slate-100">¡Hola! Soy Websy AI</h2>
                  <p className="text-lg text-foreground dark:text-slate-200 mb-8">
                    Puedo ayudarte a analizar proyectos, gestionar recursos y generar reportes.
                    <br />
                    ¿En qué puedo ayudarte hoy?
                  </p>
                  
                  {/* Acciones Rápidas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    <button
                      onClick={() => handleQuickAction("Analiza el estado actual de todos los proyectos")}
                      className="p-4 text-left bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">Análisis de Proyectos</h3>
                          <p className="text-sm text-muted-foreground">Revisa el estado de todos los proyectos</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleQuickAction("Genera un reporte de tareas pendientes y completadas")}
                      className="p-4 text-left bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">Reporte de Tareas</h3>
                          <p className="text-sm text-muted-foreground">Resumen de tareas pendientes y completadas</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleQuickAction("Muestra las próximas reuniones programadas en el calendario")}
                      className="p-4 text-left bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">Próximas Reuniones</h3>
                          <p className="text-sm text-muted-foreground">Consulta el calendario de reuniones</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleQuickAction("Analiza el rendimiento del equipo y sugiere mejoras")}
                      className="p-4 text-left bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">Análisis del Equipo</h3>
                          <p className="text-sm text-muted-foreground">Rendimiento y sugerencias de mejora</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                {currentMessages.map((message) => (
                  !message.isAI ? (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isNewMessage={newMessageIds.has(message.id)}
                      onCopy={(text) => {
                        navigator.clipboard.writeText(text);
                        toast({
                          title: "Copiado",
                          description: "Mensaje copiado al portapapeles"
                        });
                      }}
                      onRetry={undefined}
                      onEditMessage={handleEditMessage}
                      onStartEdit={handleStartEdit}
                      onCancelEdit={handleCancelEdit}
                      isEditing={editingMessageId === message.id}
                      onTypewriterProgress={handleTypewriterProgress}
                    />
                  ) : (
                    <CleanResponse 
                      key={message.id}
                      content={message.message}
                      onRetry={() => handleRetryMessage(message.id)}
                    />
                  )
                ))}
                
                {/* Respuesta de IA limpia */}
                {aiResponse && (
                  <CleanResponse 
                    content={aiResponse}
                    isStreaming={isStreaming}
                    streamingText={streamingText}
                    onRetry={handleRetryMessage}
                  />
                )}
                
                {isThinking && <ThinkingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
          
          <div 
            className="flex-shrink-0 w-full"
            style={{ 
              minHeight: '80px'
            }}
          >
            <div className="w-full h-full flex items-center">
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isLoading}
                placeholder="Escribe tu mensaje a Websy AI..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de configuración */}
      <AISettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
      />

      {/* Diálogo de renombrar conversación */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Renombrar conversación</DialogTitle>
            <DialogDescription>
              Ingresa un nuevo nombre para esta conversación.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Nombre
              </Label>
              <Input
                id="title"
                value={newConversationTitle}
                onChange={(e) => setNewConversationTitle(e.target.value)}
                className="col-span-3"
                placeholder="Nombre de la conversación"
                maxLength={100}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameDialogOpen(false);
                setConversationToRename(null);
                setNewConversationTitle('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmRename}
              disabled={!newConversationTitle.trim()}
            >
              Renombrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
};

export default WebsyAI;
