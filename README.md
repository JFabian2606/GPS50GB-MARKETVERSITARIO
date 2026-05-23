# Marketvesitario

Marketvesitario es una plataforma tipo marketplace universitario orientada a la compra, venta, intercambio de productos y oferta de tutorías académicas entre estudiantes.

## Objetivo
Facilitar el acceso a productos, servicios y apoyo académico dentro de la comunidad universitaria, promoviendo la economía colaborativa.

## Stack Tecnológico Óptimo y Estético

Este proyecto utiliza una arquitectura moderna diseñada para rendimiento, SEO y una estética de primer nivel:

- **Framework Core:** [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript.
- **UI & Estilos:** Tailwind CSS v4 + [Shadcn/ui](https://ui.shadcn.com/) + Framer Motion (para animaciones premium y glassmorphism).
- **Backend as a Service:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Edge Functions).
- **Infraestructura:** Despliegue en [Vercel](https://vercel.com/) (Frontend).
- **Package Manager:** `pnpm`.

## Configuración Inicial

1. **Instalar dependencias**:
   ```bash
   pnpm install
   ```

2. **Desarrollo**:
   ```bash
   pnpm dev
   ```

### Estructura General de Carpetas (Sujeta a adiciones y cambios)

```text
/
 ├── src/
 │   ├── app/           # Vistas y Rutas (Next.js App Router).
 │   ├── components/    # Componentes de UI globales y agnósticos (shadcn, hero, etc).
 │   ├── features/      # Módulos específicos del negocio (auth, marketplace, tutorias).
 │   ├── hooks/         # Custom hooks de React.
 │   └── lib/           # Configuración de clientes (Supabase, utils).
 │
 ├── supabase/          # Gestión por el CLI de Supabase
 │   ├── migrations/    # Versionamiento de la base de datos en scripts de SQL puro.
 │   ├── functions/     # Edge functions para ejecutar lógica robusta de servidor.
 │   └── seed.sql       # Script de datos iniciales / de prueba (mock data).
```

---

## Flujo de Trabajo del Equipo (Codeamos)

Para evitar sobrescribir datos y mantener un entorno de desarrollo seguro, **NUNCA nos conectamos directamente a la base de datos de producción mientras desarrollamos**. Seguimos este flujo basado en Git y migraciones locales:

### 1. Iniciar tu entorno local
Cuando clones o actualices el repositorio, asegúrate de tener Docker abierto y corre el entorno local:
```bash
pnpm install
pnpm exec supabase start
```
*Esto creará una base de datos local en tu equipo con las credenciales base que viven en `.env.local`.*

### 2. Modificar la Base de Datos
Si necesitas crear una tabla, hazlo desde tu navegador en el **Supabase Studio Local** (`http://127.0.0.1:54323`).

Para compartir esos cambios en la BD con el resto del equipo, debes generar un archivo de migración:
```bash
pnpm exec supabase db diff -f nombre_descriptivo_del_cambio
```
*Esto leerá tus tablas, detectará lo nuevo, y generará código `.sql` automáticamente en la carpeta `supabase/migrations/`.*

### 3. Compartir Código
Haz tu flujo normal de Git (commit de tus vistas, componentes y la nueva carpeta de migration) y haz push.
**(Las credenciales y variables secretas nunca se suben a Git, usa `.env.example` en su lugar).**

### 4. Recibir cambios de los compañeros
Cuando hagas `git pull` y recibas migraciones hechas por tu equipo, actualiza tu propia BD local corriendo:
```bash
pnpm exec supabase db reset
```

> **Nota:** Solo el encargado de DevOps/Líder Técnico vincula el proyecto a la nube (`supabase link`) para reflejar la versión final testeada enviándola con `pnpm exec supabase db push`.
    