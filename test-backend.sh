#!/bin/bash

# Script de Diagnóstico do Backend
# Execute: bash test-backend.sh

echo "🔍 DIAGNÓSTICO DO BACKEND - Sistema de Cobrança"
echo "================================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Teste 1: Verificar se Supabase CLI está instalado
echo "📦 Teste 1: Verificando Supabase CLI..."
if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✅ Supabase CLI instalado${NC}"
    supabase --version
else
    echo -e "${RED}❌ Supabase CLI não encontrado${NC}"
    echo "   Instale com: npm install -g supabase"
    exit 1
fi
echo ""

# Teste 2: Verificar se está logado
echo "🔐 Teste 2: Verificando login..."
if supabase projects list &> /dev/null; then
    echo -e "${GREEN}✅ Logado no Supabase${NC}"
else
    echo -e "${RED}❌ Não está logado${NC}"
    echo "   Execute: supabase login"
    exit 1
fi
echo ""

# Teste 3: Verificar projeto linkado
echo "🔗 Teste 3: Verificando projeto linkado..."
if supabase status &> /dev/null; then
    echo -e "${GREEN}✅ Projeto linkado${NC}"
    PROJECT_REF=$(supabase status | grep "Project ref:" | awk '{print $3}')
    echo "   Project ID: $PROJECT_REF"
else
    echo -e "${RED}❌ Projeto não linkado${NC}"
    echo "   Execute: supabase link --project-ref SEU_PROJECT_ID"
    exit 1
fi
echo ""

# Teste 4: Listar funções
echo "📋 Teste 4: Verificando Edge Functions..."
FUNCTIONS=$(supabase functions list 2>&1)
if echo "$FUNCTIONS" | grep -q "server"; then
    echo -e "${GREEN}✅ Edge Function 'server' encontrada${NC}"
else
    echo -e "${RED}❌ Edge Function 'server' NÃO encontrada${NC}"
    echo "   Execute: supabase functions deploy server"
    exit 1
fi
echo ""

# Teste 5: Verificar logs recentes
echo "📝 Teste 5: Verificando logs recentes..."
echo "   Últimas 10 linhas de log:"
echo "   ========================"
supabase functions logs server --limit 10 2>&1 | sed 's/^/   /'
echo ""

# Teste 6: Pedir PROJECT_ID e ANON_KEY para teste HTTP
echo "🌐 Teste 6: Teste de conectividade HTTP"
echo "   Para este teste, precisamos de:"
echo "   1. PROJECT_ID (você já viu acima)"
echo "   2. ANON_KEY (Dashboard → Settings → API → anon public)"
echo ""

read -p "Digite seu PROJECT_ID: " USER_PROJECT_ID
echo ""
read -p "Digite sua ANON_KEY: " USER_ANON_KEY
echo ""

if [ -z "$USER_PROJECT_ID" ] || [ -z "$USER_ANON_KEY" ]; then
    echo -e "${YELLOW}⚠️  Pulando teste HTTP (credenciais não fornecidas)${NC}"
else
    echo "   Testando health endpoint..."
    HEALTH_URL="https://${USER_PROJECT_ID}.supabase.co/functions/v1/make-server-bd42bc02/health"

    HTTP_RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL" \
        -H "Authorization: Bearer $USER_ANON_KEY")

    HTTP_BODY=$(echo "$HTTP_RESPONSE" | head -n -1)
    HTTP_CODE=$(echo "$HTTP_RESPONSE" | tail -n 1)

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Backend respondendo corretamente (HTTP 200)${NC}"
        echo "   Resposta: $HTTP_BODY"
    else
        echo -e "${RED}❌ Backend retornou HTTP $HTTP_CODE${NC}"
        echo "   Resposta: $HTTP_BODY"
        echo ""
        echo "   Possíveis causas:"
        echo "   - 404: Função não deployada ou nome incorreto"
        echo "   - 500: Erro na função (veja logs acima)"
        echo "   - 403: ANON_KEY incorreta"
    fi
fi
echo ""

# Resumo
echo "================================================"
echo "📊 RESUMO DO DIAGNÓSTICO"
echo "================================================"
echo ""
echo "Se todos os testes passaram (✅), seu backend está funcionando!"
echo ""
echo "Se algum teste falhou (❌):"
echo "1. Siga as instruções de correção indicadas"
echo "2. Execute este script novamente"
echo "3. Ou leia: DIAGNOSTICO_BACKEND.md"
echo ""
echo "💡 Próximos passos se tudo estiver OK:"
echo "   - Abra a aplicação no navegador"
echo "   - Pressione F12 (DevTools)"
echo "   - Tente alterar sua senha"
echo "   - Verifique os logs no Console"
echo ""
