import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';
import { supabase } from '@/lib/supabase';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { reportService } from '@/lib/reportService';
import { useWebsyMemory } from '@/hooks/useWebsyMemory';
import { contextAnalysisService } from '@/lib/contextAnalysisService';
import { projectManagementService } from '@/lib/projectManagementService';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { 
    text?: string;
    inline_data?: {
      mime_type: string;
      data: string;
    };
  }[] | any[];
}

interface ChatMessage {
  id: string;
  message: string;
  isAI: boolean;
  timestamp: Date;
  attachments?: any[];
  contextData?: any;
}

interface ApiKeyStatus {
  key: string;
  isActive: boolean;
  isRateLimited: boolean;
  lastUsed: Date | null;
  requestCount: number;
  estimatedRemaining: number;
  lastError: string | null;
}

interface UseMultiAIOptions {
  temperature?: number;
  maxTokens?: number;
  enableLogging?: boolean;
  resetIntervalHours?: number;
  isCalendarAuthenticated?: boolean;
  calendarUserInfo?: { email: string; name: string } | null;
}

interface MultiAIState {
  currentApiIndex: number;
  apiKeys: string[];
  apiStatuses: ApiKeyStatus[];
  isLoading: boolean;
  error: string | null;
  totalRequests: number;
  lastReset: Date;
}

const STORAGE_KEY = 'websy_ai_multi_api_state';
const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 horas

// Función para formatear respuestas de IA
const formatAIResponse = (response: string): string => {
  // Si la respuesta ya tiene el formato correcto, devolverla tal como está
  if (response.includes('### 🎯') && response.includes('### 📋') && response.includes('### ⚡') && response.includes('### 💡')) {
    return response;
  }

  // Si no tiene el formato correcto, intentar estructurarlo
  const lines = response.split('\n');
  const formattedLines: string[] = [];
  
  // Agregar encabezado si no existe
  if (!response.includes('### 🎯')) {
    formattedLines.push('### 🎯 Resumen Ejecutivo');
    formattedLines.push('');
  }
  
  // Procesar cada línea
  let inCodeBlock = false;
  let hasMainSections = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Detectar bloques de código
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      formattedLines.push(line);
      continue;
    }
    
    if (inCodeBlock) {
      formattedLines.push(line);
      continue;
    }
    
    // Detectar títulos existentes y convertirlos al formato correcto
    if (trimmed.startsWith('### ')) {
      if (!hasMainSections) {
        hasMainSections = true;
        if (!trimmed.includes('🎯')) {
          formattedLines.push('### 🎯 Resumen Ejecutivo');
          formattedLines.push('');
        }
      }
      formattedLines.push(line);
    } else if (trimmed.startsWith('## ')) {
      formattedLines.push('### 📋 ' + trimmed.slice(3));
    } else if (trimmed.startsWith('# ')) {
      formattedLines.push('### 🎯 ' + trimmed.slice(2));
    } else if (trimmed && !hasMainSections) {
      // Si no hay secciones principales, agregar la primera sección
      formattedLines.push('### 🎯 Resumen Ejecutivo');
      formattedLines.push('');
      formattedLines.push(line);
      hasMainSections = true;
    } else {
      formattedLines.push(line);
    }
  }
  
  // Asegurar que tenga las secciones principales
  const finalResponse = formattedLines.join('\n');
  
  if (!finalResponse.includes('### 📋')) {
    formattedLines.push('');
    formattedLines.push('### 📋 Análisis Detallado');
    formattedLines.push('Análisis específico del tema abordado.');
  }
  
  if (!finalResponse.includes('### ⚡')) {
    formattedLines.push('');
    formattedLines.push('### ⚡ Acciones Recomendadas');
    formattedLines.push('- Revisar la información proporcionada');
    formattedLines.push('- Implementar las sugerencias relevantes');
  }
  
  if (!finalResponse.includes('### 💡')) {
    formattedLines.push('');
    formattedLines.push('### 💡 Conclusiones');
    formattedLines.push('Información procesada y lista para implementación.');
  }
  
  return formattedLines.join('\n');
};

export const useMultiAI = ({ 
  temperature = 0.7, 
  maxTokens = 2048, 
  enableLogging = true,
  resetIntervalHours = 24,
  isCalendarAuthenticated: externalIsCalendarAuthenticated,
  calendarUserInfo: externalCalendarUserInfo
}: UseMultiAIOptions = {}) => {
  const [state, setState] = useState<MultiAIState>({
    currentApiIndex: 0,
    apiKeys: [],
    apiStatuses: [],
    isLoading: false,
    error: null,
    totalRequests: 0,
    lastReset: new Date()
  });

  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { getDatabaseContext } = useSupabaseContext();
  const [user, setUser] = useState<any>(null);
  const { 
    isAuthenticated: isCalendarAuthenticated, 
    createMeeting, 
    listEvents,
    authenticate: authenticateCalendar,
    userInfo: calendarUserInfo
  } = useGoogleCalendar();

  // Sistema de memoria contextual
  const {
    conversationMemories,
    userProfile,
    knowledgeBase,
    saveConversationMemory,
    updateUserProfile,
    addToKnowledgeBase,
    getRelevantContext
  } = useWebsyMemory();

  // Usar el estado externo si está disponible, sino usar el interno
  const finalIsCalendarAuthenticated = externalIsCalendarAuthenticated !== undefined 
    ? externalIsCalendarAuthenticated 
    : isCalendarAuthenticated;
  
  const finalCalendarUserInfo = externalCalendarUserInfo !== undefined 
    ? externalCalendarUserInfo 
    : calendarUserInfo;

  // Obtener API keys de las variables de entorno
  const getApiKeys = useCallback(() => {
    const keys = [];
    for (let i = 1; i <= 5; i++) {
      const key = import.meta.env[`VITE_GEMINI_API_KEY_${i}`] || 
                  import.meta.env[`REACT_APP_GEMINI_API_KEY_${i}`];
      if (key && key.trim()) {
        keys.push(key.trim());
      }
    }
    return keys;
  }, []);

  // Inicializar estado desde localStorage
  const initializeState = useCallback(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    const apiKeys = getApiKeys();
    
    if (savedState && apiKeys.length > 0) {
      try {
        const parsed = JSON.parse(savedState);
        const now = new Date();
        const lastReset = new Date(parsed.lastReset);
        const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
        
        // Si han pasado más de 24 horas, resetear a la primera API
        if (hoursSinceReset >= resetIntervalHours) {
          const newState: MultiAIState = {
            currentApiIndex: 0,
            apiKeys,
            apiStatuses: apiKeys.map((key, index) => ({
              key,
              isActive: index === 0,
              isRateLimited: false,
              lastUsed: null,
              requestCount: 0,
              estimatedRemaining: 1500, // Estimación inicial
              lastError: null
            })),
            isLoading: false,
            error: null,
            totalRequests: 0,
            lastReset: now
          };
          setState(newState);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
          logMessage('🔄 Sistema multi-API reseteado después de 24 horas');
        } else {
          // Usar estado guardado pero actualizar las API keys
          const updatedState = {
            ...parsed,
            apiKeys,
            apiStatuses: apiKeys.map((key, index) => {
              const existing = parsed.apiStatuses?.find((s: ApiKeyStatus) => s.key === key);
              return existing || {
                key,
                isActive: index === parsed.currentApiIndex,
                isRateLimited: false,
                lastUsed: null,
                requestCount: 0,
                estimatedRemaining: 1500,
                lastError: null
              };
            }),
            lastReset: new Date(parsed.lastReset)
          };
          setState(updatedState);
        }
      } catch (error) {
        logMessage('❌ Error cargando estado guardado, inicializando nuevo estado');
        initializeNewState();
      }
    } else {
      initializeNewState();
    }
  }, [getApiKeys, resetIntervalHours]);

  // Inicializar nuevo estado
  const initializeNewState = useCallback(() => {
    const apiKeys = getApiKeys();
    if (apiKeys.length === 0) {
      setState(prev => ({
        ...prev,
        error: 'No se encontraron API keys de Gemini configuradas'
      }));
      return;
    }

    const newState: MultiAIState = {
      currentApiIndex: 0,
      apiKeys,
      apiStatuses: apiKeys.map((key, index) => ({
        key,
        isActive: index === 0,
        isRateLimited: false,
        lastUsed: null,
        requestCount: 0,
        estimatedRemaining: 1500,
        lastError: null
      })),
      isLoading: false,
      error: null,
      totalRequests: 0,
      lastReset: new Date()
    };

    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    logMessage(`🚀 Sistema multi-API inicializado con ${apiKeys.length} API keys`);
  }, [getApiKeys]);

  // Logging
  const logMessage = useCallback((message: string, data?: any) => {
    // Logging deshabilitado para producción
  }, [enableLogging]);

  // Guardar estado en localStorage
  const saveState = useCallback((newState: MultiAIState) => {
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, []);

  // Detectar si es un error de rate limit
  const isRateLimitError = useCallback((error: any): boolean => {
    const errorMessage = error?.message || error?.toString() || '';
    return errorMessage.includes('429') || 
           errorMessage.includes('rate limit') || 
           errorMessage.includes('quota') ||
           errorMessage.includes('Límite de solicitudes excedido') ||
           errorMessage.includes('Too Many Requests');
  }, []);

  // Cambiar a la siguiente API key disponible
  const switchToNextApi = useCallback(() => {
    setState(prev => {
      const nextIndex = (prev.currentApiIndex + 1) % prev.apiKeys.length;
      
      if (nextIndex === 0) {
        // Si volvemos al inicio, todas las APIs están limitadas
        logMessage('⚠️ Todas las API keys han alcanzado su límite');
        return {
          ...prev,
          error: 'Todas las API keys han alcanzado su límite. Intenta de nuevo en unas horas.'
        };
      }

      const newStatuses = prev.apiStatuses.map((status, index) => ({
        ...status,
        isActive: index === nextIndex
      }));

      const newState = {
        ...prev,
        currentApiIndex: nextIndex,
        apiStatuses: newStatuses,
        error: null
      };

      logMessage(`🔄 Cambiando a API key ${nextIndex + 1}`, {
        previousApi: prev.currentApiIndex + 1,
        newApi: nextIndex + 1
      });

      return newState;
    });
  }, [logMessage]);

  // Usar el hook de contexto seguro

  // Función para procesar comandos de Google Calendar
  const processCalendarCommands = useCallback(async (aiResponse: string, userMessage: string): Promise<string> => {
    try {
      // Detectar si el usuario quiere programar una reunión
      const meetingKeywords = ['programar', 'reunión', 'reunion', 'meeting', 'cita', 'evento', 'mañana', 'tomorrow', 'hoy', 'today'];
      const wantsMeeting = meetingKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
      );

      if (wantsMeeting && !finalIsCalendarAuthenticated) {
        return `### 🔗 Conectar Google Calendar

Para programar reuniones, primero necesitas conectar tu Google Calendar. 

**Pasos:**
1. Haz clic en el botón **"Conectar Google Calendar"** en el panel lateral
2. Autoriza el acceso a tu cuenta de Google
3. Una vez conectado, podré programar reuniones reales en tu calendario

¿Te gustaría que te ayude con algo más mientras tanto?`;
      }

      if (wantsMeeting && finalIsCalendarAuthenticated) {
        // Extraer información de la reunión del mensaje del usuario
        const timeMatch = userMessage.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)?/);
        const tomorrowMatch = userMessage.match(/mañana|tomorrow/i);
        const todayMatch = userMessage.match(/hoy|today/i);
        
        let startTime = new Date();
        if (tomorrowMatch) {
          startTime.setDate(startTime.getDate() + 1);
        }
        
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          const period = timeMatch[3]?.toLowerCase();
          
          if (period === 'pm' && hours !== 12) {
            hours += 12;
          } else if (period === 'am' && hours === 12) {
            hours = 0;
          }
          
          startTime.setHours(hours, minutes, 0, 0);
        } else {
          // Si no especifica hora, usar 17:00 (5 PM) como mencionó el usuario
          startTime.setHours(17, 0, 0, 0);
        }

        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + 1); // 1 hora de duración por defecto

        // Generar título profesional de la reunión
        const generateProfessionalTitle = (userMessage: string): string => {
          const titleMatch = userMessage.match(/[""]([^""]+)[""]/);
          if (titleMatch) {
            return titleMatch[1];
          }

          // Detectar tipo de reunión basado en palabras clave
          const meetingTypes = {
            'reunión': 'Reunión de Trabajo',
            'meeting': 'Team Meeting',
            'presentación': 'Presentación de Proyecto',
            'presentation': 'Project Presentation',
            'revisión': 'Revisión de Proyecto',
            'review': 'Project Review',
            'planificación': 'Sesión de Planificación',
            'planning': 'Planning Session',
            'análisis': 'Sesión de Análisis',
            'analysis': 'Analysis Session',
            'coordinación': 'Reunión de Coordinación',
            'coordination': 'Coordination Meeting',
            'técnico': 'Reunión Técnica',
            'technical': 'Technical Meeting',
            'diseño': 'Reunión de Diseño',
            'design': 'Design Meeting',
            'marketing': 'Reunión de Marketing',
            'ventas': 'Reunión de Ventas',
            'sales': 'Sales Meeting'
          };

          const detectedType = Object.keys(meetingTypes).find(key => 
            userMessage.toLowerCase().includes(key)
          );

          if (detectedType) {
            return meetingTypes[detectedType as keyof typeof meetingTypes] || 'Reunión de Trabajo';
          }

          // Títulos profesionales por defecto
          const defaultTitles = [
            'Reunión de Trabajo - TuWebAI',
            'Team Sync - Proyecto Actual',
            'Sesión de Coordinación',
            'Reunión de Seguimiento',
            'Planning Session - TuWebAI'
          ];

          return defaultTitles[Math.floor(Math.random() * defaultTitles.length)];
        };

        const title = generateProfessionalTitle(userMessage);

        try {
          const meetingData = {
            title: title,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString()
          };

          const createdEvent = await createMeeting(meetingData);
          
          if (createdEvent) {
            return `### ✅ Reunión Programada Exitosamente

**Detalles de la reunión:**
- **Título:** ${title}
- **Fecha:** ${startTime.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
- **Hora:** ${startTime.toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
- **Duración:** 1 hora
- **ID del evento:** \`${createdEvent.id}\`
- **Calendario:** ${finalCalendarUserInfo?.email || 'Usuario autenticado'}

La reunión ha sido creada en tu Google Calendar (${finalCalendarUserInfo?.email || 'cuenta autenticada'}) y aparecerá en tu calendario personal. Recibirás una notificación antes del evento.`;
          }
        } catch (error) {
          console.error('Error creando reunión:', error);
          return `### ❌ Error al Programar la Reunión

No pude crear la reunión en tu Google Calendar. 

**Posibles causas:**
- Problema de conexión con Google Calendar
- Permisos insuficientes
- Error en la configuración

**Solución:**
1. Verifica que estés conectado correctamente a Google Calendar
2. Intenta desconectarte y volver a conectar
3. Si el problema persiste, contacta al administrador

¿Te gustaría intentar de nuevo?`;
        }
      }

      return aiResponse;
    } catch (error) {
      console.error('Error procesando comandos de calendario:', error);
      return aiResponse;
    }
  }, [finalIsCalendarAuthenticated, createMeeting, finalCalendarUserInfo]);

  // Procesar comandos de reportes
  const processReportCommands = useCallback(async (aiResponse: string, userMessage: string): Promise<string> => {
    try {
      const reportKeywords = ['reporte', 'report', 'generar reporte', 'crear reporte', 'descargar reporte'];
      const hasReportCommand = reportKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
      );

      if (hasReportCommand) {
        const isWeekly = userMessage.toLowerCase().includes('semanal') || userMessage.toLowerCase().includes('semana');
        const isMonthly = userMessage.toLowerCase().includes('mensual') || userMessage.toLowerCase().includes('mes');
        const reportType = isWeekly ? 'weekly' : isMonthly ? 'monthly' : 'weekly'; // Por defecto semanal

        try {
          // Generar datos del reporte
          const reportData = await reportService.generateReportData(reportType);
          
          // Generar y descargar PDF
          const pdfBlob = await reportService.generatePDF(reportData, reportType);
          const filename = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
          reportService.downloadFile(pdfBlob, filename);
          
          // Generar y descargar CSV
          const csvBlob = await reportService.generateCSV(reportData, reportType);
          const csvFilename = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
          reportService.downloadFile(csvBlob, csvFilename);

          aiResponse += `

### 📊 **Reporte ${reportType === 'weekly' ? 'Semanal' : 'Mensual'} Generado**

**Archivos descargados:**
- **PDF:** \`${filename}\`
- **CSV:** \`${csvFilename}\`

**Resumen del Reporte:**
- **Total de Tareas:** ${reportData.total_tasks}
- **Tareas Completadas:** ${reportData.completed_tasks}
- **Tareas Vencidas:** ${reportData.overdue_tasks}
- **Puntuación de Productividad:** ${reportData.productivity_score}%
- **Eficiencia del Equipo:** ${reportData.team_efficiency}%

${reportData.top_performers.length > 0 ? `
**Top Performers:**
${reportData.top_performers.map((performer, index) => 
  `${index + 1}. **${performer.user_name}:** ${performer.completed_tasks} tareas`
).join('\n')}
` : ''}

${reportData.skill_gaps.length > 0 ? `
**Gaps de Habilidades Identificados:**
${reportData.skill_gaps.slice(0, 3).map(gap => 
  `- **${gap.skill_name}:** ${gap.gap_percentage.toFixed(1)}% gap`
).join('\n')}
` : ''}

Los archivos se han descargado automáticamente a tu carpeta de descargas.`;
        } catch (error) {
          console.error('Error generando reporte:', error);
          aiResponse += `

### ❌ **Error al Generar el Reporte**

No se pudo generar el reporte. Verifica que:
- Tengas permisos de administrador
- La base de datos esté accesible
- No haya problemas de conectividad

**Error:** ${error instanceof Error ? error.message : 'Error desconocido'}`;
        }
      }

      return aiResponse;
    } catch (error) {
      console.error('Error procesando comandos de reportes:', error);
      return aiResponse;
    }
  }, []);

  // Procesar comandos de tareas y fases
  const processTaskCommands = useCallback(async (aiResponse: string, userMessage: string): Promise<string> => {
    try {
      const taskKeywords = ['crear tarea', 'agregar tarea', 'nueva tarea', 'tarea para', 'task', 'asignar tarea'];
      const phaseKeywords = ['crear fase', 'agregar fase', 'nueva fase', 'fase para', 'phase'];
      
      const wantsTask = taskKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
      );
      const wantsPhase = phaseKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
      );

      if (wantsTask) {
        try {
          // Extraer información de la tarea del mensaje
          const projectMatch = userMessage.match(/proyecto[:\s]+([^,]+)/i);
          const titleMatch = userMessage.match(/tarea[:\s]+[""]?([^""]+)[""]?/i) || 
                           userMessage.match(/[""]([^""]+)[""]/);
          const priorityMatch = userMessage.match(/(urgente|alta|media|baja|high|medium|low)/i);
          const dueDateMatch = userMessage.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|mañana|tomorrow|hoy|today)/i);

          if (!projectMatch) {
            return aiResponse + `

### ❌ **Información Faltante**

Para crear una tarea necesito que especifiques:
- **Proyecto:** ¿En qué proyecto quieres crear la tarea?
- **Título:** ¿Cómo se llama la tarea?

**Ejemplo:** "Crear tarea para el proyecto Mapacolaborativo: Implementar autenticación"`;
          }

          const projectName = projectMatch[1].trim();
          const taskTitle = titleMatch ? titleMatch[1].trim() : 'Nueva tarea';
          
          // Buscar el proyecto
          const projects = await projectManagementService.searchProjects(projectName);
          if (projects.length === 0) {
            return aiResponse + `

### ❌ **Proyecto No Encontrado**

No encontré el proyecto "${projectName}". 

**Proyectos disponibles:**
${(await projectManagementService.searchProjects('')).map(p => `- ${p.name}`).join('\n')}

Por favor, verifica el nombre del proyecto.`;
          }

          const project = projects[0];
          
          // Determinar prioridad
          let priority = 'medium';
          if (priorityMatch) {
            const priorityText = priorityMatch[1].toLowerCase();
            if (priorityText.includes('urgente') || priorityText.includes('high')) priority = 'urgent';
            else if (priorityText.includes('alta') || priorityText.includes('high')) priority = 'high';
            else if (priorityText.includes('baja') || priorityText.includes('low')) priority = 'low';
          }

          // Determinar fecha de vencimiento
          let dueDate = null;
          if (dueDateMatch) {
            const dateText = dueDateMatch[1].toLowerCase();
            if (dateText === 'mañana' || dateText === 'tomorrow') {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              dueDate = tomorrow.toISOString();
            } else if (dateText === 'hoy' || dateText === 'today') {
              dueDate = new Date().toISOString();
            } else {
              // Intentar parsear fecha
              const parsedDate = new Date(dueDateMatch[1]);
              if (!isNaN(parsedDate.getTime())) {
                dueDate = parsedDate.toISOString();
              }
            }
          }

          // Crear la tarea
          const task = await projectManagementService.createTask(
            project.id,
            {
              title: taskTitle,
              description: `Tarea creada por Websy AI: ${taskTitle}`,
              priority: priority as any,
              due_date: dueDate
            },
            user?.id || 'system'
          );

          return aiResponse + `

### ✅ **Tarea Creada Exitosamente**

**📋 Detalles de la Tarea:**
- **Título:** ${task.title}
- **Proyecto:** ${project.name}
- **Prioridad:** ${task.priority}
- **Estado:** ${task.status}
- **Fecha de vencimiento:** ${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No especificada'}

**🆔 ID de la tarea:** \`${task.id}\`

La tarea ha sido creada y está lista para ser asignada y trabajada.`;

        } catch (error) {
          console.error('Error creando tarea:', error);
          return aiResponse + `

### ❌ **Error al Crear la Tarea**

No pude crear la tarea. 

**Posibles causas:**
- Error de conexión con la base de datos
- Permisos insuficientes
- Datos inválidos

**Error:** ${error instanceof Error ? error.message : 'Error desconocido'}`;
        }
      }

      if (wantsPhase) {
        try {
          // Extraer información de la fase del mensaje
          const projectMatch = userMessage.match(/proyecto[:\s]+([^,]+)/i);
          const nameMatch = userMessage.match(/fase[:\s]+[""]?([^""]+)[""]?/i) || 
                           userMessage.match(/[""]([^""]+)[""]/);
          const descriptionMatch = userMessage.match(/descripción[:\s]+[""]?([^""]+)[""]?/i);

          if (!projectMatch) {
            return aiResponse + `

### ❌ **Información Faltante**

Para crear una fase necesito que especifiques:
- **Proyecto:** ¿En qué proyecto quieres crear la fase?
- **Nombre:** ¿Cómo se llama la fase?

**Ejemplo:** "Crear fase para el proyecto Mapacolaborativo: Desarrollo Frontend"`;
          }

          const projectName = projectMatch[1].trim();
          const phaseName = nameMatch ? nameMatch[1].trim() : 'Nueva fase';
          const phaseDescription = descriptionMatch ? descriptionMatch[1].trim() : `Fase creada por Websy AI: ${phaseName}`;
          
          // Buscar el proyecto
          const projects = await projectManagementService.searchProjects(projectName);
          if (projects.length === 0) {
            return aiResponse + `

### ❌ **Proyecto No Encontrado**

No encontré el proyecto "${projectName}". 

**Proyectos disponibles:**
${(await projectManagementService.searchProjects('')).map(p => `- ${p.name}`).join('\n')}

Por favor, verifica el nombre del proyecto.`;
          }

          const project = projects[0];
          
          // Obtener siguiente orden de fase
          const nextOrder = await projectManagementService.getNextPhaseOrder(project.id);

          // Crear la fase
          const phase = await projectManagementService.createPhase(
            project.id,
            {
              name: phaseName,
              description: phaseDescription,
              phase_order: nextOrder
            },
            user?.id || 'system'
          );

          return aiResponse + `

### ✅ **Fase Creada Exitosamente**

**📋 Detalles de la Fase:**
- **Nombre:** ${phase.name}
- **Proyecto:** ${project.name}
- **Descripción:** ${phase.description}
- **Orden:** ${phase.phase_order}
- **Estado:** ${phase.status}

**🆔 ID de la fase:** \`${phase.id}\`

La fase ha sido creada y está lista para agregar tareas.`;

        } catch (error) {
          console.error('Error creando fase:', error);
          return aiResponse + `

### ❌ **Error al Crear la Fase**

No pude crear la fase. 

**Posibles causas:**
- Error de conexión con la base de datos
- Permisos insuficientes
- Datos inválidos

**Error:** ${error instanceof Error ? error.message : 'Error desconocido'}`;
        }
      }

      return aiResponse;
    } catch (error) {
      console.error('Error procesando comandos de tareas:', error);
      return aiResponse;
    }
  }, [user]);

  // Enviar mensaje usando la API actual
  const sendMessage = useCallback(async (
    message: string,
    conversationHistory: ChatMessage[] = [],
    contextType: 'general' | 'project' | 'user' | 'analytics' = 'general',
    contextId?: string,
    attachments?: any[]
  ): Promise<string> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const currentApiKey = state.apiKeys[state.currentApiIndex];
      
      if (!currentApiKey) {
        throw new Error('No hay API keys disponibles');
      }

      if (!message || message.trim() === '') {
        throw new Error('El mensaje no puede estar vacío');
      }

      // Análisis contextual avanzado
      const conversationHistoryText = conversationHistory.map(msg => msg.message).join(' ');
      const contextData = {
        currentMessage: message,
        conversationHistory: conversationHistoryText.split(' '),
        userProfile,
        projectContext: contextId ? { id: contextId, type: contextType } : null
      };

      // Analizar el mensaje para extraer contexto
      const messageAnalysis = await contextAnalysisService.analyzeMessage(contextData);
      
      // Obtener contexto relevante de memorias y base de conocimiento
      const relevantContext = await getRelevantContext(message);
      
      // Generar prompt contextual
      const contextualPrompt = contextAnalysisService.generateContextualPrompt(
        message,
        messageAnalysis,
        relevantContext.memories,
        relevantContext.knowledge
      );

      // Obtener contexto de la base de datos
      let dbContext = null;
      try {
        dbContext = await getDatabaseContext();
      } catch (dbError) {
        logMessage('⚠️ Error obteniendo contexto de BD, continuando sin contexto');
      }

      // Construir contexto del sistema con análisis contextual
      const systemPrompt = `Eres Websy AI, un asistente de inteligencia artificial especializado en administración de proyectos web y análisis de datos empresariales.

CONTEXTO COMPLETO DE LA BASE DE DATOS:
${dbContext ? JSON.stringify(dbContext, null, 2) : 'No se pudo obtener contexto de la base de datos'}

ANÁLISIS DE DATOS DISPONIBLES:
${dbContext ? `
📊 RESUMEN DE DATOS:
- Proyectos: ${dbContext.totalRecords?.projects || 0} registros
- Usuarios: ${dbContext.totalRecords?.users || 0} registros  
- Tickets: ${dbContext.totalRecords?.tickets || 0} registros
- Tareas: ${dbContext.totalRecords?.tasks || 0} registros
- Fases: ${dbContext.totalRecords?.phases || 0} registros
- Métricas: ${dbContext.totalRecords?.metrics || 0} registros
- Actividades: ${dbContext.totalRecords?.activities || 0} registros
- Archivos: ${dbContext.totalRecords?.attachments || 0} registros
- Comentarios: ${dbContext.totalRecords?.comments || 0} registros
- Dependencias: ${dbContext.totalRecords?.dependencies || 0} registros

📈 CAPACIDADES DE ANÁLISIS:
- Análisis de progreso de proyectos por fases
- Identificación de tareas críticas y dependencias
- Análisis de productividad por usuario
- Detección de cuellos de botella en proyectos
- Análisis de métricas de rendimiento
- Seguimiento de actividades y cambios
- Análisis de archivos y documentación
- Análisis de comentarios y feedback
` : 'No hay datos disponibles para análisis'}

ANÁLISIS CONTEXTUAL:
- Temas clave identificados: ${messageAnalysis.keyTopics.join(', ')}
- Preferencias del usuario: ${JSON.stringify(messageAnalysis.userPreferences, null, 2)}
- Acciones sugeridas: ${messageAnalysis.suggestedActions.join(', ')}
- Brechas de conocimiento: ${messageAnalysis.knowledgeGaps.join(', ')}

CONTEXTO DE CONVERSACIONES ANTERIORES:
${relevantContext.memories.map(m => `- ${m.context_summary}`).join('\n')}

BASE DE CONOCIMIENTO RELEVANTE:
${relevantContext.knowledge.map(k => `- ${k.title}: ${k.content.substring(0, 200)}...`).join('\n')}

FUNCIONALIDADES REALES DISPONIBLES:
- ✅ PROGRAMAR REUNIONES REALES en Google Calendar usando createMeeting()
- ✅ CREAR EVENTOS en tu calendario personal usando createEvent()
- ✅ GESTIONAR PROYECTOS y tareas
- ✅ ANALIZAR DATOS en tiempo real
- ✅ GENERAR REPORTES automáticos (PDF y CSV)
- ✅ PROCESAR ARCHIVOS e imágenes

COMANDOS DE REPORTES DISPONIBLES:
- "Generar reporte semanal" - Crea un reporte de la última semana con datos reales
- "Crear reporte mensual" - Crea un reporte del último mes con datos reales
- "Descargar reporte de proyectos" - Genera reporte específico de proyectos
- Los reportes se descargan automáticamente en PDF y CSV
- Incluyen: estadísticas de tareas, productividad, top performers, gaps de habilidades

COMANDOS DE GESTIÓN DE PROYECTOS DISPONIBLES:
- "Crear tarea para el proyecto [nombre]: [título]" - Crea una nueva tarea en el proyecto especificado
- "Agregar fase para el proyecto [nombre]: [nombre de fase]" - Crea una nueva fase en el proyecto
- "Crear tarea urgente para [proyecto]: [título] para mañana" - Crea tarea con prioridad y fecha
- "Nueva fase [nombre] para [proyecto] con descripción [texto]" - Crea fase con descripción detallada

COMANDOS DE ANÁLISIS AVANZADO DISPONIBLES:
- "Analizar progreso del proyecto [nombre]" - Análisis completo del proyecto con fases y tareas
- "Identificar cuellos de botella" - Detecta tareas que bloquean el progreso
- "Análisis de productividad por usuario" - Muestra rendimiento de cada miembro del equipo
- "Revisar dependencias críticas" - Identifica tareas que dependen de otras
- "Análisis de métricas de rendimiento" - Estadísticas de productividad y eficiencia
- "Historial de actividades del proyecto [nombre]" - Muestra todas las actividades recientes
- "Análisis de archivos adjuntos" - Revisa documentación y archivos del proyecto
- "Comentarios recientes en tareas" - Muestra feedback y discusiones
- "Dashboard de métricas en tiempo real" - Vista general de todos los KPIs
- "Análisis de retrasos y problemas" - Identifica tareas atrasadas y sus causas

EJEMPLOS DE COMANDOS DE TAREAS:
- "Crear tarea para el proyecto Mapacolaborativo: Implementar autenticación JWT"
- "Agregar tarea urgente para Dashboard: Corregir bug de login para mañana"
- "Nueva tarea para Landing Page: Optimizar imágenes con prioridad alta"

EJEMPLOS DE COMANDOS DE FASES:
- "Crear fase para el proyecto Mapacolaborativo: Desarrollo Frontend"
- "Agregar fase Planificación para Dashboard con descripción Fase inicial de análisis"
- "Nueva fase Testing para Landing Page"

EJEMPLOS DE COMANDOS DE ANÁLISIS:
- "Analizar progreso del proyecto Mapacolaborativo"
- "Identificar cuellos de botella en todos los proyectos"
- "Análisis de productividad por usuario esta semana"
- "Revisar dependencias críticas del proyecto Dashboard"
- "Dashboard de métricas en tiempo real"
- "Análisis de retrasos y problemas"
- "Historial de actividades del proyecto Landing Page"
- "Comentarios recientes en tareas pendientes"

INSTRUCCIONES CRÍTICAS PARA PROGRAMAR REUNIONES:
1. **NUNCA digas que el usuario programó la reunión**
2. **NUNCA digas "He programado" o "Se ha programado"**
3. **SIEMPRE di "Voy a programar" o "Estoy programando"**
4. **USA las funciones reales de Google Calendar**
5. **CONFIRMA que la reunión se creó exitosamente**

CUANDO EL USUARIO PIDA PROGRAMAR UNA REUNIÓN:
1. Si no está conectado a Google Calendar, pídele que haga clic en "Conectar Google Calendar"
2. Si está conectado, extrae la información de la reunión del mensaje
3. Usa la función createMeeting() para crear el evento real
4. Confirma que se creó exitosamente con detalles específicos

EJEMPLO DE RESPUESTA CORRECTA:
"Voy a programar la reunión para mañana a las 17:00. [Usa createMeeting()] ✅ Reunión programada exitosamente en tu Google Calendar."

EJEMPLO DE RESPUESTA INCORRECTA:
"He programado la reunión" o "Se ha programado la reunión"

INSTRUCCIONES DE FORMATO Y ESTILO OBLIGATORIAS:
1. **SIEMPRE** usa formato Markdown para estructurar tus respuestas
2. **SIEMPRE** usa **texto en negrita** para títulos y puntos importantes
3. **SIEMPRE** usa ### para subtítulos principales
4. **SIEMPRE** usa #### para subtítulos secundarios
5. **SIEMPRE** usa listas con - para puntos clave
6. **SIEMPRE** usa \`código\` entre backticks para IDs, nombres técnicos y comandos
7. **SIEMPRE** estructura tus respuestas con:
   - Un resumen ejecutivo al inicio
   - Secciones claramente definidas con ###
   - Puntos de acción específicos con listas
   - Conclusiones y recomendaciones

FORMATO OBLIGATORIO DE RESPUESTA:
\`\`\`markdown
### 🎯 Resumen Ejecutivo
[Breve resumen de la respuesta]

### 📋 Análisis Detallado
[Análisis específico del tema]

### ⚡ Acciones Recomendadas
- [Acción 1]
- [Acción 2]
- [Acción 3]

### 💡 Conclusiones
[Conclusiones y próximos pasos]
\`\`\`

INSTRUCCIONES DE CONTENIDO:
1. Eres un experto en gestión de proyectos web, análisis de datos y optimización de recursos
2. Puedes analizar proyectos, usuarios, tickets y métricas en tiempo real
3. Proporciona respuestas precisas y accionables basadas en los datos reales
4. Si no tienes información suficiente, pide aclaraciones específicas
5. Mantén un tono profesional pero amigable
6. Siempre incluye datos específicos cuando sea relevante
7. PUEDES ANALIZAR IMÁGENES Y ARCHIVOS: Eres capaz de procesar y analizar imágenes, gráficos, diagramas, capturas de pantalla, documentos PDF, y otros archivos adjuntos
8. Para imágenes: Describe lo que ves, analiza gráficos y datos, identifica problemas o mejoras, proporciona insights basados en el contenido visual
9. Para archivos: Extrae información relevante, analiza el contenido, identifica patrones o problemas, sugiere mejoras

ACCIONES REALES QUE PUEDES REALIZAR:
- **Programar reuniones**: Cuando el usuario pida programar una reunión, usa la función createMeeting() para crear el evento real en Google Calendar
- **Crear eventos**: Puedo crear cualquier tipo de evento en tu calendario usando createEvent()
- **Gestionar proyectos**: Analizar, crear y actualizar proyectos
- **Generar reportes**: Crear reportes automáticos basados en datos reales
- **Análisis de datos**: Proporcionar insights basados en métricas reales

FORMATO DE RESPUESTA REQUERIDO:
- **OBLIGATORIO**: Usa el formato Markdown especificado arriba
- **OBLIGATORIO**: Incluye emojis para secciones (🎯, 📋, ⚡, 💡)
- **OBLIGATORIO**: Usa ### para títulos principales
- **OBLIGATORIO**: Usa **negrita** para información importante
- **OBLIGATORIO**: Usa listas con - para puntos clave
- **OBLIGATORIO**: Mantén un tono ejecutivo y profesional
- **OBLIGATORIO**: Siempre incluye datos específicos y accionables
- **OBLIGATORIO**: Cuando realices una acción real, confirma que se completó exitosamente

EJEMPLO DE RESPUESTA CORRECTA:
\`\`\`markdown
### 🎯 Resumen Ejecutivo
He analizado tu solicitud y encontré 3 puntos clave que requieren atención inmediata.

### 📋 Análisis Detallado
- **Problema identificado**: [descripción específica]
- **Impacto**: [consecuencias del problema]
- **Causa raíz**: [explicación técnica]

### ⚡ Acciones Recomendadas
- Implementar solución A en las próximas 24 horas
- Revisar configuración B para evitar futuros problemas
- Programar reunión de seguimiento para el viernes

### 💡 Conclusiones
La situación es manejable con las acciones propuestas. Te mantendré informado del progreso.
\`\`\`

IMPORTANTE: 
- Responde SIEMPRE en español
- Usa EXACTAMENTE el formato Markdown especificado arriba
- Incluye SIEMPRE los emojis en los títulos (🎯, 📋, ⚡, 💡)
- Estructura SIEMPRE tu respuesta con las 4 secciones obligatorias
- Sé específico con datos reales cuando sea posible
- Mantén un tono profesional pero amigable

Responde ahora:`;

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
            userMessageParts.push({
              inline_data: {
                mime_type: attachment.mimeType || 'image/jpeg',
                data: attachment.data
              }
            } as any);
          } else if (attachment.type === 'file' && attachment.content) {
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
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${currentApiKey}`;
      
      logMessage(`📤 Enviando mensaje usando API key ${state.currentApiIndex + 1}`);

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
        
        if (response.status === 400) {
          errorMessage = 'Solicitud inválida. Verifica el formato del mensaje.';
        } else if (response.status === 401) {
          errorMessage = 'API key inválida o expirada. Verifica tu configuración.';
        } else if (response.status === 403) {
          errorMessage = 'Acceso denegado. Verifica los permisos de tu API key.';
        } else if (response.status === 429) {
          errorMessage = 'Límite de solicitudes excedido. Cambiando a siguiente API key.';
        } else if (response.status === 500) {
          errorMessage = 'Error interno del servidor de Gemini. Intenta de nuevo.';
        }

        const error = new Error(errorMessage);
        
        // Si es un error de rate limit, cambiar a la siguiente API
        if (isRateLimitError(error)) {
          logMessage(`⚠️ Rate limit detectado en API key ${state.currentApiIndex + 1}, cambiando...`);
          
          // Actualizar estado de la API actual como limitada
          setState(prev => {
            const newStatuses = [...prev.apiStatuses];
            newStatuses[prev.currentApiIndex] = {
              ...newStatuses[prev.currentApiIndex],
              isRateLimited: true,
              lastError: errorMessage,
              lastUsed: new Date()
            };
            
            return {
              ...prev,
              apiStatuses: newStatuses
            };
          });

          // Cambiar a la siguiente API
          switchToNextApi();
          
          // Reintentar con la nueva API
          return sendMessage(message, conversationHistory, contextType, contextId, attachments);
        }

        throw error;
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Respuesta inválida de la API de Gemini');
      }

      let aiResponse = data.candidates[0].content.parts[0].text;
      
      if (!aiResponse || aiResponse.trim() === '') {
        throw new Error('La respuesta de la IA está vacía');
      }

      // Procesar comandos especiales de Google Calendar
      aiResponse = await processCalendarCommands(aiResponse, message);

      // Procesar comandos de reportes
      aiResponse = await processReportCommands(aiResponse, message);

      // Procesar comandos de tareas y fases
      aiResponse = await processTaskCommands(aiResponse, message);

      // Formatear respuesta para asegurar estructura correcta
      aiResponse = formatAIResponse(aiResponse);

      // Actualizar estadísticas de la API actual
      setState(prev => {
        const newStatuses = [...prev.apiStatuses];
        newStatuses[prev.currentApiIndex] = {
          ...newStatuses[prev.currentApiIndex],
          lastUsed: new Date(),
          requestCount: newStatuses[prev.currentApiIndex].requestCount + 1,
          estimatedRemaining: Math.max(0, newStatuses[prev.currentApiIndex].estimatedRemaining - 1),
          lastError: null
        };

        const newState = {
          ...prev,
          apiStatuses: newStatuses,
          totalRequests: prev.totalRequests + 1,
          isLoading: false,
          error: null
        };

        logMessage(`✅ Respuesta exitosa usando API key ${prev.currentApiIndex + 1}`, {
          requestCount: newStatuses[prev.currentApiIndex].requestCount,
          estimatedRemaining: newStatuses[prev.currentApiIndex].estimatedRemaining
        });

        return newState;
      });

      // Guardar memoria de la conversación
      try {
        const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await saveConversationMemory(
          conversationId,
          messageAnalysis.contextSummary,
          messageAnalysis.keyTopics,
          messageAnalysis.userPreferences
        );
        
        // Actualizar perfil de usuario si hay nuevas preferencias
        if (Object.keys(messageAnalysis.userPreferences).length > 0) {
          await updateUserProfile({
            work_patterns: messageAnalysis.keyTopics.filter(topic => 
              ['desarrollo', 'análisis', 'reunión', 'proyecto'].some(pattern => 
                topic.toLowerCase().includes(pattern)
              )
            ),
            common_tasks: messageAnalysis.suggestedActions,
            expertise_areas: messageAnalysis.keyTopics.filter(topic => 
              ['react', 'typescript', 'api', 'database', 'frontend', 'backend'].some(tech => 
                topic.toLowerCase().includes(tech)
              )
            )
          });
        }
      } catch (memoryError) {
        logMessage('⚠️ Error guardando memoria de conversación:', memoryError);
      }

      return aiResponse;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      // Si no es un error de rate limit, mostrar toast
      if (!isRateLimitError(error)) {
        toast({
          title: "Error al enviar mensaje",
          description: errorMessage,
          variant: "destructive"
        });
      }

      logMessage(`❌ Error en API key ${state.currentApiIndex + 1}: ${errorMessage}`);
      throw error;
    }
  }, [state.currentApiIndex, state.apiKeys, temperature, maxTokens, getDatabaseContext, isRateLimitError, switchToNextApi, logMessage, processCalendarCommands, processReportCommands, processTaskCommands, userProfile, getRelevantContext, saveConversationMemory, updateUserProfile]);

  // Obtener usuario actual
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Inicializar al montar el componente
  useEffect(() => {
    initializeState();
  }, [initializeState]);

  // Configurar reset automático cada 24 horas
  useEffect(() => {
    const resetInterval = resetIntervalHours * 60 * 60 * 1000;
    
    resetTimeoutRef.current = setTimeout(() => {
      logMessage('🔄 Ejecutando reset automático del sistema multi-API');
      initializeNewState();
    }, resetInterval);

    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, [resetIntervalHours, initializeNewState, logMessage]);

  // Guardar estado cuando cambie
  useEffect(() => {
    if (state.apiKeys.length > 0) {
      saveState(state);
    }
  }, [state, saveState]);

  return {
    sendMessage,
    isLoading: state.isLoading,
    error: state.error,
    currentApiIndex: state.currentApiIndex,
    apiStatuses: state.apiStatuses,
    totalRequests: state.totalRequests,
    lastReset: state.lastReset,
    // Métodos de utilidad
    resetToFirstApi: () => {
      setState(prev => {
        const newStatuses = prev.apiStatuses.map((status, index) => ({
          ...status,
          isActive: index === 0,
          isRateLimited: false
        }));
        
        return {
          ...prev,
          currentApiIndex: 0,
          apiStatuses: newStatuses,
          error: null
        };
      });
      logMessage('🔄 Reseteado manualmente a la primera API key');
    },
    getApiStatus: (index: number) => state.apiStatuses[index],
    isApiRateLimited: (index: number) => state.apiStatuses[index]?.isRateLimited || false
  };
};
