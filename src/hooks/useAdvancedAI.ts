import { useState, useCallback } from 'react';
import { useGeminiAI } from './useGeminiAI';
import { toast } from '@/hooks/use-toast';

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  suggestedActions: string[];
}

export interface PatternPrediction {
  predictedIssues: string[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  confidence: number;
}

export interface ProactiveSuggestion {
  type: 'optimization' | 'prevention' | 'improvement';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedImpact: string;
}

export const useAdvancedAI = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const { sendMessage } = useGeminiAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.REACT_APP_GEMINI_API_KEY || '',
    temperature: 0.3, // Más determinístico para análisis
    maxTokens: 1024
  });

  // Helper function para parsear respuestas de IA
  const parseAIResponse = (response: string, fallback: any) => {
    let cleanResponse = response;
    if (response.includes('```json')) {
      cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    try {
      return JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.log('Raw response:', response);
      console.log('Clean response:', cleanResponse);
      return fallback;
    }
  };

  // Helper function para manejar límites de API
  const handleAPICall = async (apiCall: () => Promise<any>, fallback: any) => {
    if (isRateLimited) {
      console.log('API está limitada, usando datos de fallback');
      return fallback;
    }

    try {
      const result = await apiCall();
      setIsRateLimited(false);
      return result;
    } catch (error: any) {
      if (error.message?.includes('Límite de solicitudes excedido') || error.message?.includes('429')) {
        console.log('Límite de API alcanzado, usando datos de fallback');
        setIsRateLimited(true);
        // Resetear el límite después de 5 minutos
        setTimeout(() => setIsRateLimited(false), 5 * 60 * 1000);
        return fallback;
      }
      throw error;
    }
  };

  // Análisis de sentimientos y urgencia
  const analyzeSentiment = useCallback(async (message: string, context?: string): Promise<SentimentAnalysis> => {
    setIsAnalyzing(true);
    
    try {
      const prompt = `
Analiza el siguiente mensaje de cliente y proporciona un análisis completo de sentimientos y urgencia.

Mensaje: "${message}"
${context ? `Contexto: "${context}"` : ''}

Proporciona la respuesta en formato JSON con la siguiente estructura:
{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": 0.0-1.0,
  "emotions": ["emoción1", "emoción2"],
  "urgency": "low" | "medium" | "high" | "critical",
  "suggestedActions": ["acción1", "acción2", "acción3"]
}

Criterios de urgencia:
- critical: Problemas técnicos graves, pérdida de datos, servicios caídos
- high: Problemas que afectan funcionalidad principal, clientes molestos
- medium: Consultas importantes, mejoras solicitadas
- low: Preguntas generales, consultas informativas

Solo responde con el JSON válido, sin texto adicional.
`;

      const fallback = {
        sentiment: 'neutral',
        confidence: 0.5,
        emotions: [],
        urgency: 'low',
        suggestedActions: ['Revisar manualmente']
      };
      
      const analysis = await handleAPICall(async () => {
        const response = await sendMessage(prompt, [], 'analysis');
        return parseAIResponse(response, fallback);
      }, fallback);
      
      return {
        sentiment: analysis.sentiment || 'neutral',
        confidence: analysis.confidence || 0.5,
        emotions: analysis.emotions || [],
        urgency: analysis.urgency || 'low',
        suggestedActions: analysis.suggestedActions || []
      };
    } catch (error) {
      console.error('Error en análisis de sentimientos:', error);
      toast({
        title: "Error de análisis",
        description: "No se pudo analizar el sentimiento del mensaje.",
        variant: "destructive"
      });
      
      return {
        sentiment: 'neutral',
        confidence: 0,
        emotions: [],
        urgency: 'low',
        suggestedActions: []
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, [sendMessage]);

  // Predicción de patrones y problemas
  const predictPatterns = useCallback(async (historicalData: any[], currentContext: string): Promise<PatternPrediction> => {
    setIsAnalyzing(true);
    
    try {
      const prompt = `
Analiza los siguientes datos históricos y el contexto actual para predecir posibles problemas y patrones.

Datos históricos: ${JSON.stringify(historicalData.slice(-10))} // Últimos 10 registros
Contexto actual: "${currentContext}"

Proporciona la respuesta en formato JSON:
{
  "predictedIssues": ["problema1", "problema2"],
  "riskLevel": "low" | "medium" | "high",
  "recommendations": ["recomendación1", "recomendación2"],
  "confidence": 0.0-1.0
}

Busca patrones como:
- Problemas técnicos recurrentes
- Horarios de mayor incidencia
- Tipos de usuarios con más problemas
- Tendencias estacionales
- Problemas de escalabilidad

Solo responde con el JSON válido, sin texto adicional.
`;

      const fallback = {
        predictedIssues: [],
        riskLevel: 'low',
        recommendations: [],
        confidence: 0.5
      };
      
      const prediction = await handleAPICall(async () => {
        const response = await sendMessage(prompt, [], 'analysis');
        return parseAIResponse(response, fallback);
      }, fallback);
      
      return {
        predictedIssues: prediction.predictedIssues || [],
        riskLevel: prediction.riskLevel || 'low',
        recommendations: prediction.recommendations || [],
        confidence: prediction.confidence || 0.5
      };
    } catch (error) {
      console.error('Error en predicción de patrones:', error);
      toast({
        title: "Error de predicción",
        description: "No se pudieron analizar los patrones históricos.",
        variant: "destructive"
      });
      
      return {
        predictedIssues: [],
        riskLevel: 'low',
        recommendations: [],
        confidence: 0
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, [sendMessage]);

  // Sugerencias proactivas de optimización
  const generateProactiveSuggestions = useCallback(async (systemMetrics: any, userBehavior: any[]): Promise<ProactiveSuggestion[]> => {
    setIsAnalyzing(true);
    
    try {
      const prompt = `
Analiza las métricas del sistema y el comportamiento de usuarios para generar sugerencias proactivas de optimización.

Métricas del sistema: ${JSON.stringify(systemMetrics)}
Comportamiento de usuarios: ${JSON.stringify(userBehavior.slice(-20))} // Últimos 20 registros

Proporciona la respuesta en formato JSON:
{
  "suggestions": [
    {
      "type": "optimization" | "prevention" | "improvement",
      "title": "Título de la sugerencia",
      "description": "Descripción detallada",
      "priority": "low" | "medium" | "high",
      "estimatedImpact": "Impacto estimado"
    }
  ]
}

Tipos de sugerencias:
- optimization: Mejoras de rendimiento, eficiencia
- prevention: Prevención de problemas futuros
- improvement: Mejoras de experiencia de usuario

Solo responde con el JSON válido, sin texto adicional.
`;

      const fallback = { suggestions: [] };
      const result = await handleAPICall(async () => {
        const response = await sendMessage(prompt, [], 'analysis');
        return parseAIResponse(response, fallback);
      }, fallback);
      
      return result.suggestions || [];
    } catch (error) {
      console.error('Error generando sugerencias:', error);
      toast({
        title: "Error de sugerencias",
        description: "No se pudieron generar sugerencias proactivas.",
        variant: "destructive"
      });
      
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  }, [sendMessage]);

  // Análisis de urgencia en tickets
  const analyzeTicketUrgency = useCallback(async (ticketData: any): Promise<{urgency: string, priority: number, suggestedResponse: string}> => {
    setIsAnalyzing(true);
    
    try {
      const prompt = `
Analiza la urgencia de este ticket de soporte y sugiere una respuesta apropiada.

Datos del ticket: ${JSON.stringify(ticketData)}

Proporciona la respuesta en formato JSON:
{
  "urgency": "low" | "medium" | "high" | "critical",
  "priority": 1-10,
  "suggestedResponse": "Respuesta sugerida para el cliente"
}

Factores a considerar:
- Severidad del problema
- Impacto en el negocio
- Número de usuarios afectados
- Tiempo de respuesta esperado
- Complejidad de resolución

Solo responde con el JSON válido, sin texto adicional.
`;

      const fallback = {
        urgency: 'low',
        priority: 5,
        suggestedResponse: 'Gracias por contactarnos. Revisaremos tu consulta.'
      };
      
      const analysis = await handleAPICall(async () => {
        const response = await sendMessage(prompt, [], 'analysis');
        return parseAIResponse(response, fallback);
      }, fallback);
      
      return {
        urgency: analysis.urgency || 'low',
        priority: analysis.priority || 5,
        suggestedResponse: analysis.suggestedResponse || 'Gracias por contactarnos. Revisaremos tu consulta.'
      };
    } catch (error) {
      console.error('Error analizando urgencia del ticket:', error);
      toast({
        title: "Error de análisis",
        description: "No se pudo analizar la urgencia del ticket.",
        variant: "destructive"
      });
      
      return {
        urgency: 'low',
        priority: 5,
        suggestedResponse: 'Gracias por contactarnos. Revisaremos tu consulta.'
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, [sendMessage]);

  return {
    analyzeSentiment,
    predictPatterns,
    generateProactiveSuggestions,
    analyzeTicketUrgency,
    isAnalyzing,
    isRateLimited
  };
};
