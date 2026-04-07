# 🚀 DEPLOY DA EDGE FUNCTION - PASSO A PASSO

## ⚠️ IMPORTANTE: Você precisa fazer o deploy AGORA para corrigir o erro 500!

O código está atualizado localmente, mas o Supabase ainda está rodando a versão antiga da Edge Function.

---

## 📋 CHECKLIST PRÉ-DEPLOY

### 1. Verificar se a Service Role Key está configurada no Supabase

Acesse o painel do Supabase:
```
https://supabase.com/dashboard/project/nbelraenzoprsskjnvpc/settings/api
```

Verifique se existe uma variável de ambiente chamada `SERVICE_ROLE_KEY` nas Edge Functions:
```
https://supabase.com/dashboard/project/nbelraenzoprsskjnvpc/settings/functions
```

Se não existir, crie:
- Nome: `SERVICE_ROLE_KEY`
- Valor: Cole a sua Service Role Key (encontrada em Settings > API)
- ⚠️ NUNCA compartilhe esta chave publicamente!

---

## 🚀 COMANDO DE DEPLOY

Execute este comando no terminal (na raiz do projeto):

```bash
supabase functions deploy server --project-ref nbelraenzoprsskjnvpc
```

---

## ✅ O QUE VAI ACONTECER APÓS O DEPLOY

1. ✅ A Edge Function será atualizada com o novo código
2. ✅ O endpoint `/users` vai funcionar corretamente
3. ✅ A página de Segurança vai mostrar os usuários reais
4. ✅ A página de Usuários vai listar todos os usuários
5. ✅ Criar, resetar senha e deletar usuários vai funcionar

---

## 🔍 VERIFICAÇÃO PÓS-DEPLOY

Após o deploy, teste:

1. **Acesse a página de Segurança** (`/security`)
   - Clique nos cards de usuários
   - Deve abrir um modal com a lista de usuários

2. **Acesse a página de Usuários** (`/users`)
   - Deve listar todos os usuários do sistema
   - Deve mostrar um toast verde de sucesso

3. **Teste criar um novo usuário**
   - Clique em "Adicionar Usuário"
   - Preencha os dados e crie
   - Deve criar com sucesso

---

## 🐛 SE DER ERRO APÓS O DEPLOY

### Erro: "SERVICE_ROLE_KEY not configured"

**Solução:**
1. Vá em Settings > Functions no Supabase Dashboard
2. Adicione a variável de ambiente `SERVICE_ROLE_KEY`
3. Valor: Sua Service Role Key (em Settings > API)
4. Salve e aguarde alguns segundos

### Erro: "Unauthorized" ou "User not allowed"

**Solução:**
1. Faça logout do sistema
2. Faça login novamente com usuário admin
3. Tente novamente

### Erro persiste?

**Execute este comando para ver os logs:**
```bash
supabase functions logs server --project-ref nbelraenzoprsskjnvpc
```

Procure por linhas que começam com `[USERS]` para ver os logs detalhados.

---

## 📝 RESUMO DO QUE FOI CORRIGIDO

### No Frontend:
- ✅ Removida chamada insegura ao `supabase.auth.admin`
- ✅ Todas as operações agora passam pelo backend seguro
- ✅ Cards da página de Segurança agora são clicáveis
- ✅ Modal mostra detalhes dos usuários por tipo

### No Backend:
- ✅ Criado endpoint `GET /users` para listar usuários
- ✅ Criado endpoint `POST /users` para criar usuários
- ✅ Criado endpoint `POST /users/:id/reset-password`
- ✅ Criado endpoint `DELETE /users/:id`
- ✅ Todos os endpoints usam Service Role Key de forma segura
- ✅ Logs detalhados para diagnóstico

---

## 🎯 EXECUTE O DEPLOY AGORA!

```bash
supabase functions deploy server --project-ref nbelraenzoprsskjnvpc
```

Após o deploy, atualize a página do navegador e teste! 🚀
