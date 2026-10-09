# Mobile App Plan — `apps/mobile/`

## Overview

Add a React Native + Expo mobile application to the existing `seminario` monorepo. The app consumes the same NestJS API already used by `apps/web/`. No backend changes are required.

**Key decisions:**
- **Framework:** React Native + Expo (managed workflow, SDK 52+)
- **Navigation:** React Navigation v7 (Stack + Bottom Tabs)
- **State / Data fetching:** TanStack React Query v5 (same as web)
- **HTTP client:** Axios with an interceptor equivalent to `apps/web/src/lib/api.ts`
- **Token storage:** `expo-secure-store` (replaces `localStorage`)
- **Auth state:** React Context (`AuthContext`) — same pattern as web
- **Forms:** `react-hook-form` + `zod` (same as web)
- **Shared types:** `@gestion-pas/types` imported via pnpm workspace
- **Testing device:** Physical device — `EXPO_PUBLIC_API_URL` must point to the machine's LAN IP

**Out of scope:** Export/Import CSV functionality (desktop-only feature).

---

## Architecture at a glance

```
apps/mobile/
├── app.json                     ← Expo config
├── package.json                 ← name: @gestion-pas/mobile
├── tsconfig.json                ← extends workspace TS config
├── babel.config.js
├── index.ts                     ← entry point (registerRootComponent)
└── src/
    ├── lib/
    │   ├── api.ts               ← axios instance + interceptors (mirrors web)
    │   ├── auth.ts              ← AuthUser type + SecureStore helpers
    │   ├── queryClient.ts       ← TanStack Query client
    │   └── format.ts            ← date/money formatters (same as web)
    ├── context/
    │   └── AuthContext.tsx      ← login / logout / user state
    ├── navigation/
    │   ├── RootNavigator.tsx    ← auth gate: Auth stack vs App navigator
    │   ├── AuthNavigator.tsx    ← Login screen stack
    │   └── AppNavigator.tsx     ← role-aware bottom tabs + stacks
    ├── screens/
    │   ├── auth/
    │   │   └── LoginScreen.tsx
    │   ├── shared/              ← screens accessible to multiple roles
    │   │   ├── DashboardScreen.tsx
    │   │   ├── AseguradosScreen.tsx
    │   │   ├── AseguradoDetailScreen.tsx
    │   │   ├── NuevoAseguradoScreen.tsx
    │   │   ├── PolizasScreen.tsx
    │   │   ├── PolizaDetailScreen.tsx
    │   │   ├── NuevaPolizaScreen.tsx
    │   │   ├── SiniestrosScreen.tsx
    │   │   ├── SiniestroDetailScreen.tsx
    │   │   ├── NuevoSiniestroScreen.tsx
    │   │   ├── ReclamosScreen.tsx
    │   │   ├── ReclamoDetailScreen.tsx
    │   │   └── NuevoReclamoScreen.tsx
    │   └── organizador/         ← organizador-only screens
    │       ├── ProductoresScreen.tsx
    │       ├── CompaniasScreen.tsx
    │       └── ReportesScreen.tsx
    ├── components/
    │   ├── StatusBadge.tsx
    │   ├── ListCard.tsx
    │   ├── LoadingState.tsx
    │   └── ErrorState.tsx
    └── hooks/
        └── useAuth.ts           ← convenience hook for AuthContext
```

---

## Sub-Task 1 — Scaffold `apps/mobile/` in the pnpm workspace

**Status:** [ ] pending

### Intent
Bootstrap a bare Expo project inside `apps/mobile/` and wire it into the existing pnpm workspace so that `@gestion-pas/types` resolves correctly and `pnpm dev` can launch the app.

### Expected Outcomes
- `apps/mobile/package.json` exists with `name: "@gestion-pas/mobile"`, React Native + Expo dependencies, and a `@gestion-pas/types` workspace dependency.
- `apps/mobile/tsconfig.json` is configured with `"moduleResolution": "bundler"` and `"paths"` for `@gestion-pas/types` (needed because Metro does not follow pnpm symlinks by default).
- `apps/mobile/babel.config.js` uses `babel-preset-expo`.
- `apps/mobile/metro.config.js` adds the `packages/` directory to `watchFolders` and maps the workspace package via `resolver.extraNodeModules`.
- `apps/mobile/app.json` has slug `gestion-pas-mobile`, platforms `["ios", "android"]`, and no EAS fields.
- `apps/mobile/index.ts` registers the root component.
- Running `pnpm install` from the repo root resolves `@gestion-pas/types` inside `apps/mobile/node_modules`.

### Todo List
1. Create `apps/mobile/package.json` with name, scripts (`start`, `android`, `ios`), and dependencies: `expo`, `react`, `react-native`, `expo-secure-store`, `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, `react-native-screens`, `react-native-safe-area-context`, `@tanstack/react-query`, `axios`, `react-hook-form`, `@hookform/resolvers`, `zod`, `@expo/vector-icons`, `@gestion-pas/types: workspace:*`.
2. Create `apps/mobile/tsconfig.json` extending `../../tsconfig.json` (if root exists) with `"moduleResolution": "bundler"`, `"jsx": "react-native"`, and path alias for `@gestion-pas/types`.
3. Create `apps/mobile/babel.config.js` with `babel-preset-expo`.
4. Create `apps/mobile/metro.config.js` adding `packages/types` to `watchFolders` and aliasing `@gestion-pas/types` in `resolver.extraNodeModules`.
5. Create `apps/mobile/app.json` with basic Expo config.
6. Create `apps/mobile/index.ts` as entry point.
7. Create `apps/mobile/src/` directory skeleton (empty placeholder files are fine).
8. Run `pnpm install` from repo root; confirm no resolution errors.

### Relevant Context
- `pnpm-workspace.yaml` already declares `apps/*` and `packages/*` — no changes needed there.
- `packages/types/package.json` exports from `src/index.ts` as `@gestion-pas/types`.
- Metro bundler does not follow pnpm symlinks; `watchFolders` + `extraNodeModules` is the standard workaround. See: https://docs.expo.dev/guides/monorepos/
- Expo SDK 52 uses `metro@0.81` — use `@expo/metro-config` for the `getDefaultConfig` helper.
- `@expo/vector-icons` is included with Expo and is needed for bottom-tab icons in Sub-Task 3.

---

## Sub-Task 2 — Auth layer: SecureStore, axios client, AuthContext

**Status:** [ ] pending

### Intent
Implement token storage and the HTTP client so all subsequent screens can make authenticated API calls — exactly mirroring the web's `lib/api.ts` and `context/AuthContext.tsx`, but using `expo-secure-store` instead of `localStorage`.

### Expected Outcomes
- `src/lib/auth.ts` exports `AuthUser` type (same shape as web: `{ id, perfil, aseguradoId, organizadorId }`) plus `getToken`, `setToken`, `removeToken`, `getUser`, `setUser`, `removeUser` using `expo-secure-store`.
- `src/lib/api.ts` exports an `axios` instance with `baseURL` read from `process.env.EXPO_PUBLIC_API_URL` and:
  - Request interceptor: reads token via `SecureStore.getItemAsync('token')` and sets `Authorization: Bearer <token>`.
  - Response interceptor: on 401, clears SecureStore and triggers navigation to the Login screen (via a navigation ref).
- `src/context/AuthContext.tsx` provides `{ user, token, login, logout, isLoading }`. `login()` calls `POST /auth/login`, stores token + user in SecureStore, updates state. `logout()` clears store and state.
- `src/hooks/useAuth.ts` is a thin `useContext(AuthContext)` wrapper.

### Todo List
1. Create `src/lib/auth.ts` with `AuthUser` interface and SecureStore helpers (getToken, setToken, removeToken, getUser, setUser, removeUser).
2. Create a navigation ref file `src/lib/navigationRef.ts` using `React.createRef()` typed for React Navigation's `NavigationContainerRef` — required for the 401 interceptor to redirect without React context.
3. Create `src/lib/api.ts`: axios instance with base URL from `process.env.EXPO_PUBLIC_API_URL` (no hardcoded default — developer must set this in `apps/mobile/.env` to the LAN IP of their machine, e.g., `http://192.168.x.x:3000/api`). Add request interceptor (async SecureStore read) and response interceptor (401 → clear auth + navigate to Login).
4. Create `src/context/AuthContext.tsx` with Provider, initial state hydrated from SecureStore on mount, `login()` and `logout()` actions.
5. Create `src/hooks/useAuth.ts`.
6. Wire `AuthProvider` around the app root in `index.ts` / `src/App.tsx`.

### Relevant Context
- Web equivalent: `apps/web/src/lib/api.ts`, `apps/web/src/lib/auth.ts`, `apps/web/src/context/AuthContext.tsx`.
- Login endpoint: `POST /api/auth/login` → `{ accessToken, perfil, id, aseguradoId, organizadorId }`.
- `expo-secure-store` API is async (`getItemAsync`, `setItemAsync`, `deleteItemAsync`); the request interceptor must `await` it.
- Testing on a **physical device**: the device and the dev machine must be on the same LAN. Set `EXPO_PUBLIC_API_URL=http://<machine-LAN-IP>:3000/api` in `apps/mobile/.env`.
- `UserRole` enum from `@gestion-pas/types` should be used for the `perfil` field type.

---

## Sub-Task 3 — Navigation structure

**Status:** [ ] pending

### Intent
Implement a role-aware navigation tree using React Navigation so the app shows the correct set of screens depending on whether the user is unauthenticated, an `asegurado`, a `productor`, or an `organizador`.

### Expected Outcomes
- App launches and lands on `LoginScreen` when unauthenticated.
- After login, the app navigates to the appropriate tab bar based on role (no flicker of the login screen).
- Each role sees its own bottom-tab set; extra screens (Productores, Compañías, Reportes) are only in the Organizador tabs.
- Stack navigators are nested inside each tab so detail screens (e.g., `AseguradoDetailScreen`) push on top of the list screen.
- The navigation container uses `navigationRef` from Sub-Task 2 so the 401 interceptor can redirect.

### Navigation tree

```
RootNavigator (NavigationContainer, ref=navigationRef)
├── [unauthenticated] AuthStack (NativeStack)
│   └── Login
└── [authenticated] AppTabs (BottomTabs) — rendered per role
    │
    ├── [asegurado]
    │   ├── Tab: Mis Pólizas → PolizasStack (NativeStack)
    │   │   ├── PolizasScreen
    │   │   └── PolizaDetailScreen
    │   ├── Tab: Mis Siniestros → SiniestrosStack
    │   │   ├── SiniestrosScreen
    │   │   └── SiniestroDetailScreen
    │   └── Tab: Mis Reclamos → ReclamosStack
    │       ├── ReclamosScreen
    │       └── ReclamoDetailScreen
    │
    ├── [productor]
    │   ├── Tab: Asegurados → AseguradosStack
    │   │   ├── AseguradosScreen
    │   │   └── AseguradoDetailScreen
    │   ├── Tab: Pólizas → PolizasStack
    │   ├── Tab: Siniestros → SiniestrosStack
    │   └── Tab: Reclamos → ReclamosStack
    │
    └── [organizador]
        ├── Tab: Dashboard → DashboardScreen
        ├── Tab: Asegurados → AseguradosStack
        ├── Tab: Pólizas → PolizasStack
        ├── Tab: Siniestros → SiniestrosStack
        ├── Tab: Reclamos → ReclamosStack
        └── Tab: Más (Drawer or Stack)
            ├── ProductoresScreen
            ├── CompaniasScreen
            └── ReportesScreen
```

> Note: Because tabs beyond 5 become unwieldy, the Organizador's extra screens (Productores, Compañías, Reportes) are grouped under a "Más" tab that opens a simple list/menu screen with `navigation.navigate()` links.

### Todo List
1. Create `src/navigation/RootNavigator.tsx`: reads `user` from `AuthContext`; renders `AuthNavigator` if null, `AppNavigator` if authenticated.
2. Create `src/navigation/AuthNavigator.tsx`: a `createNativeStackNavigator` with a single `Login` screen.
3. Create `src/navigation/stacks/AseguradosStack.tsx`, `PolizasStack.tsx`, `SiniestrosStack.tsx`, `ReclamosStack.tsx` — each a `createNativeStackNavigator` with the list + detail screen pair.
4. Create `src/navigation/AppNavigator.tsx`: a `createBottomTabNavigator`; switches on `user.perfil` to render the correct set of tabs. Import and use Expo vector icons for tab icons.
5. Create `src/navigation/MasNavigator.tsx` (organizador only): a simple stack that shows a menu screen with links to Productores, Compañías, Reportes.
6. Wire `NavigationContainer` with `ref={navigationRef}` in the app root, wrapping `RootNavigator`.
7. Wrap everything in `QueryClientProvider` (from `src/lib/queryClient.ts`) and `AuthProvider`.

### Relevant Context
- Web role mapping: `apps/web/src/App.tsx` (ProtectedRoute) and `apps/web/src/components/AppLayout.tsx` (sidebar nav items per role).
- React Navigation docs: https://reactnavigation.org/docs/getting-started
- `@react-navigation/bottom-tabs`, `@react-navigation/native-stack` are already in the package.json from Sub-Task 1.
- `UserRole` enum values: `"organizador"`, `"productor"`, `"asegurado"` (lowercase strings).

---

## Sub-Task 4 — Auth screen: Login

**Status:** [ ] pending

### Intent
Implement the `LoginScreen` so users can authenticate and be routed to their role-appropriate home screen.

### Expected Outcomes
- `LoginScreen` renders email + password fields.
- On submit, calls `login()` from `AuthContext`; shows a loading indicator while pending.
- On success, `RootNavigator` automatically transitions to `AppNavigator` (no manual navigation needed — reactive to auth state change).
- On error (401 / inactive account), displays an inline error message.
- Password field has a show/hide toggle.

### Todo List
1. Create `src/screens/auth/LoginScreen.tsx` using `react-hook-form` + `zod` schema: `{ email: z.string().email(), password: z.string().min(6) }`.
2. Use `KeyboardAvoidingView` + `ScrollView` for safe keyboard handling on both iOS and Android.
3. Call `useAuth().login(email, password)` on submit; handle loading and error states.
4. Style with React Native `StyleSheet` in the brand palette: dark navy background (`#040a18`), cyan accent (`#00d4ff`).
5. Add logo/branding text ("Gestión PAS") at the top.

### Relevant Context
- Web equivalent: `apps/web/src/pages/LoginPage.tsx`.
- `AuthContext.login()` from Sub-Task 2 calls the API and stores the token.
- No navigation call needed — `RootNavigator` reacts to the auth state.

---

## Sub-Task 5 — Asegurado screens (list + detail + new form)

**Status:** [ ] pending

### Intent
Implement the Asegurados list screen with search and an Asegurado detail screen that links to related pólizas, siniestros, and reclamos.

### Expected Outcomes
- `AseguradosScreen` fetches `GET /asegurados` (filtered for `productor` by their own portfolio; organizational view for `organizador`) and displays a searchable `FlatList`.
- A FAB on `AseguradosScreen` navigates to `NuevoAseguradoScreen`.
- Tapping a row navigates to `AseguradoDetailScreen` passing the `aseguradoId`.
- `AseguradoDetailScreen` fetches `GET /asegurados/:id` and shows the contact info plus summary counts of pólizas/siniestros/reclamos with `TouchableOpacity` rows that navigate to the relevant stack.
- `NuevoAseguradoScreen` has a creation form; on success navigates back and invalidates the asegurados query.
- The `asegurado` role never sees these screens (their data is scoped via the Mis Pólizas/Siniestros/Reclamos tabs).

### Todo List
1. Create `src/screens/shared/AseguradosScreen.tsx`: `useQuery` for `GET /asegurados`, local search state filtering by `nombre` or `dniCuil`, renders a `FlatList` with `ListCard` rows, FAB navigating to `NuevoAseguradoScreen`.
2. Create `src/screens/shared/AseguradoDetailScreen.tsx`: receives `aseguradoId` via route params, `useQuery` for `GET /asegurados/:id`, displays formatted fields, navigates to pólizas/siniestros/reclamos filtered by this asegurado.
3. Create `src/screens/shared/NuevoAseguradoScreen.tsx`: form fields are `nombre`, `dniCuil`, `fechaNacimiento`, `direccion`, `codigoPostal`, `telefono`, `email`, `productorId`. For `productor` role, pre-fill and hide `productorId` using the user's own productor ID (look up from `GET /productores` or store it at login). `POST /asegurados` on submit.
4. Create `src/components/ListCard.tsx`: a reusable card component with title, subtitle, and right-side badge/icon.
5. Create `src/components/LoadingState.tsx` and `src/components/ErrorState.tsx` for consistent empty/error/loading UI.

### Relevant Context
- API endpoints: `GET /api/asegurados`, `GET /api/asegurados/:id`, `POST /api/asegurados`.
- `POST /api/asegurados` fields: `nombre`, `dniCuil`, `fechaNacimiento`, `direccion`, `codigoPostal`, `telefono`, `email`, `productorId`.
- For `productor` role the API already filters by their portfolio (backend guard/service).
- Web equivalent: `apps/web/src/pages/AseguradosPage.tsx`, `AseguradoDetailPage.tsx`.
- Asegurado fields: `nombre`, `dniCuil`, `email`, `telefono`, `direccion`, `productor`.
- `NuevoAseguradoScreen` is only shown to `productor` and `organizador` roles (hide FAB for `asegurado`).

---

## Sub-Task 6 — Pólizas screens (list + detail + new form)

**Status:** [ ] pending

### Intent
Display the policy list for the authenticated user's scope, a detail view showing installment status and endorsements, and a creation form for `productor`/`organizador`.

### Expected Outcomes
- `PolizasScreen` fetches `GET /polizas` and displays cards with policy number, status badge, validity dates, and premium amount.
- A FAB on `PolizasScreen` navigates to `NuevaPolizaScreen` (visible to `productor` and `organizador` only).
- For `asegurado` role, the endpoint returns only their own policies (FAB hidden).
- `PolizaDetailScreen` shows full policy data, endorsements (`GET /polizas/:id/endosos`), and cuotas summary.
- `NuevaPolizaScreen` has a creation form with all required fields; on success navigates back.
- `StatusBadge` component used for `EstadoPoliza` colour coding (activa/suspendida/anulada).

### Todo List
1. Create `src/screens/shared/PolizasScreen.tsx` with `FlatList` + `useQuery` for `GET /polizas`, FAB for `productor`/`organizador`.
2. Create `src/screens/shared/PolizaDetailScreen.tsx` with accordion sections for: Datos generales, Endosos, Cuotas.
3. Create `src/screens/shared/NuevaPolizaScreen.tsx`: fields are `numeroPoliza`, `vigenciaInicio` (date picker), `vigenciaFin` (date picker), `importeCuotaVigente` (numeric), `modalidadPago`, `estado` (picker, default ACTIVA), `periodicidadRefacturacion` (picker), `aseguradoId` (searchable picker), `bienId` (picker filtered by asegurado), `productorId` (pre-filled for `productor` role), `companiaId` (picker). `POST /polizas` on submit.
4. Create `src/components/StatusBadge.tsx`: maps `EstadoPoliza`, `EstadoSiniestro`, `EstadoReclamo`, `EstadoCuota` to colours and labels.
5. Use enums from `@gestion-pas/types` for all picker values.

### Relevant Context
- Web equivalent: `apps/web/src/pages/PolizasPage.tsx`.
- `EstadoPoliza`: ACTIVA (green), SUSPENDIDA (yellow), ANULADA (red).
- Endpoints: `GET /api/polizas`, `GET /api/polizas/:id`, `POST /api/polizas`, `GET /api/polizas/:id/endosos`.
- `POST /api/polizas` fields: `numeroPoliza`, `vigenciaInicio`, `vigenciaFin`, `importeCuotaVigente`, `modalidadPago`, `estado`, `periodicidadRefacturacion`, `aseguradoId`, `bienId`, `productorId`, `companiaId`.
- Cuotas endpoint: `GET /api/cuotas?polizaId=:id`.
- `PeriodicidadRefacturacion` enum from `@gestion-pas/types`: MENSUAL, TRIMESTRAL, SEMESTRAL, ANUAL.

---

## Sub-Task 7 — Siniestros screens + new siniestro form

**Status:** [ ] pending

### Intent
Allow users to view their claims and file new ones from mobile — the most common field action for an insured party or producer.

### Expected Outcomes
- `SiniestrosScreen` lists claims with type, date, location snippet, and status badge; `FlatList` with filter by `estado`.
- `SiniestroDetailScreen` shows all siniestro fields.
- A floating action button (FAB) on `SiniestrosScreen` opens `NuevoSiniestroScreen`.
- `NuevoSiniestroScreen` has a form: tipo (picker), fechaOcurrencia (date picker), lugarOcurrencia (text), relato (multiline), datosTerceros (multiline), aseguradoId (if productor/organizador — searchable picker), bienId (picker filtered by asegurado).
- On submit, calls `POST /siniestros` and invalidates the siniestros query.

### Todo List
1. Create `src/screens/shared/SiniestrosScreen.tsx` with `FlatList`, status filter tabs, and a FAB navigating to `NuevoSiniestroScreen`.
2. Create `src/screens/shared/SiniestroDetailScreen.tsx`.
3. Create `src/screens/shared/NuevoSiniestroScreen.tsx` using `react-hook-form` + `zod`. Fields: `tipo` (enum picker from `TipoSiniestro`), `fechaOcurrencia` (date picker), `horaOcurrencia` (time input, optional), `lugarOcurrencia` (text), `relato` (multiline), `datosTerceros` (multiline, optional), `numeroDenunciaCompania` (text, optional), `aseguradoId` (searchable picker — only visible for productor/organizador), `bienId` (picker filtered by asegurado), `productorId` (pre-filled for productor role), `companiaId` (picker).
4. On `asegurado` role, pre-fill and hide `aseguradoId` from `user.aseguradoId` (from AuthContext).
5. Use `useMutation` for the `POST /siniestros` call; navigate back on success and invalidate the siniestros query.
6. Add `NuevoSiniestroScreen` to `SiniestrosStack` in Sub-Task 3 stacks.

### Relevant Context
- Web equivalent: `apps/web/src/pages/SiniestrosPage.tsx`.
- `TipoSiniestro` enum from `@gestion-pas/types`: COLISION, ROBO_TOTAL, ROBO_AUTOPARTES, HOGAR, VIDA, OTRO.
- `EstadoSiniestro`: ABIERTO, EN_GESTION, RESUELTO, RECHAZADO.
- `POST /api/siniestros` fields: `tipo`, `fechaOcurrencia`, `horaOcurrencia`, `lugarOcurrencia`, `relato`, `datosTerceros`, `numeroDenunciaCompania`, `aseguradoId`, `bienId`, `productorId`, `companiaId`.
- Asegurado ID for the `asegurado` role is in `AuthContext.user.aseguradoId`.
- Bienes for a given asegurado: `GET /api/bienes/asegurado/:aseguradoId`.

---

## Sub-Task 8 — Reclamos screens + new reclamo form

**Status:** [ ] pending

### Intent
Allow users to view and file complaints (reclamos) from mobile.

### Expected Outcomes
- `ReclamosScreen` lists reclamos with type, opening date, and status badge.
- `ReclamoDetailScreen` shows full reclamo data.
- A FAB opens `NuevoReclamoScreen` with tipo picker, descripcion textarea, aseguradoId (productor/organizador), companiaId (optional picker).
- On submit, calls `POST /reclamos` and invalidates query.

### Todo List
1. Create `src/screens/shared/ReclamosScreen.tsx` with `FlatList`, status filter, and FAB.
2. Create `src/screens/shared/ReclamoDetailScreen.tsx`.
3. Create `src/screens/shared/NuevoReclamoScreen.tsx`: fields are `tipo` (picker from `TipoReclamo`), `descripcion` (multiline), `fechaApertura` (date picker, defaults to today), `aseguradoId` (picker — hidden for `asegurado` role), `productorId` (pre-filled for `productor` role), `companiaId` (optional picker).
4. Pre-fill and hide `aseguradoId` for `asegurado` role from `AuthContext.user.aseguradoId`.
5. Use `useMutation` for `POST /reclamos`; navigate back and invalidate query on success.
6. Add `NuevoReclamoScreen` to `ReclamosStack`.

### Relevant Context
- Web equivalent: `apps/web/src/pages/ReclamosPage.tsx`.
- `TipoReclamo` enum: FACTURACION, COBERTURA, ADMINISTRATIVO, OTRO.
- `EstadoReclamo`: ABIERTO, EN_GESTION, RESUELTO.
- `POST /api/reclamos` fields: `tipo`, `descripcion`, `fechaApertura`, `aseguradoId`, `productorId`, `companiaId`.
- Compañías list: `GET /api/companias`.

---

## Sub-Task 9 — Organizador-only screens: Productores, Compañías, Reportes

**Status:** [ ] pending

### Intent
Implement the three screens for `organizador` (and Reportes also for `productor`): a producer directory, an insurance company directory, and a Reportes dashboard built from the seven reportes sub-endpoints.

### Expected Outcomes
- `ProductoresScreen`: `FlatList` with name, license number, and active status. Read-only on mobile.
- `CompaniasScreen`: `FlatList` with company name, CUIT, phone. Read-only on mobile.
- `ReportesScreen`: a scrollable screen with named sections, one per reportes endpoint:
  - **Cartera de asegurados** — `GET /reportes/cartera-asegurados` — count card + list
  - **Vencimientos próximos** — `GET /reportes/vencimientos-proximos?dias=30` — list of upcoming cuotas
  - **Siniestros** — `GET /reportes/siniestros` — count by estado
  - **Reclamos** — `GET /reportes/reclamos` — count by estado
  - **Pólizas** — `GET /reportes/polizas` — count by estado + expiring soon (`vencenEnDias=30`)
  - **Comisiones** — `GET /reportes/comisiones` — per-producer summary (shown only for `organizador`)
  - **Datos incompletos** — `GET /reportes/datos-incompletos` — bienes with missing fields
- Productores and Companias screens are guarded to `organizador` only. Reportes is accessible to both `organizador` and `productor` (backend already enforces this with `@Roles(ORGANIZADOR, PRODUCTOR)`).
- "Más" tab is therefore visible to both `productor` (Reportes only) and `organizador` (all three screens).

### Todo List
1. Create `src/screens/organizador/ProductoresScreen.tsx` with `FlatList` + `useQuery` for `GET /productores`.
2. Create `src/screens/organizador/CompaniasScreen.tsx` with `FlatList` + `useQuery` for `GET /companias`.
3. Create `src/screens/organizador/ReportesScreen.tsx`: use multiple `useQuery` calls — one per reportes sub-endpoint above. Render each as a named section. Omit the Comisiones section if `user.perfil === 'productor'`.
4. Update `MasNavigator.tsx` (Sub-Task 3) to show Productores and Companias only for `organizador`; Reportes for both roles.
5. Add a role guard on `ProductoresScreen` and `CompaniasScreen`: if `user.perfil !== 'organizador'`, render `ErrorState` with "Acceso no autorizado".

### Relevant Context
- Web equivalent: `apps/web/src/pages/ProductoresPage.tsx`, `CompaniasPage.tsx`, `ReportesPage.tsx`.
- Reportes sub-endpoints (confirmed from `apps/api/src/reportes/reportes.controller.ts`):
  - `GET /api/reportes/cartera-asegurados`
  - `GET /api/reportes/vencimientos-proximos?dias=30`
  - `GET /api/reportes/siniestros?estado=...`
  - `GET /api/reportes/reclamos?estado=...&tipo=...&companiaId=...`
  - `GET /api/reportes/polizas?estado=...&vencenEnDias=...`
  - `GET /api/reportes/comisiones`
  - `GET /api/reportes/datos-incompletos`
- `@Roles(UserRole.ORGANIZADOR, UserRole.PRODUCTOR)` guards the entire reportes controller.

---

## Sub-Task 10 — Dashboard screen (Organizador only)

**Status:** [ ] pending

### Intent
Implement a home dashboard for the `organizador` role showing a quick portfolio summary. The `productor` role's first tab is Asegurados (their primary workflow) — they do not get a Dashboard tab.

### Expected Outcomes
- `DashboardScreen` shows 4 metric cards:
  - Total asegurados en cartera (`GET /reportes/cartera-asegurados` → count)
  - Pólizas activas (`GET /reportes/polizas?estado=activa` → count)
  - Siniestros abiertos (`GET /reportes/siniestros?estado=abierto` → count)
  - Reclamos abiertos (`GET /reportes/reclamos?estado=abierto` → count)
- A "Próximos vencimientos" section lists the first 5 results from `GET /reportes/vencimientos-proximos?dias=30`.
- Loading skeleton shown during fetch.
- Only rendered in the Organizador tab set (Sub-Task 3).

### Todo List
1. Create `src/screens/shared/DashboardScreen.tsx` with 4 metric cards and a vencimientos list.
2. Use 5 parallel `useQuery` calls (one per reportes sub-endpoint needed).
3. Create a reusable `MetricCard` sub-component inside the same file (or `src/components/MetricCard.tsx`).
4. Show a `LoadingState` while any query is loading.

### Relevant Context
- Web equivalent: `apps/web/src/pages/DashboardPage.tsx`.
- Exact reportes sub-endpoints to use: `/reportes/cartera-asegurados`, `/reportes/polizas?estado=activa`, `/reportes/siniestros?estado=abierto`, `/reportes/reclamos?estado=abierto`, `/reportes/vencimientos-proximos?dias=30`.
- Dashboard tab is `organizador`-only in the navigation tree (Sub-Task 3).

---

## Cross-Cutting Notes

### pnpm workspace resolution
`apps/mobile/package.json` must list `"@gestion-pas/types": "workspace:*"` as a dependency. Metro requires explicit `watchFolders` and `extraNodeModules` because it does not follow symlinks.

### API base URL
Use `EXPO_PUBLIC_API_URL` in a `.env` file at `apps/mobile/.env`. Since testing is on a **physical device**, the device and the dev machine must be on the same LAN:
```
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api
```
The developer must update this to their actual machine LAN IP (find it with `ifconfig` / `ipconfig`). Add `apps/mobile/.env` to `.gitignore` and commit a `apps/mobile/.env.example` with the placeholder value.

### CORS on the API
The backend currently allows all origins in development (`CORS: true` in dev). No change needed for local development. For production/staging, add the Expo Go / app origin to `FRONTEND_URL`.

### Token storage
`expo-secure-store` stores values in the device keychain (iOS) / Keystore (Android). Values are strings — serialize the `AuthUser` object via `JSON.stringify`.

### Role filtering
The API already enforces role-based access on the backend. The frontend role checks are purely for UX (showing/hiding tabs). Trust the API responses; do not duplicate business logic in the mobile app.

### Shared format utilities
`apps/web/src/lib/format.ts` contains `formatDate`, `formatMoney`, etc. Copy or re-implement the same functions in `src/lib/format.ts` (React Native has no `window` or `Intl.DateTimeFormat` issues, so the same code works).
