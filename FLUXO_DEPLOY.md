# 📊 Fluxo de Deploy - Visual

```
┌─────────────────────────────────────────────────────────────┐
│  🎯 SITUAÇÃO ATUAL                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Código atualizado para SERVICE_ROLE_KEY                │
│  ✅ Segredo configurado no Supabase                        │
│  ⏳ AGUARDANDO DEPLOY                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

                            ↓

┌─────────────────────────────────────────────────────────────┐
│  🚀 DEPLOY (Escolha UMA opção)                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  OPÇÃO 1: Script Automático                                │
│  ┌──────────────────────────────────────┐                  │
│  │ ./deploy-edge-function.sh            │                  │
│  └──────────────────────────────────────┘                  │
│            ⏱️ ~3 minutos                                    │
│                                                             │
│  OPÇÃO 2: Comandos CLI                                     │
│  ┌──────────────────────────────────────┐                  │
│  │ supabase login                       │                  │
│  │ supabase link --project-ref ...      │                  │
│  │ supabase functions deploy server     │                  │
│  └──────────────────────────────────────┘                  │
│            ⏱️ ~2 minutos                                    │
│                                                             │
│  OPÇÃO 3: Dashboard Supabase                               │
│  ┌──────────────────────────────────────┐                  │
│  │ Edge Functions → Upload              │                  │
│  └──────────────────────────────────────┘                  │
│            ⏱️ ~5 minutos                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

                            ↓

┌─────────────────────────────────────────────────────────────┐
│  ✅ VERIFICAÇÃO                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Teste 1: Health Check                                     │
│  ┌──────────────────────────────────────┐                  │
│  │ curl .../health                      │                  │
│  │ → "version": "2.4.0" ✅              │                  │
│  └──────────────────────────────────────┘                  │
│                                                             │
│  Teste 2: Service Key                                      │
│  ┌──────────────────────────────────────┐                  │
│  │ curl .../health/detailed             │                  │
│  │ → "hasServiceKey": true ✅           │                  │
│  └──────────────────────────────────────┘                  │
│                                                             │
│  Teste 3: Logs                                             │
│  ┌──────────────────────────────────────┐                  │
│  │ supabase functions logs server       │                  │
│  │ → "[INIT] Has Service Key: true" ✅  │                  │
│  └──────────────────────────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

                            ↓

┌─────────────────────────────────────────────────────────────┐
│  🎉 SUCESSO!                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Edge Function atualizada (v2.4.0)                      │
│  ✅ SERVICE_ROLE_KEY funcionando                           │
│  ✅ Sistema pronto para cadastrar clientes                 │
│                                                             │
│  Próximos passos:                                          │
│  1. Testar cadastro de clientes                            │
│  2. Verificar upload de documentos                         │
│  3. Configurar políticas RLS (se necessário)               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Arquivos Modificados:

```
/supabase/functions/server/
├── index.tsx                    ✅ v2.3.0 → v2.4.0
├── billing_routes.tsx           ✅ Atualizado
├── client_portal_routes.tsx     (não modificado)
├── health.tsx                   ✅ Atualizado
└── kv_store.tsx                 ✅ Atualizado

/supabase/functions/make-server-bd42bc02/
├── health.tsx                   ✅ Atualizado
└── kv_store.tsx                 ✅ Atualizado
```

---

## 🔄 Mudança Realizada:

```diff
- const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
+ const serviceKey = Deno.env.get('SERVICE_ROLE_KEY')!;
```

**Motivo:** Você já configurou o segredo como `SERVICE_ROLE_KEY` no Supabase.

---

## 📋 Checklist Completo:

```
✅ 1. Código atualizado
✅ 2. Segredo SERVICE_ROLE_KEY configurado
✅ 3. Scripts de deploy criados
✅ 4. Documentação completa
⏳ 5. FAZER DEPLOY ← VOCÊ ESTÁ AQUI
⏳ 6. Testar health check
⏳ 7. Verificar hasServiceKey: true
⏳ 8. Testar sistema completo
```

---

## 🚀 Comando Mais Rápido:

```bash
supabase login && \
supabase link --project-ref nbelraenzoprsskjnvpc && \
supabase functions deploy server --project-ref nbelraenzoprsskjnvpc
```

**Copie, cole e execute!** ⚡

---

## 📊 Informações do Projeto:

| Item | Valor |
|------|-------|
| **Projeto ID** | `nbelraenzoprsskjnvpc` |
| **Edge Function** | `server` |
| **Versão Atual** | `v2.3.0` |
| **Nova Versão** | `v2.4.0` |
| **Segredo** | `SERVICE_ROLE_KEY` ✅ |

---

## 🎯 URLs de Teste:

**Health Simple:**
```
https://nbelraenzoprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/health
```

**Health Detailed:**
```
https://nbelraenzoprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/health/detailed
```

---

⏱️ **Tempo total estimado:** 3-5 minutos

🚀 **Faça o deploy agora!**
