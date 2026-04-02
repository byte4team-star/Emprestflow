# ❓ FAQ - Perguntas Frequentes sobre o Deploy

## 📌 Perguntas Gerais

### ❓ Por que meu código não está funcionando se eu já corrigi?

**Resposta:** Você corrigiu os arquivos na pasta **errada**!

- ❌ Você editou: `/supabase/functions/server/`
- ✅ Deveria estar em: `/supabase/functions/make-server-bd42bc02/`

O Supabase só executa a função `make-server-bd42bc02`, que está incompleta.

---

### ❓ Por que existem duas pastas de Edge Functions?

**Resposta:** A pasta `server/` foi criada localmente com as correções, mas a função real no Supabase se chama `make-server-bd42bc02`. Provavelmente houve uma renomeação ou criação de nova função no processo de desenvolvimento.

---

### ❓ Preciso deletar a pasta `server/`?

**Resposta:** **NÃO!** Mantenha as duas pastas. A pasta `server/` contém as correções corretas. Você só precisa copiar os arquivos dela para `make-server-bd42bc02/`.

---

### ❓ Qual a diferença entre as duas pastas?

| Pasta | Status | Versão | Deploy |
|-------|--------|--------|--------|
| `server/` | ✅ Completa | v2.2.0 | ❌ Não deployada |
| `make-server-bd42bc02/` | ❌ Incompleta | - | ✅ Deployada |

---

## 🔧 Perguntas Técnicas

### ❓ Quais arquivos preciso copiar?

**Resposta:** Apenas 3 arquivos:

1. `index.tsx` (arquivo principal - 3020 linhas)
2. `billing_routes.tsx` (rotas de cobrança - 818 linhas)
3. `client_portal_routes.tsx` (portal do cliente - 771 linhas)

Os outros 2 arquivos (`health.tsx` e `kv_store.tsx`) já existem no Supabase.

---

### ❓ Como sei se o deploy funcionou?

**Resposta:** Execute o health check:

```bash
curl https://nbelraenszprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/health
```

Se retornar `"version": "2.2.0"`, o deploy funcionou! ✅

---

### ❓ E se o health check retornar versão diferente?

**Resposta:** Significa que o deploy do `index.tsx` não funcionou. Verifique:

1. Você copiou TODO o conteúdo do arquivo?
2. Você clicou em "Deploy new version" após colar?
3. Não houve erro de sintaxe?

---

### ❓ Posso usar Git para fazer deploy?

**Resposta:** Não diretamente. O deploy via GitHub Actions está dando erro 403. Use uma das opções:

1. **Dashboard do Supabase** (mais fácil)
2. **Supabase CLI** (pode dar erro 403)
3. **Script `deploy-edge-function-fix.sh`** (tenta CLI, senão orienta para Dashboard)

---

## 🐛 Perguntas sobre Correções

### ❓ O que foi corrigido na versão 2.2.0?

**Resposta:** Duas correções críticas:

1. **Timezone Fix:** Datas de vencimento agora são salvas corretamente
   - Antes: Salvava -1 dia (bug de timezone)
   - Depois: Salva a data exata informada

2. **Cálculo de Juros:** Agora usa juros simples
   - Antes: Usava Tabela Price (fórmula errada)
   - Depois: Usa juros simples corretamente

---

### ❓ Como funcionava o bug de timezone?

**Resposta:**

```typescript
// ANTES (ERRADO):
const dueDate = new Date(2026, 3, 15); // 15 de abril
// JavaScript criava em timezone local (GMT-3)
// Ao converter para UTC, virava 14 de abril ❌

// DEPOIS (CORRETO):
const dueDate = new Date(Date.UTC(2026, 3, 15));
// Cria diretamente em UTC
// Data salva: 15 de abril ✅
```

---

### ❓ O que é juros simples vs Tabela Price?

**Resposta:**

**Juros Simples** (correto para este sistema):
```
Total = Principal × (1 + taxa × parcelas)
Parcela = Total ÷ parcelas

Exemplo: R$ 1.000 × (1 + 10% × 4) = R$ 1.400
Parcela: R$ 350
```

**Tabela Price** (estava sendo usado incorretamente):
```
PMT = P × i × (1 + i)^n / ((1 + i)^n - 1)
(Fórmula complexa de amortização)
```

---

## 🚀 Perguntas sobre Deploy

### ❓ Quanto tempo leva o deploy?

**Resposta:**
- Via Dashboard: 5-10 minutos (manual)
- Via CLI: 2-3 minutos (se funcionar)
- Via Script: Depende do método usado

---

### ❓ O deploy afeta os usuários?

**Resposta:** Sim, mas o impacto é mínimo:

- ⏱️ **Downtime:** ~10-30 segundos durante deploy
- ✅ **Sessões ativas:** Não são afetadas
- ✅ **Dados:** Não são perdidos
- ⚠️ **Contratos antigos:** Continuarão com datas erradas

---

### ❓ Preciso deletar contratos antigos?

**Resposta:** Depende:

- Se criou apenas para teste: **Sim, delete**
- Se são contratos reais de produção: **Não delete, mas corrija manualmente**

Para deletar todos os dados de teste:
```
POST /make-server-bd42bc02/seed-data
```
(Isso recria tudo com dados corretos)

---

### ❓ O erro 403 no deploy via CLI tem solução?

**Resposta:** Infelizmente, não neste momento. O erro 403 indica problema de permissões no GitHub/Supabase. A solução é fazer deploy via Dashboard do Supabase.

---

## 📊 Perguntas sobre Teste

### ❓ Como testar se as correções funcionaram?

**Resposta:** Use o arquivo `test-deploy-corrigido.html`:

1. Abra o arquivo no navegador
2. Execute o "Health Check" (deve retornar v2.2.0)
3. Faça login
4. Crie um contrato de teste
5. Verifique se as datas estão corretas

---

### ❓ Qual a data esperada para teste?

**Resposta:**

Se criar contrato com primeiro vencimento em **15/04/2026**:

```
✅ CORRETO (v2.2.0):
Parcela 1: 15/04/2026
Parcela 2: 15/05/2026
Parcela 3: 15/06/2026
Parcela 4: 15/07/2026

❌ ERRADO (versão antiga):
Parcela 1: 14/04/2026
Parcela 2: 14/05/2026
Parcela 3: 14/06/2026
Parcela 4: 14/07/2026
```

---

### ❓ Como testar o cálculo de juros?

**Resposta:**

Teste: Empréstimo de R$ 1.000, 4 parcelas, 10% ao mês

```
✅ CORRETO (Juros Simples):
Total: R$ 1.000 × (1 + 0,10 × 4) = R$ 1.400
Parcela: R$ 350

❌ ERRADO (Tabela Price):
Parcela: ~R$ 315,47
(Valor diferente!)
```

---

## 💡 Perguntas sobre Manutenção

### ❓ Preciso fazer backup antes do deploy?

**Resposta:** **Recomendado, mas não obrigatório.**

O deploy só atualiza o código, não afeta os dados. Mas é sempre bom ter backup.

Para exportar dados importantes:
1. Acesse Supabase Dashboard
2. Vá em "Database" → "Tables"
3. Exporte as tabelas importantes

---

### ❓ O que fazer se algo der errado?

**Resposta:**

1. **Não entre em pânico!** 😊
2. Verifique os logs no Dashboard do Supabase
3. Tente o health check para ver se a função está respondendo
4. Se necessário, faça rollback para versão anterior (via Dashboard)

---

### ❓ Como fazer rollback?

**Resposta:**

No Supabase Dashboard:
1. Vá em Functions → `make-server-bd42bc02`
2. Clique em "Deployments" (histórico)
3. Selecione a versão anterior
4. Clique em "Redeploy"

---

## 🎓 Perguntas de Aprendizado

### ❓ Por que não usar Tabela Price?

**Resposta:** Tabela Price é para amortização, onde as parcelas têm juros decrescentes e amortização crescente. O sistema precisa de **juros simples** onde todas as parcelas têm o mesmo valor.

---

### ❓ O que é UTC e por que importa?

**Resposta:**

- **UTC:** Coordinated Universal Time (horário padrão mundial)
- **Por que importa:** Bancos de dados salvam datas em UTC
- **Problema:** JavaScript cria datas em timezone local (GMT-3 no Brasil)
- **Solução:** Criar datas diretamente em UTC

---

### ❓ Onde aprender mais sobre Edge Functions?

**Resposta:**

- [Documentação Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Deploy Docs](https://deno.com/deploy/docs)
- Arquivos locais:
  - `ARQUITETURA_SISTEMA_COBRANCA.md`
  - `CORRECAO_TIMEZONE_DEPLOY.md`

---

## 🆘 Precisa de Ajuda?

### ❓ Onde encontrar suporte?

1. **Documentação local:**
   - `ACAO_IMEDIATA.md` - Guia rápido
   - `RESUMO_PROBLEMA_E_SOLUCAO.md` - Visão geral
   - `INSTRUCAO_DEPLOY_EDGE_FUNCTION.md` - Passo a passo completo

2. **Logs do Supabase:**
   - Dashboard → Functions → make-server-bd42bc02 → Logs

3. **Testes:**
   - `test-deploy-corrigido.html` - Interface de testes

---

**Última atualização:** 28/03/2026  
**Versão:** 1.0  
**Contribuições:** Bem-vindas!
