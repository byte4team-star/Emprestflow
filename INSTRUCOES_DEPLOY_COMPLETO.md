# 🚀 INSTRUÇÕES COMPLETAS DE DEPLOY - Correção de Timezone

## 📋 RESUMO EXECUTIVO

### O QUE FOI CORRIGIDO?
- ✅ **Backend (Edge Function)**: Datas de vencimento gravando um dia antes
- ✅ **Frontend (Opcional)**: Funções utilitárias para evitar problemas de exibição

### PRIORIDADE
🔴 **ALTA** - O backend DEVE ser deployado para corrigir contratos novos
⚪ **BAIXA** - O frontend é opcional (melhoria incremental)

---

## 🎯 PARTE 1: DEPLOY DO BACKEND (OBRIGATÓRIO)

### Arquivo Corrigido
`/supabase/functions/server/index.tsx`

### O que mudou?
3 locais onde datas são calculadas:
1. **Linha ~1151** - Criar contrato (POST)
2. **Linha ~1258** - Editar contrato (PUT)
3. **Linha ~2344** - Dados de teste (SEED)

### Mudança Aplicada
```typescript
// ANTES (INCORRETO)
const dueDate = new Date(year, month + i, day);
const formatted = `${dueDate.getFullYear()}-...`;

// DEPOIS (CORRETO)
const dueDate = new Date(Date.UTC(year, month + i, day));
const formatted = `${dueDate.getUTCFullYear()}-...`;
```

---

## 📝 OPÇÃO A: DEPLOY VIA SUPABASE DASHBOARD

### Passo a Passo

#### 1. Acessar o Dashboard
- Ir para: https://supabase.com/dashboard
- Fazer login com sua conta
- Selecionar o projeto: **EmprestFlow** (ou o nome do seu projeto)

#### 2. Navegar até Edge Functions
- No menu lateral, clicar em **Edge Functions**
- Procurar pela função chamada: **server**

#### 3. Abrir o Editor
- Clicar na função **server** para abrir os detalhes
- Clicar no botão **Edit** ou **Update Function**

#### 4. Substituir o Código
- Selecionar TODO o código atual
- Deletar
- Copiar TODO o conteúdo do arquivo `/supabase/functions/server/index.tsx`
- Colar no editor

#### 5. Salvar e Deploy
- Clicar em **Save** ou **Deploy**
- Aguardar o processo de deploy (geralmente 10-30 segundos)
- Verificar se aparece mensagem de sucesso

#### 6. Verificar Logs
- Na mesma tela, clicar em **Logs**
- Verificar se aparece a versão: `Server version: 2.2.0`
- Verificar se não há erros

---

## 💻 OPÇÃO B: DEPLOY VIA SUPABASE CLI

### Pré-requisitos
```bash
# Verificar se Supabase CLI está instalado
supabase --version

# Se não estiver, instalar:
npm install -g supabase
# ou
brew install supabase/tap/supabase
```

### Passo a Passo

#### 1. Login no Supabase
```bash
supabase login
```
- Abrirá o navegador para fazer login
- Autorizar o acesso

#### 2. Link com o Projeto
```bash
# Substitua YOUR_PROJECT_ID pelo ID do seu projeto
# O ID está em: Dashboard > Settings > General > Reference ID
supabase link --project-ref YOUR_PROJECT_ID
```

Exemplo:
```bash
supabase link --project-ref xyzabc123def
```

#### 3. Deploy da Edge Function
```bash
cd /caminho/para/seu/projeto

supabase functions deploy server --no-verify-jwt
```

#### 4. Verificar Logs
```bash
supabase functions logs server --tail
```

Você deve ver:
```
Server version: 2.2.0 - Fixed timezone issue...
```

---

## ✅ TESTE PÓS-DEPLOY (OBRIGATÓRIO)

### Teste 1: Criar Novo Contrato

1. **Acessar o sistema**
   - Login como admin ou operador

2. **Criar novo contrato**
   - Ir para Contratos > Novo Contrato
   - Preencher dados:
     - Cliente: qualquer cliente
     - Valor: R$ 10.000,00
     - Parcelas: 10
     - **Primeiro Vencimento: 15/04/2026** ⬅️ DATA DE TESTE
     - Taxa de juros: 25%

3. **Salvar e verificar**
   - Clicar em Salvar
   - Abrir o contrato criado
   - Verificar se a **primeira parcela** mostra: **15/04/2026**
   - ✅ Se mostrar 15/04/2026 → **CORREÇÃO FUNCIONANDO!**
   - ❌ Se mostrar 14/04/2026 → Deploy não aplicado ou erro

### Teste 2: Editar Contrato Existente

1. **Abrir contrato existente**
   - Selecionar qualquer contrato

2. **Editar**
   - Clicar em Editar
   - Mudar o primeiro vencimento para: **20/04/2026**
   - Salvar

3. **Verificar**
   - Reabrir o contrato
   - Primeira parcela deve mostrar: **20/04/2026**

### Teste 3: Gerar Dados de Teste

```bash
# Via curl ou Postman
curl -X POST https://SUA_URL_SUPABASE/functions/v1/make-server-bd42bc02/seed \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json"
```

Verificar se os contratos criados têm as datas corretas:
- Contrato 1: 01/03/2026
- Contrato 2: 15/03/2026
- etc.

---

## 🎨 PARTE 2: ATUALIZAÇÃO DO FRONTEND (OPCIONAL)

### O que foi criado?
Arquivo novo: `/src/app/utils/dateUtils.ts`

### Para que serve?
Funções utilitárias para formatar e manipular datas sem problemas de timezone.

### Como usar?

#### Substituir formatações antigas
```typescript
// ANTES (pode ter problema de timezone)
const formatted = new Date(date).toLocaleDateString('pt-BR');

// DEPOIS (sem problema de timezone)
import { formatDateBR } from '../utils/dateUtils';
const formatted = formatDateBR(date);
```

#### Funções disponíveis
```typescript
import {
  formatDateBR,              // '2026-04-15' → '15/04/2026'
  formatDateBRWithLocale,    // Usa toLocaleDateString com UTC
  isDateOverdue,             // Verifica se está vencida
  getDaysBetween,            // Diferença em dias
  getTodayDateString,        // Data atual em YYYY-MM-DD
  isValidDateString          // Valida formato de data
} from '../utils/dateUtils';
```

### Arquivos que PODEM ser atualizados (não obrigatório)

1. `/src/app/pages/ContractDetails.tsx`
2. `/src/app/pages/Contracts.tsx`
3. `/src/app/pages/ClientPortal.tsx`
4. `/src/app/pages/ClientPortalDashboard.tsx`
5. `/src/app/pages/Clients.tsx`
6. `/src/app/pages/ClientDetails.tsx`

### Exemplo de Atualização

**Arquivo:** `/src/app/pages/ContractDetails.tsx`

```typescript
// No início do arquivo
import { formatDateBR, isDateOverdue } from '../utils/dateUtils';

// Substituir a função formatDate
const formatDate = (date: string) => {
  return formatDateBR(date); // ✅ Novo
};

// Substituir a função isOverdue
const isOverdue = (dueDate: string, status: string) => {
  return status !== 'paid' && isDateOverdue(dueDate); // ✅ Novo
};
```

---

## ⚠️ IMPORTANTE: CONTRATOS ANTIGOS

### Contratos criados ANTES da correção
- ❌ **Mantêm as datas incorretas** (um dia antes)
- ⚠️ Não são corrigidos automaticamente

### Opções para corrigir contratos antigos:

#### Opção 1: Editar Manualmente (Recomendado)
- Abrir cada contrato
- Clicar em Editar
- Ajustar o primeiro vencimento para a data correta
- Salvar → O sistema recalcula todas as parcelas

#### Opção 2: Deixar Como Está
- Se os contratos já têm datas acordadas com clientes
- E as notificações de cobrança estão funcionando corretamente
- Pode deixar como está

#### Opção 3: Script de Correção em Massa (Avançado)
- Criar um script que busca todos os contratos
- Para cada contrato, adiciona 1 dia ao firstDueDate
- Recalcula as parcelas
- Atualiza no banco

⚠️ **Não implementamos Opção 3 por questão de segurança** (pode afetar contratos que já foram ajustados manualmente)

---

## 📊 CHECKLIST DE DEPLOY

### Antes do Deploy
- [ ] Ler completamente este documento
- [ ] Fazer backup dos dados importantes
- [ ] Ter acesso ao Supabase Dashboard ou CLI
- [ ] Ter o arquivo `/supabase/functions/server/index.tsx` atualizado

### Durante o Deploy
- [ ] Fazer deploy da Edge Function "server"
- [ ] Verificar logs após deploy
- [ ] Confirmar versão 2.2.0

### Após o Deploy
- [ ] Executar Teste 1 (criar novo contrato)
- [ ] Executar Teste 2 (editar contrato)
- [ ] Verificar se as datas estão corretas
- [ ] (Opcional) Atualizar frontend com dateUtils.ts
- [ ] (Opcional) Corrigir contratos antigos

---

## 🆘 PROBLEMAS E SOLUÇÕES

### ❌ Após deploy, as datas ainda estão incorretas

**Possíveis causas:**
1. Deploy não foi aplicado corretamente
2. Edge Function antiga está em cache
3. Projeto errado foi atualizado

**Soluções:**
```bash
# 1. Verificar logs
supabase functions logs server --tail

# Deve mostrar: "Server version: 2.2.0"

# 2. Forçar novo deploy
supabase functions deploy server --no-verify-jwt

# 3. Limpar cache do navegador
# Ctrl+Shift+Delete (Chrome/Edge)
# Cmd+Shift+Delete (Safari)
```

### ❌ Erro ao fazer deploy via CLI

**Erro comum:** "Project not linked"

**Solução:**
```bash
# Re-link o projeto
supabase link --project-ref YOUR_PROJECT_ID

# Tentar deploy novamente
supabase functions deploy server
```

### ❌ Erro 403 ao fazer deploy via API

**Causa:** Permissões insuficientes

**Solução:** Usar Dashboard ou CLI (ambos têm autenticação adequada)

---

## 📞 SUPORTE

### Logs e Debugging

**Ver logs em tempo real:**
```bash
supabase functions logs server --tail
```

**Ver últimos 100 logs:**
```bash
supabase functions logs server --limit 100
```

### Informações do Sistema

**Verificar versão ativa:**
- Logs devem mostrar: `Server version: 2.2.0`

**Verificar variáveis de ambiente:**
```bash
supabase secrets list
```

### Contato

Se o problema persistir após seguir todos os passos:
1. Revisar logs da Edge Function
2. Verificar se a versão 2.2.0 está ativa
3. Testar com contrato NOVO (não editado)
4. Documentar o erro específico
5. Entrar em contato com o desenvolvedor

---

## ✅ CONCLUSÃO

### Após completar este deploy:

✅ **Contratos NOVOS** terão datas corretas automaticamente
✅ **Contratos EDITADOS** terão datas recalculadas corretamente
✅ **Dados de teste** (seed) terão datas corretas
⚠️ **Contratos ANTIGOS** precisam ser corrigidos manualmente (opcional)

### Arquivos modificados:
- `/supabase/functions/server/index.tsx` (DEPLOY OBRIGATÓRIO)
- `/src/app/utils/dateUtils.ts` (NOVO - uso opcional)

### Versão:
**2.2.0** - Fixed timezone issue causing due dates to save one day earlier

---

**Status**: ✅ Correção implementada e pronta para deploy  
**Data**: 28/03/2026  
**Prioridade**: 🔴 ALTA - Deploy recomendado o quanto antes
