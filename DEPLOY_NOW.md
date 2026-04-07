# 🚀 Deploy da Edge Function - Passo a Passo

## ✅ Pré-requisitos Concluídos
- [x] Supabase reconectado com todas as permissões
- [x] Código atualizado e pronto para deploy
- [x] Correções de autenticação implementadas

---

## 🎯 Opção 1: Deploy via Figma Make (Agora Deve Funcionar)

Com as permissões corretas, o deploy via Figma Make deve funcionar agora.

### Como fazer:

1. **No Figma Make, procure o botão/opção de Deploy**
   - Pode estar no menu de integrações
   - Ou em "Settings" → "Supabase" → "Deploy Functions"

2. **Selecione a Edge Function `make-server`**

3. **Clique em "Deploy" ou "Publish"**

4. **Aguarde a conclusão** (pode levar 1-2 minutos)

### ✅ Sinais de Sucesso:
- Mensagem: "Deploy successful" ou similar
- Status code: 200 (não 403)
- Logs mostram "Function deployed successfully"

### ❌ Se ainda der erro 403:
- Verifique se você tem plano **Pro** no Supabase (necessário para Edge Functions)
- Tente a Opção 2 (CLI) abaixo

---

## 🎯 Opção 2: Deploy via Supabase CLI (100% Confiável)

Se o Figma Make ainda não funcionar, use a CLI:

### Passo 1: Instalar Supabase CLI

**macOS/Linux:**
```bash
brew install supabase/tap/supabase
```

**Windows (PowerShell como Admin):**
```bash
# Instalar Scoop primeiro (se não tiver)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Instalar Supabase
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Qualquer plataforma (via npm):**
```bash
npm install -g supabase
```

### Passo 2: Login

```bash
supabase login
```

Isso abrirá seu navegador. Faça login normalmente.

### Passo 3: Vincular Projeto

Você precisa do **PROJECT_ID**. Encontre em:
- Supabase Dashboard → Settings → General → Reference ID

```bash
supabase link --project-ref <SEU_PROJECT_ID>
```

Exemplo:
```bash
supabase link --project-ref h6ns2b7kryo4rqu6
```

### Passo 4: Deploy

```bash
supabase functions deploy make-server
```

**Aguarde a mensagem:**
```
Deploying function make-server...
Function deployed successfully!
```

---

## 🧪 Testando o Deploy

Após o deploy (qualquer método), teste imediatamente:

### Teste 1: Health Check

**No terminal:**
```bash
# Substitua PROJECT_ID e ANON_KEY pelos seus valores
curl https://<PROJECT_ID>.supabase.co/functions/v1/make-server-bd42bc02/health \
  -H "Authorization: Bearer <ANON_KEY>"
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "message": "Make Server is running"
}
```

### Teste 2: Via Navegador

1. **Faça login no sistema**
2. **Acesse o Dashboard**
3. **Abra DevTools (F12) → Console**
4. **Veja se há logs de sucesso:**
   ```
   [API_CALL] Making request to: /dashboard/stats
   [API_CALL] Full URL: https://...supabase.co/functions/v1/make-server-bd42bc02/dashboard/stats
   ```

5. **Verifique se os dados carregam:**
   - Total de Clientes
   - Receita do Mês
   - Gráficos de evolução mensal

### Teste 3: Documentos de Cliente

1. **Vá em Clientes → Selecione um cliente**
2. **Role até "Documentos"**
3. **Clique em "Atualizar Documentos"**
4. **Veja se fotos/vídeos carregam**

---

## 📊 Verificando Logs no Supabase

### Via Dashboard:

```
https://supabase.com/dashboard/project/<PROJECT_ID>/functions/make-server/logs
```

### Via CLI:

```bash
# Logs em tempo real
supabase functions logs make-server --follow

# Últimos 50 logs
supabase functions logs make-server --limit 50
```

**O que procurar:**
- ✅ Logs de inicialização: "Server running on port..."
- ✅ Logs de requisições bem-sucedidas
- ❌ Erros 401/403/500
- ❌ "Module not found"
- ❌ "Invalid token"

---

## 🔐 Variáveis de Ambiente (Se necessário)

Se após o deploy houver erros relacionados a variáveis de ambiente:

### Via CLI:

```bash
# Definir service role key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<SUA_KEY>

# Verificar
supabase secrets list
```

### Via Dashboard:

1. Vá em: **Functions** → **make-server** → **Settings**
2. Seção: **Environment Variables**
3. Adicione:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_URL`
   - Outras se necessário

**Onde encontrar essas keys:**
- Dashboard → Settings → API → service_role key (NUNCA compartilhe!)

---

## 🆘 Troubleshooting Pós-Deploy

### Problema: "Function not found" (404)

**Causa:** Deploy não concluiu ou nome errado

**Solução:**
```bash
# Listar functions deployadas
supabase functions list

# Re-deploy
supabase functions deploy make-server
```

### Problema: "Internal Server Error" (500)

**Causa:** Erro no código ou dependências faltando

**Solução:**
1. Veja os logs:
   ```bash
   supabase functions logs make-server --limit 100
   ```

2. Procure por erros tipo:
   - "Module not found" → dependência faltando
   - "Syntax error" → erro de código
   - "Cannot find module" → import errado

### Problema: "Unauthorized" (401)

**Causa:** Token JWT expirado ou inválido

**Solução:**
1. **Faça logout e login novamente** no sistema
2. **Limpe localStorage:**
   - DevTools (F12) → Application → Local Storage → Clear All
3. **Faça login novamente**

### Problema: Fotos/vídeos não carregam

**Causa:** URLs assinadas expiraram ou arquivos não existem

**Solução:**
1. **Na página do cliente, clique em "Atualizar Documentos"**
2. **Verifique os logs do backend:**
   ```
   [CLIENT_GET] File not found in storage: ...
   ```
3. **Confirme que os arquivos existem:**
   - Dashboard → Storage → make-bd42bc02-documents
   - Veja se as pastas dos clientes existem

---

## ✅ Checklist Final de Verificação

Após o deploy, marque cada item:

- [ ] Deploy concluído sem erros
- [ ] Health check retorna `{"status":"ok"}`
- [ ] Login funciona normalmente
- [ ] Dashboard carrega com dados
- [ ] Gráficos aparecem (sem warnings no console)
- [ ] Lista de clientes carrega
- [ ] Detalhes de cliente abrem
- [ ] Botão "Atualizar Documentos" funciona
- [ ] Fotos/vídeos carregam (se existirem)
- [ ] Não há erros 401/403/500 no console

---

## 🎉 Sucesso!

Se todos os itens acima funcionam, **seu deploy foi um sucesso!**

### Próximos passos:

1. **Teste funcionalidades principais:**
   - Cadastrar novo cliente
   - Criar contrato
   - Fazer upload de documentos
   - Visualizar dashboard

2. **Monitore os logs** por alguns minutos:
   ```bash
   supabase functions logs make-server --follow
   ```

3. **Se encontrar bugs:**
   - Anote a URL exata
   - Copie a mensagem de erro completa
   - Verifique os logs do backend
   - Verifique o console do frontend (F12)

---

## 📞 Próxima Ação

**Agora tente fazer o deploy!**

1. Se via **Figma Make**: procure o botão de deploy
2. Se via **CLI**: siga os comandos acima

**Depois do deploy, me avise:**
- ✅ "Deploy funcionou! Sistema está no ar"
- ❌ "Deu erro X" (copie a mensagem de erro completa)

Boa sorte! 🚀
