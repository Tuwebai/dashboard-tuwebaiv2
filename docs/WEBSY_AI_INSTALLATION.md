# Instalación de Websy AI

## Requisitos Previos

- Node.js 18+ 
- pnpm (recomendado) o npm
- Cuenta de Google AI Studio (para Gemini API)
- Proyecto con Supabase configurado

## Pasos de Instalación

### 1. Configurar Variables de Entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
# Gemini AI (Google AI Studio)
REACT_APP_GEMINI_API_KEY=tu_api_key_de_gemini_aqui

# Supabase (ya debería estar configurado)
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 2. Obtener API Key de Gemini

1. Ir a [Google AI Studio](https://aistudio.google.com/)
2. Iniciar sesión con tu cuenta de Google
3. Crear un nuevo proyecto
4. Generar una API key
5. Copiar la API key al archivo `.env.local`

### 3. Configurar Base de Datos

Ejecutar el script SQL en tu consola de Supabase:

```sql
-- Copiar y pegar el contenido de SQL/create_websy_ai_tables.sql
-- O ejecutar directamente desde el archivo
```

### 4. Instalar Dependencias (si es necesario)

```bash
# Si usas pnpm
pnpm install

# Si usas npm
npm install
```

### 5. Verificar Instalación

1. Iniciar el servidor de desarrollo:
```bash
pnpm dev
# o
npm run dev
```

2. Navegar a `/admin/websy-ai`
3. Verificar que aparezca la interfaz de Websy AI
4. Probar enviando un mensaje

## Verificación de Funcionamiento

### ✅ Checklist de Verificación

- [ ] La página `/admin/websy-ai` carga correctamente
- [ ] El sidebar muestra "Websy AI" con icono de robot
- [ ] Se puede enviar un mensaje de prueba
- [ ] La IA responde (verificar API key)
- [ ] Se pueden crear nuevas conversaciones
- [ ] El panel de contexto muestra datos reales
- [ ] La configuración se puede abrir y modificar
- [ ] Los mensajes se guardan en Supabase

### 🔍 Troubleshooting

#### Error: "Acceso Denegado"
- Verificar que el usuario tenga rol de administrador
- Revisar la configuración de RLS en Supabase

#### Error: "Error de API: 400 Bad Request"
- Verificar que la API key de Gemini esté correcta
- Verificar que la API key tenga permisos activos

#### Error: "relation does not exist"
- Ejecutar el script SQL completo
- Verificar que las tablas se crearon correctamente

#### Error: "No se pudo cargar el contexto"
- Verificar conexión a Supabase
- Verificar permisos de lectura en tablas de proyectos/usuarios

## Configuración Avanzada

### Personalizar Comportamiento de IA

1. Ir a Configuración en Websy AI
2. Ajustar temperatura (0.0 = preciso, 1.0 = creativo)
3. Configurar longitud máxima de respuesta
4. Activar/desactivar funcionalidades específicas

### Configurar Notificaciones

1. En Configuración > Funcionalidades
2. Activar "Notificaciones"
3. Configurar alertas automáticas

### Personalizar Contexto

1. El panel de contexto se actualiza automáticamente
2. Los datos se sincronizan cada vez que se abre la página
3. Se puede forzar actualización con el botón de refresh

## Soporte

Si encuentras problemas:

1. Revisar los logs en la consola del navegador
2. Verificar la configuración de variables de entorno
3. Comprobar la conexión a Supabase
4. Verificar permisos de la API key de Gemini

## Próximos Pasos

Una vez instalado correctamente:

1. Explorar las funcionalidades de análisis
2. Configurar las preferencias de IA
3. Probar casos de uso específicos
4. Integrar con flujos de trabajo existentes

---

¡Websy AI está listo para transformar tu administración de proyectos! 🚀
