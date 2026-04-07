# 🚀 Deploy - Edge Function com SERVICE_ROLE_KEY

## ✅ Código Atualizado

Todos os arquivos foram atualizados para usar `SERVICE_ROLE_KEY` em vez de `SUPABASE_SERVICE_ROLE_KEY`:

### Arquivos Modificados:
- ✅ `/supabase/functions/server/index.tsx`
- ✅ `/supabase/functions/server/billing_routes.tsx`
- ✅ `/supabase/functions/server/health.tsx`
- ✅ `/supabase/functions/server/kv_store.tsx`
- ✅ `/supabase/functions/make-server-bd42bc02/health.tsx`
- ✅ `/supabase/functions/make-server-bd42bc02/kv_store.tsx`

---

## 🔧 Opção 1: Deploy via Supabase CLI (RECOMENDADO)

### Pré-requisitos:
```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Verificar instalação
supabase --version
```

### Deploy:

```bash
# 1. Login no Supabase
supabase login

# 2. Navegar até a pasta do projeto
cd /caminho/do/seu/projeto

# 3. Linkar ao projeto (se ainda não fez)
supabase link --project-ref nbelraenzoprsskjnvpc

# 4. Verificar se o segredo está configurado
supabase secrets list

# Deve aparecer:
# SERVICE_ROLE_KEY (secret)

# 5. Deploy da Edge Function
supabase functions deploy server --project-ref nbelraenzoprsskjnvpc

# 6. Aguardar conclusão
# ✅ Deployed Function server on project nbelraenzoprsskjnvpc
```

### Verificar Logs:
```bash
# Ver logs em tempo real
supabase functions logs server --project-ref nbelraenzoprsskjnvpc

# Procure por:
# [INIT] Has Service Key: true
```

---

## 🔧 Opção 2: Deploy via Dashboard Supabase

### Passo 1: Preparar o Código

1. Certifique-se de que todos os arquivos em `/supabase/functions/server/` estão salvos
2. Os arquivos já foram atualizados neste projeto

### Passo 2: Upload Manual

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: **nbelraenzoprsskjnvpc**
3. Vá em: **Edge Functions**
4. Clique em: **server** (ou **make-server-bd42bc02**)
5. Clique em: **Deploy** → **Upload new version**

### Passo 3: Fazer Upload dos Arquivos

Você precisará fazer upload de todos os arquivos da pasta `/supabase/functions/server/`:

```
server/
├── index.tsx
├── billing_routes.tsx
├── client_portal_routes.tsx
├── health.tsx
└── kv_store.tsx
```

**IMPORTANTE:** Mantenha a estrutura de pastas!

### Passo 4: Verificar

1. Após o deploy, vá em **Logs**
2. Procure por: `[INIT] Has Service Key: true`

---

## 🔧 Opção 3: Deploy via Script (Mais Rápido)

Vou criar um script de deploy para você:

### Para Linux/Mac:

Crie um arquivo `deploy-edge-function.sh`:

```bash
#!/bin/bash

echo "🚀 Fazendo deploy da Edge Function..."

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não está instalado"
    echo "Instale com: npm install -g supabase"
    exit 1
fi

# Login
echo "📝 Fazendo login no Supabase..."
supabase login

# Link ao projeto
echo "🔗 Conectando ao projeto..."
supabase link --project-ref nbelraenzoprsskjnvpc

# Verificar segredos
echo "🔐 Verificando segredos configurados..."
supabase secrets list

# Deploy
echo "🚀 Fazendo deploy da função..."
supabase functions deploy server --project-ref nbelraenzoprsskjnvpc

# Verificar logs
echo "📊 Verificando logs..."
supabase functions logs server --project-ref nbelraenzoprsskjnvpc --tail 20

echo "✅ Deploy concluído!"
```

Execute:
```bash
chmod +x deploy-edge-function.sh
./deploy-edge-function.sh
```

### Para Windows:

Crie um arquivo `deploy-edge-function.bat`:

```batch
@echo off
echo 🚀 Fazendo deploy da Edge Function...

REM Verificar se Supabase CLI está instalado
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI não está instalado
    echo Instale com: npm install -g supabase
    exit /b 1
)

REM Login
echo 📝 Fazendo login no Supabase...
call supabase login

REM Link ao projeto
echo 🔗 Conectando ao projeto...
call supabase link --project-ref nbelraenzoprsskjnvpc

REM Verificar segredos
echo 🔐 Verificando segredos configurados...
call supabase secrets list

REM Deploy
echo 🚀 Fazendo deploy da função...
call supabase functions deploy server --project-ref nbelraenzoprsskjnvpc

REM Verificar logs
echo 📊 Verificando logs...
call supabase functions logs server --project-ref nbelraenzoprsskjnvpc --tail 20

echo ✅ Deploy concluído!
pause
```

Execute:
```batch
deploy-edge-function.bat
```

---

## ✅ Verificar se o Deploy Funcionou

### Teste 1: Health Check Simples

```bash
curl https://nbelraenzoprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/health
```

**Resposta Esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-29T...",
  "version": "2.3.0"
}
```

### Teste 2: Health Check Detalhado

```bash
curl https://nbelraenzoprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/health/detailed
```

**Resposta Esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-29T...",
  "version": "2.3.0",
  "supabase": {
    "connected": true,
    "hasServiceKey": true,  ← DEVE SER TRUE
    "hasAnonKey": true
  },
  "evolutionApi": {
    "configured": false
  }
}
```

**✅ Se `hasServiceKey: true`, o deploy funcionou!**

### Teste 3: Ver Logs no Dashboard

1. Acesse: https://supabase.com/dashboard
2. Projeto: **nbelraenzoprsskjnvpc**
3. **Edge Functions** → **server** → **Logs**
4. Procure por:
   ```
   [INIT] Has Service Key: true
   ```

---

## 🐛 Troubleshooting

### Erro: "Function not found"

**Causa:** A função ainda não foi deployada ou nome está errado

**Solução:**
```bash
# Listar funções disponíveis
supabase functions list --project-ref nbelraenzoprsskjnvpc

# Se não aparecer "server", faça deploy
supabase functions deploy server --project-ref nbelraenzoprsskjnvpc
```

### Erro: "Permission denied"

**Causa:** Não está autenticado no Supabase CLI

**Solução:**
```bash
# Fazer login novamente
supabase login

# Tentar deploy novamente
supabase functions deploy server --project-ref nbelraenzoprsskjnvpc
```

### Erro: "Invalid import"

**Causa:** Imports NPM podem precisar de configuração

**Solução:**
Crie um arquivo `deno.json` na raiz de `/supabase/functions/`:

```json
{
  "imports": {
    "hono": "npm:hono@^4.0.0",
    "@supabase/supabase-js": "npm:@supabase/supabase-js@2"
  }
}
```

Depois faça deploy novamente.

### Erro: "SERVICE_ROLE_KEY is not defined"

**Causa:** O segredo não está configurado no Supabase

**Solução:**
```bash
# Verificar segredos
supabase secrets list

# Se não aparecer SERVICE_ROLE_KEY, configure:
supabase secrets set SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZWxyYWVuem9wcnNza2pudnBjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzE4MjA2NCwiZXhwIjoyMDQ4NzU4MDY0fQ.sb_secret_eaRVOowDLKPZlKsMzxkn1Q_YPJc-msp"

# Fazer deploy novamente
supabase functions deploy server --project-ref nbelraenzoprsskjnvpc
```

---

## 📊 Checklist de Deploy

- [ ] Supabase CLI instalado (`npm install -g supabase`)
- [ ] Login feito (`supabase login`)
- [ ] Projeto linkado (`supabase link --project-ref nbelraenzoprsskjnvpc`)
- [ ] Segredo SERVICE_ROLE_KEY configurado (`supabase secrets list`)
- [ ] Deploy realizado (`supabase functions deploy server`)
- [ ] Health check testado (curl)
- [ ] Logs verificados (Dashboard ou CLI)
- [ ] `hasServiceKey: true` confirmado

---

## 🎯 Próximos Passos Após Deploy

1. ✅ Testar cadastro de clientes no portal
2. ✅ Verificar upload de documentos
3. ✅ Configurar políticas RLS (se necessário)
4. ✅ Testar autenticação

---

## 📚 Comandos Úteis

```bash
# Ver funções disponíveis
supabase functions list

# Ver logs em tempo real
supabase functions logs server --tail

# Ver segredos configurados
supabase secrets list

# Remover segredo (se necessário)
supabase secrets unset NOME_DO_SEGREDO

# Adicionar novo segredo
supabase secrets set NOME_SEGREDO="valor"

# Re-deploy
supabase functions deploy server
```

---

✅ **Status:** Código atualizado. Execute o deploy usando uma das opções acima!

⏱️ **Tempo estimado:** 5-10 minutos
