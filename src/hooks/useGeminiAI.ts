import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface ChatMessage {
  id: string;
  message: string;
  isAI: boolean;
  timestamp: Date;
  attachments?: any[];
  contextData?: any;
}

interface UseGeminiAIOptions {
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}

export const useGeminiAI = ({ apiKey, temperature = 0.7, maxTokens = 2048 }: UseGeminiAIOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener contexto de la base de datos
  const getDatabaseContext = useCallback(async () => {
    try {
      const [projectsResult, usersResult, ticketsResult] = await Promise.all([
        supabase.from('projects').select('id, name, status, progress, created_at, updated_at, created_by'),
        supabase.from('users').select('id, full_name, email, role, created_at'),
        supabase.from('tickets').select('id, title, status, priority, created_at, user_id')
      ]);

      return {
        projects: projectsResult.data || [],
        users: usersResult.data || [],
        tickets: ticketsResult.data || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting database context:', error);
      return null;
    }
  }, []);

  // Enviar mensaje a Gemini AI
  const sendMessage = useCallback(async (
    message: string,
    conversationHistory: ChatMessage[] = [],
    contextType: 'general' | 'project' | 'user' | 'analytics' = 'general',
    contextId?: string
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // Obtener contexto de la base de datos
      const dbContext = await getDatabaseContext();
      
      // Construir contexto del sistema
      const systemPrompt = `Eres Websy AI, un asistente de inteligencia artificial especializado en administración de proyectos web y análisis de datos empresariales.

CONTEXTO DE LA BASE DE DATOS:
${dbContext ? JSON.stringify(dbContext, null, 2) : 'No se pudo obtener contexto de la base de datos'}

INSTRUCCIONES:
1. Eres un experto en gestión de proyectos web, análisis de datos y optimización de recursos
2. Puedes analizar proyectos, usuarios, tickets y métricas en tiempo real
3. Proporciona respuestas precisas y accionables basadas en los datos reales
4. Si no tienes información suficiente, pide aclaraciones específicas
5. Mantén un tono profesional pero amigable
6. Siempre incluye datos específicos cuando sea relevante

TIPOS DE ANÁLISIS QUE PUEDES REALIZAR:
- Análisis predictivo de proyectos
- Asignación inteligente de recursos
- Validación de briefs de clientes
- Generación de reportes automáticos
- Optimización de carga de trabajo
- Análisis de tendencias y patrones

Responde en español y sé específico con los datos cuando sea posible.`;

      // Construir historial de conversación para Gemini
      const geminiHistory: GeminiMessage[] = [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        }
      ];

      // Agregar historial de conversación reciente (últimos 10 mensajes)
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        geminiHistory.push({
          role: msg.isAI ? 'model' : 'user',
          parts: [{ text: msg.message }]
        });
      }

      // Agregar el mensaje actual
      geminiHistory.push({
        role: 'user',
        parts: [{ text: message }]
      });

      // Llamar a la API de Gemini
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiHistory,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            topP: 0.8,
            topK: 10
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Error de API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Respuesta inválida de la API');
      }

      const aiResponse = data.candidates[0].content.parts[0].text;
      
      return aiResponse;
    } catch (error) {
      console.error('Error calling Gemini AI:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, temperature, maxTokens, getDatabaseContext]);

  return {
    sendMessage,
    isLoading,
    error
  };
};
