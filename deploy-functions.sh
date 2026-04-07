#!/bin/bash

echo "🚀 DEPLOY DE EDGE FUNCTIONS - EMPRESTFLOW"
echo "=========================================="
echo ""

# Project reference
PROJECT_REF="nbelraenzoprsskjnvpc"

echo "📦 Fazendo deploy da Edge Function 'server'..."
echo ""

# Deploy
supabase functions deploy server --project-ref $PROJECT_REF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deploy concluído com sucesso!"
    echo ""
    echo "🔍 Verificando logs..."
    echo ""
    supabase functions logs server --project-ref $PROJECT_REF --tail 10
    echo ""
    echo "✅ TUDO PRONTO!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Acesse o sistema e faça login"
    echo "2. Vá para a página de Segurança (/security)"
    echo "3. Clique nos cards de usuários"
    echo "4. Teste criar um novo usuário"
    echo ""
else
    echo ""
    echo "❌ Erro no deploy!"
    echo ""
    echo "Verifique:"
    echo "1. Se você está logado no Supabase CLI (supabase login)"
    echo "2. Se a variável SERVICE_ROLE_KEY está configurada no Supabase Dashboard"
    echo "3. Se você tem permissões para fazer deploy"
    echo ""
    exit 1
fi
