# 🚀 Instruções de Deploy Manual - ERRO 403 RESOLVIDO

## ❌ **Por que o erro 403 acontece?**

O Figma Make **não tem permissão** para fazer deploy de Edge Functions no Supabase. Isso é uma **limitação de segurança** e é **comportamento esperado**.

---

## ✅ **SOLUÇÃO DEFINITIVA - 3 Opções Simples**

---

### **📦 OPÇÃO 1: Script Automático (Mais Fácil)**

Criei scripts que fazem tudo automaticamente para você!

#### **🪟 Windows:**
```cmd
# Abra o Prompt de Comando (CMD) ou PowerShell na pasta do projeto
deploy-fix.bat
```

#### **🐧 Linux/Mac:**
```bash
# Abra o Terminal na pasta do projeto
chmod +x deploy-fix.sh
./deploy-fix.sh
```

**O script vai:**
- ✅ Verificar se você tem Supabase CLI instalado
- ✅ Instalar automaticamente se necessário
- ✅ Fazer login no Supabase (se necessário)
- ✅ Linkar o projeto (se necessário)
- ✅ Fazer o deploy da correção
- ✅ Mostrar instruções de teste

---

### **🖥️ OPÇÃO 2: Linha de Comando Manual (Rápido)**

#### **Passo 1: Instalar Supabase CLI**
```bash
npm install -g supabase
```

#### **Passo 2: Fazer Login**
```bash
supabase login
```

#### **Passo 3: Linkar o Projeto**
```bash
supabase link --project-ref SEU_PROJECT_ID
```

**Como encontrar o PROJECT_ID:**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **General**
4. Copie o **Reference ID**

#### **Passo 4: Deploy!**
```bash
supabase functions deploy server
```

**Pronto!** ✅

---

### **🌐 OPÇÃO 3: Via Dashboard do Supabase (Sem CLI)**

Se você **não pode** ou **não quer** usar a linha de comando:

#### **Passo a Passo:**

1. **Abra o arquivo no seu computador:**
   - Navegue até: `/supabase/functions/server/index.tsx`
   - Selecione todo o conteúdo (**Ctrl+A**)
   - Copie (**Ctrl+C**)

2. **Acesse o Dashboard do Supabase:**
   - URL: https://supabase.com/dashboard
   - Faça login

3. **Navegue até Edge Functions:**
   - Menu lateral → **Edge Functions**
   - Procure pela função **"server"** ou **"make-server-bd42bc02"**
   - Clique nela

4. **Edite a Função:**
   - Clique em **"Edit Function"** ou botão de editar
   - **Delete todo o código** atual
   - **Cole o novo código** (**Ctrl+V**)

5. **Deploy:**
   - Clique em **"Deploy"** ou **"Save and Deploy"**
   - Aguarde a confirmação: ✅ **"Function deployed successfully"**

6. **Verifique nos Logs:**
   - Clique em **"Logs"** 
   - Você deve ver: `[INIT] Supabase URL: ...`

---

## 🧪 **Como Testar Após Deploy**

### **1. Aguarde 1-2 minutos**
Após o deploy, aguarde a propagação das mudanças.

### **2. Limpe o Cache do Navegador**
- **Chrome/Edge:** `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
- **Firefox:** `Ctrl + F5` (Windows) ou `Cmd + Shift + R` (Mac)
- Ou abra uma **aba anônima/privada**

### **3. Teste Criando um Contrato**

No seu sistema:
1. Vá em **Contratos** → **Novo Contrato**
2. Preencha:
   ```
   Cliente: Qualquer cliente cadastrado
   Valor Total: R$ 20.000,00
   Parcelas: 10
   Data do Vencimento: 30/03/2026
   Taxa de Juros: 25% ao mês
   ```
3. Clique em **Salvar**

### **4. Verifique os Resultados**

**✅ Resultado CORRETO (após deploy):**
- Parcela 1: R$ 2.500,00 • Vencimento: **30/03/2026**
- Parcela 2: R$ 2.500,00 • Vencimento: **30/04/2026**
- Parcela 3: R$ 2.500,00 • Vencimento: **30/05/2026**
- ...e assim por diante

**❌ Resultado ERRADO (se ainda não fez deploy):**
- Parcelas com valores diferentes
- Datas "pulando" dias (29, 31, etc.)

---

## 📊 **Verificar Logs (Opcional)**

Para ver se está funcionando:

```bash
# Ver logs em tempo real
supabase functions logs server --tail

# Ver últimos 50 logs
supabase functions logs server --limit 50
```

Você deve ver:
```
[INIT] Supabase URL: https://...
[INIT] ✅ Evolution API URL format is valid
[CONTRACT_CREATE] Creating new contract...
[CONTRACT_CREATE] ✅ Contract created successfully
```

---

## ❓ **Perguntas Frequentes**

### **Q: O script não funciona no Windows**
**A:** Tente executar como Administrador:
- Clique com botão direito no arquivo `deploy-fix.bat`
- Selecione **"Executar como Administrador"**

### **Q: Erro "Command not found: supabase"**
**A:** O CLI não está instalado. Execute:
```bash
npm install -g supabase
```

### **Q: Erro "Not logged in"**
**A:** Você precisa fazer login:
```bash
supabase login
```

### **Q: Erro "Project not linked"**
**A:** Link o projeto primeiro:
```bash
supabase link --project-ref SEU_PROJECT_ID
```

### **Q: Não tenho permissão para fazer deploy**
**A:** Você precisa ser **Owner** ou **Admin** do projeto no Supabase.
- Vá em **Settings** → **Team** 
- Verifique seu nível de acesso

### **Q: O deploy foi feito mas continua com valores errados**
**A:** 
1. Aguarde 2 minutos
2. Limpe o cache do navegador (**Ctrl+Shift+R**)
3. Verifique os logs: `supabase functions logs server`
4. Tente em aba anônima

---

## 📞 **Suporte Adicional**

Se após seguir todos os passos ainda houver problemas:

1. **Verifique a versão do CLI:**
   ```bash
   supabase --version
   ```
   Deve ser >= 1.0.0

2. **Force um novo login:**
   ```bash
   supabase logout
   supabase login
   ```

3. **Re-linke o projeto:**
   ```bash
   supabase unlink
   supabase link --project-ref SEU_PROJECT_ID
   ```

4. **Tente fazer deploy novamente:**
   ```bash
   supabase functions deploy server
   ```

---

## ✅ **Checklist Final**

Antes de testar no sistema:

- [ ] Deploy realizado com sucesso
- [ ] Aguardados 1-2 minutos
- [ ] Cache do navegador limpo
- [ ] Aba anônima testada (opcional)
- [ ] Logs verificados (opcional)
- [ ] Teste de criação de contrato realizado
- [ ] Valores conferidos: R$ 2.500,00 por parcela
- [ ] Datas conferidas: sempre dia 30

---

## 🎯 **Resumo das Correções**

**Antes (ERRADO):**
- Valor da parcela: R$ 2.800,00 ❌
- Datas: 29/03, 29/04, 29/05 ❌
- Fórmula: Price (juros compostos sempre)

**Depois (CORRETO):**
- Valor da parcela: R$ 2.500,00 ✅
- Datas: 30/03, 30/04, 30/05 ✅
- Fórmula: Respeita a taxa informada
- Arredondamento: 2 casas decimais

---

**Data:** 28/03/2026  
**Status:** ✅ Código corrigido e pronto para deploy  
**Arquivos:** 
- `/supabase/functions/server/index.tsx` (backend corrigido)
- `/src/app/pages/Dashboard.tsx` (warnings React corrigidos)
- `/deploy-fix.sh` (script Linux/Mac)
- `/deploy-fix.bat` (script Windows)
