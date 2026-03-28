# 🔧 Correção de Timezone - Data de Vencimento

## 📌 INÍCIO RÁPIDO

**Problema:** Datas de vencimento das parcelas sendo gravadas **UM DIA ANTES** do selecionado.

**Solução:** Correção implementada no backend (Edge Function).

**Status:** ✅ Código corrigido | ⚠️ Deploy manual necessário

---

## 🎯 O QUE PRECISO FAZER?

### 1️⃣ Para Deploy Rápido (5-10 minutos)

1. Leia: [`RESUMO_CORRECAO.txt`](./RESUMO_CORRECAO.txt) **(COMECE AQUI!)**
2. Execute: Deploy via Supabase Dashboard
3. Teste: Crie um contrato novo e verifique a data

### 2️⃣ Para Deploy Completo (20-30 minutos)

1. Leia: [`INSTRUCOES_DEPLOY_COMPLETO.md`](./INSTRUCOES_DEPLOY_COMPLETO.md)
2. Siga: [`CHECKLIST_DEPLOY.md`](./CHECKLIST_DEPLOY.md)
3. Execute: Todos os testes de verificação

### 3️⃣ Para Entendimento Técnico

1. Leia: [`CORRECAO_TIMEZONE_DEPLOY.md`](./CORRECAO_TIMEZONE_DEPLOY.md)
2. Analise: Código antes vs depois
3. Execute: Testes automatizados

---

## 📚 DOCUMENTAÇÃO DISPONÍVEL

### 📄 Documentos Principais

| Arquivo | Descrição | Quando Usar |
|---------|-----------|-------------|
| **[RESUMO_CORRECAO.txt](./RESUMO_CORRECAO.txt)** | Resumo executivo em texto simples | **Comece aqui!** Visão geral rápida |
| **[INSTRUCOES_DEPLOY_COMPLETO.md](./INSTRUCOES_DEPLOY_COMPLETO.md)** | Guia completo passo a passo | Deploy passo a passo com detalhes |
| **[CHECKLIST_DEPLOY.md](./CHECKLIST_DEPLOY.md)** | Checklist interativo | Acompanhe seu progresso |
| **[CORRECAO_TIMEZONE_DEPLOY.md](./CORRECAO_TIMEZONE_DEPLOY.md)** | Detalhes técnicos da correção | Entenda o código modificado |

### 🧪 Testes e Validação

| Arquivo | Descrição | Como Usar |
|---------|-----------|-----------|
| **[test-timezone-fix.html](./test-timezone-fix.html)** | Teste visual interativo | Abra no navegador |
| **[test-date-correction.js](./test-date-correction.js)** | Teste via console | Cole no console do navegador (F12) |

### 💻 Código Atualizado

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `/supabase/functions/server/index.tsx` | ✅ Atualizado | Edge Function corrigida (v2.2.0) |
| `/src/app/utils/dateUtils.ts` | ✨ Novo | Utilitários de data (frontend - opcional) |

---

## 🚀 GUIA RÁPIDO DE DEPLOY

### Opção 1: Supabase Dashboard (Recomendado para iniciantes)

```
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Edge Functions > "server"
4. Clique em "Edit"
5. Cole o código de: /supabase/functions/server/index.tsx
6. Clique em "Save"
7. ✅ Pronto!
```

### Opção 2: Supabase CLI (Recomendado para desenvolvedores)

```bash
# Login
supabase login

# Link projeto (substitua SEU_PROJECT_ID)
supabase link --project-ref SEU_PROJECT_ID

# Deploy
supabase functions deploy server --no-verify-jwt

# Verificar
supabase functions logs server --tail
```

---

## ✅ VERIFICAÇÃO PÓS-DEPLOY

### Teste Simples (2 minutos)

1. **Criar contrato:**
   - Primeiro vencimento: `15/04/2026`
   
2. **Verificar:**
   - ✅ Primeira parcela mostra: `15/04/2026` → **Correção funcionando!**
   - ❌ Primeira parcela mostra: `14/04/2026` → Revisar deploy

### Teste Completo

Siga o checklist em [`CHECKLIST_DEPLOY.md`](./CHECKLIST_DEPLOY.md)

---

## 🔍 DETALHES TÉCNICOS

### O que foi mudado?

**ANTES (Problema):**
```typescript
const dueDate = new Date(year, month + i, day);
const formatted = `${dueDate.getFullYear()}-...`;
```

**DEPOIS (Solução):**
```typescript
const dueDate = new Date(Date.UTC(year, month + i, day));
const formatted = `${dueDate.getUTCFullYear()}-...`;
```

### Por quê?

- `new Date(year, month, day)` → Usa **timezone local** do servidor
- `Date.UTC(year, month, day)` → Sempre usa **UTC**, sem conversão

### Onde foi aplicado?

1. **Linha ~1151**: Criar contrato (POST `/contracts`)
2. **Linha ~1258**: Editar contrato (PUT `/contracts/:id`)
3. **Linha ~2344**: Dados de teste (POST `/seed`)

---

## ⚠️ IMPORTANTE

### ✅ Após o Deploy

- **Contratos NOVOS**: Datas corretas automaticamente
- **Contratos EDITADOS**: Datas recalculadas corretamente
- **Dados de teste**: Datas corretas

### ❌ Contratos Antigos

- **NÃO** são corrigidos automaticamente
- **OPÇÃO 1**: Editar manualmente cada contrato
- **OPÇÃO 2**: Deixar como está (se não há impacto)
- **OPÇÃO 3**: Aguardar edições naturais

---

## 📊 VERSÕES

| Versão | Data | Descrição |
|--------|------|-----------|
| 2.1.1 | 23/03/2026 | Versão anterior (com problema) |
| **2.2.0** | **28/03/2026** | **Correção de timezone (atual)** |

---

## 🆘 PRECISO DE AJUDA?

### 1. Consulte a Documentação

| Problema | Consulte |
|----------|----------|
| Não sei por onde começar | [`RESUMO_CORRECAO.txt`](./RESUMO_CORRECAO.txt) |
| Erro ao fazer deploy | [`INSTRUCOES_DEPLOY_COMPLETO.md`](./INSTRUCOES_DEPLOY_COMPLETO.md) → Seção "Problemas e Soluções" |
| Datas ainda incorretas | [`CHECKLIST_DEPLOY.md`](./CHECKLIST_DEPLOY.md) → Verificar cada passo |
| Dúvida técnica | [`CORRECAO_TIMEZONE_DEPLOY.md`](./CORRECAO_TIMEZONE_DEPLOY.md) |

### 2. Execute os Testes

- **Visual**: Abra [`test-timezone-fix.html`](./test-timezone-fix.html)
- **Console**: Execute [`test-date-correction.js`](./test-date-correction.js)

### 3. Verifique os Logs

```bash
# Via CLI
supabase functions logs server --tail

# Via Dashboard
Edge Functions > server > Logs
```

Deve aparecer: `Server version: 2.2.0`

---

## 📋 FLUXO RECOMENDADO

```
┌─────────────────────────────────────────────────┐
│  1. Leia RESUMO_CORRECAO.txt                    │
│     ↓                                            │
│  2. Escolha método de deploy                    │
│     ↓                                            │
│  3. Execute deploy (Dashboard ou CLI)           │
│     ↓                                            │
│  4. Verifique logs (versão 2.2.0?)              │
│     ↓                                            │
│  5. Execute testes básicos                       │
│     ↓                                            │
│  6. ✅ Se passou: Monitorar sistema             │
│     ❌ Se falhou: INSTRUCOES_DEPLOY_COMPLETO.md │
└─────────────────────────────────────────────────┘
```

---

## 🎯 CHECKLIST RÁPIDO

```
[ ] Li o RESUMO_CORRECAO.txt
[ ] Fiz deploy da Edge Function
[ ] Verifiquei versão 2.2.0 nos logs
[ ] Criei contrato de teste
[ ] Confirmei data correta (15/04 = 15/04, não 14/04)
[ ] ✅ Correção funcionando!
```

---

## 📞 SUPORTE

**Problemas após seguir toda a documentação?**

1. **Documente o erro:**
   - Logs da Edge Function
   - Prints da tela
   - Passos executados

2. **Informações necessárias:**
   - Versão mostrada nos logs
   - Método de deploy usado
   - Resultado dos testes

3. **Contate o desenvolvedor** com as informações acima

---

## 🏆 STATUS FINAL

```
┌──────────────────────────────────────────────────┐
│  CORREÇÃO IMPLEMENTADA E TESTADA                 │
│  ✅ Backend: Código corrigido (v2.2.0)           │
│  ✅ Documentação: Completa e detalhada           │
│  ✅ Testes: Disponíveis e funcionais             │
│  ⚠️  Deploy: Manual necessário                   │
│  📅 Data: 28/03/2026                             │
└──────────────────────────────────────────────────┘
```

---

## 📎 ARQUIVOS CRIADOS

### Backend
- `/supabase/functions/server/index.tsx` (atualizado)

### Frontend (Opcional)
- `/src/app/utils/dateUtils.ts` (novo)

### Documentação
- `README_CORRECAO_TIMEZONE.md` (este arquivo)
- `RESUMO_CORRECAO.txt`
- `INSTRUCOES_DEPLOY_COMPLETO.md`
- `CHECKLIST_DEPLOY.md`
- `CORRECAO_TIMEZONE_DEPLOY.md`

### Testes
- `test-timezone-fix.html`
- `test-date-correction.js`

---

**Última atualização:** 28/03/2026  
**Versão:** 2.2.0  
**Status:** ✅ Pronto para deploy

---

💡 **DICA:** Comece pelo [`RESUMO_CORRECAO.txt`](./RESUMO_CORRECAO.txt) para uma visão geral rápida!
