import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { 
    text?: string;
    inline_data?: {
      mime_type: string;
      data: string;
    };
  }[];
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
      
      // Intentar obtener datos de manera individual para manejar errores específicos
      let projects = [];
      let users = [];
      let tickets = [];

      try {
        // Consulta de proyectos con columnas correctas
        const projectsResult = await supabase
          .from('projects')
          .select('id, name, status, progress, created_at, created_by')
          .limit(10);
        
        if (projectsResult.error) {
          // Fallback a consulta simple
          const simpleResult = await supabase
            .from('projects')
            .select('id, name')
            .limit(5);
          
          if (simpleResult.error) {
            projects = [];
          } else {
            projects = simpleResult.data || [];
          }
        } else {
          projects = projectsResult.data || [];
        }
      } catch (error) {
        projects = [];
      }

      try {
        const usersResult = await supabase
          .from('users')
          .select('id, full_name, email, role, created_at')
          .limit(10);
        
        if (usersResult.error) {
        } else {
          users = usersResult.data || [];
        }
      } catch (error) {
      }

      try {
        // Consulta de tickets con columnas correctas
        const ticketsResult = await supabase
          .from('tickets')
          .select('id, asunto, status, prioridad, created_at, user_id')
          .limit(10);
        
        if (ticketsResult.error) {
          // Fallback a consulta simple
          const simpleResult = await supabase
            .from('tickets')
            .select('id, asunto')
            .limit(5);
          
          if (simpleResult.error) {
            tickets = [];
          } else {
            tickets = simpleResult.data || [];
          }
        } else {
          tickets = ticketsResult.data || [];
        }
      } catch (error) {
        tickets = [];
      }

      const context = {
        projects,
        users,
        tickets,
        timestamp: new Date().toISOString()
      };

      return context;
    } catch (error) {
      return {
        projects: [],
        users: [],
        tickets: [],
        timestamp: new Date().toISOString()
      };
    }
  }, []);

  // Enviar mensaje a Gemini AI
  const sendMessage = useCallback(async (
    message: string,
    conversationHistory: ChatMessage[] = [],
    contextType: 'general' | 'project' | 'user' | 'analytics' = 'general',
    contextId?: string,
    attachments?: any[]
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


      // Obtener contexto de la base de datos
      let dbContext = null;
      try {
        dbContext = await getDatabaseContext();
      } catch (dbError) {
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
7. PUEDES ANALIZAR IMÁGENES Y ARCHIVOS: Eres capaz de procesar y analizar imágenes, gráficos, diagramas, capturas de pantalla, documentos PDF, y otros archivos adjuntos
8. Para imágenes: Describe lo que ves, analiza gráficos y datos, identifica problemas o mejoras, proporciona insights basados en el contenido visual
9. Para archivos: Extrae información relevante, analiza el contenido, identifica patrones o problemas, sugiere mejoras

TIPOS DE ANÁLISIS QUE PUEDES REALIZAR:
- Análisis predictivo de proyectos
- Asignación inteligente de recursos
- Validación de briefs de clientes
- Generación de reportes automáticos
- Optimización de carga de trabajo
- Análisis de tendencias y patrones
- Análisis visual de gráficos, diagramas y capturas de pantalla
- Procesamiento de documentos y archivos adjuntos
- Análisis de diseños web y mockups

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

      // Agregar el mensaje actual con archivos adjuntos si los hay
      const userMessageParts = [{ text: message }];
      
      // Procesar archivos adjuntos
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          if (attachment.type === 'image' && attachment.data) {
            // Para imágenes, agregar como parte de imagen
            userMessageParts.push({
              inline_data: {
                mime_type: attachment.mimeType || 'image/jpeg',
                data: attachment.data
              }
            });
          } else if (attachment.type === 'file' && attachment.content) {
            // Para archivos de texto, agregar como texto
            userMessageParts.push({
              text: `\n\n[Archivo adjunto: ${attachment.name}]\n${attachment.content}`
            });
          }
        }
      }
      
      geminiHistory.push({
        role: 'user',
        parts: userMessageParts
      });


      // Llamar a la API de Gemini
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
      

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


      if (!response.ok) {
        const errorText = await response.text();

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
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Respuesta inválida de la API de Gemini');
      }

      const aiResponse = data.candidates[0].content.parts[0].text;
      
      if (!aiResponse || aiResponse.trim() === '') {
        throw new Error('La respuesta de la IA está vacía');
      }

      
      return aiResponse;
    } catch (error) {
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
