# Configuración Real de Google OAuth para TuWebAI

## Pasos para Configurar Google Calendar con tuwebai@gmail.com

### 1. Ir a Google Cloud Console
- Ve a: https://console.cloud.google.com/
- Inicia sesión con tuwebai@gmail.com

### 2. Crear o Seleccionar Proyecto
- Crea un nuevo proyecto llamado "TuWebAI Dashboard"
- O selecciona un proyecto existente

### 3. Habilitar APIs Necesarias
- Ve a "APIs y servicios" > "Biblioteca"
- Busca y habilita:
  - Google Calendar API
  - Google+ API (para información del usuario)

### 4. Crear Credenciales OAuth 2.0
- Ve a "APIs y servicios" > "Credenciales"
- Haz clic en "Crear credenciales" > "ID de cliente OAuth 2.0"
- Tipo de aplicación: "Aplicación web"

### 5. Configurar Orígenes Autorizados
- **Orígenes JavaScript autorizados:**
  - `http://localhost:8083`
  - `https://tuwebai.com` (tu dominio de producción)
  - `https://www.tuwebai.com`

### 6. Configurar URIs de Redirección
- **URIs de redirección autorizados:**
  - `http://localhost:8083`
  - `https://tuwebai.com`
  - `https://www.tuwebai.com`

### 7. Obtener Credenciales
- Copia el **Client ID** y **API Key**
- Ve a "APIs y servicios" > "Credenciales"
- Busca tu API Key y cópiala

### 8. Configurar Variables de Entorno
Crea o actualiza tu archivo `.env`:

```env
# Google Calendar Integration
VITE_GOOGLE_API_KEY=tu_api_key_aqui
VITE_GOOGLE_CLIENT_ID=tu_client_id_aqui
```

### 9. Configurar Dominio de Producción
- Ve a "APIs y servicios" > "Pantalla de consentimiento OAuth"
- Agrega tuwebai@gmail.com como usuario de prueba
- Configura la pantalla de consentimiento:
  - Nombre de la aplicación: "TuWebAI Dashboard"
  - Email de soporte: tuwebai@gmail.com
  - Dominio autorizado: tuwebai.com

### 10. Verificar Configuración
- Reinicia el servidor de desarrollo: `pnpm dev`
- Ve a http://localhost:8083/admin#integraciones
- Haz clic en "Conectar Calendario"
- Debería abrirse la ventana de autorización de Google

## Solución de Problemas

### Error 400: redirect_uri_mismatch
- Verifica que las URIs de redirección estén exactamente como se configuraron
- Asegúrate de que no haya espacios extra o caracteres especiales

### Error 403: access_denied
- Verifica que tuwebai@gmail.com esté en la lista de usuarios de prueba
- Asegúrate de que la pantalla de consentimiento esté configurada

### Error 401: unauthorized
- Verifica que las APIs estén habilitadas
- Asegúrate de que las credenciales sean correctas

## Notas Importantes

- **NUNCA** subas el archivo `.env` al repositorio
- Las credenciales son sensibles y deben mantenerse seguras
- Para producción, usa variables de entorno del servidor
- El usuario tuwebai@gmail.com debe ser el propietario del proyecto en Google Cloud Console

## Verificación Final

Una vez configurado correctamente:
1. El panel de integraciones mostrará "Conectado" con el correo tuwebai@gmail.com
2. Se podrán crear eventos reales en Google Calendar
3. Los eventos aparecerán en el calendario de tuwebai@gmail.com
4. No habrá más mensajes de "simulado" en la consola
