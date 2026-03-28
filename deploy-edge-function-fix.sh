#!/bin/bash

# ========================================
# SCRIPT DE DEPLOY DA EDGE FUNCTION
# Versão: 1.0
# Data: 28/03/2026
# ========================================

set -e  # Exit on error

echo "🚀 DEPLOY DA EDGE FUNCTION COM CORREÇÕES"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
PROJECT_REF="nbelraenszprsskjnvpc"
FUNCTION_NAME="make-server-bd42bc02"
SOURCE_DIR="supabase/functions/server"
TARGET_DIR="supabase/functions/${FUNCTION_NAME}"

echo -e "${BLUE}📋 Configurações:${NC}"
echo "   Project: ${PROJECT_REF}"
echo "   Function: ${FUNCTION_NAME}"
echo "   Source: ${SOURCE_DIR}"
echo "   Target: ${TARGET_DIR}"
echo ""

# Verificar se a pasta source existe
if [ ! -d "${SOURCE_DIR}" ]; then
    echo -e "${RED}❌ Erro: Pasta ${SOURCE_DIR} não encontrada!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pasta source encontrada${NC}"
echo ""

# Verificar se os arquivos necessários existem
REQUIRED_FILES=("index.tsx" "billing_routes.tsx" "client_portal_routes.tsx" "health.tsx" "kv_store.tsx")

echo -e "${BLUE}🔍 Verificando arquivos necessários:${NC}"
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "${SOURCE_DIR}/${file}" ]; then
        echo -e "   ${GREEN}✅${NC} ${file}"
    else
        echo -e "   ${RED}❌${NC} ${file} - FALTANDO!"
        exit 1
    fi
done
echo ""

# Criar pasta target se não existir
if [ ! -d "${TARGET_DIR}" ]; then
    echo -e "${YELLOW}📁 Criando pasta ${TARGET_DIR}...${NC}"
    mkdir -p "${TARGET_DIR}"
fi

# Copiar arquivos
echo -e "${BLUE}📦 Copiando arquivos...${NC}"
for file in "${REQUIRED_FILES[@]}"; do
    echo "   Copiando ${file}..."
    cp "${SOURCE_DIR}/${file}" "${TARGET_DIR}/${file}"
done
echo -e "${GREEN}✅ Arquivos copiados com sucesso!${NC}"
echo ""

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI não encontrado${NC}"
    echo ""
    echo "Para instalar:"
    echo "   npm install -g supabase"
    echo ""
    echo "Ou faça deploy manual via Dashboard:"
    echo "   https://supabase.com/dashboard/project/${PROJECT_REF}/functions"
    echo ""
    exit 0
fi

echo -e "${GREEN}✅ Supabase CLI encontrado${NC}"
echo ""

# Perguntar se deseja fazer deploy
echo -e "${YELLOW}Deseja fazer deploy agora? (y/n)${NC}"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo -e "${BLUE}🚀 Fazendo deploy da função...${NC}"
    
    # Fazer login (se necessário)
    echo "Verificando autenticação..."
    if ! supabase projects list &> /dev/null; then
        echo -e "${YELLOW}⚠️  Não autenticado. Fazendo login...${NC}"
        supabase login
    fi
    
    # Link com o projeto (se necessário)
    echo "Verificando link com o projeto..."
    if ! supabase status &> /dev/null; then
        echo -e "${YELLOW}⚠️  Fazendo link com o projeto...${NC}"
        supabase link --project-ref "${PROJECT_REF}"
    fi
    
    # Deploy
    echo ""
    echo -e "${BLUE}📤 Fazendo deploy da função ${FUNCTION_NAME}...${NC}"
    cd supabase/functions
    supabase functions deploy "${FUNCTION_NAME}" --project-ref "${PROJECT_REF}"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}✅ DEPLOY REALIZADO COM SUCESSO!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        echo -e "${BLUE}🧪 Testando a função:${NC}"
        echo ""
        
        # Teste de health check
        FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}/health"
        echo "   Endpoint: ${FUNCTION_URL}"
        echo ""
        
        response=$(curl -s "${FUNCTION_URL}")
        echo "   Resposta: ${response}"
        echo ""
        
        # Verificar versão
        version=$(echo "${response}" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
        if [ "${version}" == "2.2.0" ]; then
            echo -e "${GREEN}✅ Versão 2.2.0 confirmada!${NC}"
        else
            echo -e "${YELLOW}⚠️  Versão retornada: ${version}${NC}"
        fi
        
        echo ""
        echo -e "${BLUE}📋 Próximos passos:${NC}"
        echo "   1. Teste criar um contrato via Dashboard"
        echo "   2. Verifique se as datas de vencimento estão corretas"
        echo "   3. Verifique se o cálculo de parcelas está usando juros simples"
        echo ""
        echo -e "${BLUE}📚 Documentação completa:${NC}"
        echo "   - INSTRUCAO_DEPLOY_EDGE_FUNCTION.md"
        echo "   - CORRECAO_TIMEZONE_DEPLOY.md"
        echo ""
    else
        echo ""
        echo -e "${RED}========================================${NC}"
        echo -e "${RED}❌ ERRO NO DEPLOY${NC}"
        echo -e "${RED}========================================${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  Se recebeu erro 403, faça deploy manual:${NC}"
        echo "   1. Acesse: https://supabase.com/dashboard/project/${PROJECT_REF}/functions"
        echo "   2. Clique em '${FUNCTION_NAME}'"
        echo "   3. Clique em 'Deploy new version'"
        echo "   4. Copie e cole o conteúdo dos arquivos:"
        echo "      - index.tsx"
        echo "      - billing_routes.tsx"
        echo "      - client_portal_routes.tsx"
        echo ""
        echo -e "${BLUE}📄 Consulte: INSTRUCAO_DEPLOY_EDGE_FUNCTION.md${NC}"
        echo ""
    fi
else
    echo ""
    echo -e "${YELLOW}⏸️  Deploy cancelado${NC}"
    echo ""
    echo "Os arquivos foram copiados para:"
    echo "   ${TARGET_DIR}"
    echo ""
    echo "Para fazer deploy manual:"
    echo "   1. Acesse: https://supabase.com/dashboard/project/${PROJECT_REF}/functions"
    echo "   2. Siga as instruções em: INSTRUCAO_DEPLOY_EDGE_FUNCTION.md"
    echo ""
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✨ Script finalizado${NC}"
echo -e "${GREEN}========================================${NC}"
