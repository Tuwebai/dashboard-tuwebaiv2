interface MessageAnalysis {
  keyTopics: string[];
  userPreferences: Record<string, any>;
  contextSummary: string;
  suggestedActions: string[];
  knowledgeGaps: string[];
}

interface ContextData {
  currentMessage: string;
  conversationHistory: string[];
  userProfile?: any;
  projectContext?: any;
}

export class ContextAnalysisService {
  private static instance: ContextAnalysisService;

  public static getInstance(): ContextAnalysisService {
    if (!ContextAnalysisService.instance) {
      ContextAnalysisService.instance = new ContextAnalysisService();
    }
    return ContextAnalysisService.instance;
  }

  // Analizar mensaje y extraer contexto
  async analyzeMessage(contextData: ContextData): Promise<MessageAnalysis> {
    const { currentMessage, conversationHistory, userProfile, projectContext } = contextData;

    // Extraer temas clave usando palabras clave técnicas
    const keyTopics = this.extractKeyTopics(currentMessage);
    
    // Identificar preferencias del usuario
    const userPreferences = this.extractUserPreferences(currentMessage, userProfile);
    
    // Generar resumen de contexto
    const contextSummary = this.generateContextSummary(
      currentMessage, 
      conversationHistory, 
      keyTopics
    );
    
    // Sugerir acciones basadas en el contexto
    const suggestedActions = this.suggestActions(currentMessage, keyTopics, userProfile);
    
    // Identificar brechas de conocimiento
    const knowledgeGaps = this.identifyKnowledgeGaps(currentMessage, keyTopics);

    return {
      keyTopics,
      userPreferences,
      contextSummary,
      suggestedActions,
      knowledgeGaps
    };
  }

  // Extraer temas clave del mensaje
  private extractKeyTopics(message: string): string[] {
    const technicalKeywords = [
      'react', 'nextjs', 'typescript', 'javascript', 'node', 'api', 'database',
      'supabase', 'authentication', 'frontend', 'backend', 'deployment',
      'css', 'tailwind', 'ui', 'component', 'hook', 'state', 'props',
      'routing', 'navigation', 'form', 'validation', 'error', 'loading',
      'responsive', 'mobile', 'desktop', 'performance', 'optimization',
      'seo', 'accessibility', 'testing', 'debug', 'fix', 'bug', 'issue',
      'project', 'task', 'feature', 'requirement', 'design', 'layout',
      'integration', 'calendar', 'email', 'notification', 'automation',
      'dashboard', 'admin', 'user', 'role', 'permission', 'security'
    ];

    const businessKeywords = [
      'cliente', 'proyecto', 'presupuesto', 'timeline', 'deadline',
      'reunión', 'presentación', 'propuesta', 'contrato', 'factura',
      'marketing', 'ventas', 'estrategia', 'objetivo', 'meta',
      'análisis', 'reporte', 'métrica', 'kpi', 'rendimiento',
      'equipo', 'colaboración', 'comunicación', 'feedback', 'revisión'
    ];

    const messageLower = message.toLowerCase();
    const foundTopics: string[] = [];

    // Buscar palabras técnicas
    technicalKeywords.forEach(keyword => {
      if (messageLower.includes(keyword)) {
        foundTopics.push(keyword);
      }
    });

    // Buscar palabras de negocio
    businessKeywords.forEach(keyword => {
      if (messageLower.includes(keyword)) {
        foundTopics.push(keyword);
      }
    });

    // Extraer entidades nombradas (proyectos, nombres, etc.)
    const namedEntities = this.extractNamedEntities(message);
    foundTopics.push(...namedEntities);

    return [...new Set(foundTopics)]; // Eliminar duplicados
  }

  // Extraer entidades nombradas
  private extractNamedEntities(message: string): string[] {
    const entities: string[] = [];
    
    // Buscar nombres de proyectos (palabras en mayúsculas o con números)
    const projectPattern = /\b[A-Z][a-zA-Z0-9]*(?:[A-Z][a-zA-Z0-9]*)*\b/g;
    const projects = message.match(projectPattern) || [];
    entities.push(...projects);

    // Buscar emails
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = message.match(emailPattern) || [];
    entities.push(...emails);

    // Buscar URLs
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = message.match(urlPattern) || [];
    entities.push(...urls);

    return entities;
  }

  // Extraer preferencias del usuario
  private extractUserPreferences(message: string, userProfile?: any): Record<string, any> {
    const preferences: Record<string, any> = {};

    // Preferencias de comunicación
    if (message.includes('detallado') || message.includes('explicación completa')) {
      preferences.communication_style = 'detailed';
    } else if (message.includes('resumen') || message.includes('breve')) {
      preferences.communication_style = 'concise';
    }

    // Preferencias de tecnología
    if (message.includes('react') || message.includes('frontend')) {
      preferences.tech_preferences = [...(preferences.tech_preferences || []), 'react'];
    }
    if (message.includes('backend') || message.includes('api')) {
      preferences.tech_preferences = [...(preferences.tech_preferences || []), 'backend'];
    }

    // Preferencias de formato
    if (message.includes('código') || message.includes('ejemplo')) {
      preferences.include_code_examples = true;
    }
    if (message.includes('diagrama') || message.includes('visual')) {
      preferences.include_diagrams = true;
    }

    // Preferencias de horario (si se menciona)
    const timePattern = /(\d{1,2}):(\d{2})\s*(am|pm)?/gi;
    const timeMatches = message.match(timePattern);
    if (timeMatches) {
      preferences.preferred_times = timeMatches;
    }

    // Combinar con perfil existente
    if (userProfile) {
      return { ...userProfile, ...preferences };
    }

    return preferences;
  }

  // Generar resumen de contexto
  private generateContextSummary(
    currentMessage: string, 
    conversationHistory: string[], 
    keyTopics: string[]
  ): string {
    const recentHistory = conversationHistory.slice(-3).join(' ');
    const topicsText = keyTopics.join(', ');
    
    return `Contexto: ${currentMessage.substring(0, 200)}... | Temas: ${topicsText} | Historial reciente: ${recentHistory.substring(0, 100)}...`;
  }

  // Sugerir acciones basadas en el contexto
  private suggestActions(message: string, keyTopics: string[], userProfile?: any): string[] {
    const actions: string[] = [];

    // Acciones basadas en palabras clave
    if (keyTopics.includes('error') || keyTopics.includes('bug')) {
      actions.push('Revisar logs de error', 'Proponer solución de debugging');
    }
    
    if (keyTopics.includes('proyecto') || keyTopics.includes('nuevo')) {
      actions.push('Crear estructura de proyecto', 'Configurar herramientas de desarrollo');
    }
    
    if (keyTopics.includes('reunión') || keyTopics.includes('calendar')) {
      actions.push('Programar reunión en Google Calendar', 'Enviar invitación por email');
    }
    
    if (keyTopics.includes('reporte') || keyTopics.includes('análisis')) {
      actions.push('Generar reporte automático', 'Crear dashboard de métricas');
    }

    // Acciones basadas en perfil del usuario
    if (userProfile?.expertise_areas?.includes('frontend')) {
      actions.push('Optimizar componentes React', 'Mejorar rendimiento frontend');
    }

    return actions;
  }

  // Identificar brechas de conocimiento
  private identifyKnowledgeGaps(message: string, keyTopics: string[]): string[] {
    const gaps: string[] = [];

    // Detectar conceptos técnicos mencionados sin contexto
    const technicalConcepts = ['api', 'database', 'authentication', 'deployment'];
    technicalConcepts.forEach(concept => {
      if (keyTopics.includes(concept) && !message.includes('cómo') && !message.includes('explicar')) {
        gaps.push(`Más información sobre ${concept}`);
      }
    });

    // Detectar proyectos mencionados sin detalles
    if (keyTopics.some(topic => /^[A-Z]/.test(topic)) && !message.includes('detalles')) {
      gaps.push('Información detallada del proyecto');
    }

    return gaps;
  }

  // Generar prompt contextual para la IA
  generateContextualPrompt(
    message: string, 
    analysis: MessageAnalysis, 
    relevantMemories: any[], 
    relevantKnowledge: any[]
  ): string {
    let prompt = `Eres Websy AI, el asistente inteligente de TuWebAI. `;
    
    // Agregar contexto del perfil
    if (analysis.userPreferences.communication_style) {
      prompt += `El usuario prefiere respuestas ${analysis.userPreferences.communication_style}. `;
    }
    
    // Agregar temas relevantes
    if (analysis.keyTopics.length > 0) {
      prompt += `Temas relevantes: ${analysis.keyTopics.join(', ')}. `;
    }
    
    // Agregar memorias relevantes
    if (relevantMemories.length > 0) {
      prompt += `Contexto de conversaciones anteriores: ${relevantMemories.map(m => m.context_summary).join(' | ')}. `;
    }
    
    // Agregar conocimiento relevante
    if (relevantKnowledge.length > 0) {
      prompt += `Información relevante: ${relevantKnowledge.map(k => k.title).join(', ')}. `;
    }
    
    // Agregar sugerencias de acción
    if (analysis.suggestedActions.length > 0) {
      prompt += `Acciones sugeridas: ${analysis.suggestedActions.join(', ')}. `;
    }
    
    prompt += `Responde de manera útil y contextualizada: ${message}`;
    
    return prompt;
  }
}

export const contextAnalysisService = ContextAnalysisService.getInstance();
