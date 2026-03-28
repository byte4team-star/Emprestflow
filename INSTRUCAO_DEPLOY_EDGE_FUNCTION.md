# 🚀 INSTRUÇÕES PARA DEPLOY DA EDGE FUNCTION COM CORREÇÕES

## ⚠️ PROBLEMA IDENTIFICADO

A Edge Function no Supabase se chama **`make-server-bd42bc02`** e NÃO "server".

Atualmente, a função `make-server-bd42bc02` só possui 2 arquivos:
- `health.tsx`
- `kv_store.tsx`

**Faltam 3 arquivos essenciais** com as correções de timezone e cálculo de parcelas:
- `index.tsx` (arquivo principal - 3020 linhas)
- `billing_routes.tsx` (rotas de cobrança - 818 linhas)  
- `client_portal_routes.tsx` (portal do cliente - 771 linhas)

## 📁 ARQUIVOS CORRETOS LOCALMENTE

Os arquivos com as correções estão em `/supabase/functions/server/`:

```
/supabase/functions/server/
├── index.tsx               ✅ (v2.2.0 - COM CORREÇÕES)
├── billing_routes.tsx      ✅ (COM CORREÇÕES)
├── client_portal_routes.tsx ✅ (COM CORREÇÕES)
├── health.tsx              ✅ (já existe no Supabase)
└── kv_store.tsx            ✅ (já existe no Supabase)
```

## 🎯 SOLUÇÃO: DEPLOY MANUAL VIA SUPABASE DASHBOARD

### OPÇÃO 1: Deploy via Dashboard (RECOMENDADO)

1. **Acesse o Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/[seu-project-id]/functions
   - Ou através da imagem fornecida

2. **Clique na função `make-server-bd42bc02`**

3. **Para cada arquivo abaixo, clique em "Deploy new version":**

#### 📄 Arquivo 1: `index.tsx`
```bash
# Localização local: /supabase/functions/server/index.tsx
# Copie TODO o conteúdo deste arquivo e cole no editor do Dashboard
```

**Principais correções neste arquivo:**
- Versão 2.2.0 (linha 10)
- Correção de timezone usando `Date.UTC()` nas rotas de contratos
- Cálculo correto de juros simples (não mais Tabela Price)

#### 📄 Arquivo 2: `billing_routes.tsx`
```bash
# Localização local: /supabase/functions/server/billing_routes.tsx
# Copie TODO o conteúdo deste arquivo e cole no editor do Dashboard
```

**Principais correções neste arquivo:**
- Rotas de cobrança automática
- Integração com Evolution API para WhatsApp
- Templates de mensagens

#### 📄 Arquivo 3: `client_portal_routes.tsx`
```bash
# Localização local: /supabase/functions/server/client_portal_routes.tsx
# Copie TODO o conteúdo deste arquivo e cole no editor do Dashboard
```

**Principais correções neste arquivo:**
- Portal do cliente
- Rotas de consulta de contratos e parcelas
- **Correção crítica de timezone** usando `Date.UTC()` ao invés de `new Date()`

---

### OPÇÃO 2: Deploy via Supabase CLI (Se tiver acesso)

```bash
# 1. Instale o Supabase CLI (se ainda não tiver)
npm install -g supabase

# 2. Faça login
supabase login

# 3. Link com o projeto
supabase link --project-ref nbelraenszprsskjnvpc

# 4. Deploy da função
supabase functions deploy make-server-bd42bc02 \
  --project-ref nbelraenszprsskjnvpc
```

⚠️ **ATENÇÃO**: O CLI pode dar erro 403. Se isso acontecer, use a OPÇÃO 1 (Dashboard).

---

### OPÇÃO 3: Renomear a pasta local (mais rápido para CLI)

Se você tem acesso ao CLI e quer evitar erro de caminho:

```bash
# No terminal, na raiz do projeto:

# 1. Renomeie a pasta server para make-server-bd42bc02
mv supabase/functions/server supabase/functions/make-server-bd42bc02

# 2. Deploy
cd supabase/functions
supabase functions deploy make-server-bd42bc02

# 3. (Opcional) Renomeie de volta se preferir
mv supabase/functions/make-server-bd42bc02 supabase/functions/server
```

---

## ✅ VERIFICAÇÃO PÓS-DEPLOY

Após fazer o deploy, teste a função:

### 1. Teste de Health Check
```bash
curl https://nbelraenszprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/health
```

Resposta esperada:
```json
{
  "status": "healthy",
  "version": "2.2.0",
  "timestamp": "2026-03-28T..."
}
```

### 2. Teste de Criação de Contrato

Use o arquivo `test-timezone-fix.html` ou faça uma requisição via Postman/Insomnia:

```javascript
// Criar contrato de teste
POST https://nbelraenszprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/contracts

// Headers
Authorization: Bearer [SEU_JWT_TOKEN]
Content-Type: application/json

// Body
{
  "clientId": "client_xxx",
  "loanAmount": 1000,
  "installmentsCount": 4,
  "monthlyInterestRate": 10,
  "firstDueDate": "2026-04-15"
}
```

### 3. Verifique as Datas de Vencimento

As parcelas devem ser geradas com as datas CORRETAS:
- Parcela 1: 15/04/2026 (não 14/04/2026)
- Parcela 2: 15/05/2026 (não 14/05/2026)
- Parcela 3: 15/06/2026 (não 14/06/2026)
- Parcela 4: 15/07/2026 (não 14/07/2026)

---

## 📋 CHECKLIST DE DEPLOY

- [ ] Acessei o Supabase Dashboard
- [ ] Encontrei a função `make-server-bd42bc02`
- [ ] Copiei e colei o conteúdo de `index.tsx`
- [ ] Copiei e colei o conteúdo de `billing_routes.tsx`
- [ ] Copiei e colei o conteúdo de `client_portal_routes.tsx`
- [ ] Salvei e fiz deploy da nova versão
- [ ] Testei o health check (retornou v2.2.0)
- [ ] Testei criar um contrato de teste
- [ ] Verifiquei que as datas estão corretas
- [ ] Deletei contratos antigos com datas erradas (se necessário)

---

## 🐛 CORREÇÕES IMPLEMENTADAS

### 1. Timezone Fix (Datas de Vencimento)
**Antes:**
```typescript
const dueDate = new Date(year, month, day);
// BUG: Usava timezone local, causava -1 dia ao salvar em UTC
```

**Depois:**
```typescript
const dueDate = new Date(Date.UTC(year, month, day));
// CORRETO: Usa UTC diretamente, data salva corretamente
```

### 2. Cálculo de Juros (Juros Simples)
**Antes:**
```typescript
// Usava Tabela Price (fórmula de juros compostos)
const monthlyPayment = (principal * rate) / (1 - Math.pow(1 + rate, -months));
```

**Depois:**
```typescript
// Usa Juros Simples correto
const totalWithInterest = principal * (1 + (monthlyRate / 100) * installmentsCount);
const installmentValue = totalWithInterest / installmentsCount;
```

---

## 📞 SUPORTE

Se encontrar problemas durante o deploy:

1. Verifique os logs da função no Dashboard
2. Teste o endpoint de health check
3. Verifique se todas as variáveis de ambiente estão configuradas:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
   - `EVOLUTION_API_URL` (opcional)
   - `EVOLUTION_API_KEY` (opcional)

---

## 🎉 RESULTADO ESPERADO

Após o deploy correto:
- ✅ Versão 2.2.0 ativa
- ✅ Datas de vencimento corretas (sem problema de timezone)
- ✅ Cálculo de parcelas com juros simples
- ✅ Seed data com exemplos corretos
- ✅ Sistema pronto para produção

---

**Última atualização:** 28/03/2026
**Versão do documento:** 1.0
