#!/bin/bash

echo "🚀 Deploy da Edge Function - SERVICE_ROLE_KEY Fix"
echo "================================================="
echo ""

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não está instalado"
    echo ""
    echo "Instale com:"
    echo "  npm install -g supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI encontrado"
echo ""

# Login
echo "📝 Fazendo login no Supabase..."
supabase login

if [ $? -ne 0 ]; then
    echo "❌ Erro ao fazer login"
    exit 1
fi

echo "✅ Login realizado com sucesso"
echo ""

# Link ao projeto
echo "🔗 Conectando ao projeto nbelraenzoprsskjnvpc..."
supabase link --project-ref nbelraenzoprsskjnvpc

if [ $? -ne 0 ]; then
    echo "❌ Erro ao conectar ao projeto"
    exit 1
fi

echo "✅ Conectado ao projeto"
echo ""

# Verificar segredos
echo "🔐 Verificando segredos configurados..."
echo ""
supabase secrets list
echo ""

# Verificar se SERVICE_ROLE_KEY existe
if supabase secrets list | grep -q "SERVICE_ROLE_KEY"; then
    echo "✅ SERVICE_ROLE_KEY encontrado"
else
    echo "⚠️  SERVICE_ROLE_KEY não encontrado"
    echo ""
    echo "Configure com:"
    echo "  supabase secrets set SERVICE_ROLE_KEY=\"sua-chave\""
    echo ""
    read -p "Deseja continuar mesmo assim? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# Deploy
echo "🚀 Fazendo deploy da Edge Function 'server'..."
echo ""
supabase functions deploy server --project-ref nbelraenzoprsskjnvpc

if [ $? -ne 0 ]; then
    echo "❌ Erro ao fazer deploy"
    exit 1
fi

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""

# Verificar logs
echo "📊 Verificando logs (últimas 20 linhas)..."
echo ""
supabase functions logs server --project-ref nbelraenzoprsskjnvpc --tail 20

echo ""
echo "================================================="
echo "🎉 Deploy Finalizado!"
echo "================================================="
echo ""
echo "Próximos passos:"
echo "1. Teste o health check:"
echo "   curl https://nbelraenzoprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/health"
echo ""
echo "2. Verifique se hasServiceKey: true"
echo "   curl https://nbelraenzoprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/health/detailed"
echo ""
echo "3. Teste o cadastro de clientes no portal"
echo ""
