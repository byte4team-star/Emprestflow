@echo off
REM 🚀 Script de Deploy - Correção de Parcelas e Datas (Windows)
REM Data: 28/03/2026

echo ==================================================
echo 🔧 DEPLOY DA CORREÇÃO - Sistema de Cobrança
echo ==================================================
echo.

REM Verificar se Supabase CLI está instalado
where supabase >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Supabase CLI não encontrado!
    echo.
    echo 📥 Instalando Supabase CLI...
    call npm install -g supabase
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ Erro ao instalar Supabase CLI
        echo.
        echo Tente manualmente:
        echo   npm install -g supabase
        echo.
        pause
        exit /b 1
    )
    
    echo ✅ Supabase CLI instalado com sucesso!
    echo.
)

echo ✅ Supabase CLI encontrado
echo.

REM Verificar se está logado
echo 🔐 Verificando autenticação...
supabase projects list >nul 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Você não está logado no Supabase
    echo.
    echo Executando login...
    call supabase login
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ Erro no login
        echo.
        echo Tente manualmente:
        echo   supabase login
        echo.
        pause
        exit /b 1
    )
)

echo ✅ Autenticado no Supabase
echo.

REM Verificar se o projeto está linkado
echo 🔗 Verificando link do projeto...

if not exist ".supabase\config.toml" (
    echo ⚠️  Projeto não está linkado
    echo.
    echo Por favor, informe o PROJECT_REF (Reference ID):
    echo Encontre em: https://supabase.com/dashboard → Settings → General
    echo.
    set /p project_ref="PROJECT_REF: "
    
    if "%project_ref%"=="" (
        echo.
        echo ❌ PROJECT_REF não pode estar vazio
        pause
        exit /b 1
    )
    
    echo.
    echo 🔗 Linkando projeto...
    call supabase link --project-ref "%project_ref%"
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ Erro ao linkar projeto
        pause
        exit /b 1
    )
    
    echo ✅ Projeto linkado com sucesso!
    echo.
)

echo ✅ Projeto linkado
echo.

REM Verificar se a pasta de functions existe
if not exist "supabase\functions\server" (
    echo ❌ Pasta supabase\functions\server não encontrada!
    echo.
    echo Certifique-se de estar na raiz do projeto
    pause
    exit /b 1
)

echo 📁 Estrutura de pastas verificada
echo.

REM Fazer o deploy
echo 🚀 Iniciando deploy da Edge Function...
echo.
echo Função: server
echo Arquivo: supabase\functions\server\index.tsx
echo.

call supabase functions deploy server

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Erro no deploy!
    echo.
    echo Tente manualmente:
    echo   supabase functions deploy server
    echo.
    pause
    exit /b 1
)

echo.
echo ==================================================
echo ✅ DEPLOY CONCLUÍDO COM SUCESSO!
echo ==================================================
echo.
echo 📋 Correções Aplicadas:
echo   ✅ Valores de parcelas calculados corretamente
echo   ✅ Datas sem problema de timezone
echo   ✅ Arredondamento para 2 casas decimais
echo.
echo 🧪 Próximos Passos:
echo   1. Aguarde 1-2 minutos para propagação
echo   2. Limpe o cache do navegador (Ctrl+Shift+R)
echo   3. Teste criando um novo contrato
echo.
echo 📊 Teste com:
echo   - Valor: R$ 20.000,00
echo   - Parcelas: 10
echo   - Data: 30/03/2026
echo   - Taxa: 25%
echo.
echo ✅ Resultado esperado:
echo   - Parcela: R$ 2.500,00
echo   - Datas: 30/03, 30/04, 30/05...
echo.
echo ==================================================
echo.
pause
