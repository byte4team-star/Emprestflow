# 🔧 Correção: Erro HTTP 401 no Dashboard

## 📅 Data: 25 de Fevereiro de 2026

## ⚠️ Problema Identificado

O dashboard estava retornando erro **HTTP 401 (Unauthorized)** ao tentar carregar as estatísticas.

### Mensagem de erro:
```
Error loading dashboard: Error: HTTP 401
```

## 🔍 Diagnóstico

O erro HTTP 401 indica problema de autenticação. Possíveis causas:

1. **Sessão expirada**: O token JWT do usuário pode ter expirado
2. **Token inválido**: O token pode estar corrompido ou malformado
3. **Usuário não logado**: O usuário pode não ter feito login
4. **Problema no backend**: O servidor pode estar rejeitando o token

## ✅ Correções Implementadas

### 1. **Melhor tratamento de erros no Dashboard** (`/src/app/pages/Dashboard.tsx`)

**Antes:**
```typescript
catch (error) {
  console.error('Error loading dashboard:', error);
  setStats(null);
  setMonthlyData([]);
}
```

**Depois:**
```typescript
const [error, setError] = useState<string | null>(null);

catch (error) {
  console.error('Error loading dashboard:', error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  setError(errorMessage);
  setStats(null);
  setMonthlyData([]);
}
```

### 2. **Tela de erro amigável**

Adicionada uma interface completa quando houver erro:
- ✅ Mensagem de erro clara
- ✅ Explicação das possíveis causas (especialmente para erro 401)
- ✅ Botão "Tentar Novamente"
- ✅ Botão "Fazer Login" para reautenticação
- ✅ Visual destacado em vermelho

```typescript
if (error) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Erro ao Carregar Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-red-600 mb-4">{error}</p>
        {error.includes('401') && (
          <div className="bg-white p-4 rounded border border-red-300 mb-4">
            <p className="font-semibold text-gray-900 mb-2">Possíveis causas:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
              <li>Sua sessão expirou - faça login novamente</li>
              <li>Token de autenticação inválido</li>
              <li>Problemas de conexão com o servidor</li>
            </ul>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={loadDashboardData}>Tentar Novamente</button>
          <Link to="/login">Fazer Login</Link>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 3. **Logs detalhados na função apiCall** (`/src/app/lib/supabase.ts`)

Adicionados logs extensivos para debug:

```typescript
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  console.log('[API_CALL] Making request to:', endpoint);
  
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  console.log('[API_CALL] Has session:', !!session.data.session);
  console.log('[API_CALL] Has token:', !!token);
  console.log('[API_CALL] Token length:', token?.length || 0);

  // ... resto do código com logs

  if (!token) {
    console.warn('[API_CALL] ⚠️ No token available - request may fail with 401');
  }

  console.log('[API_CALL] Response status:', response.status);
  console.log('[API_CALL] Response ok:', response.ok);
}
```

## 🔍 Como Debugar

Agora, quando houver erro 401, você verá nos logs do navegador:

```
[API_CALL] Making request to: /dashboard/stats
[API_CALL] Has session: false
[API_CALL] Has token: false
[API_CALL] Token length: 0
[API_CALL] ⚠️ No token available - request may fail with 401
[API_CALL] Full URL: https://xxxxx.supabase.co/functions/v1/make-server-bd42bc02/dashboard/stats
[API_CALL] Response status: 401
[API_CALL] Response ok: false
[API_CALL] Error response: { error: 'Unauthorized', message: 'No authorization header' }
```

## 📋 Checklist de Verificação

Quando encontrar erro 401, verifique:

- [ ] **Usuário está logado?** - Verificar `localStorage` tem sessão do Supabase
- [ ] **Token é válido?** - Verificar se não expirou (validade geralmente 1 hora)
- [ ] **Backend está funcionando?** - Testar endpoint `/health`
- [ ] **Credenciais corretas?** - Testar login com admin@empresa.com / Admin@123456

## 🛠️ Soluções Rápidas

### Solução 1: Relogar
1. Clique no botão "Fazer Login" na tela de erro
2. Use: `admin@empresa.com` / `Admin@123456`
3. Tente acessar o dashboard novamente

### Solução 2: Limpar localStorage
```javascript
// No console do navegador:
localStorage.clear();
// Depois recarregue a página e faça login
```

### Solução 3: Verificar saúde do backend
```bash
# Teste se o backend está respondendo:
curl https://xxxxx.supabase.co/functions/v1/make-server-bd42bc02/health
```

## 🔐 Informações de Autenticação

### Como funciona a autenticação:

1. **Login** → Supabase Auth gera JWT (access_token)
2. **Frontend** → Armazena token no localStorage
3. **apiCall** → Busca token e adiciona no header `X-User-Token`
4. **Backend** → Middleware `requireAuth` valida o token
5. **Sucesso** → Retorna dados do dashboard

### Fluxo do token:

```
Frontend (apiCall)
  ↓ [X-User-Token: eyJhbGc...]
Backend (requireAuth middleware)
  ↓ [authenticateUser]
Backend (supabaseAdmin.auth.getUser)
  ↓ [valida JWT]
✅ Usuário autenticado
  ↓
Handler da rota processa request
  ↓
✅ Retorna dados
```

## 📊 Melhorias Implementadas

### UX (Experiência do Usuário)
- ✅ Mensagem de erro clara e amigável
- ✅ Explicação das possíveis causas
- ✅ Botões de ação rápida (Tentar Novamente / Fazer Login)
- ✅ Visual destacado para erros

### DX (Experiência do Desenvolvedor)
- ✅ Logs detalhados em cada etapa
- ✅ Identificação clara do problema
- ✅ Informações de debug no console
- ✅ Stack trace completo

### Segurança
- ✅ Não expõe tokens nos logs (apenas tamanho)
- ✅ Não expõe detalhes sensíveis na UI
- ✅ Validação adequada no backend
- ✅ Mensagens genéricas para o usuário

## 🎯 Próximos Passos (Opcional)

Se o problema persistir, considere:

1. **Implementar refresh token automático**
   - Renovar token antes de expirar
   - Retry automático em caso de 401

2. **Adicionar middleware de auth no React Router**
   - Redirecionar automaticamente para login se não autenticado
   - Proteger rotas que exigem autenticação

3. **Melhorar gestão de sessão**
   - Mostrar tempo restante da sessão
   - Avisar antes da expiração
   - Renovar automaticamente

4. **Implementar logout automático**
   - Limpar sessão após erro 401
   - Redirecionar para login
   - Mostrar mensagem informativa

## 📞 Suporte

Se o erro persistir após estas correções:

1. **Verifique os logs do Supabase Edge Functions**
   - Acesse o painel Supabase → Functions → Logs
   - Procure por erros relacionados a autenticação

2. **Teste a rota diretamente**
   ```bash
   curl -H "X-User-Token: SEU_TOKEN_AQUI" \
     https://xxxxx.supabase.co/functions/v1/make-server-bd42bc02/dashboard/stats
   ```

3. **Verifique se o usuário admin existe**
   - Acesse Supabase → Authentication → Users
   - Confirme que admin@empresa.com está criado

---

**Status:** ✅ Correções Implementadas
**Impacto:** 🟢 Baixo (melhorias de UX e DX)
**Requer Deploy:** ✅ Sim (frontend apenas)
**Breaking Changes:** ❌ Não
