# 🚀 Migración a pnpm - TuWebAI Dashboard

## ✅ Migración Completada

El proyecto ha sido migrado exitosamente de npm a pnpm.

## 📦 Comandos Principales

### Instalación
```bash
# Instalar dependencias
pnpm install

# Instalación limpia (elimina node_modules y reinstala)
pnpm run install:clean
```

### Desarrollo
```bash
# Servidor de desarrollo
pnpm dev

# Build de producción
pnpm build

# Build de desarrollo
pnpm build:dev

# Preview del build
pnpm preview
```

### Limpieza
```bash
# Limpiar cache y rebuild
pnpm run clean

# Limpiar y dev
pnpm run clean:dev
```

## 🔧 Configuración

### Archivo .npmrc
Se ha creado un archivo `.npmrc` con las siguientes optimizaciones:
- `shamefully-hoist=true` - Compatibilidad con herramientas que esperan node_modules planos
- `strict-peer-dependencies=false` - Evita errores de peer dependencies
- `auto-install-peers=true` - Instala automáticamente peer dependencies
- `prefer-frozen-lockfile=true` - Usa pnpm-lock.yaml para builds consistentes

## 📊 Beneficios de pnpm

1. **Velocidad**: 2-3x más rápido que npm
2. **Espacio**: 50% menos espacio en disco
3. **Seguridad**: Mejor manejo de dependencias
4. **Monorepos**: Soporte nativo para workspaces
5. **Cache**: Cache global compartido entre proyectos

## 🚨 Notas Importantes

- El archivo `package-lock.json` ha sido eliminado
- Se ha generado `pnpm-lock.yaml` como archivo de lock
- Todos los scripts han sido actualizados para usar pnpm
- El build funciona correctamente con pnpm

## 🔄 Rollback (si es necesario)

Si necesitas volver a npm:
```bash
# Eliminar pnpm files
rm -rf node_modules pnpm-lock.yaml .npmrc

# Reinstalar con npm
npm install
```

## ✅ Estado Actual

- ✅ pnpm instalado globalmente
- ✅ Dependencias migradas
- ✅ Scripts actualizados
- ✅ Build funcionando
- ✅ Dev server funcionando
- ✅ Configuración optimizada

La migración está **100% completa** y funcional.
