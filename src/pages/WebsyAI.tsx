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
import { ContextPanel } from '@/components/websy-ai/ContextPanel';
import { AISettingsModal } from '@/components/websy-ai/AISettingsModal';
import { supabase } from '@/lib/supabase';

const WebsyAI: React.FC = () => {
  const { user } = useApp();
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [contextData, setContextData] = useState<any>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  
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

  // Cargar contexto de la base de datos
  const loadContextData = useCallback(async () => {
    setLoadingContext(true);
    try {
      const [projectsResult, usersResult, ticketsResult] = await Promise.all([
        supabase.from('projects').select('id, name, status, progress, created_at, updated_at, created_by'),
        supabase.from('users').select('id, full_name, email, role, created_at'),
        supabase.from('tickets').select('id, asunto, status, prioridad, created_at, user_id')
      ]);

      setContextData({
        projects: projectsResult.data || [],
        users: usersResult.data || [],
        tickets: ticketsResult.data || [],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el contexto de datos",
        variant: "destructive"
      });
    } finally {
      setLoadingContext(false);
    }
  }, []);

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
      loadContextData();
    }
  }, [user, loadConversations, loadContextData]);

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
      <div className="container mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar de conversaciones */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-200px)]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Conversaciones</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {conversations.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
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
          <div className="lg:col-span-2">
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

          {/* Panel de contexto */}
          <div className="lg:col-span-1 space-y-4">
            <ContextPanel
              contextData={contextData}
              onRefresh={loadContextData}
              loading={loadingContext}
            />
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
