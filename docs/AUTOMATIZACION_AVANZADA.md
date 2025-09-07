# 🤖 Automatización Avanzada - Websy AI

Sistema inteligente de automatización que optimiza la gestión de tareas, asignaciones y reportes de manera automática.

## 🚀 Características Principales

### 📊 **Generación Automática de Reportes**
- **Reportes Semanales**: Generados automáticamente cada domingo a las 9:00 AM
- **Reportes Mensuales**: Análisis completo del rendimiento mensual
- **Métricas Incluidas**:
  - Total de tareas completadas
  - Tasa de productividad
  - Top performers del equipo
  - Problemas críticos identificados
  - Análisis de gaps de habilidades

### 🎯 **Asignación Inteligente de Tareas**
- **Algoritmo de Matching**: Asigna tareas basándose en habilidades y experiencia
- **Score de Compatibilidad**: Calcula la mejor coincidencia usuario-tarea
- **Reasignación Automática**: Reasigna tareas vencidas automáticamente
- **Gestión de Habilidades**: Sistema completo de habilidades del equipo

### ⏰ **Seguimiento Automático de Deadlines**
- **Verificación Cada 6 Horas**: Monitorea deadlines continuamente
- **Alertas Proactivas**: Notifica 24 horas antes del vencimiento
- **Escalación Automática**: Escala tareas vencidas según reglas configuradas
- **Dashboard en Tiempo Real**: Vista actualizada del estado de las tareas

### 🚨 **Sistema de Escalación Inteligente**
- **Reglas Configurables**: Define cuándo y cómo escalar problemas
- **Acciones Automáticas**:
  - Notificar a administradores
  - Reasignar tareas automáticamente
  - Crear reuniones urgentes
  - Enviar alertas críticas
- **Verificación Cada 2 Horas**: Monitorea condiciones de escalación

## 🏗️ Arquitectura del Sistema

### Servicios Principales

#### `AutomationService`
- **Singleton Pattern**: Una instancia global del servicio
- **Inicialización Automática**: Se activa al cargar la aplicación
- **Intervalos Configurables**: Timers para cada tipo de automatización
- **Métodos Principales**:
  - `generateWeeklyReport()`: Genera reportes semanales
  - `assignTaskIntelligently()`: Asigna tareas basándose en habilidades
  - `checkDeadlines()`: Verifica deadlines y envía alertas
  - `escalateTask()`: Escala tareas según reglas

#### `useAutomation` Hook
- **Estado Centralizado**: Maneja el estado de automatización
- **Acciones Reactivas**: Funciones para interactuar con el sistema
- **Carga de Datos**: Obtiene estadísticas y reportes
- **Gestión de Habilidades**: CRUD completo de habilidades

### Componentes de UI

#### `AutomationDashboard`
- **Vista Principal**: Dashboard completo de automatización
- **Métricas en Tiempo Real**: Estadísticas actualizadas
- **Tabs Organizados**: Resumen, Tareas, Habilidades, Reportes, Configuración
- **Acciones Rápidas**: Botones para generar reportes y reasignar tareas

#### `SkillsManager`
- **Gestión de Habilidades**: CRUD completo de habilidades de usuarios
- **Niveles de Proficiencia**: Sistema de 1-5 estrellas
- **Análisis del Equipo**: Estadísticas de habilidades a nivel de equipo
- **Habilidades Comunes**: Lista predefinida de habilidades populares

#### `AutomationNotifications`
- **Centro de Notificaciones**: Todas las alertas del sistema
- **Categorización**: Notificaciones, Alertas, Configuración
- **Gestión de Estado**: Marcar como leídas, filtrar, etc.
- **Alertas en Tiempo Real**: Notificaciones push del sistema

## 🗄️ Base de Datos

### Tablas Principales

#### `user_skills`
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- skill_name: VARCHAR(100)
- proficiency_level: INTEGER (1-5)
- experience_years: INTEGER
- last_used: TIMESTAMP
```

#### `tasks`
```sql
- id: UUID (PK)
- title: VARCHAR(255)
- description: TEXT
- priority: VARCHAR(20) (low, medium, high, critical)
- status: VARCHAR(20) (pending, in_progress, completed, blocked)
- assigned_to: UUID (FK → users)
- due_date: TIMESTAMP
- estimated_hours: INTEGER
- required_skills: TEXT[] (Array de habilidades)
- project_id: UUID (FK → projects)
```

#### `automation_reports`
```sql
- id: VARCHAR(255) (PK)
- type: VARCHAR(20) (weekly, monthly)
- period_start: TIMESTAMP
- period_end: TIMESTAMP
- generated_at: TIMESTAMP
- data: JSONB (Datos del reporte)
```

#### `escalation_rules`
```sql
- id: UUID (PK)
- name: VARCHAR(255)
- condition: TEXT (JSON con condiciones)
- action: VARCHAR(50) (notify_manager, reassign_task, create_meeting, send_alert)
- priority_threshold: INTEGER
- days_overdue_threshold: INTEGER
- is_active: BOOLEAN
```

#### `notifications`
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- title: VARCHAR(255)
- message: TEXT
- type: VARCHAR(50) (automation, deadline, escalation, assignment, report)
- is_read: BOOLEAN
- created_at: TIMESTAMP
```

### Funciones de Base de Datos

#### `get_skill_statistics()`
- Retorna estadísticas de habilidades del equipo
- Incluye: total usuarios, proficiencia promedio, experiencia total

#### `get_tasks_needing_reassignment()`
- Identifica tareas que necesitan reasignación
- Sugiere usuarios basándose en habilidades
- Calcula días de retraso

#### `automation_dashboard` (Vista)
- Vista materializada con estadísticas en tiempo real
- Actualizada automáticamente
- Optimizada para consultas rápidas

## ⚙️ Configuración

### 1. Migración de Base de Datos
```bash
# Ejecutar en Supabase SQL Editor
SQL/crear_automatizacion_avanzada.sql
```

### 2. Variables de Entorno
```env
# Configuración de notificaciones (opcional)
VITE_NOTIFICATION_SERVICE_URL=your_notification_service_url
VITE_EMAIL_SERVICE_URL=your_email_service_url
```

### 3. Inicialización del Servicio
```typescript
// En App.tsx o main.tsx
import { automationService } from '@/lib/automationService';

// Inicializar automáticamente
automationService.initialize();
```

## 🎯 Uso del Sistema

### Para Administradores

1. **Acceder al Dashboard**:
   - Ve a Admin Dashboard > Automatización Avanzada
   - Explora las diferentes secciones

2. **Configurar Habilidades**:
   - Gestiona habilidades de usuarios
   - Establece niveles de proficiencia
   - Analiza gaps de habilidades

3. **Monitorear Automatización**:
   - Revisa notificaciones del sistema
   - Genera reportes manualmente
   - Configura reglas de escalación

4. **Gestionar Tareas**:
   - Revisa tareas que necesitan reasignación
   - Escala problemas críticos
   - Monitorea deadlines

### Para Usuarios

1. **Ver Notificaciones**:
   - Recibe alertas de deadlines
   - Notificaciones de asignaciones
   - Alertas de escalación

2. **Gestionar Habilidades**:
   - Actualiza tu perfil de habilidades
   - Añade nuevas competencias
   - Mejora tus niveles de proficiencia

## 📈 Métricas y KPIs

### Métricas de Productividad
- **Tasa de Completación**: % de tareas completadas
- **Eficiencia del Equipo**: Promedio de productividad
- **Tiempo de Resolución**: Promedio de tiempo para completar tareas
- **Satisfacción de Asignación**: % de asignaciones exitosas

### Métricas de Automatización
- **Tareas Asignadas Automáticamente**: % de asignaciones automáticas
- **Tiempo de Escalación**: Tiempo promedio para escalar problemas
- **Precisión de Asignación**: % de asignaciones correctas
- **Reducción de Tiempo**: Tiempo ahorrado por automatización

### Métricas de Habilidades
- **Cobertura de Habilidades**: % de habilidades cubiertas por el equipo
- **Gaps Identificados**: Número de gaps de habilidades
- **Desarrollo del Equipo**: Progreso en habilidades
- **Rotación de Tareas**: Distribución equitativa de trabajo

## 🔧 Personalización

### Reglas de Escalación Personalizadas
```typescript
// Ejemplo de regla personalizada
const customRule = {
  name: "Escalación por Prioridad Crítica",
  condition: JSON.stringify({
    priority: "critical",
    days_overdue: 1
  }),
  action: "notify_manager",
  priority_threshold: 4,
  days_overdue_threshold: 1,
  is_active: true
};
```

### Configuración de Reportes
```typescript
// Personalizar frecuencia de reportes
automationService.setReportSchedule({
  weekly: { day: 0, hour: 9 }, // Domingo 9:00 AM
  monthly: { day: 1, hour: 10 } // Primer día del mes 10:00 AM
});
```

## 🚨 Solución de Problemas

### Problemas Comunes

1. **Reportes no se generan**:
   - Verificar que el servicio esté inicializado
   - Revisar logs de la consola
   - Verificar permisos de base de datos

2. **Asignaciones incorrectas**:
   - Revisar habilidades de usuarios
   - Verificar configuración de tareas
   - Ajustar algoritmo de matching

3. **Notificaciones no llegan**:
   - Verificar configuración de notificaciones
   - Revisar permisos de usuario
   - Comprobar estado del servicio

### Logs y Debugging
```typescript
// Habilitar logs detallados
automationService.setDebugMode(true);

// Verificar estado del servicio
console.log(automationService.getStatus());
```

## 🔮 Roadmap Futuro

### Próximas Características
- **IA Predictiva**: Predicción de deadlines y problemas
- **Optimización de Recursos**: Asignación óptima de recursos
- **Integración con Calendarios**: Sincronización con Google Calendar
- **Análisis de Sentimientos**: Análisis del estado del equipo
- **Automatización de Reuniones**: Creación automática de reuniones

### Mejoras Planificadas
- **Dashboard Móvil**: Versión móvil del dashboard
- **API REST**: API para integraciones externas
- **Webhooks**: Notificaciones en tiempo real
- **Machine Learning**: Mejora continua del algoritmo

## 📞 Soporte

Para soporte técnico o preguntas sobre la automatización:
- Revisa la documentación completa
- Consulta los logs del sistema
- Contacta al equipo de desarrollo

---

**¡Disfruta de la automatización inteligente en Websy AI!** 🚀
