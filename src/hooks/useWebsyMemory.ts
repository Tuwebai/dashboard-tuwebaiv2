import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';

export interface ConversationMemory {
  id: string;
  conversation_id: string;
  context_summary: string;
  key_topics: string[];
  user_preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  work_patterns: string[];
  preferred_communication_style: string;
  common_tasks: string[];
  expertise_areas: string[];
  project_contexts: string[];
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  project_id?: string;
  created_at: string;
  updated_at: string;
}

export const useWebsyMemory = () => {
  const { user } = useApp();
  const [conversationMemories, setConversationMemories] = useState<ConversationMemory[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar memoria de conversaciones
  const loadConversationMemories = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('websy_memory')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('Error consultando websy_memory:', error.message);
        setConversationMemories([]);
        return;
      }
      setConversationMemories(data || []);
    } catch (err) {
      console.error('Error loading conversation memories:', err);
      setError('Error al cargar memorias de conversación');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Cargar perfil de usuario
  const loadUserProfile = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('websy_user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUserProfile(data);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('Error al cargar perfil de usuario');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Cargar base de conocimiento
  const loadKnowledgeBase = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('websy_knowledge_base')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Error consultando websy:', error.message);
        return;
      }
      setKnowledgeBase(data || []);
    } catch (err) {
      console.error('Error loading knowledge base:', err);
      setError('Error al cargar base de conocimiento');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Guardar memoria de conversación
  const saveConversationMemory = useCallback(async (
    conversationId: string,
    contextSummary: string,
    keyTopics: string[],
    userPreferences: Record<string, any>
  ) => {
    if (!user) return;

    try {
      // Verificar si ya existe una memoria para esta conversación
      const { data: existingMemory } = await supabase
        .from('websy_memory')
        .select('*')
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId)
        .single();

      let data;
      if (existingMemory) {
        // Actualizar memoria existente
        const { data: updatedData, error } = await supabase
          .from('websy_memory')
          .update({
            context_summary: contextSummary,
            key_topics: keyTopics,
            user_preferences: userPreferences,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMemory.id)
          .select()
          .single();

        if (error) {
        console.warn('Error consultando websy:', error.message);
        return;
      }
        data = updatedData;
      } else {
        // Crear nueva memoria
        const { data: newData, error } = await supabase
          .from('websy_memory')
          .insert({
            user_id: user.id,
            conversation_id: conversationId,
            context_summary: contextSummary,
            key_topics: keyTopics,
            user_preferences: userPreferences,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
        console.warn('Error consultando websy:', error.message);
        return;
      }
        data = newData;
      }
      
      // Actualizar estado local
      setConversationMemories(prev => {
        const existing = prev.find(m => m.conversation_id === conversationId);
        if (existing) {
          return prev.map(m => m.conversation_id === conversationId ? data : m);
        }
        return [data, ...prev];
      });

      return data;
    } catch (err) {
      console.error('Error saving conversation memory:', err);
      setError('Error al guardar memoria de conversación');
      return null;
    }
  }, [user]);

  // Actualizar perfil de usuario
  const updateUserProfile = useCallback(async (profileData: Partial<UserProfile>) => {
    if (!user) return;

    try {
      // Primero intentar actualizar el perfil existente
      const { data: existingProfile } = await supabase
        .from('websy_user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) {
        // Actualizar perfil existente
        const { data, error } = await supabase
          .from('websy_user_profiles')
          .update({
            ...profileData,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
        console.warn('Error consultando websy:', error.message);
        return;
      }
        setUserProfile(data);
        return data;
      } else {
        // Crear nuevo perfil
        const { data, error } = await supabase
          .from('websy_user_profiles')
          .insert({
            user_id: user.id,
            ...profileData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
        console.warn('Error consultando websy:', error.message);
        return;
      }
        setUserProfile(data);
        return data;
      }
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError('Error al actualizar perfil de usuario');
      return null;
    }
  }, [user]);

  // Agregar a base de conocimiento
  const addToKnowledgeBase = useCallback(async (
    title: string,
    content: string,
    category: string,
    tags: string[],
    projectId?: string
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('websy_knowledge_base')
        .insert({
          user_id: user.id,
          title,
          content,
          category,
          tags,
          project_id: projectId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.warn('Error consultando websy:', error.message);
        return;
      }
      
      setKnowledgeBase(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding to knowledge base:', err);
      setError('Error al agregar a base de conocimiento');
      return null;
    }
  }, [user]);

  // Buscar en base de conocimiento
  const searchKnowledgeBase = useCallback(async (query: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('websy_knowledge_base')
        .select('*')
        .eq('user_id', user.id)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Error consultando websy:', error.message);
        return;
      }
      return data || [];
    } catch (err) {
      console.error('Error searching knowledge base:', err);
      return [];
    }
  }, [user]);

  // Obtener contexto relevante para una conversación
  const getRelevantContext = useCallback(async (currentMessage: string) => {
    if (!user) return { memories: [], knowledge: [], profile: null };

    try {
      // Buscar memorias relevantes
      const relevantMemories = conversationMemories.filter(memory => 
        memory.key_topics.some(topic => 
          currentMessage.toLowerCase().includes(topic.toLowerCase())
        )
      );

      // Buscar en base de conocimiento
      const relevantKnowledge = await searchKnowledgeBase(currentMessage);

      return {
        memories: relevantMemories,
        knowledge: relevantKnowledge,
        profile: userProfile
      };
    } catch (err) {
      console.error('Error getting relevant context:', err);
      return { memories: [], knowledge: [], profile: null };
    }
  }, [user, conversationMemories, userProfile, searchKnowledgeBase]);

  // Cargar todo al inicializar
  useEffect(() => {
    if (user) {
      loadConversationMemories();
      loadUserProfile();
      loadKnowledgeBase();
    }
  }, [user, loadConversationMemories, loadUserProfile, loadKnowledgeBase]);

  return {
    conversationMemories,
    userProfile,
    knowledgeBase,
    isLoading,
    error,
    saveConversationMemory,
    updateUserProfile,
    addToKnowledgeBase,
    searchKnowledgeBase,
    getRelevantContext,
    loadConversationMemories,
    loadUserProfile,
    loadKnowledgeBase
  };
};
