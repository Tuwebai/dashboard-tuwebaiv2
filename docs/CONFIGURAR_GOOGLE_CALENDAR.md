# Configuración de Google Calendar API

## 🚀 Pasos para Configurar Google Calendar

### 1. **Crear Proyecto en Google Cloud Console**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombra tu proyecto (ej: "Websy AI Calendar")

### 2. **Habilitar Google Calendar API**

1. En el menú lateral, ve a **APIs y servicios** > **Biblioteca**
2. Busca "Google Calendar API"
3. Haz clic en **Habilitar**

### 3. **Crear Credenciales**

1. Ve a **APIs y servicios** > **Credenciales**
2. Haz clic en **+ CREAR CREDENCIALES** > **ID de cliente OAuth 2.0**
3. Selecciona **Aplicación web**
4. Configura:
   - **Nombre**: Websy AI Calendar
   - **Orígenes JavaScript autorizados**: 
     - `http://localhost:8083` (desarrollo)
     - `https://tu-dominio.com` (producción)
   - **URI de redirección autorizados**:
     - `http://localhost:8083` (desarrollo)
     - `https://tu-dominio.com` (producción)

### 4. **Obtener API Key**

1. Ve a **APIs y servicios** > **Credenciales**
2. Haz clic en **+ CREAR CREDENCIALES** > **Clave de API**
3. Copia la clave generada

### 5. **Configurar Variables de Entorno**

Agrega estas variables a tu archivo `.env.local`:

```env
# Google Calendar Integration
VITE_GOOGLE_API_KEY=tu_api_key_aqui
VITE_GOOGLE_CLIENT_ID=tu_client_id_aqui
```

### 6. **Configurar OAuth Consent Screen**

1. Ve a **APIs y servicios** > **Pantalla de consentimiento OAuth**
2. Selecciona **Externo** (para desarrollo)
3. Completa la información:
   - **Nombre de la aplicación**: Websy AI
   - **Correo electrónico de soporte**: tu-email@ejemplo.com
   - **Dominio autorizado**: tu-dominio.com
4. Agrega los siguientes ámbitos:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`

### 7. **Probar la Integración**

1. Reinicia el servidor de desarrollo:
   ```bash
   pnpm dev
   ```

2. Ve a Websy AI y haz clic en "Conectar Google Calendar"

3. Autoriza la aplicación

4. Prueba programando una reunión

## 🔧 Solución de Problemas

### Error: "This app isn't verified"
- **Solución**: En desarrollo, haz clic en "Avanzado" > "Ir a Websy AI (no seguro)"

### Error: "redirect_uri_mismatch"
- **Solución**: Verifica que las URIs de redirección coincidan exactamente

### Error: "access_denied"
- **Solución**: Verifica que los ámbitos estén configurados correctamente

### Error: "invalid_client"
- **Solución**: Verifica que el Client ID sea correcto

## 📋 Verificación

### ✅ **Checklist de Configuración**

- [ ] Proyecto creado en Google Cloud Console
- [ ] Google Calendar API habilitada
- [ ] Credenciales OAuth 2.0 creadas
- [ ] API Key generada
- [ ] Variables de entorno configuradas
- [ ] Pantalla de consentimiento configurada
- [ ] Ámbitos de acceso agregados
- [ ] URIs de redirección configuradas

### 🧪 **Pruebas**

1. **Conexión**: El botón "Conectar Google Calendar" debe funcionar
2. **Autenticación**: Debe pedir permisos y autorizar
3. **Programación**: Debe poder crear eventos reales
4. **Verificación**: Los eventos deben aparecer en Google Calendar

## 🎯 **Funcionalidades Disponibles**

Una vez configurado, Websy AI podrá:

- ✅ **Programar reuniones reales** en Google Calendar
- ✅ **Crear eventos** con participantes
- ✅ **Gestionar horarios** y disponibilidad
- ✅ **Enviar invitaciones** automáticamente
- ✅ **Sincronizar** con tu calendario personal

## 🔒 **Seguridad**

- Las credenciales se almacenan de forma segura
- Solo se accede a los permisos necesarios
- Los datos se mantienen privados
- Puedes revocar el acceso en cualquier momento

## 📞 **Soporte**

Si tienes problemas con la configuración:

1. Verifica que todos los pasos se completaron
2. Revisa la consola del navegador para errores
3. Confirma que las variables de entorno están correctas
4. Verifica que las URIs de redirección coinciden

¡Con esta configuración, Websy AI podrá programar reuniones reales en tu Google Calendar!
