# 🔧 CORREÇÃO CRÍTICA: Data de Vencimento (Timezone)

## ⚠️ PROBLEMA IDENTIFICADO
As datas de vencimento das parcelas estavam sendo gravadas **um dia antes** do esperado devido a problemas de conversão de fuso horário (timezone) no servidor.

## ✅ SOLUÇÃO IMPLEMENTADA

### Causa Raiz
O código estava usando `new Date(year, month, day)` que cria datas no fuso horário **local do servidor**. Como o servidor Supabase opera em UTC e há diferenças de fuso horário, as datas eram convertidas incorretamente, resultando em um dia a menos.

### Correção Aplicada
Substituímos `new Date(year, month, day)` por **`Date.UTC(year, month, day)`** para garantir que as datas sejam sempre processadas em UTC, evitando conversões indesejadas.

Também alteramos os métodos de formatação:
- **Antes**: `getFullYear()`, `getMonth()`, `getDate()`
- **Depois**: `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`

## 📝 ARQUIVOS MODIFICADOS

### `/supabase/functions/server/index.tsx`

#### 1️⃣ Rota POST `/contracts` (Criar Contrato) - Linha ~1151
```typescript
// ANTES (INCORRETO):
const dueDate = new Date(year, month + i, day);
const formattedDueDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;

// DEPOIS (CORRETO):
const dueDate = new Date(Date.UTC(year, month + i, day));
const formattedDueDate = `${dueDate.getUTCFullYear()}-${String(dueDate.getUTCMonth() + 1).padStart(2, '0')}-${String(dueDate.getUTCDate()).padStart(2, '0')}`;
```

#### 2️⃣ Rota PUT `/contracts/:id` (Atualizar Contrato) - Linha ~1258
```typescript
// ANTES (INCORRETO):
const dueDate = new Date(year, month + i, day);
const formattedDueDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;

// DEPOIS (CORRETO):
const dueDate = new Date(Date.UTC(year, month + i, day));
const formattedDueDate = `${dueDate.getUTCFullYear()}-${String(dueDate.getUTCMonth() + 1).padStart(2, '0')}-${String(dueDate.getUTCDate()).padStart(2, '0')}`;
```

#### 3️⃣ Rota POST `/seed` (Dados de Teste) - Linha ~2344
```typescript
// ANTES (INCORRETO):
const dueDate = new Date(year, month + i, day);
const formattedDueDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;

// DEPOIS (CORRETO):
const dueDate = new Date(Date.UTC(year, month + i, day));
const formattedDueDate = `${dueDate.getUTCFullYear()}-${String(dueDate.getUTCMonth() + 1).padStart(2, '0')}-${String(dueDate.getUTCDate()).padStart(2, '0')}`;
```

## 🚀 DEPLOY MANUAL NECESSÁRIO

### Opção 1: Deploy via Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para **Edge Functions** > **server**
4. Clique em **Deploy** ou **Update Function**
5. Cole o conteúdo completo do arquivo `/supabase/functions/server/index.tsx`
6. Clique em **Save/Deploy**

### Opção 2: Deploy via Supabase CLI
```bash
# 1. Instalar Supabase CLI (se ainda não instalado)
npm install -g supabase

# 2. Login no Supabase
supabase login

# 3. Link com o projeto
supabase link --project-ref SEU_PROJECT_ID

# 4. Deploy da Edge Function
supabase functions deploy server --no-verify-jwt

# 5. Verificar logs
supabase functions logs server
```

## ✅ VERIFICAÇÃO PÓS-DEPLOY

### Teste 1: Criar Novo Contrato
1. Acesse o sistema e crie um novo contrato
2. Defina data de vencimento: **2026-04-15**
3. Verifique se a primeira parcela aparece como **2026-04-15** (não 2026-04-14)

### Teste 2: Verificar Contratos Existentes
**IMPORTANTE**: Contratos criados antes desta correção **mantêm as datas incorretas**. Você pode:
- **Opção A**: Editar manualmente cada contrato para recalcular as datas
- **Opção B**: Criar novos contratos com as datas corretas
- **Opção C**: Aguardar que os usuários editem os contratos naturalmente

### Teste 3: Dados de Teste (Seed)
1. Execute a rota `/make-server-bd42bc02/seed` via API
2. Verifique se os contratos criados têm as datas corretas:
   - Contrato 1: primeira parcela em **2026-03-01**
   - Contrato 2: primeira parcela em **2026-03-15**
   - etc.

## 📊 VERSÃO DO SERVIDOR
- **Versão Anterior**: 2.1.1
- **Versão Atual**: 2.2.0
- **Data da Correção**: 2026-03-28

## 🔗 DOCUMENTAÇÃO TÉCNICA

### Por que usar Date.UTC()?
```javascript
// Problema: new Date() usa timezone local
const date1 = new Date(2026, 2, 15); // 15 de março de 2026
console.log(date1.toISOString()); 
// Output em servidor UTC-3: "2026-03-15T03:00:00.000Z"
// Quando convertido para string YYYY-MM-DD: "2026-03-14" ❌

// Solução: Date.UTC() sempre usa UTC
const date2 = new Date(Date.UTC(2026, 2, 15));
console.log(date2.toISOString());
// Output: "2026-03-15T00:00:00.000Z"
// Quando convertido com getUTC*(): "2026-03-15" ✅
```

## 📞 SUPORTE
Se após o deploy o problema persistir:
1. Verifique os logs da Edge Function: `supabase functions logs server`
2. Confirme que a versão 2.2.0 está ativa
3. Teste com um contrato completamente novo (não editado)
4. Se necessário, entre em contato com o desenvolvedor

---

**Status**: ✅ Correção implementada e pronta para deploy
**Prioridade**: 🔴 ALTA - Deploy manual necessário
**Impacto**: Todos os contratos criados/editados após o deploy terão datas corretas
