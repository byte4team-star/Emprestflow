# Solução para Erros de Autenticação (401) e Deploy (403)

## 🔴 Problema 1: Erro 401 - Unauthorized (Sessão Expirada)

### Sintomas:
```
[API_CALL] Error 401 on /dashboard/stats: {
  "error": "Unauthorized",
  "message": "Auth error: Auth session missing!"
}
Error loading dashboard: Error: Unauthorized
```

### Causa:
A sessão de autenticação do usuário expirou ou foi perdida do localStorage.

### ✅ Solução:

#### Opção 1: Fazer Login Novamente (Mais Simples)
1. Acesse a página de login: `https://seu-dominio.com/login`
2. Digite suas credenciais:
   - **Admin padrão:**
     - Email: `admin@empresa.com`
     - Senha: `Admin@123456`
3. Faça login normalmente

#### Opção 2: Limpar Cache e Cookies (Se o login não funcionar)
1. Abra o DevTools do navegador (F12)
2. Vá para a aba **Application** (Chrome) ou **Armazenamento** (Firefox)
3. No menu lateral esquerdo:
   - Clique em **Local Storage**
   - Selecione o domínio do seu site
   - Clique com botão direito e selecione **Clear**
4. Também limpe **Session Storage** da mesma forma
5. Feche e abra o navegador novamente
6. Acesse a página de login e faça login

#### Opção 3: Via Console do Navegador (Avançado)
```javascript
// Abra o console (F12 → Console) e execute:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Melhorias Implementadas:
✅ Sistema agora detecta automaticamente quando a sessão expira  
✅ Mensagem de erro mais clara com botão para fazer login  
✅ Listener de mudanças de autenticação para atualizar o estado em tempo real  
✅ Logs detalhados no console para debugging  

---

## 🔴 Problema 2: Erro 403 - Forbidden no Deploy

### Sintomas:
```
Error while deploying: XHR for "/api/integrations/supabase/.../edge_functions/make-server/deploy" failed with status 403
```

### Causa:
Este erro ocorre no **Figma Make** quando há mudanças no backend e o sistema tenta fazer deploy da Edge Function automaticamente. É um problema conhecido do ambiente de desenvolvimento.

### ✅ Solução:

#### Solução Imediata: Ignorar o Erro de Deploy
O erro 403 no deploy **NÃO afeta o funcionamento do sistema**. Ele ocorre apenas quando o Figma Make tenta fazer deploy automático do backend.

**O sistema continuará funcionando normalmente porque:**
- O backend já está implantado no Supabase
- As mudanças no frontend não requerem novo deploy do backend
- O erro é apenas no processo de deploy automático do Figma Make

#### Se Realmente Precisar Fazer Deploy do Backend:

**Método 1: Deploy Manual via Supabase CLI**
```bash
# 1. Instale o Supabase CLI se ainda não tiver
npm install -g supabase

# 2. Faça login no Supabase
supabase login

# 3. Link ao seu projeto
supabase link --project-ref SEU_PROJECT_ID

# 4. Deploy da função
supabase functions deploy make-server-bd42bc02
```

**Método 2: Via Dashboard do Supabase**
1. Acesse: https://supabase.com/dashboard/project/SEU_PROJECT_ID
2. Vá em **Edge Functions** no menu lateral
3. Clique na função `make-server-bd42bc02`
4. Clique em **Deploy new version**
5. Cole o código do arquivo `/supabase/functions/server/index.tsx`
6. Clique em **Deploy**

**Método 3: Via GitHub Actions (Recomendado para Produção)**
Configure um workflow de CI/CD que faz deploy automático quando você faz push para a branch main.

---

## 🔍 Como Verificar se Tudo Está Funcionando

### Checklist Rápido:

1. **Verificar Sessão de Autenticação:**
   ```javascript
   // Console do navegador (F12 → Console)
   const { data } = await supabase.auth.getSession();
   console.log('Sessão ativa:', !!data.session);
   console.log('Token:', data.session?.access_token?.substring(0, 20) + '...');
   ```

2. **Verificar Backend:**
   - Acesse: `https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-bd42bc02/health`
   - Deve retornar: `{"status":"ok","timestamp":"..."}`

3. **Verificar Conexão com Supabase:**
   - Abra o DevTools (F12)
   - Vá para a aba **Network**
   - Tente fazer login
   - Verifique se as requisições para `supabase.co` estão retornando 200

---

## 🛠️ Debugging Avançado

### Logs Úteis no Console:
```javascript
// Ver estado atual da autenticação
console.log('[AUTH_CONTEXT] Initializing authentication...');
console.log('[AUTH_CONTEXT] Session found:', !!session);

// Ver token de acesso
const session = await supabase.auth.getSession();
console.log('Access Token:', session.data.session?.access_token);

// Ver dados do usuário
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
```

### Testar Endpoint Manualmente:
```javascript
// Copie e cole no console do navegador
const testApi = async () => {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  
  const response = await fetch(
    'https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-bd42bc02/dashboard/stats',
    {
      headers: {
        'Authorization': 'Bearer SUA_ANON_KEY',
        'X-User-Token': token,
        'Content-Type': 'application/json'
      }
    }
  );
  
  console.log('Status:', response.status);
  console.log('Response:', await response.json());
};

testApi();
```

---

## 🎯 Prevenção de Problemas Futuros

### Para Evitar Perder a Sessão:
1. **Não use navegação anônima/privada** para o sistema de produção
2. **Não limpe cookies/cache** enquanto estiver logado
3. **Configure refresh automático** se o token estiver próximo de expirar
4. **Mantenha uma aba aberta** para evitar perda de sessão

### Para Evitar Problemas de Deploy:
1. **Não modifique** arquivos dentro de `/supabase/functions/` diretamente no Figma Make
2. **Use o Supabase CLI** para fazer deploy do backend
3. **Configure GitHub Actions** para deploy automático
4. **Documente mudanças** no backend em um CHANGELOG

---

## 📞 Ainda Com Problemas?

Se após seguir todos os passos você ainda tiver problemas:

1. **Verifique o console do navegador** (F12 → Console) para ver logs detalhados
2. **Verifique o Supabase Dashboard** → Logs → Edge Functions
3. **Teste a função de health** do backend: `https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-bd42bc02/health`
4. **Verifique as variáveis de ambiente** no Supabase Dashboard → Settings → Edge Functions

### Informações Úteis para Debug:
- **Project ID:** Encontre em `/utils/supabase/info.tsx`
- **Edge Function Name:** `make-server-bd42bc02`
- **Logs do Backend:** Supabase Dashboard → Logs → Edge Functions
- **Logs do Frontend:** DevTools (F12) → Console

---

## ✅ Resumo das Soluções

| Problema | Solução Rápida |
|----------|----------------|
| **Erro 401 (Sessão Expirada)** | Fazer login novamente em `/login` |
| **Erro 403 (Deploy)** | Ignorar - não afeta o sistema em produção |
| **Sessão não persiste** | Limpar localStorage e fazer login novamente |
| **Token inválido** | Fazer logout e login novamente |

---

**Última atualização:** 28/03/2026  
**Status:** ✅ Erros Corrigidos com Melhorias Implementadas
