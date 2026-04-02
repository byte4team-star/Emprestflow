#!/bin/bash

# 🚀 Script de Deploy - Correção de Parcelas e Datas
# Data: 28/03/2026

echo "=================================================="
echo "🔧 DEPLOY DA CORREÇÃO - Sistema de Cobrança"
echo "=================================================="
echo ""

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI não encontrado!"
    echo ""
    echo "📥 Instalando Supabase CLI..."
    npm install -g supabase
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Erro ao instalar Supabase CLI"
        echo ""
        echo "Tente manualmente:"
        echo "  npm install -g supabase"
        echo ""
        exit 1
    fi
    
    echo "✅ Supabase CLI instalado com sucesso!"
    echo ""
fi

echo "✅ Supabase CLI encontrado"
echo ""

# Verificar se está logado
echo "🔐 Verificando autenticação..."
supabase projects list &> /dev/null

if [ $? -ne 0 ]; then
    echo "❌ Você não está logado no Supabase"
    echo ""
    echo "Executando login..."
    supabase login
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Erro no login"
        echo ""
        echo "Tente manualmente:"
        echo "  supabase login"
        echo ""
        exit 1
    fi
fi

echo "✅ Autenticado no Supabase"
echo ""

# Verificar se o projeto está linkado
echo "🔗 Verificando link do projeto..."

if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  Projeto não está linkado"
    echo ""
    echo "Por favor, informe o PROJECT_REF (Reference ID):"
    echo "Encontre em: https://supabase.com/dashboard → Settings → General"
    echo ""
    read -p "PROJECT_REF: " project_ref
    
    if [ -z "$project_ref" ]; then
        echo ""
        echo "❌ PROJECT_REF não pode estar vazio"
        exit 1
    fi
    
    echo ""
    echo "🔗 Linkando projeto..."
    supabase link --project-ref "$project_ref"
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Erro ao linkar projeto"
        exit 1
    fi
    
    echo "✅ Projeto linkado com sucesso!"
    echo ""
fi

echo "✅ Projeto linkado"
echo ""

# Verificar se a pasta de functions existe
if [ ! -d "supabase/functions/server" ]; then
    echo "❌ Pasta supabase/functions/server não encontrada!"
    echo ""
    echo "Certifique-se de estar na raiz do projeto"
    exit 1
fi

echo "📁 Estrutura de pastas verificada"
echo ""

# Fazer o deploy
echo "🚀 Iniciando deploy da Edge Function..."
echo ""
echo "Função: server"
echo "Arquivo: supabase/functions/server/index.tsx"
echo ""

supabase functions deploy server

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Erro no deploy!"
    echo ""
    echo "Tente manualmente:"
    echo "  supabase functions deploy server"
    echo ""
    exit 1
fi

echo ""
echo "=================================================="
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "=================================================="
echo ""
echo "📋 Correções Aplicadas:"
echo "  ✅ Valores de parcelas calculados corretamente"
echo "  ✅ Datas sem problema de timezone"
echo "  ✅ Arredondamento para 2 casas decimais"
echo ""
echo "🧪 Próximos Passos:"
echo "  1. Aguarde 1-2 minutos para propagação"
echo "  2. Limpe o cache do navegador (Ctrl+Shift+R)"
echo "  3. Teste criando um novo contrato"
echo ""
echo "📊 Teste com:"
echo "  - Valor: R$ 20.000,00"
echo "  - Parcelas: 10"
echo "  - Data: 30/03/2026"
echo "  - Taxa: 25%"
echo ""
echo "✅ Resultado esperado:"
echo "  - Parcela: R$ 2.500,00"
echo "  - Datas: 30/03, 30/04, 30/05..."
echo ""
echo "=================================================="
