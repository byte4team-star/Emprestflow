# 📱 Sistema de Cobrança Automática via WhatsApp

## 📋 Visão Geral

O sistema de **Cobrança Automática** envia mensagens via WhatsApp para os clientes de forma inteligente e programada, lembrando sobre vencimentos de parcelas e enviando cobranças para parcelas em atraso.

---

## ✨ Funcionalidades

### 1. **Mensagens Automáticas**
- ✅ Lembretes **antes do vencimento** (ex: 3 dias antes)
- ✅ Notificação **no dia do vencimento**
- ✅ Cobranças **após o vencimento** (ex: 1, 3, 7 e 15 dias de atraso)

### 2. **Templates Personalizáveis**
- Crie mensagens profissionais com variáveis dinâmicas
- Ative/desative templates específicos
- Teste mensagens antes de ativar

### 3. **Configurações Inteligentes**
- **Horário comercial**: Envie apenas em horários específicos (ex: 9h às 18h)
- **Evita duplicação**: Não envia a mesma mensagem duas vezes no mesmo dia
- **Status em tempo real**: Acompanhe taxa de sucesso e falhas

### 4. **Dashboard Completo**
- Total de mensagens enviadas
- Mensagens enviadas hoje
- Taxa de sucesso
- Mensagens pendentes
- Falhas nas últimas 24h

---

## 🚀 Como Configurar

### **Passo 1: Acessar o Sistema**

1. Faça login como **Administrador** ou **Operador**
2. No menu lateral, clique em **"Cobrança Automática"**

### **Passo 2: Ativar o Sistema**

1. Na tela principal, você verá um **switch** no topo
2. Ative o switch para **"Sistema Ativo"**
3. ✅ Pronto! O sistema está ativo e processará cobranças automaticamente

### **Passo 3: Criar Templates de Mensagens**

1. Vá para a aba **"Templates de Mensagens"**
2. Role até o final e preencha:
   - **Nome do Template**: Ex: "Lembrete 3 dias antes"
   - **Tipo de Mensagem**: Escolha quando enviar
     - `Antes do Vencimento`
     - `No Dia do Vencimento`
     - `Após o Vencimento`
   - **Dias Antes/Depois**: Quantos dias antes ou depois do vencimento
   - **Mensagem**: Texto da mensagem (veja variáveis abaixo)
3. Clique em **"Criar Template"**

#### **Variáveis Disponíveis:**

Use estas variáveis na mensagem para personalizar automaticamente:

| Variável | Substituído por |
|----------|----------------|
| `{cliente}` | Nome do cliente |
| `{valor}` | Valor da parcela (R$ 500,00) |
| `{vencimento}` | Data de vencimento (15/03/2026) |
| `{parcela}` | Número da parcela (3) |
| `{contrato}` | Número do contrato (12345) |
| `{dias_atraso}` | Dias de atraso (2) |

#### **Exemplo de Template:**

```
Olá {cliente}! 

Este é um lembrete sobre o vencimento da parcela {parcela} do contrato #{contrato}.

💰 Valor: {valor}
📅 Vencimento: {vencimento}

Para evitar multas e juros, por favor efetue o pagamento até a data informada.

Qualquer dúvida, estamos à disposição!

Atenciosamente,
Equipe ALEMÃO RN
```

### **Passo 4: Configurar Horário de Envio**

1. Vá para a aba **"Configurações"**
2. Ative **"Respeitar Horário Comercial"**
3. Defina:
   - **Hora Inicial**: 9
   - **Hora Final**: 18
4. Clique em **"Salvar Configurações"**

---

## 🔄 Processamento Automático

O sistema processa cobranças automaticamente através de um **CRON job** que:

1. ✅ Verifica se o sistema está ativo
2. ✅ Checa o horário comercial (se configurado)
3. ✅ Busca todos os contratos ativos
4. ✅ Identifica parcelas pendentes e em atraso
5. ✅ Envia mensagens conforme os templates configurados
6. ✅ Registra logs de todos os envios

### **Endpoint de Processamento:**

```
POST /make-server-bd42bc02/billing/process
```

Este endpoint pode ser chamado:
- **Manualmente**: Para teste
- **Via CRON**: Configurando um job para executar diariamente

### **Configuração de CRON (Supabase)**

Para processar automaticamente todos os dias às 9h:

1. Acesse o painel do **Supabase**
2. Vá em **Edge Functions** > **Cron Jobs**
3. Adicione um novo job:
   - **Schedule**: `0 9 * * *` (todo dia às 9h)
   - **Function**: `make-server-bd42bc02`
   - **Endpoint**: `/billing/process`

---

## 📊 Monitoramento

### **Dashboard de Estatísticas**

Na aba **"Visão Geral"**, você encontra:

- 📤 **Total Enviadas**: Todas as mensagens já enviadas
- 📅 **Hoje**: Mensagens enviadas hoje
- 📈 **Taxa de Sucesso**: % de mensagens entregues com sucesso
- ⏳ **Pendentes**: Mensagens aguardando envio
- ❌ **Falhas (24h)**: Mensagens que falharam nas últimas 24 horas

---

## 🧪 Testando o Sistema

### **Testar um Template:**

1. Na aba **"Templates de Mensagens"**
2. Encontre o template que deseja testar
3. Clique no botão **"Testar"**
4. ✅ Uma mensagem de teste será enviada para o número administrativo (81985828087)

**Exemplo de Mensagem de Teste:**

```
🧪 TESTE DE MENSAGEM

Olá João Silva! 

Este é um lembrete sobre o vencimento da parcela 3 do contrato #12345.

💰 Valor: R$ 500,00
📅 Vencimento: 15/03/2026

--- Esta é uma mensagem de teste ---
```

---

## 🔧 Integração com Evolution API

O sistema utiliza a **Evolution API** para enviar mensagens via WhatsApp.

### **Variáveis de Ambiente Necessárias:**

```env
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave-aqui
EVOLUTION_INSTANCE_NAME=emprestflow
```

**Status da Conexão:**

Na aba **"Configurações"**, você pode verificar se a Evolution API está conectada:

- ✅ **Evolution API configurada e funcionando**
- ❌ **Evolution API não configurada**

---

## 📝 Exemplos de Uso

### **Exemplo 1: Lembrete 3 Dias Antes**

**Template:**
- Nome: Lembrete 3 dias antes
- Tipo: Antes do Vencimento
- Dias: 3

**Mensagem:**
```
Olá {cliente}! 👋

Lembramos que a parcela {parcela} do seu contrato #{contrato} vence em 3 dias.

💰 Valor: {valor}
📅 Vencimento: {vencimento}

Fique atento para não perder o prazo!
```

---

### **Exemplo 2: Notificação no Vencimento**

**Template:**
- Nome: Dia do vencimento
- Tipo: No Dia do Vencimento
- Dias: 0

**Mensagem:**
```
Olá {cliente}! 

Hoje é o dia de vencimento da parcela {parcela}.

💰 Valor: {valor}
📅 Vencimento: HOJE ({vencimento})

Por favor, efetue o pagamento para evitar multas e juros.
```

---

### **Exemplo 3: Cobrança 7 Dias de Atraso**

**Template:**
- Nome: Cobrança 7 dias atraso
- Tipo: Após o Vencimento
- Dias: 7

**Mensagem:**
```
Olá {cliente},

Identificamos que a parcela {parcela} do contrato #{contrato} está com {dias_atraso} dias de atraso.

💰 Valor original: {valor}
📅 Vencimento: {vencimento}

⚠️ Multa e juros já foram aplicados.

Por favor, regularize sua situação o quanto antes para evitar maiores transtornos.

Para negociação, entre em contato conosco.
```

---

## 🛡️ Segurança e LGPD

✅ **Conformidade com LGPD:**
- Mensagens enviadas apenas para clientes que aceitaram os termos
- Logs completos de todos os envios para auditoria
- Dados criptografados em trânsito

✅ **Controle de Acesso:**
- Apenas Administradores e Operadores podem configurar
- Logs de auditoria registram todas as alterações

---

## ❓ Perguntas Frequentes

### **1. Como sei se as mensagens estão sendo enviadas?**

Verifique o dashboard na aba "Visão Geral". Você verá:
- Total de mensagens enviadas hoje
- Taxa de sucesso
- Falhas recentes

### **2. Posso desativar temporariamente?**

Sim! Basta desativar o **switch** no topo da página. O sistema para imediatamente de enviar mensagens.

### **3. O sistema envia mensagens duplicadas?**

Não. O sistema verifica se já enviou uma mensagem específica no dia antes de enviar novamente.

### **4. Posso ter vários templates do mesmo tipo?**

Sim! Você pode ter múltiplos templates. Por exemplo:
- Lembrete 5 dias antes
- Lembrete 3 dias antes
- Lembrete 1 dia antes

Todos serão enviados se estiverem ativos.

### **5. Como desativo um template sem excluir?**

Use o **switch** ao lado de cada template para ativar/desativar sem excluir.

---

## 🎯 Melhores Práticas

### **✅ Recomendações:**

1. **Crie pelo menos 3 templates:**
   - 1 antes do vencimento (3 dias)
   - 1 no dia do vencimento
   - 1-2 após o vencimento (1 e 7 dias)

2. **Seja profissional mas cordial:**
   - Use emojis com moderação
   - Seja claro e objetivo
   - Sempre ofereça contato para dúvidas

3. **Respeite o horário comercial:**
   - Configure envios entre 9h e 18h
   - Evite fins de semana (se possível)

4. **Teste antes de ativar:**
   - Use o botão "Testar" em cada template
   - Verifique se as variáveis estão corretas

5. **Monitore regularmente:**
   - Verifique a taxa de sucesso semanalmente
   - Ajuste mensagens que não estão tendo boa resposta

### **❌ Evite:**

- Enviar mensagens muito longas
- Usar linguagem agressiva
- Enviar fora do horário comercial
- Ativar muitos templates de uma vez sem testar

---

## 🆘 Suporte

Em caso de problemas:

1. Verifique a aba "Configurações" para confirmar a conexão com Evolution API
2. Revise os logs de falhas no dashboard
3. Entre em contato com o suporte técnico

---

**Sistema desenvolvido por ALEMÃO RN**  
📅 Última atualização: Março de 2026
