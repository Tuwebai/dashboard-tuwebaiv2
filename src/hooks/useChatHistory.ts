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

  // Claves para localStorage
  const STORAGE_KEYS = {
    currentConversationId: 'websy_ai_current_conversation_id',
    currentMessages: 'websy_ai_current_messages',
    conversations: 'websy_ai_conversations'
  };

  // Funciones para localStorage
  const saveToStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const loadFromStorage = (key: string) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  };

  const clearStorage = () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  // Función para obtener conteo de mensajes de forma segura
  const getMessageCount = useCallback(async (conversationId: string) => {
    try {
      const { count, error } = await supabase
        .from('conversation_messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);

      if (error) {
        console.warn('Error contando mensajes:', error.message);
        return 0;
      }
      return count || 0;
    } catch (error) {
      console.warn('Error en conteo de mensajes:', error);
      return 0;
    }
  }, []);

  // Cargar conversaciones del usuario
  const loadConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Primero intentar cargar desde localStorage
      const cachedConversations = loadFromStorage(STORAGE_KEYS.conversations);
      if (cachedConversations) {
        setConversations(cachedConversations);
      }

      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Obtener conteos de mensajes para cada conversación
      const conversationsWithCount = await Promise.all(
        (data || []).map(async (conv) => {
          const messageCount = await getMessageCount(conv.id);
          return {
            ...conv,
            createdAt: new Date(conv.created_at),
            updatedAt: new Date(conv.updated_at),
            messageCount
          };
        })
      );

      setConversations(conversationsWithCount);
      saveToStorage(STORAGE_KEYS.conversations, conversationsWithCount);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError(error instanceof Error ? error.message : 'Error cargando conversaciones');
    } finally {
      setLoading(false);
    }
  }, [user, getMessageCount]);

  // Cargar mensajes de una conversación
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Primero intentar cargar desde localStorage
      const cachedMessages = loadFromStorage(STORAGE_KEYS.currentMessages);
      const cachedConversationId = loadFromStorage(STORAGE_KEYS.currentConversationId);
      
      if (cachedMessages && cachedConversationId === conversationId) {
        setCurrentMessages(cachedMessages);
        setCurrentConversationId(conversationId);
      }

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
      
      // Guardar en localStorage
      saveToStorage(STORAGE_KEYS.currentMessages, messages);
      saveToStorage(STORAGE_KEYS.currentConversationId, conversationId);
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
      
      console.log('saveMessage - conversationId:', conversationId);
      console.log('saveMessage - currentConversationId:', currentConversationId);
      console.log('saveMessage - currentConvId:', currentConvId);

      // Si no hay conversación, crear una nueva
      if (!currentConvId) {
        console.log('No hay conversación actual, creando nueva...');
        const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
        currentConvId = await createConversation(title);
        if (!currentConvId) return null;
        // Actualizar el estado de la conversación actual
        setCurrentConversationId(currentConvId);
        // NO cargar mensajes de la nueva conversación para evitar sobrescribir el mensaje actual
        // await loadMessages(currentConvId);
      } else {
        console.log('Usando conversación existente:', currentConvId);
      }

      // Agregar mensaje del usuario al estado local INMEDIATAMENTE
      if (!isAI) {
        const tempUserMessage: ChatMessage = {
          id: `temp_${Date.now()}`,
          message,
          isAI: false,
          timestamp: new Date(),
          attachments: attachments || [],
          contextData: contextData || {}
        };
        setCurrentMessages(prev => [...prev, tempUserMessage]);
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

      // Si es un mensaje del usuario, reemplazar el mensaje temporal
      if (!isAI) {
        setCurrentMessages(prev => {
          // Remover mensaje temporal y agregar el real
          const withoutTemp = prev.filter(msg => !msg.id.startsWith('temp_'));
          return [...withoutTemp, newMessage];
        });
      } else {
        // Si es mensaje de IA, agregar normalmente
        setCurrentMessages(prev => [...prev, newMessage]);
      }
      setCurrentConversationId(currentConvId);

      // Guardar en localStorage
      const finalMessages = !isAI ? 
        currentMessages.filter(msg => !msg.id.startsWith('temp_')).concat(newMessage) :
        [...currentMessages, newMessage];
      
      saveToStorage(STORAGE_KEYS.currentMessages, finalMessages);
      saveToStorage(STORAGE_KEYS.currentConversationId, currentConvId);

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

  // Cargar estado inicial desde localStorage
  useEffect(() => {
    if (user) {
      // Cargar conversación actual desde localStorage
      const savedConversationId = loadFromStorage(STORAGE_KEYS.currentConversationId);
      const savedMessages = loadFromStorage(STORAGE_KEYS.currentMessages);
      
      if (savedConversationId && savedMessages) {
        setCurrentConversationId(savedConversationId);
        setCurrentMessages(savedMessages);
      }
      
      loadConversations();
    } else {
      // Limpiar localStorage cuando no hay usuario
      clearStorage();
    }
  }, [user, loadConversations]);

  // Limpiar chat actual
  const clearCurrentChat = useCallback(() => {
    setCurrentMessages([]);
    setCurrentConversationId(null);
    saveToStorage(STORAGE_KEYS.currentMessages, []);
    saveToStorage(STORAGE_KEYS.currentConversationId, null);
  }, []);

  // Limpiar localStorage al desmontar
  useEffect(() => {
    return () => {
      // No limpiar aquí para mantener persistencia entre pestañas
    };
  }, []);

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
    setCurrentMessages,
    clearCurrentChat
  };
};
