import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Settings, 
  Trash2, 
  Plus, 
  Search,
  Download,
  MoreHorizontal,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { useChatHistory, ChatMessage, Conversation } from '@/hooks/useChatHistory';
import { useAISettings } from '@/hooks/useAISettings';
import { MessageBubble } from '@/components/websy-ai/MessageBubble';
import { TypingIndicator } from '@/components/websy-ai/TypingIndicator';
import { ChatInput } from '@/components/websy-ai/ChatInput';
import { AISettingsModal } from '@/components/websy-ai/AISettingsModal';
import { supabase } from '@/lib/supabase';

const WebsyAI: React.FC = () => {
  const { user } = useApp();
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { sendMessage, isLoading, error } = useGeminiAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.REACT_APP_GEMINI_API_KEY || '',
    temperature: 0.7,
    maxTokens: 2048
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
      await saveMessage(message, false, currentConversationId, attachments);

      // Mostrar indicador de escritura
      setIsTyping(true);

      // Enviar a Gemini AI
      const aiResponse = await sendMessage(
        message,
        currentMessages,
        'general',
        undefined
      );

      // Guardar respuesta de la IA
      await saveMessage(aiResponse, true, currentConversationId);

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

  // Scroll automático al final
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
    <div className="min-h-screen bg-background">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Websy AI
                </h1>
                <p className="text-sm text-muted-foreground">
                  Asistente de IA para administración de proyectos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewConversation}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva
              </Button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-200px)] relative">
          {/* Botón flotante para expandir cuando está colapsado */}
          {sidebarCollapsed && (
            <button
              className="absolute left-0 top-4 z-10 text-token-text-tertiary no-draggable hover:bg-token-surface-hover keyboard-focused:bg-token-surface-hover touch:h-10 touch:w-10 flex h-9 w-9 items-center justify-center rounded-lg focus:outline-none disabled:opacity-50 no-draggable cursor-e-resize bg-background border border-border shadow-lg"
              aria-expanded={false}
              aria-controls="stage-slideover-sidebar"
              aria-label="Abrir barra lateral"
              data-testid="open-sidebar-button"
              data-state="closed"
              onClick={() => setSidebarCollapsed(false)}
              title="Abrir barra lateral"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" data-rtl-flip="" className="icon max-md:hidden">
                <path d="M13.165 3.99992C13.6165 4.00411 13.9858 4.0122 14.3018 4.03801C14.6877 4.06954 14.961 4.12266 15.1778 4.20012L15.3779 4.28606C15.8174 4.50996 16.185 4.85035 16.4414 5.26848L16.5439 5.45207C16.6699 5.69922 16.7499 6.01354 16.792 6.52824C16.8347 7.05065 16.835 7.71885 16.835 8.66301V11.3271C16.835 12.2712 16.8347 12.9394 16.792 13.4618C16.7499 13.9766 16.6699 14.2909 16.5439 14.538L16.4414 14.7216C16.185 15.1397 15.8173 15.4801 15.3779 15.704L15.1778 15.79C14.961 15.8674 14.6877 15.9205 14.3018 15.9521C13.986 15.9779 13.617 15.986 13.166 15.9902L13.165 3.99992ZM1.83504 11.3271C1.83504 12.2493 1.83468 12.9811 1.88281 13.5702C1.92548 14.0924 2.00843 14.5472 2.1875 14.9648L2.27051 15.1415C2.606 15.8 3.11658 16.3511 3.74316 16.7353L4.01855 16.8896C4.48432 17.1268 4.99309 17.2285 5.58984 17.2773C6.17898 17.3254 6.91071 17.3251 7.83301 17.3251H12.167C13.0893 17.3251 13.821 17.3254 14.4102 17.2773C14.9324 17.2346 15.3871 17.1508 15.8047 16.9716L15.9814 16.8896C16.6399 16.5541 17.191 16.0434 17.5752 15.4169L17.7295 15.1415C17.9667 14.6758 18.0684 14.167 18.1172 13.5702C18.1653 12.9811 18.165 12.2493 18.165 11.3271V8.66301C18.165 7.74072 18.1653 7.00898 18.1172 6.41985C18.0684 5.82309 17.9667 5.31432 17.7295 4.84856L17.5752 4.57317C17.191 3.94666 16.6399 3.436 15.9814 3.10051L15.8047 3.0175C15.3871 2.83843 14.9323 2.75548 14.4102 2.71281C13.821 2.66468 13.0893 2.66496 12.167 2.66496H7.83301C6.91071 2.66496 6.17898 2.66468 5.58984 2.71281C4.99309 2.76157 4.48432 2.86329 4.01855 3.10051L3.74316 3.25481C3.11667 3.63898 2.606 4.19012 2.27051 4.84856L2.1875 5.02531C2.00843 5.44285 1.92548 5.89771 1.88281 6.41985C1.83468 7.00898 1.83504 7.74072 1.83504 8.66301V11.3271ZM11.8359 15.995H7.83301C6.8888 15.995 6.22058 15.9947 5.69824 15.9521C5.18359 15.91 4.86914 15.8299 4.62207 15.704L4.43848 15.6015C4.02035 15.3451 3.68004 14.9774 3.45605 14.538L3.37012 14.3378C3.29266 14.121 3.2395 13.8478 3.20799 13.4618C3.16533 12.9394 3.16504 12.2712 3.16504 11.3271V8.66301C3.16504 7.71885 3.16533 7.05065 3.20799 6.52824C3.2395 6.14232 3.29266 5.86904 3.37012 5.65227L3.45605 5.45207C3.68004 5.01264 4.02035 4.64498 4.43848 4.3886L4.62207 4.28606C4.86914 4.16013 5.18347 4.08006 5.69824 4.03801C6.22058 3.99533 6.8888 3.99504 7.83301 3.99504H11.8359C11.8359 3.99667 11.835 3.99829 11.835 3.99992L11.8359 15.995Z"></path>
              </svg>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="icon md:hidden">
                <path d="M5.74512 4.75488C5.47176 4.48152 5.02826 4.48152 4.75488 4.75488C4.48152 5.02825 4.48152 5.47175 4.75488 5.74512L9.00977 10L4.75488 14.2549L4.66504 14.3652C4.48594 14.6369 4.5158 15.006 4.75488 15.2451C4.99396 15.4842 5.3631 15.5141 5.63477 15.335L5.74512 15.2451L9.99995 10.9902L14.2548 15.2451C14.5282 15.5185 14.9717 15.5185 15.2451 15.2451C15.5184 14.9718 15.5184 14.5282 15.2451 14.2549L10.9902 10L15.2451 5.74512L15.335 5.63477C15.5141 5.3631 15.4842 4.99396 15.2451 4.75488C15.006 4.51581 14.6369 4.48594 14.3652 4.66504L14.2548 4.75488L9.99995 9.00977L5.74512 4.75488Z"></path>
              </svg>
            </button>
          )}

          {/* Sidebar de conversaciones */}
          <div className={`${sidebarCollapsed ? 'w-0' : 'w-80'} transition-all duration-300 overflow-hidden border-r`}>
            <Card className="h-full border-0 rounded-none">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Conversaciones</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {conversations.length}
                    </Badge>
                    <button
                      className="text-token-text-tertiary no-draggable hover:bg-token-surface-hover keyboard-focused:bg-token-surface-hover touch:h-10 touch:w-10 flex h-9 w-9 items-center justify-center rounded-lg focus:outline-none disabled:opacity-50 no-draggable cursor-w-resize rtl:cursor-e-resize"
                      aria-expanded={!sidebarCollapsed}
                      aria-controls="stage-slideover-sidebar"
                      aria-label={sidebarCollapsed ? "Abrir barra lateral" : "Cerrar barra lateral"}
                      data-testid="close-sidebar-button"
                      data-state={sidebarCollapsed ? "closed" : "open"}
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" data-rtl-flip="" className="icon max-md:hidden">
                        <path d="M6.83496 3.99992C6.38353 4.00411 6.01421 4.0122 5.69824 4.03801C5.31232 4.06954 5.03904 4.12266 4.82227 4.20012L4.62207 4.28606C4.18264 4.50996 3.81498 4.85035 3.55859 5.26848L3.45605 5.45207C3.33013 5.69922 3.25006 6.01354 3.20801 6.52824C3.16533 7.05065 3.16504 7.71885 3.16504 8.66301V11.3271C3.16504 12.2712 3.16533 12.9394 3.20801 13.4618C3.25006 13.9766 3.33013 14.2909 3.45605 14.538L3.55859 14.7216C3.81498 15.1397 4.18266 15.4801 4.62207 15.704L4.82227 15.79C5.03904 15.8674 5.31234 15.9205 5.69824 15.9521C6.01398 15.9779 6.383 15.986 6.83398 15.9902L6.83496 3.99992ZM18.165 11.3271C18.165 12.2493 18.1653 12.9811 18.1172 13.5702C18.0745 14.0924 17.9916 14.5472 17.8125 14.9648L17.7295 15.1415C17.394 15.8 16.8834 16.3511 16.2568 16.7353L15.9814 16.8896C15.5157 17.1268 15.0069 17.2285 14.4102 17.2773C13.821 17.3254 13.0893 17.3251 12.167 17.3251H7.83301C6.91071 17.3251 6.17898 17.3254 5.58984 17.2773C5.06757 17.2346 4.61294 17.1508 4.19531 16.9716L4.01855 16.8896C3.36014 16.5541 2.80898 16.0434 2.4248 15.4169L2.27051 15.1415C2.03328 14.6758 1.93158 14.167 1.88281 13.5702C1.83468 12.9811 1.83496 12.2493 1.83496 11.3271V8.66301C1.83496 7.74072 1.83468 7.00898 1.88281 6.41985C1.93157 5.82309 2.03329 5.31432 2.27051 4.84856L2.4248 4.57317C2.80898 3.94666 3.36012 3.436 4.01855 3.10051L4.19531 3.0175C4.61285 2.83843 5.06771 2.75548 5.58984 2.71281C6.17898 2.66468 6.91071 2.66496 7.83301 2.66496H12.167C13.0893 2.66496 13.821 2.66468 14.4102 2.71281C15.0069 2.76157 15.5157 2.86329 15.9814 3.10051L16.2568 3.25481C16.8833 3.63898 17.394 4.19012 17.7295 4.84856L17.8125 5.02531C17.9916 5.44285 18.0745 5.89771 18.1172 6.41985C18.1653 7.00898 18.165 7.74072 18.165 8.66301V11.3271ZM8.16406 15.995H12.167C13.1112 15.995 13.7794 15.9947 14.3018 15.9521C14.8164 15.91 15.1308 15.8299 15.3779 15.704L15.5615 15.6015C15.9797 15.3451 16.32 14.9774 16.5439 14.538L16.6299 14.3378C16.7074 14.121 16.7605 13.8478 16.792 13.4618C16.8347 12.9394 16.835 12.2712 16.835 11.3271V8.66301C16.835 7.71885 16.8347 7.05065 16.792 6.52824C16.7605 6.14232 16.7073 5.86904 16.6299 5.65227L16.5439 5.45207C16.32 5.01264 15.9796 4.64498 15.5615 4.3886L15.3779 4.28606C15.1308 4.16013 14.8165 4.08006 14.3018 4.03801C13.7794 3.99533 13.1112 3.99504 12.167 3.99504H8.16406C8.16407 3.99667 8.16504 3.99829 8.16504 3.99992L8.16406 15.995Z"></path>
                      </svg>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="icon md:hidden">
                        <path d="M14.2548 4.75488C14.5282 4.48152 14.9717 4.48152 15.2451 4.75488C15.5184 5.02825 15.5184 5.47175 15.2451 5.74512L10.9902 10L15.2451 14.2549L15.3349 14.3652C15.514 14.6369 15.4841 15.006 15.2451 15.2451C15.006 15.4842 14.6368 15.5141 14.3652 15.335L14.2548 15.2451L9.99995 10.9902L5.74506 15.2451C5.4717 15.5185 5.0282 15.5185 4.75483 15.2451C4.48146 14.9718 4.48146 14.5282 4.75483 14.2549L9.00971 10L4.75483 5.74512L4.66499 5.63477C4.48589 5.3631 4.51575 4.99396 4.75483 4.75488C4.99391 4.51581 5.36305 4.48594 5.63471 4.66504L5.74506 4.75488L9.99995 9.00977L14.2548 4.75488Z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-1 p-2">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(conversation.id);
                            }}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Área de chat principal */}
          <div className="flex-1">
            <Card className="h-[calc(100vh-200px)] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Chat con Websy AI
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                  <div className="space-y-4">
                    {currentMessages.length === 0 && !isTyping && (
                      <div className="text-center text-muted-foreground py-8">
                        <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">¡Hola! Soy Websy AI</p>
                        <p className="text-sm">
                          Puedo ayudarte a analizar proyectos, gestionar recursos y generar reportes.
                          <br />
                          ¿En qué puedo ayudarte hoy?
                        </p>
                      </div>
                    )}
                    
                    {currentMessages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        onCopy={(text) => {
                          navigator.clipboard.writeText(text);
                          toast({
                            title: "Copiado",
                            description: "Mensaje copiado al portapapeles"
                          });
                        }}
                      />
                    ))}
                    
                    {isTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                <div className="p-4 border-t">
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    disabled={isLoading}
                    placeholder="Escribe tu mensaje a Websy AI..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>

      {/* Modal de configuración */}
      <AISettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  );
};

export default WebsyAI;
