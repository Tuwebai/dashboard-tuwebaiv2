import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

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
  // Obtener API key de las variables de entorno de Vite
  const geminiApiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.REACT_APP_GEMINI_API_KEY;
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
      // Validar API key
      if (!geminiApiKey || geminiApiKey.trim() === '') {
        throw new Error('API key de Gemini no configurada. Verifica las variables de entorno.');
      }

      // Validar mensaje
      if (!message || message.trim() === '') {
        throw new Error('El mensaje no puede estar vacío');
      }

      console.log('🚀 Enviando mensaje a Gemini AI...', {
        messageLength: message.length,
        conversationHistoryLength: conversationHistory.length,
        contextType,
        contextId
      });

      // Obtener contexto de la base de datos
      let dbContext = null;
      try {
        dbContext = await getDatabaseContext();
        console.log('📊 Contexto de base de datos obtenido:', dbContext ? 'OK' : 'ERROR');
      } catch (dbError) {
        console.warn('⚠️ Error obteniendo contexto de BD, continuando sin contexto:', dbError);
        // Continuar sin contexto si hay error en la BD
      }
      
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

      console.log('📝 Historial preparado:', {
        totalMessages: geminiHistory.length,
        systemPromptLength: systemPrompt.length,
        userMessageLength: message.length
      });

      // Llamar a la API de Gemini
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
      
      console.log('🌐 Llamando a Gemini API...', { apiUrl: apiUrl.replace(geminiApiKey, '***') });

      const response = await fetch(apiUrl, {
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

      console.log('📡 Respuesta de API recibida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error de API:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });

        let errorMessage = `Error de API: ${response.status} ${response.statusText}`;
        
        // Mensajes de error específicos
        if (response.status === 400) {
          errorMessage = 'Solicitud inválida. Verifica el formato del mensaje.';
        } else if (response.status === 401) {
          errorMessage = 'API key inválida o expirada. Verifica tu configuración.';
        } else if (response.status === 403) {
          errorMessage = 'Acceso denegado. Verifica los permisos de tu API key.';
        } else if (response.status === 429) {
          errorMessage = 'Límite de solicitudes excedido. Intenta de nuevo en unos minutos.';
        } else if (response.status === 500) {
          errorMessage = 'Error interno del servidor de Gemini. Intenta de nuevo.';
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('📄 Datos de respuesta:', data);
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('❌ Respuesta inválida de la API:', data);
        throw new Error('Respuesta inválida de la API de Gemini');
      }

      const aiResponse = data.candidates[0].content.parts[0].text;
      
      if (!aiResponse || aiResponse.trim() === '') {
        throw new Error('La respuesta de la IA está vacía');
      }

      console.log('✅ Respuesta de IA obtenida:', {
        length: aiResponse.length,
        preview: aiResponse.substring(0, 100) + '...'
      });
      
      return aiResponse;
    } catch (error) {
      console.error('❌ Error en sendMessage:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      
      // Mostrar toast de error
      toast({
        title: "Error al enviar mensaje",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [geminiApiKey, temperature, maxTokens, getDatabaseContext]);

  return {
    sendMessage,
    isLoading,
    error
  };
};
