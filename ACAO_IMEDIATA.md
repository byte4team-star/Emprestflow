# ⚡ AÇÃO IMEDIATA - DEPLOY EDGE FUNCTION

## 🎯 O QUE FAZER AGORA

### 1️⃣ ACESSE O SUPABASE DASHBOARD

```
URL: https://supabase.com/dashboard/project/nbelraenszprsskjnvpc/functions
```

### 2️⃣ CLIQUE NA FUNÇÃO `make-server-bd42bc02`

### 3️⃣ COPIE E COLE 3 ARQUIVOS

#### Arquivo 1: `index.tsx`
1. No seu editor local, abra: `/supabase/functions/server/index.tsx`
2. Selecione TUDO (Ctrl+A / Cmd+A)
3. Copie (Ctrl+C / Cmd+C)
4. No Dashboard do Supabase, cole no editor
5. Clique em "Deploy new version"

#### Arquivo 2: `billing_routes.tsx`
1. No seu editor local, abra: `/supabase/functions/server/billing_routes.tsx`
2. Selecione TUDO (Ctrl+A / Cmd+A)
3. Copie (Ctrl+C / Cmd+C)
4. No Dashboard do Supabase, cole no editor
5. Clique em "Deploy new version"

#### Arquivo 3: `client_portal_routes.tsx`
1. No seu editor local, abra: `/supabase/functions/server/client_portal_routes.tsx`
2. Selecione TUDO (Ctrl+A / Cmd+A)
3. Copie (Ctrl+C / Cmd+C)
4. No Dashboard do Supabase, cole no editor
5. Clique em "Deploy new version"

### 4️⃣ TESTE O DEPLOY

Abra no navegador:
```
test-deploy-corrigido.html
```

Ou execute no terminal:
```bash
curl https://nbelraenszprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/health
```

Resposta esperada:
```json
{
  "status": "healthy",
  "version": "2.2.0"
}
```

---

## 🚀 ALTERNATIVA: SCRIPT AUTOMÁTICO

Se você tem acesso ao terminal:

```bash
# 1. Dê permissão
chmod +x deploy-edge-function-fix.sh

# 2. Execute
./deploy-edge-function-fix.sh
```

---

## ✅ RESULTADO ESPERADO

Após o deploy:
- ✅ Versão 2.2.0 ativa
- ✅ Datas de vencimento corretas (sem -1 dia)
- ✅ Cálculo de parcelas com juros simples
- ✅ Sistema pronto para produção

---

## 📚 DOCUMENTAÇÃO COMPLETA

Para mais detalhes, consulte:
- `RESUMO_PROBLEMA_E_SOLUCAO.md` - Visão geral do problema
- `INSTRUCAO_DEPLOY_EDGE_FUNCTION.md` - Instruções detalhadas
- `CORRECAO_TIMEZONE_DEPLOY.md` - Explicação técnica das correções

---

## 🆘 PRECISA DE AJUDA?

Se algo der errado:
1. Verifique os logs no Dashboard do Supabase
2. Confirme que copiou TODO o conteúdo dos 3 arquivos
3. Teste o health check novamente
4. Se a versão não for 2.2.0, refaça o deploy

---

**Tempo estimado:** 5-10 minutos  
**Dificuldade:** Fácil  
**Requer:** Acesso ao Supabase Dashboard
