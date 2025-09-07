import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';

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
  const { getDatabaseContext } = useSupabaseContext();

  // Usar el hook de contexto seguro

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
      const systemPrompt = `Eres Websy AI, un asistente de IA para administración de proyectos.

CONTEXTO DE LA BASE DE DATOS:
${dbContext ? JSON.stringify(dbContext, null, 2) : 'No se pudo obtener contexto de la base de datos'}

INSTRUCCIONES:
- Responde de manera natural y conversacional
- Para saludos simples como "Hola", responde brevemente y amigable
- Para consultas complejas, puedes usar formato Markdown si es necesario
- Mantén un tono profesional pero amigable
- Responde en español
- Sé específico con los datos cuando sea relevante

Responde de manera útil y contextualizada.`;

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
            } as any);
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
