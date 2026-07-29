# Plan: UI Redesign — Dashboards Modernos

## Goal

Rediseñar todos los dashboards y páginas del frontend para que se vean modernos, únicos y con identidad visual propia. El diseño actual tiene cards genéricas con border-radius excesivo, colores de modo claro que no respetan el tema dark-navy, y cero profundidad visual (sin degradés, sin sombreados, sin micro-animaciones).

## Approach

- **Sistema dark-navy permanente** — eliminar toda referencia a colores light (`bg-white`, `bg-slate-900`, `text-slate-900`, `dark:` prefixes que revierten al light)
- **Cards menos redondeadas** — reducir `rounded-2xl` → `rounded-xl` y `rounded-xl` → `rounded-lg` como estándar
- **Fondos con degradé** — cada card/surface tendrá `background: linear-gradient(...)` en lugar de `bg-navy-700/60` plano
- **Sombreados con transparencia** — `box-shadow` compuesto: sombra de profundidad + glow de color sutil
- **Framer Motion** — instalar para animaciones de entrada (stagger en listas, fade-in en cards, hover scale) — da el resultado más premium sin mucho código
- **Micro-detalles** — bordes superiores de color en cards de stat, líneas de acento, separadores con gradiente

---

## Sub-Tasks

---

### ST-1: Instalar Framer Motion + actualizar tokens de diseño en index.css y cn.ts

**Status:** [ ] pending

**Intent:**
Preparar la base: instalar Framer Motion, añadir nuevos keyframes y tokens en `index.css`, y actualizar los tokens de `cls` en `cn.ts` para reflejar el nuevo sistema de cards, tablas y superficies dark-only.

**Expected Outcomes:**
- `framer-motion` instalado y disponible en el proyecto
- `index.css` con nuevas animaciones CSS (`slideInLeft`, `countUp`) y tokens de superficie actualizados
- `cn.ts` con:
  - `cls.card` ahora usa degradé + sombra compuesta (no el flat `bg-navy-700/60`)
  - `cls.cardGradient` variante con color tint para stat cards
  - `cls.table`, `cls.th`, `cls.td` corregidos (eliminar clases de modo claro)
  - `cls.input`, `cls.select` corregidos (eliminar `bg-white dark:...`)
  - `roundedCard = 'rounded-xl'` (no 2xl) como nueva constante de redondeo estándar
  - Nuevas variantes para surface activo, superficie hover

**Todo List:**
1. En `apps/web`, instalar `framer-motion` via pnpm
2. En `index.css`: agregar keyframes `slideInLeft`, `pulse-dot`, actualizar `.glass` y `.glass-heavy` con bordes de gradiente, agregar clase `.card-surface` con sombra compuesta
3. En `cn.ts`:
   - Corregir `cls.card` y `cls.cardPad` → dark-only, con degradé sutil y shadow compuesta
   - Añadir `cls.statCard` (base dark con border-top de color) y variantes por color
   - Corregir `cls.input`, `cls.select`, `cls.textarea` → sin `bg-white dark:`, usar `bg-navy-700` siempre
   - Corregir `cls.th` y `cls.td` → sin clases light
   - Reducir border-radius en todas las clases de `rounded-2xl` → `rounded-xl`
   - Añadir `cls.surface` para contenedores de tabla/panel (reemplaza `bg-white dark:bg-slate-900`)

**Relevant Context:**
- `apps/web/src/lib/cn.ts` — archivo a modificar
- `apps/web/src/index.css` — tokens y animaciones
- `apps/web/package.json` — agregar dependencia

---

### ST-2: Rediseñar DashboardPage.tsx

**Status:** [ ] pending

**Intent:**
El dashboard es la primera pantalla que ve el usuario. Las stat cards actuales tienen fondo claro que no se invierte en dark mode y `rounded-2xl` muy genérico. Rediseñarlo con cards de degradé oscuro, borde superior de color (accent line), número grande con animación de conteo, sección de vencimientos como tabla glass con highlight amber.

**Expected Outcomes:**
- 4 stat cards con: fondo degradé dark, borde superior de color (2px), número con Framer Motion `countFrom0`, ícono en fondo con degradé de color, sin referencias a `bg-brand-50` ni `text-brand-700`
- Sección de vencimientos con fondo `glass-heavy` en lugar de `bg-white dark:bg-slate-900`
- Header con saludo + fecha usando tipografía grande y `text-gradient` en el número de fecha
- Entrada de la página con `motion.div` stagger para las cards
- Loading state con skeleton shimmer correcto (dark)

**Todo List:**
1. Reescribir `StatCard` component: fondo `linear-gradient(135deg, #1a2235, #131929)`, borde superior `2px solid <color>`, número con `motion.div` animate `{opacity:0, y:8}→{opacity:1, y:0}`, ícono con fondo de color translúcido
2. Eliminar `CARD_LIGHT`, `CARD_TEXT`, `CARD_SUB` (mapas de colores light) — reemplazar con mapas dark: `CARD_BORDER` (color de la línea top) y `CARD_ICON_BG` (fondo del ícono)
3. Envolver grid de stats con `motion.div` + `staggerChildren`
4. Reescribir la sección vencimientos con `cls.surface` y tabla dark
5. Corregir loading skeleton al dark: `bg-navy-700 animate-pulse` en lugar de `bg-slate-100 dark:bg-slate-800`

**Relevant Context:**
- `apps/web/src/pages/DashboardPage.tsx` — archivo a reescribir
- El problema principal: `CARD_LIGHT` usa `bg-brand-50 border-brand-100` (fondo claro) y `text-brand-700` (texto oscuro sobre fondo claro) — incompatibles con dark mode
- `cn.ts` con los nuevos tokens de ST-1 disponibles

---

### ST-3: Rediseñar AseguradosPage.tsx

**Status:** [ ] pending

**Intent:**
La tabla de asegurados usa `bg-white dark:bg-slate-900` como surface y el search input usa colores light. Unificar al sistema dark-navy, añadir animación de entrada a filas, corregir hover states, modernizar el modal de alta.

**Expected Outcomes:**
- Surface de tabla: `cls.surface` (fondo dark con borde y shadow)
- Search input: usa `cls.input` del sistema (ya corregido en ST-1) en lugar de su propio inline
- Filas de tabla: `motion.tr` con entrada stagger (o CSS `animation-delay` si se prefiere sin animar cada fila)
- Badge del productor en la tabla con el nuevo `cls.badge` dark
- Modal de alta: `border-b border-navy-600` en lugar de `border-slate-100 dark:border-slate-800`
- Avatar inicial del asegurado en la primera columna (círculo con letra, dark style)

**Todo List:**
1. Cambiar el contenedor de tabla de `bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800` → `cls.surface`
2. Reemplazar el search input inline por `cls.input` con el prefixed-icon wrapper del sistema
3. En el modal: reemplazar `border-slate-100 dark:border-slate-800` → `border-navy-600/50`
4. Añadir avatar de letra en columna Nombre (círculo navy con inicial)
5. Añadir `motion.tbody` + `motion.tr` con stagger en la lista de asegurados
6. Corregir color de link `text-brand-600` → `text-accent-400 hover:text-accent-300`

**Relevant Context:**
- `apps/web/src/pages/AseguradosPage.tsx`
- El modal también usa `border-slate-100 dark:...` — mismo fix

---

### ST-4: Rediseñar PolizasPage.tsx

**Status:** [ ] pending

**Intent:**
Las pólizas tienen el mismo problema de surface light + estados que no se ven en dark. Además, la vista de detalle de póliza tiene secciones separadas que deben verse como paneles cohesivos en dark.

**Expected Outcomes:**
- Lista de pólizas con surface dark, estado badges correctos en dark
- Vista de detalle de póliza: header con fondo degradé de estado (verde para activa, amber para suspendida, rojo para anulada)
- Sección de endosos y cuotas como sub-paneles con `cls.surface` y separador sutil
- Formulario de nueva póliza: inputs con el tema correcto

**Todo List:**
1. Cambiar todos los `bg-white dark:bg-slate-900` → `cls.surface`
2. En el detalle de póliza, añadir un header-banner con degradé de color según estado
3. Corregir borders de separación en el detalle
4. Animación de entrada en la tabla de pólizas

**Relevant Context:**
- `apps/web/src/pages/PolizasPage.tsx` — archivo grande, solo cambios quirúrgicos de surface/color

---

### ST-5: Rediseñar SiniestrosPage.tsx

**Status:** [ ] pending

**Intent:**
Los siniestros tienen el `EstadoStepper` visual que ya tiene buen diseño. El problema está en la tabla de listado y los modales. También el componente `VehiculoSilueta` tiene su propio estilo — no tocar.

**Expected Outcomes:**
- Tabla de siniestros con surface dark
- El stepper de estado mantiene su diseño actual (ya está bien)
- El modal de alta de siniestro con tema dark correcto
- Badge de tipo de siniestro con colores dark

**Todo List:**
1. Surface de tabla → `cls.surface`
2. Borders de modal → `border-navy-600/50`
3. Verificar que el stepper no use clases light

**Relevant Context:**
- `apps/web/src/pages/SiniestrosPage.tsx`
- `apps/web/src/components/VehiculoSilueta.tsx` — NO modificar

---

### ST-6: Rediseñar ReclamosPage.tsx, DocumentosPage.tsx, ProductoresPage.tsx, CompaniasPage.tsx, BienesPage.tsx

**Status:** [ ] pending

**Intent:**
Aplicar los mismos fixes de surface + color dark a las páginas restantes. Son variaciones del mismo patrón: tabla con `bg-white dark:` + modal con `border-slate-...`.

**Expected Outcomes:**
- Todas las páginas usan `cls.surface` para contenedores de tabla
- Todos los modales tienen borders dark
- Inputs en modales usan el tema correcto (ya corregido en `cls.input` en ST-1)

**Todo List:**
1. ReclamosPage: surface + modal borders
2. DocumentosPage: surface + modal borders
3. ProductoresPage: surface + modal borders
4. CompaniasPage: surface + modal borders
5. BienesPage: surface + modal borders (el formulario condicional de tipo bien puede tener sus propios issues)

**Relevant Context:**
- `apps/web/src/pages/ReclamosPage.tsx`
- `apps/web/src/pages/DocumentosPage.tsx`
- `apps/web/src/pages/ProductoresPage.tsx`
- `apps/web/src/pages/CompaniasPage.tsx`
- `apps/web/src/pages/BienesPage.tsx`

---

### ST-7: Rediseñar ReportesPage.tsx

**Status:** [ ] pending

**Intent:**
Los reportes tienen gráficos Recharts y 7 secciones desplegables. Los gráficos ya tienen tooltips dark custom. El problema está en las secciones colapsables que usan fondos light y los colores de los gráficos que pueden no ser acordes.

**Expected Outcomes:**
- Secciones desplegables con surface dark + borde izquierdo de color accent
- Stat cards de resumen del dashboard de reportes: mismo estilo que el nuevo StatCard del Dashboard
- Gráficos Recharts con paleta de colores actualizada (blues del sistema navy)
- Animación de expand/collapse en las secciones con Framer Motion

**Todo List:**
1. Secciones de reporte: reemplazar superficies light
2. Stat cards de resumen: reusar el nuevo StatCard del Dashboard (o extraerlo a componente compartido)
3. Actualizar colores de gráficos Recharts a la paleta del sistema
4. Animación de altura en secciones colapsables con `motion.div` + `AnimatePresence`

**Relevant Context:**
- `apps/web/src/pages/ReportesPage.tsx`
- Recharts: `BarChart`, `PieChart` ya importados

---

### ST-8: Sidebar y AppLayout — mejoras visuales

**Status:** [ ] pending

**Intent:**
El sidebar ya está bastante bien (dark navy, items agrupados, indicador de activo). Mejoras puntuales: añadir el nombre del usuario en el footer (no solo el rol), mejorar el breadcrumb en el top bar usando `useLocation()` correctamente, añadir tooltip en los nav items al hover.

**Expected Outcomes:**
- Footer del sidebar muestra: avatar + nombre/email (truncado) + rol pill
- Breadcrumb en top bar usa `useLocation()` de react-router-dom (no `location.pathname` global)
- Top bar añade un subtle notch/indicator de la ruta activa en el lado derecho
- Transición de página: `motion.div` wrapping el `{children}` con `fadeIn` entry

**Todo List:**
1. En `AppLayout`, importar `useLocation` de react-router-dom y usarlo en el breadcrumb
2. En el footer del sidebar: mostrar `user.identificadorAcceso` (truncado) debajo del rol
3. Envolver `{children}` con `motion.div` key={pathname} para fade entre rutas

**Relevant Context:**
- `apps/web/src/components/AppLayout.tsx`
- `apps/web/src/context/AuthContext.tsx` — `user` tiene `identificadorAcceso`? Verificar antes de implementar

---

## Design Tokens Reference

Valores a usar consistentemente en toda la implementación:

```
Surface principal (tabla/panel): 
  background: linear-gradient(180deg, #161d2f 0%, #131929 100%)
  border: 1px solid rgba(255,255,255,0.06)
  box-shadow: 0 4px 24px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.04) inset

Stat card:
  background: linear-gradient(135deg, #1a2235 0%, #131929 100%)
  border: 1px solid rgba(255,255,255,0.06)
  border-top: 2px solid <color-accent>
  box-shadow: 0 8px 32px rgba(0,0,0,0.25)

Modal:
  background: #131929
  border: 1px solid rgba(255,255,255,0.08)
  box-shadow: 0 24px 80px rgba(0,0,0,0.6)

Border-radius estándar: rounded-xl (0.75rem) para cards, rounded-lg para inputs/badges

Colores de acento por tipo:
  blue   → border #3d6bff, icon-bg rgba(61,107,255,0.12)
  green  → border #10b981, icon-bg rgba(16,185,129,0.12)
  amber  → border #f59e0b, icon-bg rgba(245,158,11,0.12)
  red    → border #ef4444, icon-bg rgba(239,68,68,0.12)
  violet → border #8b5cf6, icon-bg rgba(139,92,246,0.12)
```

## Library Addition

- **`framer-motion`** — animaciones de entrada (stagger, fade, slide), hover states con `whileHover`, animación de conteo en números del dashboard, transiciones entre rutas
  - Instalar: `pnpm add framer-motion` en `apps/web`
  - Alternativa si se prefiere sin dependencias: usar las animaciones CSS existentes en `index.css` con `animation-delay` para stagger manual — pero el resultado es menos polido
