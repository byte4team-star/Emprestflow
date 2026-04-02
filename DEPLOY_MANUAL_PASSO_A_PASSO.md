# 🚀 Deploy Manual - Guia Passo a Passo

## ⚠️ POR QUE PRECISO FAZER DEPLOY MANUAL?

O Figma Make **não tem permissão** para fazer deploy de Edge Functions no Supabase.  
Você receberá um **erro 403** se tentar fazer deploy automático.

**Solução:** Deploy manual via **Supabase Dashboard** (mais fácil) ou **Supabase CLI**.

---

## 🎯 Escolha o Método de Deploy

### 📱 **Método 1: Supabase Dashboard** ⭐ RECOMENDADO
**Mais fácil, sem precisar instalar nada**

### 💻 **Método 2: Supabase CLI**
**Para quem já tem o CLI instalado ou prefere linha de comando**

---

# 📱 MÉTODO 1: Supabase Dashboard (RECOMENDADO)

## ✅ Passo 1: Abra o Arquivo Corrigido

1. Abra o arquivo no seu computador:
   ```
   /supabase/functions/server/index.tsx
   ```

2. **Selecione TODO o conteúdo:**
   - Windows/Linux: **Ctrl + A**
   - macOS: **Cmd + A**

3. **Copie o conteúdo:**
   - Windows/Linux: **Ctrl + C**
   - macOS: **Cmd + C**

**⚠️ IMPORTANTE:** Copie TODO o arquivo, não apenas parte dele!

---

## ✅ Passo 2: Acesse o Supabase Dashboard

1. Abra o navegador e acesse:
   ```
   https://supabase.com/dashboard
   ```

2. **Faça login** com sua conta Supabase

3. **Selecione seu projeto:**
   - Procure pelo projeto do sistema de cobrança
   - Geralmente chamado de `emprestflow26` ou similar

---

## ✅ Passo 3: Navegue até Edge Functions

1. No menu lateral esquerdo, clique em:
   ```
   Edge Functions
   ```

2. Você verá uma lista de funções

3. Procure pela função:
   - **`make-server-bd42bc02`**
   - ou **`server`**

4. **Clique na função** para abrir os detalhes

---

## ✅ Passo 4: Edite a Função

1. Procure pelo botão **"Edit Function"** ou **"Deploy"**

2. Clique nele

3. Um **editor de código** será aberto na tela

---

## ✅ Passo 5: Cole o Código Corrigido

1. **Selecione TODO o código** que está no editor online:
   - Windows/Linux: **Ctrl + A**
   - macOS: **Cmd + A**

2. **Delete o código antigo:**
   - Pressione: **Delete** ou **Backspace**

3. **Cole o código corrigido** que você copiou no Passo 1:
   - Windows/Linux: **Ctrl + V**
   - macOS: **Cmd + V**

---

## ✅ Passo 6: Faça o Deploy

1. Procure pelo botão **"Deploy"** ou **"Save & Deploy"**

2. **Clique nele**

3. Aguarde a mensagem de confirmação:
   ```
   ✅ Function deployed successfully!
   ```

4. **Aguarde 1-2 minutos** para a função ser propagada

---

## ✅ Passo 7: Teste o Sistema

1. **Limpe o cache do navegador:**
   - Windows/Linux: **Ctrl + Shift + R**
   - macOS: **Cmd + Shift + R**

2. Acesse o sistema de cobrança

3. Crie um **novo contrato** com:
   - Valor: R$ 20.000,00
   - Parcelas: 10
   - Taxa de juros: 25%

4. **Verifique o resultado:**
   - ✅ Valor da parcela deve ser: **R$ 2.500,00**
   - ❌ Se mostrar outro valor (como R$ 5.606), o deploy não funcionou

---

# 💻 MÉTODO 2: Supabase CLI

## 📋 Pré-requisitos

Você precisa ter o Supabase CLI instalado e configurado.

### Instalação do CLI (se ainda não tiver):

**Windows (via npm):**
```bash
npm install -g supabase
```

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Linux:**
```bash
brew install supabase/tap/supabase
# ou
npm install -g supabase
```

---

## ✅ Passo 1: Abra o Terminal

1. Abra o **Terminal** ou **Prompt de Comando**

2. Navegue até a pasta do projeto:
   ```bash
   cd /caminho/do/seu/projeto
   ```

---

## ✅ Passo 2: Faça Login no Supabase

```bash
supabase login
```

Siga as instruções para autenticar.

---

## ✅ Passo 3: Faça o Deploy

```bash
supabase functions deploy server
```

**Ou, se o nome for diferente:**
```bash
supabase functions deploy make-server-bd42bc02
```

---

## ✅ Passo 4: Aguarde a Confirmação

Você verá algo como:

```
Deploying Function server...
✅ Deployed Function server version 1.0.0
```

Aguarde **1-2 minutos** para propagação.

---

## ✅ Passo 5: Teste

Siga os mesmos passos do **Passo 7** do Método 1.

---

# 🧪 Como Verificar Se Funcionou

## ✅ Teste Simples

1. Crie um contrato com:
   - Valor: **R$ 20.000**
   - Parcelas: **10**
   - Taxa: **25%**

2. **Resultado esperado:**
   - Valor da parcela: **R$ 2.500,00** ✅
   - Total do contrato: **R$ 25.000,00** ✅

3. **Se mostrar outro valor:**
   - ❌ R$ 5.606,00 → Deploy não funcionou (ainda usa fórmula antiga)
   - ✅ R$ 2.500,00 → Deploy funcionou!

---

## ✅ Verificar Datas

As datas devem manter **o mesmo dia do mês:**

**Exemplo:** Se o primeiro vencimento é dia **30/03/2026**:

- Parcela 1: **30/03/2026** ✅
- Parcela 2: **30/04/2026** ✅
- Parcela 3: **30/05/2026** ✅

**Se as datas mudarem de dia (ex: 29, 31), o deploy não funcionou.**

---

# 🆘 Problemas Comuns

## ❌ "Ainda mostra o valor errado (R$ 5.606)"

**Solução:**
1. Limpe o cache: **Ctrl + Shift + R**
2. Teste em **aba anônima**
3. Aguarde **2-3 minutos** após o deploy
4. Verifique se o deploy realmente foi feito (veja data no Dashboard)

---

## ❌ "Erro 403 ao fazer deploy"

**Solução:**
- Você está tentando fazer deploy via Figma Make
- Use o **Supabase Dashboard** (Método 1) ou **CLI** (Método 2)

---

## ❌ "Não encontro a função no Dashboard"

**Solução:**
1. Verifique se está no **projeto correto**
2. Procure por:
   - `make-server-bd42bc02`
   - `server`
   - Qualquer função com nome parecido
3. Se não encontrar, entre em contato com o suporte

---

## ❌ "Deploy deu erro no CLI"

**Solução:**
1. Verifique se está autenticado:
   ```bash
   supabase login
   ```

2. Verifique se está na pasta correta:
   ```bash
   pwd  # mostra a pasta atual
   ```

3. Tente novamente:
   ```bash
   supabase functions deploy server
   ```

---

# ✅ Checklist Final

Marque cada item:

- [ ] Código copiado do arquivo local
- [ ] Acesso ao Supabase Dashboard realizado
- [ ] Função localizada (make-server-bd42bc02 ou server)
- [ ] Código colado no editor
- [ ] Deploy realizado com sucesso
- [ ] Aguardado 1-2 minutos
- [ ] Cache do navegador limpo
- [ ] Teste criando novo contrato
- [ ] Valor da parcela = R$ 2.500,00 ✅
- [ ] Datas mantêm o mesmo dia ✅

---

# 🎉 Pronto!

Se você completou todos os passos e o teste passou, **parabéns!** 🎊

O sistema agora calcula corretamente as parcelas usando **juros simples**.

---

**Criado em:** 28/03/2026  
**Versão:** 1.0  
**Status:** ✅ Pronto para uso
