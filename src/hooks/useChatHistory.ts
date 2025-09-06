import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';

export interface ChatMessage {
  id: string;
  message: string;
  isAI: boolean;
  timestamp: Date;
  attachments?: any[];
  contextData?: any;
}

export interface Conversation {
  id: string;
  title: string;
  contextType: 'general' | 'project' | 'user' | 'analytics';
  contextId?: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;
}

export const useChatHistory = () => {
  const { user } = useApp();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar conversaciones del usuario
  const loadConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_messages(count)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      const conversationsWithCount = data?.map(conv => ({
        ...conv,
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at),
        messageCount: conv.conversation_messages?.[0]?.count || 0
      })) || [];

      setConversations(conversationsWithCount);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError(error instanceof Error ? error.message : 'Error cargando conversaciones');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cargar mensajes de una conversación
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      const messages = data?.map(msg => ({
        id: msg.id,
        message: msg.message,
        isAI: msg.is_ai_message,
        timestamp: new Date(msg.created_at),
        attachments: msg.attachments || [],
        contextData: msg.context_data || {}
      })) || [];

      setCurrentMessages(messages);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError(error instanceof Error ? error.message : 'Error cargando mensajes');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Crear nueva conversación
  const createConversation = useCallback(async (
    title: string,
    contextType: 'general' | 'project' | 'user' | 'analytics' = 'general',
    contextId?: string
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title,
          context_type: contextType,
          context_id: contextId
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Recargar conversaciones
      await loadConversations();
      
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError(error instanceof Error ? error.message : 'Error creando conversación');
      return null;
    }
  }, [user, loadConversations]);

  // Guardar mensaje
  const saveMessage = useCallback(async (
    message: string,
    isAI: boolean,
    conversationId?: string,
    attachments?: any[],
    contextData?: any
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      let currentConvId = conversationId || currentConversationId;

      // Si no hay conversación, crear una nueva
      if (!currentConvId) {
        const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
        currentConvId = await createConversation(title);
        if (!currentConvId) return null;
      }

      const { data, error: insertError } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: currentConvId,
          message,
          is_ai_message: isAI,
          attachments: attachments || [],
          context_data: contextData || {}
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Actualizar mensajes locales
      const newMessage: ChatMessage = {
        id: data.id,
        message,
        isAI,
        timestamp: new Date(data.created_at),
        attachments: attachments || [],
        contextData: contextData || {}
      };

      setCurrentMessages(prev => [...prev, newMessage]);
      setCurrentConversationId(currentConvId);

      // Actualizar timestamp de la conversación
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentConvId);

      return data.id;
    } catch (error) {
      console.error('Error saving message:', error);
      setError(error instanceof Error ? error.message : 'Error guardando mensaje');
      return null;
    }
  }, [user, currentConversationId, createConversation]);

  // Eliminar conversación
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Recargar conversaciones
      await loadConversations();

      // Si era la conversación actual, limpiar mensajes
      if (currentConversationId === conversationId) {
        setCurrentMessages([]);
        setCurrentConversationId(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError(error instanceof Error ? error.message : 'Error eliminando conversación');
    }
  }, [user, currentConversationId, loadConversations]);

  // Buscar en conversaciones
  const searchConversations = useCallback(async (query: string) => {
    if (!user || !query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: searchError } = await supabase
        .from('conversation_messages')
        .select(`
          *,
          conversations!inner(*)
        `)
        .textSearch('message', query)
        .eq('conversations.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (searchError) throw searchError;

      return data || [];
    } catch (error) {
      console.error('Error searching conversations:', error);
      setError(error instanceof Error ? error.message : 'Error buscando conversaciones');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cargar conversaciones al montar el componente
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  return {
    conversations,
    currentMessages,
    currentConversationId,
    loading,
    error,
    loadConversations,
    loadMessages,
    createConversation,
    saveMessage,
    deleteConversation,
    searchConversations,
    setCurrentConversationId,
    setCurrentMessages
  };
};
