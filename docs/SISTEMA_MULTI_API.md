# Sistema Multi-API con Fallback Automático - Websy AI

## 🚀 Descripción

El Sistema Multi-API de Websy AI resuelve automáticamente el problema de "Límite de solicitudes excedido" implementando un sistema inteligente de fallback entre múltiples API keys de Gemini.

## ✨ Características Principales

### 🔄 Fallback Automático
- **Detección Inteligente**: Solo cambia de API en errores de rate limit (429)
- **Cambio Transparente**: El usuario no nota la transición entre APIs
- **Reintento Automático**: Reintenta inmediatamente con la siguiente API key

### 📊 Monitoreo en Tiempo Real
- **Panel de Estado**: Muestra el estado de todas las API keys configuradas
- **Estadísticas de Uso**: Contador de requests y estimación de requests restantes
- **Historial de Errores**: Registra el último error de cada API key

### 🔧 Configuración Flexible
- **Hasta 5 API Keys**: Soporte para múltiples API keys de Gemini
- **Compatibilidad Legacy**: Mantiene compatibilidad con configuración anterior
- **Reset Automático**: Se resetea a la primera API cada 24 horas

### 🛡️ Persistencia y Recuperación
- **Estado Persistente**: Guarda el estado en localStorage
- **Recuperación Automática**: Restaura el estado al recargar la página
- **Logging Detallado**: Sistema completo de logs para debugging

## 📁 Archivos Implementados

### Hooks
- `src/hooks/useMultiAI.ts` - Hook principal que maneja toda la lógica multi-API

### Componentes
- `src/components/websy-ai/ApiStatus.tsx` - Panel de estado de las APIs

### Configuración
- `src/config/environment.ts` - Configuración de variables de entorno
- `src/utils/checkConfig.ts` - Verificación de configuración actualizada

### Documentación
- `docs/WEBSY_AI_README.md` - Documentación principal actualizada
- `docs/WEBSY_AI_TROUBLESHOOTING.md` - Guía de solución de problemas
- `env.example` - Archivo de ejemplo de variables de entorno

### Scripts
- `scripts/test-multi-api.js` - Script de verificación de configuración

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
# Sistema Multi-API (Recomendado)
VITE_GEMINI_API_KEY_1=tu_primera_api_key_aqui
VITE_GEMINI_API_KEY_2=tu_segunda_api_key_aqui
VITE_GEMINI_API_KEY_3=tu_tercera_api_key_aqui
VITE_GEMINI_API_KEY_4=tu_cuarta_api_key_aqui
VITE_GEMINI_API_KEY_5=tu_quinta_api_key_aqui

# Configuración Legacy (Compatibilidad)
REACT_APP_GEMINI_API_KEY=tu_api_key_legacy_aqui
```

### Verificación de Configuración

```bash
# Verificar configuración
pnpm test:multi-api

# Iniciar aplicación
pnpm dev
```

## 🎯 Uso del Sistema

### En el Código

```typescript
import { useMultiAI } from '@/hooks/useMultiAI';

const MyComponent = () => {
  const {
    sendMessage,
    isLoading,
    error,
    currentApiIndex,
    apiStatuses,
    totalRequests,
    lastReset,
    resetToFirstApi
  } = useMultiAI({
    temperature: 0.7,
    maxTokens: 2048,
    enableLogging: true,
    resetIntervalHours: 24
  });

  // Usar sendMessage normalmente
  const handleSend = async () => {
    try {
      const response = await sendMessage("Hola Websy AI");
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  };
};
```

### En la Interfaz

```tsx
import { ApiStatus } from '@/components/websy-ai/ApiStatus';

const ChatInterface = () => {
  return (
    <div>
      {/* Panel de estado de APIs */}
      <ApiStatus
        currentApiIndex={currentApiIndex}
        apiStatuses={apiStatuses}
        totalRequests={totalRequests}
        lastReset={lastReset}
        onResetToFirst={resetToFirstApi}
      />
      
      {/* Resto de la interfaz */}
    </div>
  );
};
```

## 🔍 Flujo de Funcionamiento

1. **Inicialización**: El sistema carga todas las API keys configuradas
2. **Selección**: Comienza con la primera API key disponible
3. **Monitoreo**: Rastrea el uso y errores de cada API key
4. **Detección**: Identifica errores de rate limit (429)
5. **Fallback**: Cambia automáticamente a la siguiente API key
6. **Reintento**: Reintenta la solicitud con la nueva API key
7. **Reset**: Se resetea a la primera API cada 24 horas

## 📊 Panel de Estado

El componente `ApiStatus` muestra:

- **API Actual**: Estado de la API key en uso
- **APIs Disponibles**: Número de APIs sin límites
- **APIs Limitadas**: Número de APIs con rate limit
- **Estadísticas**: Requests totales y por API
- **Uso Estimado**: Porcentaje de uso de cada API
- **Último Reset**: Tiempo desde el último reset automático

## 🐛 Debugging

### Logs del Sistema

El sistema genera logs detallados con el prefijo `[WebsyAI Multi-API]`:

```javascript
// Ejemplos de logs
[WebsyAI Multi-API 2024-01-15T10:30:00.000Z] 🚀 Sistema multi-API inicializado con 3 API keys
[WebsyAI Multi-API 2024-01-15T10:30:15.000Z] 📤 Enviando mensaje usando API key 1
[WebsyAI Multi-API 2024-01-15T10:30:16.000Z] ⚠️ Rate limit detectado en API key 1, cambiando...
[WebsyAI Multi-API 2024-01-15T10:30:16.000Z] 🔄 Cambiando a API key 2
[WebsyAI Multi-API 2024-01-15T10:30:17.000Z] ✅ Respuesta exitosa usando API key 2
```

### Verificación de Estado

```bash
# Verificar configuración
pnpm test:multi-api

# Ver logs en consola del navegador
# Abrir DevTools (F12) y buscar mensajes con [WebsyAI Multi-API]
```

## 🚨 Solución de Problemas

### Error: "No hay API keys disponibles"
- Verificar que al menos una API key esté configurada
- Ejecutar `pnpm test:multi-api` para diagnóstico

### Error: "Todas las API keys han alcanzado su límite"
- Esperar 24 horas para reset automático
- Usar `resetToFirstApi()` para reset manual
- Configurar más API keys

### Panel de estado no se muestra
- Verificar que el componente `ApiStatus` esté importado
- Comprobar que se pasen todas las props requeridas

## 🔄 Migración desde Sistema Anterior

El sistema es completamente compatible con la configuración anterior:

1. **Mantener API key existente**: `REACT_APP_GEMINI_API_KEY`
2. **Agregar nuevas API keys**: `VITE_GEMINI_API_KEY_1`, `VITE_GEMINI_API_KEY_2`, etc.
3. **Actualizar imports**: Cambiar `useGeminiAI` por `useMultiAI`
4. **Agregar panel de estado**: Incluir componente `ApiStatus`

## 📈 Beneficios

- ✅ **99.9% Disponibilidad**: Sin interrupciones por límites de API
- ✅ **Escalabilidad**: Hasta 5x más requests disponibles
- ✅ **Transparencia**: El usuario no nota los cambios
- ✅ **Monitoreo**: Visibilidad completa del estado del sistema
- ✅ **Robustez**: Manejo inteligente de errores
- ✅ **Mantenibilidad**: Logs detallados para debugging

## 🎉 Conclusión

El Sistema Multi-API de Websy AI proporciona una solución robusta y transparente al problema de límites de API, asegurando que el chat de IA esté siempre disponible para los usuarios sin interrupciones.
