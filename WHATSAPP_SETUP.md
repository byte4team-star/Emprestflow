# 📱 Configuração do WhatsApp - Evolution API

## ✅ Implementação Concluída

O sistema agora está **totalmente integrado** com a Evolution API para envio real de mensagens WhatsApp!

## 🔧 Como Configurar

### 1️⃣ Hospedar a Evolution API

Você precisa ter uma instância da Evolution API rodando. Opções:

#### Opção A: Docker (Recomendado)
```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua-chave-secreta-aqui \
  -e DATABASE_ENABLED=true \
  -e DATABASE_CONNECTION_URI=mongodb://usuario:senha@host:27017/evolution \
  atendai/evolution-api:latest
```

#### Opção B: VPS/Servidor
- Siga o guia oficial: https://doc.evolution-api.com/v2/pt/install/docker

#### Opção C: Serviços Cloud
- Railway: https://railway.app
- Render: https://render.com
- DigitalOcean App Platform
- AWS/Google Cloud/Azure

### 2️⃣ Configurar as Variáveis de Ambiente no Supabase

No **Supabase Dashboard** → **Edge Functions** → **Secrets**, adicione:

| Secret | Valor | Exemplo |
|--------|-------|---------|
| `EVOLUTION_API_URL` | URL da sua Evolution API | `https://api.seudominio.com` |
| `EVOLUTION_API_KEY` | API Key da Evolution API | `B6D711FCDE4D4FD5936544120E713976` |

**Observação:** Você já foi solicitado a configurar esses secrets. Se não preencheu ainda:
1. Acesse o Supabase Dashboard
2. Vá em Edge Functions → Secrets
3. Adicione as variáveis acima

### 3️⃣ Conectar um Número WhatsApp

Depois que a Evolution API estiver rodando:

1. **Criar uma instância:**
```bash
curl -X POST https://api.seudominio.com/instance/create \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "emprestflow",
    "qrcode": true
  }'
```

2. **Conectar o WhatsApp:**
```bash
curl -X GET https://api.seudominio.com/instance/connect/emprestflow \
  -H "apikey: SUA_API_KEY"
```

3. **Escanear QR Code:**
   - A API retornará um QR Code em base64
   - Abra o WhatsApp no celular → Aparelhos conectados
   - Escaneie o QR Code

4. **Verificar conexão:**
```bash
curl -X GET https://api.seudominio.com/instance/connectionState/emprestflow \
  -H "apikey: SUA_API_KEY"
```

### 4️⃣ (Opcional) Configurar Nome da Instância Personalizado

Se você usar um nome diferente de "emprestflow", adicione um terceiro secret:

| Secret | Valor |
|--------|-------|
| `EVOLUTION_INSTANCE_NAME` | Seu nome personalizado |

## 📨 Como Funciona

### Formato das Mensagens

O sistema envia 3 tipos de mensagens:

#### **Lembrete Antecipado (3 dias antes):**
```
Olá João Silva! 👋

Lembramos que a parcela 2/12 no valor de R$ 500,00 vence em 3 dias (28/02/2026).

📝 Contrato: contract_abc123

Por favor, fique atento ao vencimento!
```

#### **Lembrete do Dia:**
```
Olá João Silva! 👋

⚠️ A parcela 2/12 no valor de R$ 500,00 vence HOJE!

📝 Contrato: contract_abc123

Por favor, regularize seu pagamento.
```

#### **Cobrança de Atraso:**
```
Olá João Silva! 👋

🔴 A parcela 2/12 no valor de R$ 500,00 está em atraso desde 25/02/2026.

📝 Contrato: contract_abc123

Por favor, regularize seu pagamento o quanto antes.
```

### Envio pelo Sistema

1. Acesse **Contratos** → Selecione um contrato
2. Na lista de parcelas, clique no botão **WhatsApp** 📱
3. Escolha o tipo de lembrete
4. A mensagem será enviada automaticamente!

## 🔍 Logs e Auditoria

- Todas as mensagens enviadas são registradas no **Log de Auditoria**
- Status: `sent` (enviada) ou `failed` (falhou)
- Você pode ver o histórico completo em **Logs de Auditoria**

## ⚠️ Limitações e Cuidados

1. **Limites do WhatsApp Business:**
   - Máximo 1000 mensagens/dia para contas novas
   - Evite spam para não ser bloqueado

2. **Formato do Número:**
   - O sistema formata automaticamente: `(11) 98765-4321` → `5511987654321`
   - Certifique-se que os números estão com DDD correto

3. **Requisitos:**
   - Número deve estar ativo e com WhatsApp instalado
   - Evolution API deve estar online e conectada

## 🐛 Troubleshooting

### Erro: "WhatsApp não configurado"
✅ Solução: Configure os secrets `EVOLUTION_API_URL` e `EVOLUTION_API_KEY`

### Erro: "Cliente não possui WhatsApp"
✅ Solução: Edite o cliente e adicione o número WhatsApp

### Erro: "Instance not found"
✅ Solução: Crie e conecte uma instância na Evolution API (passo 3)

### Erro: "Unauthorized"
✅ Solução: Verifique se a API Key está correta

### Mensagem não chega
✅ Solução:
1. Verifique se o número está correto (com DDD)
2. Confirme que a instância está conectada
3. Veja os logs da Evolution API

## 📚 Documentação Adicional

- Evolution API: https://doc.evolution-api.com
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- WhatsApp Business Policy: https://www.whatsapp.com/legal/business-policy

## 🎉 Recursos Implementados

✅ Envio real de mensagens via Evolution API  
✅ Formatação automática de números  
✅ 3 tipos de mensagens (antecipado, hoje, atraso)  
✅ Logs de auditoria completos  
✅ Tratamento de erros robusto  
✅ Mensagens formatadas com emojis  
✅ Validação de número WhatsApp  
✅ Integração segura com secrets  

## 💡 Próximos Passos Sugeridos

1. **Automação:** Criar cronjob para envio automático de lembretes
2. **Templates:** Permitir customizar mensagens
3. **Respostas:** Integrar webhooks para receber respostas
4. **Relatórios:** Dashboard de mensagens enviadas/recebidas
5. **Multi-canal:** Adicionar SMS e Email como alternativa

---

**Sistema desenvolvido em:** Fevereiro 2026  
**Última atualização:** 27/02/2026
