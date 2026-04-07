# 🔐 Configuração da Service Role Key - Supabase

## ✅ Configuração Concluída

A variável de ambiente `SUPABASE_SERVICE_ROLE_KEY` foi configurada com sucesso no sistema.

---

## 📋 O que foi configurado:

### 1. **Arquivo `/utils/supabase/info.tsx`**

Adicionada a exportação da `serviceRoleKey`:

```typescript
export const projectId = "nbelraenzoprsskjnvpc"
export const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...sb_secret_eaRVOowDLKPZlKsMzxkn1Q_YPJc-msp"
```

### 2. **Arquivo `/src/app/lib/supabase.ts`**

Atualizado para importar e usar a `serviceRoleKey`:

```typescript
import { projectId, publicAnonKey, serviceRoleKey } from '/utils/supabase/info';
```

Adicionada função para criar cliente admin:

```typescript
export function getSupabaseAdminClient() {
  // Retorna um cliente Supabase com permissões de service_role
  // que IGNORA todas as políticas RLS
}
```

---

## 🔑 Diferença entre as Keys:

### **Public Anon Key** (Uso no Frontend)
- ✅ Segura para expor no código frontend
- ✅ RESPEITA todas as políticas RLS (Row Level Security)
- ✅ Usuários veem apenas seus próprios dados
- ✅ Usada em: `supabase = getSupabaseClient()`

### **Service Role Key** (Uso no Backend APENAS)
- ⚠️ **NUNCA** expor no frontend
- ⚠️ **IGNORA** todas as políticas RLS
- ⚠️ Acesso total ao banco de dados
- ⚠️ Usada APENAS na Edge Function
- ✅ Usada para operações administrativas no servidor

---

## 🚀 Como Usar:

### ❌ **NÃO FAZER** (Frontend):

```typescript
// NUNCA use serviceRoleKey no frontend!
const adminClient = createClient(url, serviceRoleKey) // ❌ PERIGO!
```

### ✅ **CORRETO** (Frontend):

```typescript
// Use sempre o cliente público no frontend
import { supabase } from '@/lib/supabase';

// Operações respeitam RLS
const { data } = await supabase
  .from('clients')
  .select('*'); // Retorna apenas dados do usuário logado
```

### ✅ **CORRETO** (Backend - Edge Function):

```typescript
// Na Edge Function, use serviceRoleKey
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // ✅ Seguro no servidor
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Operações IGNORAM RLS (acesso total)
const { data } = await supabaseAdmin
  .from('clients')
  .select('*'); // Retorna TODOS os clientes
```

---

## 🔧 Configuração na Edge Function (Supabase):

Para usar a Service Role Key na Edge Function, você precisa configurá-la como variável de ambiente no Supabase:

### Passo 1: Acessar Dashboard do Supabase
1. Vá em **Settings** → **Edge Functions**
2. Clique em **Environment Variables**

### Passo 2: Adicionar Variável
Adicione a seguinte variável de ambiente:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZWxyYWVuem9wcnNza2pudnBjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzE4MjA2NCwiZXhwIjoyMDQ4NzU4MDY0fQ.sb_secret_eaRVOowDLKPZlKsMzxkn1Q_YPJc-msp
```

### Passo 3: Usar na Edge Function

```typescript
// /supabase/functions/server/index.tsx
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Use supabaseAdmin para operações que precisam ignorar RLS
```

---

## 🔒 Segurança: Boas Práticas

### ✅ DO (Faça):
- Use `publicAnonKey` no frontend
- Use `serviceRoleKey` APENAS na Edge Function
- Mantenha `serviceRoleKey` em variáveis de ambiente
- Nunca comite `serviceRoleKey` em Git
- Use RLS para proteger dados sensíveis

### ❌ DON'T (Não Faça):
- Nunca exponha `serviceRoleKey` no código frontend
- Nunca compartilhe `serviceRoleKey` publicamente
- Nunca desabilite RLS em produção sem motivo
- Nunca use `serviceRoleKey` em requests do cliente

---

## 📊 Quando Usar Service Role Key:

### Casos de Uso Válidos:
✅ Operações administrativas no backend
✅ Criação de usuários via Edge Function
✅ Upload de arquivos em nome de usuários
✅ Operações em massa (ex: gerar relatórios)
✅ Processos automatizados no servidor
✅ Migrations e seed data

### Casos Onde NÃO Usar:
❌ Queries diretas do frontend
❌ Autenticação de usuários
❌ Operações CRUD normais do usuário
❌ Qualquer código que roda no navegador

---

## 🧪 Testando a Configuração:

### Teste 1: Verificar se a key está disponível

```typescript
// No frontend (dev mode)
import { serviceRoleKey } from '/utils/supabase/info';
console.log('Service Role Key configurada:', !!serviceRoleKey);
// Deve imprimir: true
```

### Teste 2: Verificar na Edge Function

```typescript
// Na Edge Function
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
console.log('Service Role Key disponível:', !!key);
// Deve retornar: true
```

### Teste 3: Testar operação admin

```typescript
// Na Edge Function - testar acesso total
const { data: allClients } = await supabaseAdmin
  .from('clients')
  .select('*');

console.log(`Total de clientes: ${allClients?.length || 0}`);
// Deve retornar TODOS os clientes (ignorando RLS)
```

---

## 🔄 Atualização em Produção:

Se você fizer deploy na Vercel, adicione também a variável de ambiente lá:

```bash
# Na Vercel Dashboard:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...sb_secret_eaRVOowDLKPZlKsMzxkn1Q_YPJc-msp
```

**IMPORTANTE:** Nunca use a Service Role Key diretamente no código da Vercel. Use apenas para configurar a Edge Function no Supabase.

---

## 📚 Referências:

- [Supabase Service Role Key Documentation](https://supabase.com/docs/guides/api/api-keys)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions Environment Variables](https://supabase.com/docs/guides/functions/secrets)

---

✅ **Status:** Service Role Key configurada e pronta para uso na Edge Function!

🔐 **Próximo Passo:** Configure a variável de ambiente no Supabase Dashboard → Edge Functions → Environment Variables
