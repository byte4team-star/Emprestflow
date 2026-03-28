# 🔴 PROBLEMA E SOLUÇÃO - EDGE FUNCTION

## ❌ PROBLEMA IDENTIFICADO

Você estava editando os arquivos na pasta **ERRADA**!

```
❌ EDITANDO AQUI (local, não deployado):
   /supabase/functions/server/
   
✅ DEVERIA SER AQUI (nome real no Supabase):
   /supabase/functions/make-server-bd42bc02/
```

## 📊 SITUAÇÃO ATUAL

### No Supabase (produção)
```
make-server-bd42bc02/
├── health.tsx      ✅ (existe)
└── kv_store.tsx    ✅ (existe)
```

### Localmente (com correções)
```
server/
├── index.tsx               ✅ (COM CORREÇÕES v2.2.0)
├── billing_routes.tsx      ✅ (COM CORREÇÕES)
├── client_portal_routes.tsx ✅ (COM CORREÇÕES)
├── health.tsx              ✅
└── kv_store.tsx            ✅
```

## 🎯 SOLUÇÃO RÁPIDA

### Opção 1: Via Dashboard (MAIS FÁCIL)

1. **Abra o Supabase Dashboard**
   - https://supabase.com/dashboard/project/nbelraenszprsskjnvpc/functions
   - Clique em `make-server-bd42bc02`

2. **Copie e cole 3 arquivos:**
   
   **a) index.tsx** (3020 linhas)
   - Abra `/supabase/functions/server/index.tsx` 
   - Copie TODO o conteúdo
   - Cole no editor do Dashboard
   - Clique em "Deploy"
   
   **b) billing_routes.tsx** (818 linhas)
   - Abra `/supabase/functions/server/billing_routes.tsx`
   - Copie TODO o conteúdo
   - Cole no editor do Dashboard
   - Clique em "Deploy"
   
   **c) client_portal_routes.tsx** (771 linhas)
   - Abra `/supabase/functions/server/client_portal_routes.tsx`
   - Copie TODO o conteúdo
   - Cole no editor do Dashboard
   - Clique em "Deploy"

3. **Teste**
   ```bash
   curl https://nbelraenszprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/health
   ```
   
   Deve retornar:
   ```json
   {
     "status": "healthy",
     "version": "2.2.0"
   }
   ```

---

### Opção 2: Via Script (Terminal)

```bash
# 1. Dê permissão de execução
chmod +x deploy-edge-function-fix.sh

# 2. Execute o script
./deploy-edge-function-fix.sh
```

O script irá:
- ✅ Copiar os arquivos de `server/` para `make-server-bd42bc02/`
- ✅ Fazer deploy via Supabase CLI
- ✅ Testar automaticamente

---

### Opção 3: Manual via Terminal

```bash
# Copiar os 3 arquivos que faltam
cp supabase/functions/server/index.tsx \
   supabase/functions/make-server-bd42bc02/

cp supabase/functions/server/billing_routes.tsx \
   supabase/functions/make-server-bd42bc02/

cp supabase/functions/server/client_portal_routes.tsx \
   supabase/functions/make-server-bd42bc02/

# Deploy via CLI
cd supabase/functions
supabase functions deploy make-server-bd42bc02
```

---

## ✅ CHECKLIST PÓS-DEPLOY

Após fazer o deploy, verifique:

- [ ] Health check retorna versão 2.2.0
- [ ] Criar contrato de teste
- [ ] Parcelas com datas CORRETAS (não -1 dia)
- [ ] Cálculo usando JUROS SIMPLES (não Tabela Price)

---

## 🐛 CORREÇÕES QUE SERÃO APLICADAS

### 1. Timezone Fix
```typescript
// ANTES (ERRADO - salvava -1 dia):
const dueDate = new Date(year, month, day);

// DEPOIS (CORRETO):
const dueDate = new Date(Date.UTC(year, month, day));
```

### 2. Cálculo de Juros
```typescript
// ANTES (Tabela Price - ERRADO):
const payment = (P * r) / (1 - Math.pow(1 + r, -n));

// DEPOIS (Juros Simples - CORRETO):
const total = P * (1 + (r * n));
const payment = total / n;
```

---

## 📞 PRECISA DE AJUDA?

1. Consulte: `INSTRUCAO_DEPLOY_EDGE_FUNCTION.md`
2. Consulte: `CORRECAO_TIMEZONE_DEPLOY.md`
3. Verifique os logs no Dashboard do Supabase

---

**Data:** 28/03/2026  
**Versão:** 1.0  
**Status:** 🔴 Aguardando deploy
