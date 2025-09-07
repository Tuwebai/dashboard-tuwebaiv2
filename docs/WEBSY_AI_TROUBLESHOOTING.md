# Solución de Problemas - Websy AI

## 🚨 Errores Comunes y Soluciones

### **1. Error: "API key de Gemini no configurada"**

#### **Síntomas:**
- Mensaje de error al enviar mensaje
- Panel de diagnóstico muestra error en API Key

#### **Solución:**
1. **Verificar archivo .env.local:**
   ```env
   REACT_APP_GEMINI_API_KEY=tu_api_key_aqui
   ```

2. **Obtener API key de Gemini:**
   - Ir a [Google AI Studio](https://aistudio.google.com/)
   - Iniciar sesión con Google
   - Crear nuevo proyecto
   - Generar API key
   - Copiar la key completa

3. **Reiniciar servidor:**
   ```bash
   pnpm dev
   # o
   npm run dev
   ```

### **2. Error: "Error de API: 401 Unauthorized"**

#### **Síntomas:**
- API key configurada pero error 401
- Mensaje "API key inválida o expirada"

#### **Solución:**
1. **Verificar formato de API key:**
   - Debe empezar con "AIza"
   - Longitud mínima: 39 caracteres
   - Sin espacios o caracteres especiales

2. **Regenerar API key:**
   - Ir a Google AI Studio
   - Eliminar API key actual
   - Crear nueva API key
   - Actualizar .env.local

3. **Verificar permisos:**
   - Asegurar que la API key tenga permisos de Gemini API
   - Verificar que no esté restringida por IP

### **3. Error: "Error de API: 429 Too Many Requests"**

#### **Síntomas:**
- Error después de varios mensajes
- "Límite de solicitudes excedido"

#### **Solución con Sistema Multi-API:**
1. **Automático (Recomendado):**
   - El sistema cambia automáticamente a la siguiente API key
   - No requiere intervención manual
   - Verifica el panel de estado de APIs en la barra lateral

2. **Configuración Manual:**
   - Configura múltiples API keys en variables de entorno
   - Usa `VITE_GEMINI_API_KEY_1`, `VITE_GEMINI_API_KEY_2`, etc.
   - El sistema detectará y usará todas las keys disponibles

3. **Solución Legacy:**
   - Esperar 1-2 minutos para reset automático
   - Revisar cuota en Google AI Studio
   - Considerar upgrade de plan si es necesario

### **4. Problemas con Sistema Multi-API**

#### **Síntomas:**
- Panel de estado de APIs no se muestra
- Solo se usa una API key a pesar de tener múltiples configuradas
- Errores de "No hay API keys disponibles"

#### **Solución:**
1. **Verificar configuración:**
   ```env
   VITE_GEMINI_API_KEY_1=tu_primera_api_key
   VITE_GEMINI_API_KEY_2=tu_segunda_api_key
   VITE_GEMINI_API_KEY_3=tu_tercera_api_key
   ```

2. **Reiniciar servidor:**
   ```bash
   pnpm dev
   ```

3. **Verificar panel de estado:**
   - Abre la barra lateral en Websy AI
   - Verifica que se muestren todas las API keys configuradas
   - El panel debe mostrar el estado de cada API

4. **Logs de debugging:**
   - Abre las herramientas de desarrollador (F12)
   - Busca mensajes que empiecen con "[WebsyAI Multi-API]"
   - Verifica que el sistema detecte todas las API keys

### **5. Error: "Tabla chat_history no existe"**

#### **Síntomas:**
- Error al guardar mensajes
- Panel de diagnóstico muestra error de tabla

#### **Solución:**
1. **Ejecutar script SQL:**
   ```sql
   -- Copiar y pegar el contenido de SQL/create_websy_ai_tables.sql
   -- en la consola SQL de Supabase
   ```

2. **Verificar permisos:**
   - Asegurar que el usuario tenga permisos de CREATE TABLE
   - Verificar que RLS esté configurado correctamente

3. **Verificar conexión:**
   - Probar conexión a Supabase
   - Verificar variables de entorno

### **5. Error: "Error de API: 400 Bad Request"**

#### **Síntomas:**
- Error al enviar mensaje
- "Solicitud inválida"

#### **Solución:**
1. **Verificar formato del mensaje:**
   - No enviar mensajes vacíos
   - Verificar caracteres especiales
   - Longitud máxima: 4000 caracteres

2. **Verificar historial:**
   - Limpiar historial de conversación
   - Reducir número de mensajes previos

3. **Verificar configuración:**
   - Revisar parámetros de generación
   - Verificar temperatura y maxTokens

### **6. Error: "Error de API: 500 Internal Server Error"**

#### **Síntomas:**
- Error intermitente
- "Error interno del servidor"

#### **Solución:**
1. **Reintentar:**
   - Esperar unos segundos
   - Intentar enviar mensaje nuevamente

2. **Verificar estado de Gemini:**
   - Revisar [Google Cloud Status](https://status.cloud.google.com/)
   - Verificar si hay problemas conocidos

3. **Contactar soporte:**
   - Si el problema persiste
   - Reportar a Google AI Studio

### **7. Error: "No se pudo obtener contexto de la base de datos"**

#### **Síntomas:**
- IA responde sin contexto
- Warning en consola

#### **Solución:**
1. **Verificar conexión a Supabase:**
   - Probar consulta manual
   - Verificar variables de entorno

2. **Verificar permisos de tabla:**
   - Asegurar acceso a tablas projects, users, tickets
   - Verificar RLS policies

3. **Verificar estructura de tabla:**
   - Confirmar que las tablas existan
   - Verificar nombres de columnas

### **8. Error: "La respuesta de la IA está vacía"**

#### **Síntomas:**
- Mensaje enviado pero sin respuesta
- Error después de procesamiento

#### **Solución:**
1. **Verificar contenido del mensaje:**
   - Evitar mensajes muy largos
   - Simplificar consulta

2. **Verificar configuración de generación:**
   - Aumentar maxTokens
   - Ajustar temperatura

3. **Verificar filtros de contenido:**
   - Revisar si el mensaje viola políticas
   - Reformular consulta

## 🔧 Herramientas de Diagnóstico

### **Panel de Diagnóstico**
- Acceder a `/admin/websy-ai`
- Revisar panel de diagnóstico en la derecha
- Ejecutar verificación completa

### **Consola del Navegador**
- Abrir DevTools (F12)
- Revisar pestaña Console
- Buscar mensajes de error específicos

### **Verificación Manual**
```javascript
// En la consola del navegador
console.log('API Key:', process.env.REACT_APP_GEMINI_API_KEY ? 'Configurada' : 'No configurada');
console.log('Supabase URL:', process.env.VITE_SUPABASE_URL ? 'Configurada' : 'No configurada');
```

## 📋 Checklist de Verificación

### **Antes de Usar Websy AI:**
- [ ] API key de Gemini configurada
- [ ] Variables de entorno cargadas
- [ ] Script SQL ejecutado en Supabase
- [ ] Tablas creadas correctamente
- [ ] Permisos de usuario verificados
- [ ] Conexión a internet estable

### **Durante el Uso:**
- [ ] Mensajes no muy largos (< 4000 caracteres)
- [ ] No enviar mensajes vacíos
- [ ] Esperar respuesta antes de enviar siguiente
- [ ] Verificar estado de conexión

### **Después de Errores:**
- [ ] Revisar panel de diagnóstico
- [ ] Verificar logs en consola
- [ ] Probar con mensaje simple
- [ ] Reiniciar si es necesario

## 🆘 Contacto y Soporte

### **Problemas Técnicos:**
1. Revisar esta guía
2. Verificar panel de diagnóstico
3. Revisar logs de consola
4. Probar con configuración mínima

### **Problemas de API:**
1. Verificar [Google AI Studio](https://aistudio.google.com/)
2. Revisar [Google Cloud Status](https://status.cloud.google.com/)
3. Contactar soporte de Google

### **Problemas de Base de Datos:**
1. Verificar [Supabase Dashboard](https://app.supabase.com/)
2. Revisar logs de Supabase
3. Contactar soporte de Supabase

---

**¡Con esta guía deberías poder solucionar cualquier problema con Websy AI!** 🚀✨
