# 🔧 Configuración de GitHub OAuth

## ❌ **PROBLEMA ACTUAL**
El error `400 (Bad Request)` con "The client_id and/or client_secret passed are incorrect" indica que las credenciales de GitHub OAuth no están configuradas correctamente.

## ✅ **SOLUCIÓN**

### **Paso 1: Crear una GitHub OAuth App**

1. Ve a [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Haz clic en "New OAuth App"
3. Completa el formulario:
   - **Application name**: `TuWebAI Dashboard`
   - **Homepage URL**: `http://localhost:8083`
   - **Authorization callback URL**: `http://localhost:8083/auth/github/callback`
4. Haz clic en "Register application"
5. Copia el **Client ID** y **Client Secret**

### **Paso 2: Configurar Variables de Entorno**

Crea un archivo `.env` en la raíz del proyecto con:

```env
# GitHub OAuth Integration
VITE_GITHUB_CLIENT_ID=tu_client_id_aqui
VITE_GITHUB_CLIENT_SECRET=tu_client_secret_aqui
VITE_GITHUB_REDIRECT_URI=http://localhost:8083/auth/github/callback

# Supabase Configuration
VITE_SUPABASE_URL=https://xebnhwjzchrsbhzbtlsg.supabase.co
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
```

### **Paso 3: Configurar Supabase Edge Function (Opcional)**

Si quieres usar la Edge Function de Supabase:

1. Ve a tu proyecto de Supabase
2. Ve a **Settings > Edge Functions**
3. Agrega estas variables de entorno:
   - `VITE_GITHUB_CLIENT_ID` = tu_client_id
   - `VITE_GITHUB_CLIENT_SECRET` = tu_client_secret
   - `VITE_GITHUB_REDIRECT_URI` = http://localhost:8083/auth/github/callback

### **Paso 4: Configuración Temporal (Solo para Desarrollo)**

Si no quieres usar variables de entorno, puedes editar directamente:

`src/config/github-oauth.ts`:
```typescript
export const GITHUB_OAUTH_CONFIG = {
  CLIENT_ID: 'tu_client_id_aqui',
  CLIENT_SECRET: 'tu_client_secret_aqui',
  REDIRECT_URI: 'http://localhost:8083/auth/github/callback',
  SCOPE: ['user:email', 'read:user', 'repo', 'read:org'],
};
```

## 🔄 **Reiniciar el Servidor**

Después de configurar las credenciales:

```bash
pnpm dev
```

## ✅ **Verificación**

1. Ve a `http://localhost:8083/perfil`
2. Haz clic en "Conectar con GitHub"
3. Deberías ser redirigido a GitHub para autorizar
4. Después de autorizar, deberías volver al dashboard conectado

## 🚨 **Notas Importantes**

- **NUNCA** commitees el archivo `.env` con credenciales reales
- **NUNCA** expongas el Client Secret en el frontend en producción
- Para producción, usa la Edge Function de Supabase o un backend propio
- El Client Secret solo debe estar en el servidor, nunca en el cliente

## 🔍 **Debugging**

Si sigues teniendo problemas:

1. Verifica que las credenciales sean correctas
2. Verifica que la URL de callback coincida exactamente
3. Revisa la consola del navegador para errores específicos
4. Revisa los logs de la Edge Function en Supabase
