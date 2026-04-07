@echo off
echo 🚀 Deploy da Edge Function - SERVICE_ROLE_KEY Fix
echo =================================================
echo.

REM Verificar se Supabase CLI está instalado
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI não está instalado
    echo.
    echo Instale com:
    echo   npm install -g supabase
    echo.
    pause
    exit /b 1
)

echo ✅ Supabase CLI encontrado
echo.

REM Login
echo 📝 Fazendo login no Supabase...
call supabase login

if %errorlevel% neq 0 (
    echo ❌ Erro ao fazer login
    pause
    exit /b 1
)

echo ✅ Login realizado com sucesso
echo.

REM Link ao projeto
echo 🔗 Conectando ao projeto nbelraenzoprsskjnvpc...
call supabase link --project-ref nbelraenzoprsskjnvpc

if %errorlevel% neq 0 (
    echo ❌ Erro ao conectar ao projeto
    pause
    exit /b 1
)

echo ✅ Conectado ao projeto
echo.

REM Verificar segredos
echo 🔐 Verificando segredos configurados...
echo.
call supabase secrets list
echo.

echo ⚠️  Certifique-se de que SERVICE_ROLE_KEY está na lista acima
echo.
pause

REM Deploy
echo 🚀 Fazendo deploy da Edge Function 'server'...
echo.
call supabase functions deploy server --project-ref nbelraenzoprsskjnvpc

if %errorlevel% neq 0 (
    echo ❌ Erro ao fazer deploy
    pause
    exit /b 1
)

echo.
echo ✅ Deploy concluído com sucesso!
echo.

REM Verificar logs
echo 📊 Verificando logs (últimas 20 linhas)...
echo.
call supabase functions logs server --project-ref nbelraenzoprsskjnvpc --tail 20

echo.
echo =================================================
echo 🎉 Deploy Finalizado!
echo =================================================
echo.
echo Próximos passos:
echo 1. Teste o health check:
echo    curl https://nbelraenzoprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/health
echo.
echo 2. Verifique se hasServiceKey: true
echo    curl https://nbelraenzoprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/health/detailed
echo.
echo 3. Teste o cadastro de clientes no portal
echo.
pause
