@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1

:: ═══════════════════════════════════════════════════════════════
::  Gestión PAS — Setup Windows
::  Instala dependencias, levanta la base de datos, corre
::  migraciones, seed y arranca la app completa.
::  También abre el puerto 5173 en el Firewall de Windows para
::  acceso desde otras PCs de la misma red.
:: ═══════════════════════════════════════════════════════════════

set "ROOT=%~dp0"
cd /d "%ROOT%"

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║         Gestión PAS — Setup              ║
echo  ╚══════════════════════════════════════════╝
echo.

:: ────────────────────────────────────────────────────────────────
:: 1. Verificar Node >= 20
:: ────────────────────────────────────────────────────────────────
echo [1/7] Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERROR: Node.js no encontrado.
    echo  Descargalo desde https://nodejs.org  ^(version 20 o superior^)
    echo.
    pause & exit /b 1
)
for /f "tokens=1 delims=v" %%v in ('node -v') do set NODE_VER=%%v
for /f "tokens=1 delims=." %%m in ('node -v ^| findstr /r "[0-9]"') do set NODE_MAJOR=%%m
node -e "if(parseInt(process.version.slice(1)) < 20){process.exit(1)}" >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Se requiere Node.js 20 o superior.
    echo  Version actual: %NODE_VER%
    echo  Descargalo desde https://nodejs.org
    echo.
    pause & exit /b 1
)
echo  OK — Node.js %NODE_VER%

:: ────────────────────────────────────────────────────────────────
:: 2. Verificar / instalar pnpm
:: ────────────────────────────────────────────────────────────────
echo.
echo [2/7] Verificando pnpm...
where pnpm >nul 2>&1
if errorlevel 1 (
    echo  pnpm no encontrado — instalando via corepack...
    corepack enable >nul 2>&1
    corepack prepare pnpm@11.17.0 --activate >nul 2>&1
    where pnpm >nul 2>&1
    if errorlevel 1 (
        echo  Intentando con npm install -g pnpm...
        npm install -g pnpm >nul 2>&1
    )
)
where pnpm >nul 2>&1
if errorlevel 1 (
    echo  ERROR: No se pudo instalar pnpm.
    echo  Instalalo manualmente: npm install -g pnpm
    echo.
    pause & exit /b 1
)
for /f %%v in ('pnpm -v') do set PNPM_VER=%%v
echo  OK — pnpm %PNPM_VER%

:: ────────────────────────────────────────────────────────────────
:: 3. Verificar Docker Desktop
:: ────────────────────────────────────────────────────────────────
echo.
echo [3/7] Verificando Docker...
where docker >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERROR: Docker no encontrado.
    echo  Descargalo desde https://www.docker.com/products/docker-desktop
    echo  Instala Docker Desktop y volvé a ejecutar este script.
    echo.
    pause & exit /b 1
)
docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERROR: Docker no esta corriendo.
    echo  Abrí Docker Desktop y esperá a que inicie completamente.
    echo  Luego volvé a ejecutar este script.
    echo.
    pause & exit /b 1
)
for /f %%v in ('docker -v ^| findstr /r "[0-9][0-9]*\.[0-9]"') do set DOCKER_VER=%%v
echo  OK — Docker disponible

:: ────────────────────────────────────────────────────────────────
:: 4. Crear .env si no existe
:: ────────────────────────────────────────────────────────────────
echo.
echo [4/7] Configurando variables de entorno...
if not exist "apps\api\.env" (
    copy "apps\api\.env.example" "apps\api\.env" >nul
    echo  Creado apps\api\.env a partir de .env.example
    echo  ^(Podés editarlo luego si necesitas cambiar puertos o secretos^)
) else (
    echo  OK — apps\api\.env ya existe
)

:: ────────────────────────────────────────────────────────────────
:: 5. Instalar dependencias
:: ────────────────────────────────────────────────────────────────
echo.
echo [5/7] Instalando dependencias (pnpm install)...
pnpm install
if errorlevel 1 (
    echo.
    echo  ERROR: pnpm install fallo.
    echo  Revisá que tengas conexion a internet y volvé a intentar.
    echo.
    pause & exit /b 1
)
echo  OK — Dependencias instaladas

:: ────────────────────────────────────────────────────────────────
:: 6. Levantar Postgres con Docker
:: ────────────────────────────────────────────────────────────────
echo.
echo [6/7] Levantando base de datos PostgreSQL...

:: Si el contenedor ya existe y está corriendo, no hacer nada
docker ps --filter "name=gestion_pas_db" --filter "status=running" | findstr "gestion_pas_db" >nul 2>&1
if not errorlevel 1 (
    echo  OK — Postgres ya esta corriendo
    goto :migrations
)

:: Si existe pero está parado, levantarlo
docker ps -a --filter "name=gestion_pas_db" | findstr "gestion_pas_db" >nul 2>&1
if not errorlevel 1 (
    echo  Reiniciando contenedor existente...
    docker start gestion_pas_db >nul
) else (
    echo  Creando contenedor Postgres...
    docker compose up -d postgres
    if errorlevel 1 (
        echo.
        echo  ERROR: No se pudo levantar Postgres con docker compose.
        echo  Asegurate de estar en la carpeta raiz del proyecto y que Docker este corriendo.
        echo.
        pause & exit /b 1
    )
)

:: Esperar a que Postgres acepte conexiones
echo  Esperando que Postgres este listo...
set /a RETRIES=0
:wait_pg
set /a RETRIES+=1
if %RETRIES% gtr 30 (
    echo  ERROR: Postgres no respondio despues de 30 intentos.
    pause & exit /b 1
)
docker exec gestion_pas_db pg_isready -U gestion_pas -d gestion_pas >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto :wait_pg
)
echo  OK — Postgres listo

:: ────────────────────────────────────────────────────────────────
:: 7. Migraciones y seed
:: ────────────────────────────────────────────────────────────────
:migrations
echo.
echo [6b] Abriendo puerto 5173 en el Firewall de Windows (LAN)...
netsh advfirewall firewall show rule name="GestionPAS-Frontend" >nul 2>&1
if errorlevel 1 (
    netsh advfirewall firewall add rule name="GestionPAS-Frontend" protocol=TCP dir=in localport=5173 action=allow >nul 2>&1
    if not errorlevel 1 (
        echo  OK — Regla de firewall creada para el puerto 5173
    ) else (
        echo  ADVERTENCIA: No se pudo crear la regla de firewall ^(ejecuta el script como Administrador^)
    )
) else (
    echo  OK — Regla de firewall ya existe
)

echo.
echo [7/7] Corriendo migraciones y seed...

cd apps\api

echo  Ejecutando migraciones...
pnpm migration:run
if errorlevel 1 (
    echo.
    echo  ERROR: Las migraciones fallaron.
    echo  Revisá los errores de arriba. Si es la primera vez, puede que la DB no esté lista.
    echo  Esperá unos segundos y volvé a ejecutar el script.
    echo.
    cd /d "%ROOT%"
    pause & exit /b 1
)
echo  OK — Migraciones aplicadas

echo  Ejecutando seed de datos...
pnpm seed
if errorlevel 1 (
    echo.
    echo  ADVERTENCIA: El seed fallo — puede que los datos ya existan.
    echo  Esto es normal si ya corriste el setup antes. Continuando...
    echo.
)
echo  OK — Seed completado

cd /d "%ROOT%"

:: ════════════════════════════════════════════════════════════════
::  LISTO — mostrar resumen y arrancar
:: ════════════════════════════════════════════════════════════════
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   Setup completo. Arrancando la app...   ║
echo  ╚══════════════════════════════════════════╝
echo.
echo  La app va a estar disponible en:
echo.
:: Obtener IP de red local (primera IPv4 que no sea 127.x)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r "IPv4.*192\." 2^>nul') do (
  set LOCAL_IP=%%a
  goto :got_ip
)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r "IPv4.*10\." 2^>nul') do (
  set LOCAL_IP=%%a
  goto :got_ip
)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r "IPv4.*172\." 2^>nul') do (
  set LOCAL_IP=%%a
  goto :got_ip
)
set LOCAL_IP= (ejecuta ipconfig para encontrar tu IP)
:got_ip
set LOCAL_IP=%LOCAL_IP: =%

echo    Esta PC:
echo      Frontend  →  http://localhost:5173
echo      API       →  http://localhost:3000/api
echo      Swagger   →  http://localhost:3000/api/docs
echo.
echo    Desde otra PC en la misma red:
echo      Frontend  →  http://%LOCAL_IP%:5173
echo.
echo  Credenciales de acceso:
echo    Organizador  →  florencia@gestionpas.com.ar / admin1234
echo    Asegurado    →  carlos@gestionpas.com.ar / cliente1234
echo.
echo  Presiona Ctrl+C para detener los servidores.
echo  ─────────────────────────────────────────────
echo.

pnpm dev

endlocal
