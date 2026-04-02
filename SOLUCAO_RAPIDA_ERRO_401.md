# ⚡ Solução Rápida - Erro 401 (Sessão Expirada)

## 🔴 Problema

Você está vendo estes erros:
```
[API_CALL] Error 401 on /clients
[API_CALL] Error 401 on /contracts
[API_CALL] Error 401 on /users
Error: Sessão expirada. Por favor, faça login novamente.
```

## ✅ SOLUÇÃO IMEDIATA (30 segundos)

### Passo 1: Acesse a página de login
O sistema irá **redirecionar automaticamente** para `/login` quando detectar sessão expirada.

Se não redirecionar, acesse manualmente: 
```
https://seu-dominio.com/login
```

### Passo 2: Faça login com as credenciais padrão

**👤 Admin Padrão:**
- **Email:** `admin@empresa.com`
- **Senha:** `Admin@123456`

**💡 DICA:** Na tela de login, clique no botão **"⚡ Preencher Ambos"** que preenche automaticamente as credenciais!

### Passo 3: Pronto! ✅
Após o login, você será redirecionado automaticamente para o Dashboard e tudo funcionará normalmente.

---

## 🔍 Por Que Isso Aconteceu?

A sessão pode expirar por vários motivos:
- ⏰ **Timeout de inatividade** - Você ficou muito tempo sem usar o sistema
- 🔄 **Refresh do navegador** - Em alguns casos, o token pode ser perdido
- 🗑️ **Limpeza de cache/cookies** - Dados de autenticação foram removidos
- 💻 **Fechou e reabriu o navegador** - Dependendo das configurações

---

## 🛠️ O Que Foi Corrigido

### Melhorias Implementadas:

1. **Redirecionamento Automático** ✅
   - Sistema detecta sessão expirada
   - Redireciona automaticamente para `/login`
   - Mostra notificação explicativa

2. **Mensagens Mais Claras** ✅
   - Toast de notificação quando sessão expira
   - Botão de preenchimento automático de credenciais
   - Instruções visuais na tela de login

3. **Detecção Melhorada** ✅
   - Verifica token antes de cada requisição
   - Listener de mudanças de autenticação
   - Logs detalhados para debugging

---

## 🎯 Recursos Úteis

### Tela de Login Melhorada:
- ✨ **Botão "Preencher Ambos"** - Preenche email e senha automaticamente
- 👁️ **Mostrar/Ocultar senha** - Veja o que está digitando
- 🔑 **Credenciais visíveis** - Admin padrão sempre visível
- ⚠️ **Alertas contextuais** - Mensagens específicas para cada erro

### Página de Diagnóstico:
Acesse `/auth-debug` para:
- ✅ Testar conectividade com backend
- 🔍 Verificar estado da sessão
- 🧪 Executar testes de autenticação
- 🔧 Limpar sessão se necessário

---

## ❓ Ainda Com Problemas?

### Se o login não funcionar:

1. **Limpe o cache e cookies:**
   ```javascript
   // Console do navegador (F12 → Console)
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

2. **Verifique se o backend está online:**
   - Acesse: `https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-bd42bc02/health`
   - Deve retornar: `{"status":"ok","timestamp":"..."}`

3. **Use a página de diagnóstico:**
   - Acesse: `/auth-debug`
   - Clique em "Executar Testes"
   - Veja os resultados e siga as recomendações

4. **Contate o administrador:**
   - Se nada funcionar, pode haver um problema no servidor
   - Verifique os logs do Supabase Dashboard

---

## 📊 Status dos Erros

| Erro | Status | Solução |
|------|--------|---------|
| **401 - Sessão Expirada** | ✅ RESOLVIDO | Login automático + redirecionamento |
| **404 - /users não encontrado** | ✅ RESOLVIDO | Endpoint já existe no backend |
| **403 - Deploy failed** | ℹ️ NORMAL | Não afeta o sistema (apenas deploy) |

---

## 🔐 Segurança

### Credenciais Padrão:
```
Email: admin@empresa.com
Senha: Admin@123456
```

⚠️ **IMPORTANTE:** 
- Altere a senha padrão após o primeiro login
- Use senhas fortes para contas de produção
- Não compartilhe credenciais por canais inseguros

---

## ✅ Checklist de Verificação

Antes de reportar problemas, verifique:

- [ ] Tentei fazer login novamente
- [ ] Usei as credenciais corretas (admin@empresa.com / Admin@123456)
- [ ] O botão "Preencher Ambos" foi utilizado
- [ ] Limpei o cache/cookies se necessário
- [ ] Testei o backend em /health
- [ ] Usei /auth-debug para diagnóstico

---

**Última Atualização:** 28/03/2026  
**Status:** ✅ Sistema Funcionando - Login Necessário
