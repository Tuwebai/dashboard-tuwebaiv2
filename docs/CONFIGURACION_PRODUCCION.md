# Configuración para Producción - Dashboard TuWebAI

## URLs de Producción

El dashboard está desplegado en: **https://dashboard.tuweb-ai.com/**

## Configuración de GitHub OAuth

### 1. Crear OAuth App en GitHub

1. Ve a [GitHub Developer Settings](https://github.com/settings/developers)
2. Haz clic en "New OAuth App"
3. Completa los siguientes campos:

```
Application name: TuWebAI Dashboard
Homepage URL: https://dashboard.tuweb-ai.com
Application description: Dashboard profesional para gestión de proyectos y análisis de GitHub
Authorization callback URL: https://dashboard.tuweb-ai.com/auth/github/callback
```

### 2. Variables de Entorno para Producción

Configura las siguientes variables de entorno en tu plataforma de despliegue:

```env
# GitHub OAuth Integration
VITE_GITHUB_CLIENT_ID=tu_client_id_de_github
VITE_GITHUB_CLIENT_SECRET=tu_client_secret_de_github
VITE_GITHUB_REDIRECT_URI=https://dashboard.tuweb-ai.com/auth/github/callback
VITE_GITHUB_TOKEN=tu_personal_access_token_de_github

# Configuración de la aplicación
VITE_PUBLIC_URL=https://dashboard.tuweb-ai.com
VITE_APP_NAME=Dashboard TuWebAI
VITE_APP_VERSION=1.0.0

# Supabase Configuration
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

### 3. Configuración de Supabase

1. Ve a tu proyecto de Supabase
2. En Authentication > URL Configuration, agrega:
   - **Site URL**: `https://dashboard.tuweb-ai.com`
   - **Redirect URLs**: `https://dashboard.tuweb-ai.com/auth/github/callback`

### 4. Configuración de Edge Functions

Si usas Supabase Edge Functions para el intercambio de tokens:

1. Despliega la función `github-token-exchange` en Supabase
2. Configura las variables de entorno de la función:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`

### 5. Verificación de Configuración

Para verificar que todo funciona correctamente:

1. Visita https://dashboard.tuweb-ai.com
2. Intenta conectar con GitHub
3. Verifica que los datos se cargan correctamente
4. Prueba la funcionalidad de repositorios clickeables

## Características Implementadas

### ✅ Layout Responsivo Avanzado
- Grid system flexible que se adapta automáticamente
- Mobile-first approach con gestos táctiles
- Progressive disclosure - mostrar información por niveles

### ✅ Integración Real con GitHub
- Datos auténticos de la API de GitHub
- Estadísticas de contribuciones calculadas desde commits reales
- Repositorios clickeables que abren en GitHub
- Sistema de caché para optimizar rendimiento

### ✅ Funcionalidades Móviles
- Gestos táctiles (swipe izquierda/derecha)
- Menú móvil desplegable
- Indicadores de modo de vista
- Navegación por teclado

## Troubleshooting

### Error de CORS
Si encuentras errores de CORS, verifica que:
- Las URLs de callback estén configuradas correctamente
- El dominio esté autorizado en GitHub OAuth App

### Error de Token
Si hay problemas con tokens:
- Verifica que las variables de entorno estén configuradas
- Asegúrate de que el token tenga los permisos necesarios

### Error de Rate Limiting
El sistema incluye manejo automático de rate limiting con:
- Reintentos automáticos
- Delays progresivos
- Fallbacks a datos en caché

## Soporte

Para soporte técnico o reportar problemas, contacta al equipo de desarrollo.
