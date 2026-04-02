# 🔧 Configuração da Evolution API - Guia Completo

**Sistema ALEMÃO RN**  
Versão 2.1.1 - Março 2026

---

## ❌ PROBLEMA IDENTIFICADO

```
Error: Invalid URL: 'agiotaflow/message/sendText/emprestflow'
```

**Causa:** A variável `EVOLUTION_API_URL` está configurada com um valor incorreto.

Valor atual: `agiotaflow`  
Valor esperado: `https://api.evolution.com` (ou URL completa da sua API)

---

## ✅ SOLUÇÃO RÁPIDA

### **Passo 1: Verificar o Erro**

Os logs mostram:
```
[INIT] ⚠️ INVALID EVOLUTION_API_URL FORMAT!
[INIT] Current value: agiotaflow
[INIT] Expected format: https://your-api.com
```

### **Passo 2: Corrigir no Supabase Dashboard**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Edge Functions** → **Secrets**
4. Localize `EVOLUTION_API_URL`
5. Altere de `agiotaflow` para a URL completa da sua API Evolution

**Exemplo de URL correta:**
```
https://evolution.seudominio.com
```
ou
```
http://192.168.1.100:8080
```

### **Passo 3: Reiniciar o Edge Function**

Após alterar a variável:
1. O Edge Function reiniciará automaticamente
2. Verifique os logs novos para confirmar:
```
[INIT] ✅ Evolution API URL format is valid: https://...
```

---

## 📋 CONFIGURAÇÃO COMPLETA

### **Variáveis Necessárias**

No Supabase Dashboard, configure estas 3 variáveis:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `EVOLUTION_API_URL` | URL completa da API | `https://evolution.seudominio.com` |
| `EVOLUTION_API_KEY` | Chave de autenticação | `B6D711FCDE4D4FD5936544120E713976` |
| `EVOLUTION_INSTANCE_NAME` | Nome da instância | `emprestflow` |

### **Formato Correto da URL**

✅ **CORRETO:**
```bash
https://evolution.seudominio.com
http://192.168.1.100:8080
https://api.evolution.example.com:3000
```

❌ **INCORRETO:**
```bash
agiotaflow                    # Falta protocolo e domínio
evolution.com                 # Falta protocolo (http:// ou https://)
/api/evolution                # Falta domínio completo
```

---

## 🔍 COMO OBTER A URL DA EVOLUTION API

### **Opção 1: Evolution API Hospedada**

Se você tem Evolution API hospedada:
1. Pergunte ao administrador do servidor
2. A URL será algo como: `https://evolution.empresa.com`
3. Inclua a porta se necessário: `https://evolution.empresa.com:8080`

### **Opção 2: Evolution API Local**

Se está rodando localmente:
```bash
http://localhost:8080
# ou
http://192.168.1.100:8080
```

### **Opção 3: Não Tem Evolution API**

Se você ainda não tem Evolution API:

1. **Instale Evolution API** (requer servidor)
2. **Ou use serviço de terceiros** que forneça Evolution API
3. **Ou desative recursos de WhatsApp** até ter a API

---

## 🧪 TESTANDO A CONFIGURAÇÃO

### **Teste 1: Verificar Logs**

1. Acesse Supabase Dashboard
2. Edge Functions → Logs
3. Procure por:
```
[INIT] ✅ Evolution API URL format is valid: https://...
```

### **Teste 2: Enviar Mensagem de Teste**

1. Acesse o sistema
2. Vá em **Cobrança Automática**
3. Crie um template de teste
4. Clique em "Testar"
5. ✅ Mensagem deve chegar no WhatsApp

### **Teste 3: Recuperação de Senha por Celular**

1. Vá em "Esqueceu a senha?"
2. Escolha "Recuperar por Celular"
3. Digite um número cadastrado
4. ✅ Código deve chegar no WhatsApp

---

## 🐛 PROBLEMAS COMUNS

### **Erro: "Invalid URL"**

**Causa:** URL não começa com `http://` ou `https://`

**Solução:**
```bash
# Antes
EVOLUTION_API_URL=agiotaflow

# Depois
EVOLUTION_API_URL=https://evolution.seudominio.com
```

### **Erro: "Evolution API not configured"**

**Causa:** Variável não definida ou vazia

**Solução:**
1. Verifique se `EVOLUTION_API_URL` está definida
2. Verifique se `EVOLUTION_API_KEY` está definida
3. Reinicie o Edge Function

### **Erro: "Connection refused"**

**Causa:** URL correta mas servidor não está acessível

**Solução:**
1. Verifique se Evolution API está rodando
2. Teste a URL no navegador
3. Verifique firewall/portas

### **Erro: "Unauthorized"**

**Causa:** API Key incorreta

**Solução:**
1. Verifique `EVOLUTION_API_KEY` no Supabase
2. Compare com a chave da Evolution API
3. Gere nova chave se necessário

---

## 📱 ONDE A URL É USADA

A `EVOLUTION_API_URL` é usada para:

### **1. Recuperação de Senha**
```typescript
// /supabase/functions/server/index.tsx
const whatsappUrl = `${evolutionApiUrl}/message/sendText/${evolutionInstanceName}`;
```

### **2. Cobrança Automática**
```typescript
// /supabase/functions/server/billing_routes.tsx
fetch(`${evolutionApiUrl}/message/sendText/${evolutionInstanceName}`, {...})
```

### **3. Cadastro de Clientes**
```typescript
// /supabase/functions/server/index.tsx
fetch(`${evolutionApiUrl}/message/sendLocation/${evolutionInstanceName}`, {...})
```

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

- [ ] **EVOLUTION_API_URL** definida no Supabase
- [ ] URL começa com `http://` ou `https://`
- [ ] URL está acessível (testar no navegador)
- [ ] **EVOLUTION_API_KEY** definida corretamente
- [ ] **EVOLUTION_INSTANCE_NAME** definida (padrão: `emprestflow`)
- [ ] Evolution API está rodando
- [ ] Instância `emprestflow` existe na Evolution API
- [ ] Logs não mostram erros de formato
- [ ] Teste de mensagem funciona
- [ ] Recuperação de senha por celular funciona

---

## 🚀 EXEMPLO PRÁTICO

### **Cenário Real:**

Você tem Evolution API rodando em:
```
https://whatsapp.minhaempresa.com.br
```

Com a chave de API:
```
B6D711FCDE4D4FD5936544120E713976
```

E instância chamada:
```
emprestflow
```

### **Configuração no Supabase:**

```bash
EVOLUTION_API_URL=https://whatsapp.minhaempresa.com.br
EVOLUTION_API_KEY=B6D711FCDE4D4FD5936544120E713976
EVOLUTION_INSTANCE_NAME=emprestflow
```

### **Resultado:**

URLs geradas automaticamente:
```
https://whatsapp.minhaempresa.com.br/message/sendText/emprestflow
https://whatsapp.minhaempresa.com.br/message/sendLocation/emprestflow
```

---

## 📞 SUPORTE

### **Logs Importantes**

Sempre verifique os logs em:
```
Supabase Dashboard → Edge Functions → server → Logs
```

Procure por:
```
[INIT] Evolution API URL format is valid ✅
[BILLING] Sending test message to Evolution API
[FORGOT_PASSWORD] WhatsApp sent to...
```

### **Debug Mode**

Os logs agora incluem:
- Validação de formato da URL
- URL completa sendo chamada
- Resposta da API em caso de erro

---

## 🎯 RESULTADO ESPERADO

Após configurar corretamente:

```
[INIT] ✅ Evolution API URL format is valid: https://evolution.seudominio.com
[BILLING] Sending test message to Evolution API: https://evolution.seudominio.com/message/sendText/emprestflow
[BILLING] Evolution API success: { messageId: "3EB0..." }
```

---

## ⚡ AÇÃO IMEDIATA

**Para resolver o erro agora:**

1. Acesse Supabase Dashboard
2. Settings → Edge Functions → Secrets
3. Localize `EVOLUTION_API_URL`
4. Altere de `agiotaflow` para URL completa (ex: `https://sua-api.com`)
5. Salve
6. Aguarde 30 segundos
7. Teste novamente

---

*Documentação criada em: 16/03/2026*  
*Sistema ALEMÃO RN - Versão 2.1.1*  
*Fix: Evolution API URL validation*
