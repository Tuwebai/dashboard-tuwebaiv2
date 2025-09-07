import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';
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
import { ChatInput } from '@/components/websy-ai/ChatInput';
import { AISettingsModal } from '@/components/websy-ai/AISettingsModal';
// Removidos - ahora están en configuración
import { supabase } from '@/lib/supabase';

const WebsyAI: React.FC = () => {
  const { user } = useApp();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // Seleccionar avatar según el tema
  const websyAvatarSrc = theme === 'dark' ? websyAvatarDark : websyAvatar;
  const [isTyping, setIsTyping] = useState(false);
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

  // Google Calendar - Declarar primero para usar en useMultiAI
  const {
    isAuthenticated: isCalendarAuthenticated,
    userInfo: calendarUserInfo,
    authenticate: authenticateCalendar,
    signOut: signOutCalendar,
    isLoading: calendarLoading
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
      // Guardar mensaje del usuario
      const userMessageId = await saveMessage(message, false, currentConversationId, attachments);
      
      // Marcar mensaje del usuario como nuevo
      if (userMessageId) {
        setNewMessageIds(prev => new Set(prev).add(userMessageId));
      }

      // Mostrar indicador de escritura
      setIsTyping(true);

      // Enviar a Gemini AI
      const aiResponse = await sendMessage(
        message,
        currentMessages,
        'general',
        undefined,
        attachments
      );

      // Guardar respuesta de la IA
      const aiMessageId = await saveMessage(aiResponse, true, currentConversationId);
      
      // Marcar mensaje de IA como nuevo
      if (aiMessageId) {
        setNewMessageIds(prev => new Set(prev).add(aiMessageId));
      }

      setIsTyping(false);

    } catch (error) {
      setIsTyping(false);
      
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
  const handleRetryMessage = useCallback(async () => {
    if (!user || currentMessages.length === 0) return;

    // Encontrar el último mensaje del usuario
    const lastUserMessage = [...currentMessages].reverse().find(msg => !msg.isAI);
    if (!lastUserMessage) return;

    try {
      // Encontrar el índice del último mensaje de IA
      const lastAIIndex = currentMessages.findLastIndex(msg => msg.isAI);
      
      if (lastAIIndex === -1) return;

      // Eliminar solo el último mensaje de IA
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
    }
  }, [currentConversationId, loadMessages]);

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
    <div 
      className="fixed inset-0 bg-background flex flex-col"
      style={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50
      }}
    >
      <div 
        className="flex-shrink-0 px-4 py-3 border-b bg-background dark:bg-slate-900/95 dark:border-slate-700"
        style={{
          position: 'relative',
          zIndex: 60,
          minHeight: '70px'
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
            <ThemeToggle variant="outline" size="sm" />
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
        {/* Botón flotante para expandir cuando está colapsado */}
        {sidebarCollapsed && (
          <div className="w-12 flex-shrink-0 flex flex-col">
            <div className="flex-shrink-0 px-2 py-3 border-r bg-background">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarCollapsed(false)}
                className="w-full h-8 p-0 bg-background border shadow-sm hover:bg-muted"
                title="Abrir barra lateral"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className={`${sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-80'} transition-all duration-300 border-r bg-background dark:bg-slate-900 flex-shrink-0 flex flex-col`}>
          <div className="flex-shrink-0 px-4 py-3 border-b">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Conversaciones</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {conversations.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(true)}
                  className="h-8 w-8 p-0 hover:bg-muted"
                  title="Cerrar barra lateral"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
           <div className="flex-1 overflow-y-auto">
             <div className="p-3 space-y-2">
               {conversations.map((conversation) => (
                 <div
                   key={conversation.id}
                   className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                     currentConversationId === conversation.id
                       ? 'bg-primary text-primary-foreground'
                       : 'hover:bg-muted'
                   }`}
                   onClick={() => handleLoadConversation(conversation.id)}
                 >
                   <div className="flex items-center justify-between">
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-medium truncate">
                         {conversation.title}
                       </p>
                       <p className="text-xs text-muted-foreground">
                         {conversation.messageCount} mensajes
                       </p>
                     </div>
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={(e) => e.stopPropagation()}
                           className="h-6 w-6 p-0 opacity-60 group-hover:opacity-100 hover:opacity-100 transition-opacity"
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
                 </div>
               ))}
             </div>
          </div>
        </div>

        <div 
          className="flex-1 flex flex-col min-w-0 bg-background dark:bg-slate-900"
          style={{ height: 'calc(100vh - 70px)' }}
        >
          <div 
            className="flex-1 overflow-y-auto bg-background dark:bg-slate-900"
            style={{ 
              height: 'calc(100vh - 150px)',
              overflowY: 'auto'
            }}
          >
            <div className="max-w-4xl mx-auto px-4 py-6 bg-background dark:bg-slate-900">
              {currentMessages.length === 0 && !isTyping && (
                <div className="text-center text-muted-foreground dark:text-slate-300 py-12">
                  <div className="flex justify-center mb-6">
                    <img 
                      src={websyAvatarSrc} 
                      alt="Websy AI" 
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  </div>
                  <h2 className="text-2xl font-semibold mb-3 text-foreground dark:text-slate-100">¡Hola! Soy Websy AI</h2>
                  <p className="text-lg text-foreground dark:text-slate-200">
                    Puedo ayudarte a analizar proyectos, gestionar recursos y generar reportes.
                    <br />
                    ¿En qué puedo ayudarte hoy?
                  </p>
                </div>
              )}
              
              <div className="space-y-6">
                {currentMessages.map((message) => (
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
                    onRetry={message.isAI ? handleRetryMessage : undefined}
                    onEditMessage={handleEditMessage}
                    onStartEdit={handleStartEdit}
                    onCancelEdit={handleCancelEdit}
                    isEditing={editingMessageId === message.id}
                    onTypewriterProgress={handleTypewriterProgress}
                  />
                ))}
                
                {isTyping && <TypingIndicator />}
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
  );
};

export default WebsyAI;
