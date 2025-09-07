# Websy AI - Asistente de Inteligencia Artificial

## Descripción

Websy AI es un asistente de inteligencia artificial especializado en administración de proyectos web, integrado directamente en el dashboard de administración. Utiliza la API de Gemini AI (Google AI Studio) para proporcionar análisis predictivo, gestión de recursos y generación de reportes automáticos.

## Características Principales

### 🤖 Chat Inteligente
- Interfaz de chat en tiempo real con burbujas de mensajes
- Soporte para texto, imágenes y archivos (PDF, DOC, DOCX)
- Historial de conversaciones persistente en Supabase
- Memoria contextual que recuerda conversaciones anteriores
- Indicadores de escritura cuando la IA está procesando
- Timestamps en mensajes y scroll automático

### 📊 Integración con Datos Reales
- Acceso completo a la tabla de proyectos de Supabase
- Acceso a tabla de usuarios/clientes de Supabase
- Acceso a métricas y analytics reales del dashboard
- Capacidad de consultar estado de proyectos específicos
- Análisis de datos históricos en tiempo real

### 🎯 Casos de Uso Específicos
1. **Análisis Predictivo**: "Analiza los proyectos actuales y predice cuáles podrían retrasarse"
2. **Asignación Inteligente**: "¿Qué desarrollador debería trabajar en el nuevo proyecto de e-commerce?"
3. **Validación Automática**: "Revisa este brief de cliente por posibles violaciones de políticas"
4. **Generación de Reportes**: "Crea un reporte de progreso para el cliente X"
5. **Optimización de Recursos**: "Analiza la carga de trabajo del equipo esta semana"

## Configuración Técnica

### Variables de Entorno Requeridas

```env
# Supabase (ya configurado)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Gemini AI - Sistema Multi-API (Recomendado)
# Configura hasta 5 API keys para fallback automático
VITE_GEMINI_API_KEY_1=your_primary_gemini_api_key_here
VITE_GEMINI_API_KEY_2=your_secondary_gemini_api_key_here
VITE_GEMINI_API_KEY_3=your_tertiary_gemini_api_key_here
VITE_GEMINI_API_KEY_4=your_fourth_gemini_api_key_here
VITE_GEMINI_API_KEY_5=your_fifth_gemini_api_key_here

# Configuración alternativa (compatibilidad con versión anterior)
REACT_APP_GEMINI_API_KEY=your_legacy_gemini_api_key_here
```

### 🚀 Sistema Multi-API con Fallback Automático

Websy AI ahora incluye un sistema inteligente de múltiples API keys que resuelve automáticamente el problema de "Límite de solicitudes excedido":

#### **Características del Sistema Multi-API:**
- **Fallback Automático**: Cuando una API key alcanza su límite, cambia automáticamente a la siguiente
- **5 API Keys Soportadas**: Configura hasta 5 API keys diferentes de Gemini
- **Reset Automático**: Se resetea a la primera API key cada 24 horas
- **Monitoreo en Tiempo Real**: Panel de estado que muestra el uso de cada API
- **Logging Detallado**: Sistema de logs para debugging y monitoreo
- **Persistencia**: Guarda el estado en localStorage para continuidad entre sesiones

#### **Ventajas:**
- ✅ **Sin interrupciones**: El chat nunca se detiene por límites de API
- ✅ **Mayor disponibilidad**: Hasta 5x más requests disponibles
- ✅ **Transparente**: El usuario no nota los cambios de API
- ✅ **Inteligente**: Solo cambia en errores de rate limit, no en otros errores
- ✅ **Monitoreo**: Panel visual del estado de todas las APIs

### Base de Datos

Ejecutar el script SQL para crear las tablas necesarias:

```sql
-- Ejecutar: SQL/create_websy_ai_tables.sql
```

### Estructura de Archivos

```
src/
├── hooks/
│   ├── useGeminiAI.ts          # Hook para integración con Gemini AI
│   ├── useChatHistory.ts       # Hook para gestión de historial de chat
│   └── useAISettings.ts        # Hook para configuraciones de AI
├── components/websy-ai/
│   ├── MessageBubble.tsx       # Componente de burbuja de mensaje
│   ├── TypingIndicator.tsx     # Indicador de escritura
│   ├── ChatInput.tsx           # Input de chat con soporte multimedia
│   ├── ContextPanel.tsx        # Panel de contexto de datos
│   └── AISettingsModal.tsx     # Modal de configuración
└── pages/
    └── WebsyAI.tsx             # Página principal de Websy AI
```

## Funcionalidades Detalladas

### 💬 Sistema de Chat

#### Mensajes del Usuario
- Envío de texto con soporte para markdown
- Adjuntar archivos (imágenes, PDFs, documentos)
- Drag & drop para archivos
- Validación de tipos y tamaños de archivo
- Historial de mensajes persistente

#### Respuestas de la IA
- Análisis contextual basado en datos reales
- Respuestas personalizadas según el tipo de consulta
- Soporte para múltiples idiomas (español/inglés)
- Configuración de creatividad y longitud de respuesta

### 🗄️ Gestión de Conversaciones

#### Crear Conversación
- Título automático basado en el primer mensaje
- Contexto específico (general, proyecto, usuario, analytics)
- Asociación con proyectos o usuarios específicos

#### Historial de Conversaciones
- Lista de conversaciones recientes
- Búsqueda en historial de mensajes
- Eliminación de conversaciones
- Contador de mensajes por conversación

### ⚙️ Configuraciones Personalizables

#### Configuración de Respuesta
- **Temperatura**: Control de creatividad (0.0 - 1.0)
- **Longitud máxima**: Tokens de respuesta (100 - 4096)
- **Estilo**: Concisa, equilibrada o detallada

#### Funcionalidades
- **Análisis de contexto**: Acceso a datos de proyectos y usuarios
- **Análisis predictivo**: Predicciones y tendencias
- **Reportes automáticos**: Generación automática de reportes
- **Notificaciones**: Alertas de insights importantes

#### Configuración Avanzada
- **Idioma**: Español o inglés
- **Historial máximo**: 10-100 mensajes
- **Guardado automático**: Persistencia automática de cambios

### 📊 Panel de Contexto

#### Métricas en Tiempo Real
- **Proyectos**: Total, activos, completados
- **Usuarios**: Total, administradores, clientes
- **Tickets**: Total, abiertos, urgentes
- **Última actualización**: Timestamp de sincronización

#### Sugerencias de Consultas
- Consultas predefinidas para casos comunes
- Acceso rápido a análisis frecuentes
- Ejemplos de uso del sistema

## Seguridad y Permisos

### 🔐 Control de Acceso
- Solo administradores pueden acceder a Websy AI
- Validación de roles en el frontend y backend
- RLS (Row Level Security) en todas las tablas

### 🛡️ Protección de Datos
- Encriptación de mensajes sensibles en Supabase
- Rate limiting para prevenir abuso de API
- Logs de auditoría para uso de AI
- Validación de tipos de archivo adjuntos

## Uso y Ejemplos

### Consultas Básicas
```
"¿Cuántos proyectos están en progreso?"
"Muéstrame los usuarios más activos"
"¿Hay tickets urgentes pendientes?"
```

### Análisis Avanzados
```
"Analiza el rendimiento del equipo esta semana"
"¿Qué proyectos podrían retrasarse según el historial?"
"Genera un reporte de progreso para el cliente X"
```

### Gestión de Recursos
```
"¿Qué desarrollador tiene menos carga de trabajo?"
"Asigna este proyecto al mejor candidato"
"Optimiza la distribución de tareas del equipo"
```

## Troubleshooting

### Problemas Comunes

#### Error de API Key
```
Error: Error de API: 400 Bad Request
Solución: Verificar que REACT_APP_GEMINI_API_KEY esté configurada correctamente
```

#### Error de Base de Datos
```
Error: relation "chat_history" does not exist
Solución: Ejecutar el script SQL/create_websy_ai_tables.sql
```

#### Error de Permisos
```
Error: Acceso Denegado
Solución: Verificar que el usuario tenga rol de administrador
```

### Logs y Debugging

#### Verificar Conexión a Supabase
```javascript
// En la consola del navegador
console.log('Supabase connected:', !!supabase);
```

#### Verificar API Key de Gemini
```javascript
// En la consola del navegador
console.log('Gemini API Key:', process.env.REACT_APP_GEMINI_API_KEY ? 'Set' : 'Not set');
```

## Roadmap Futuro

### Próximas Características
- [ ] Integración con más APIs de IA (OpenAI, Claude)
- [ ] Análisis de sentimientos en comentarios
- [ ] Predicción de costos de proyectos
- [ ] Integración con herramientas externas (GitHub, Slack)
- [ ] Dashboard de métricas de uso de AI
- [ ] Exportación de conversaciones a PDF
- [ ] API pública para integraciones

### Mejoras de Performance
- [ ] Caché inteligente de respuestas
- [ ] Compresión de mensajes históricos
- [ ] Lazy loading de conversaciones
- [ ] Optimización de consultas a Supabase

## Soporte

Para reportar problemas o solicitar nuevas características:

1. Crear un issue en el repositorio
2. Incluir logs de error y pasos para reproducir
3. Especificar versión del navegador y sistema operativo
4. Adjuntar capturas de pantalla si es necesario

---

**Websy AI** - Transformando la administración de proyectos con inteligencia artificial 🤖✨
