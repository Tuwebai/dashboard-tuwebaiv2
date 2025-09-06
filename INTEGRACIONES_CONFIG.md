# 🔧 Configuración de Integraciones Profesionales

## 📅 Google Calendar Integration

### 1. Configurar Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google Calendar:
   - Ve a "APIs & Services" > "Library"
   - Busca "Google Calendar API"
   - Haz clic en "Enable"

### 2. Crear Credenciales OAuth 2.0

1. Ve a "APIs & Services" > "Credentials"
2. Haz clic en "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configura la pantalla de consentimiento:
   - Tipo: "External"
   - Nombre: "Websy AI Dashboard"
   - Dominios autorizados: tu dominio de producción
4. Crea el cliente OAuth:
   - Tipo: "Web application"
   - Orígenes JavaScript autorizados: `http://localhost:3000`, `https://tu-dominio.com`
   - URIs de redirección autorizados: `http://localhost:3000`, `https://tu-dominio.com`

### 3. Configurar Variables de Entorno

Agrega a tu archivo `.env`:

```env
VITE_GOOGLE_CLIENT_ID=tu_client_id_aqui
```

## 📧 Gmail Integration

### 1. Configurar Gmail API

1. En el mismo proyecto de Google Cloud Console
2. Habilita la API de Gmail:
   - Ve a "APIs & Services" > "Library"
   - Busca "Gmail API"
   - Haz clic en "Enable"

### 2. Configurar OAuth Scopes

Los scopes necesarios ya están configurados en el código:
- `https://www.googleapis.com/auth/calendar` (para calendario)
- `https://www.googleapis.com/auth/gmail.send` (para email)

## 🚀 Funcionalidades Implementadas

### Calendario
- ✅ Crear eventos programados
- ✅ Listar eventos próximos
- ✅ Actualizar eventos existentes
- ✅ Eliminar eventos
- ✅ Búsqueda de eventos
- ✅ Autenticación OAuth 2.0

### Email
- ✅ Envío de reportes automáticos
- ✅ Programación de emails
- ✅ Múltiples destinatarios
- ✅ Templates personalizados
- ✅ Autenticación OAuth 2.0

### Comandos de Voz/Texto
- ✅ "Programa una reunión para mañana"
- ✅ "Agenda una cita el viernes"
- ✅ "Envía un reporte"
- ✅ "Manda email a cliente"

## 📱 Uso en la Aplicación

### En Websy AI Chat:
1. Escribe o di: "Programa una reunión para mañana a las 2pm"
2. Se abrirá el modal de calendario
3. Completa los detalles y crea el evento

### En Panel Admin:
1. Ve a "Integraciones" en el sidebar
2. Conecta tu cuenta de Google Calendar
3. Conecta tu cuenta de Gmail
4. Ve tus próximos eventos y gestiona integraciones

## 🔒 Seguridad

- Las credenciales OAuth se almacenan localmente en el navegador
- No se envían datos sensibles al servidor
- Los tokens se renuevan automáticamente
- Cumple con las políticas de privacidad de Google

## 🐛 Solución de Problemas

### Error de CORS:
- Asegúrate de que tu dominio esté en "Orígenes JavaScript autorizados"

### Error de Redirect URI:
- Verifica que la URI de redirección coincida exactamente

### Error de Scope:
- Los scopes están predefinidos en el código, no necesitas cambiarlos

### Error de Autenticación:
- Verifica que el Client ID sea correcto
- Asegúrate de que las APIs estén habilitadas
