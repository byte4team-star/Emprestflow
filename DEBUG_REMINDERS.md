# 🔍 DEBUG - LEMBRETES NÃO CARREGANDO

## 🎯 POSSÍVEIS CAUSAS

### 1️⃣ **Não há contratos com parcelas próximas do vencimento**

**Critérios para aparecer nos lembretes:**
- Parcela deve estar com status diferente de `paid` ou `cancelled`
- Contrato deve estar com status diferente de `cancelled`
- Data de vencimento deve estar dentro de 15 dias (passado ou futuro)

**Classificação:**
- 🔴 **Atrasado (overdue)**: daysUntilDue < 0
- 🟡 **Vence Hoje (due_today)**: daysUntilDue entre 0 e 6 dias
- 🔵 **Próximo (upcoming)**: daysUntilDue entre 7 e 15 dias

---

### 2️⃣ **Todas as parcelas estão pagas**

Se você marcou todas as parcelas como pagas, elas não aparecerão nos lembretes.

**Solução:**
- Crie um novo contrato
- Ou desmarque o pagamento de alguma parcela existente

---

### 3️⃣ **Datas de vencimento muito longe**

Se todas as parcelas vencem em mais de 15 dias, não aparecerão.

**Solução:**
- Edite um contrato existente
- Altere a data de vencimento de alguma parcela para próxima do dia de hoje

---

## 🧪 TESTE RÁPIDO

### **Verificar no Console do Navegador:**

```javascript
// 1. Abra a página de Lembretes
// 2. Abra DevTools (F12)
// 3. Vá na aba Console
// 4. Veja as mensagens:

[REMINDERS] Carregando lembretes...
[REMINDERS] Resposta da API: {...}
[REMINDERS] Lembretes encontrados: 0 (ou número)
```

**Se mostrar:**
- `Lembretes encontrados: 0` → Não há lembretes no período
- `Erro ao carregar` → Problema na API

---

## 🛠️ COMO CRIAR DADOS DE TESTE COM LEMBRETES

### **Opção 1: Via Empréstimo Rápido**

```
1. Vá em: ⚡ Empréstimo Rápido
2. Selecione um cliente
3. Preencha:
   - Valor Emprestado: R$ 1.000,00
   - Valor da Parcela: R$ 200,00
   - Quantidade: 6 parcelas
   - Data Vencimento: HOJE ou AMANHÃ ⚠️
4. Confirme
```

**Resultado:** Terá 1 lembrete "Vence Hoje" ou "Próximo"

---

### **Opção 2: Editar Contrato Existente**

```
1. Vá em: Contratos
2. Clique em um contrato
3. Clique em "Editar"
4. Na lista de parcelas, altere a data da primeira para HOJE
5. Salve
```

---

### **Opção 3: Via API (Desenvolvedores)**

```javascript
// No console do navegador (DevTools):

// Buscar contratos
const response = await fetch('/api/contracts');
const data = await response.json();
console.log('Contratos:', data);

// Buscar lembretes
const reminders = await fetch('/api/reminders/due-installments');
const remindersData = await reminders.json();
console.log('Lembretes:', remindersData);
```

---

## 📊 VERIFICAÇÃO PASSO A PASSO

### **PASSO 1: Verificar se há contratos**

```
1. Vá em: Contratos
2. Veja se há pelo menos 1 contrato ativo
3. Se não houver, crie um novo
```

### **PASSO 2: Verificar parcelas**

```
1. Abra um contrato
2. Veja a lista de parcelas
3. Verifique:
   - ✅ Status: deve ser "Pendente" (não "Pago")
   - ✅ Data: deve estar dentro de 15 dias
```

### **PASSO 3: Forçar lembretes de teste**

```
1. Crie um novo contrato
2. Configure:
   - 1ª parcela: Data de ONTEM (atrasado)
   - 2ª parcela: Data de HOJE (vence hoje)
   - 3ª parcela: Data de AMANHÃ (próximo)
3. Vá em Lembretes
4. Deve mostrar 3 lembretes
```

---

## 🎨 TELA VAZIA É NORMAL?

**SIM!** Se você não tiver parcelas próximas do vencimento, verá:

```
┌────────────────────────────────────┐
│   ✅ Nenhum lembrete no momento    │
│   Todas as parcelas estão em dia!  │
└────────────────────────────────────┘
```

**Isso significa que o sistema está funcionando corretamente!**

---

## 🚀 SOLUÇÃO RÁPIDA - CRIAR LEMBRETE DE TESTE

### **Use este script no Console (DevTools):**

```javascript
// 1. Criar cliente de teste (se não houver)
const createClient = async () => {
  const response = await fetch('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Cliente Teste Lembretes',
      cpfCnpj: '999.999.999-99',
      phone: '(11) 99999-9999',
      whatsapp: '(11) 99999-9999',
      email: 'teste@lembretes.com',
      status: 'active',
      lgpdConsent: true
    })
  });
  return response.json();
};

// 2. Criar contrato com vencimento próximo
const createContract = async (clientId) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const response = await fetch('/api/contracts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: clientId,
      amount: 1000,
      installments: 3,
      installmentValue: 350,
      startDate: tomorrow.toISOString().split('T')[0],
      interestRate: 5,
      status: 'active',
      installmentsList: [
        {
          installmentNumber: 1,
          amount: 350,
          dueDate: tomorrow.toISOString().split('T')[0],
          status: 'pending'
        },
        {
          installmentNumber: 2,
          amount: 350,
          dueDate: new Date(tomorrow.setMonth(tomorrow.getMonth() + 1)).toISOString().split('T')[0],
          status: 'pending'
        },
        {
          installmentNumber: 3,
          amount: 350,
          dueDate: new Date(tomorrow.setMonth(tomorrow.getMonth() + 1)).toISOString().split('T')[0],
          status: 'pending'
        }
      ]
    })
  });
  return response.json();
};

// 3. Executar
const setup = async () => {
  const client = await createClient();
  console.log('Cliente criado:', client);
  
  const contract = await createContract(client.client.id);
  console.log('Contrato criado:', contract);
  
  console.log('✅ Dados de teste criados! Vá em Lembretes para ver o resultado.');
};

setup();
```

---

## 📞 AINDA NÃO FUNCIONA?

### **Verificar Logs do Servidor:**

```
1. Vá em: /system-diagnostic
2. Role até "Supabase Connection Diagnostic"
3. Clique em "Executar Diagnóstico"
4. Veja se a API está respondendo
```

### **Verificar Erros no Console:**

```
1. Abra DevTools (F12)
2. Vá na aba Console
3. Veja se há erros em vermelho
4. Copie a mensagem de erro
```

### **Testar Endpoint Direto:**

```bash
curl -X GET "https://seu-projeto.supabase.co/functions/v1/make-server/reminders/due-installments" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "X-User-Token: SEU_TOKEN"
```

---

## 💡 DICAS

### **Para Desenvolvimento:**

1. ✅ Sempre crie contratos com vencimento PRÓXIMO (1-3 dias)
2. ✅ Deixe algumas parcelas SEM pagar
3. ✅ Use datas variadas (ontem, hoje, amanhã, próxima semana)

### **Para Produção:**

1. ✅ Configure notificações automáticas
2. ✅ Revise lembretes diariamente
3. ✅ Marque parcelas como pagas quando receber

---

## 📈 ESTATÍSTICAS ESPERADAS

Se você tem:
- 5 clientes ativos
- 5 contratos ativos
- 3 parcelas por contrato = 15 parcelas

**Lembretes esperados:**
- Se TODAS estiverem pagas = 0 lembretes ✅
- Se TODAS vencerem em > 15 dias = 0 lembretes ✅
- Se 3 vencerem esta semana = 3 lembretes 🔔

---

**Última atualização:** 23/03/2026  
**Versão do Sistema:** 2.1.1
