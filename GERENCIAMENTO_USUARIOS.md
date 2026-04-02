# Gerenciamento de Usuários - Documentação Completa

## 📋 Visão Geral

Nova funcionalidade implementada para permitir que administradores gerenciem todos os usuários do sistema (admins, operadores e clientes) com total controle sobre contas, senhas e acessos.

## 🎯 Funcionalidades Implementadas

### 1. **Visualização de Usuários**
- ✅ Lista completa de todos os usuários cadastrados
- ✅ Estatísticas em cards: Total de Usuários, Administradores, Operadores e Clientes
- ✅ Badges coloridos identificando o tipo de cada usuário:
  - 🔴 **Admin** - Vermelho com ícone de Shield
  - 🔵 **Operador** - Azul com ícone de UserCheck
  - 🟢 **Cliente** - Verde com ícone de Users

### 2. **Filtros e Busca**
- ✅ Busca por nome ou e-mail
- ✅ Filtro por tipo de usuário (Todos, Administradores, Operadores, Clientes)
- ✅ Resultados dinâmicos em tempo real

### 3. **Exclusão de Usuários**
- ✅ Botão de exclusão com confirmação obrigatória
- ✅ Proteção contra auto-exclusão (admin não pode excluir a si mesmo)
- ✅ Para clientes: soft delete com anonimização dos dados (LGPD compliant)
- ✅ Alertas específicos ao excluir clientes sobre manutenção de contratos
- ✅ Auditoria completa da ação

### 4. **Reset de Senha**
- ✅ Geração automática de senha temporária segura
- ✅ Exibição da nova senha em toast por 10 segundos
- ✅ Aviso para anotar a senha antes de fechá-la
- ✅ Auditoria da operação

## 🔐 Segurança e Permissões

### Controle de Acesso
- ⚠️ **APENAS ADMINISTRADORES** têm acesso a esta funcionalidade
- 🚫 Operadores e Clientes não veem o menu "Usuários"
- 🔒 Todos os endpoints possuem validação de role no backend

### LGPD e Privacidade
Ao excluir um cliente:
1. Status alterado para "deleted"
2. Dados pessoais anonimizados:
   - Nome → `[EXCLUÍDO]`
   - CPF/CNPJ → `[EXCLUÍDO]`
   - RG → `[EXCLUÍDO]`
   - Telefone → `[EXCLUÍDO]`
   - E-mail → `[EXCLUÍDO]`
   - Endereço → `[EXCLUÍDO]`
   - Ocupação → `[EXCLUÍDO]`
   - Empresa → `[EXCLUÍDO]`
3. Contratos e histórico mantidos para fins de auditoria
4. Índices CPF removidos
5. Conta de autenticação removida do Supabase Auth

## 🛠️ Endpoints Backend

### 1. GET `/make-server-bd42bc02/users`
**Descrição:** Lista todos os usuários do sistema

**Autenticação:** Requerida (Admin only)

**Resposta:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "usuario@example.com",
      "name": "Nome do Usuário",
      "role": "admin|operator|client",
      "createdAt": "2026-03-28T...",
      "lastLogin": "2026-03-28T..."
    }
  ]
}
```

### 2. DELETE `/make-server-bd42bc02/users/:userId`
**Descrição:** Exclui um usuário do sistema

**Autenticação:** Requerida (Admin only)

**Validações:**
- Admin não pode excluir a si mesmo
- Valida permissões de admin
- Se for cliente, anonimiza dados (LGPD)

**Resposta:**
```json
{
  "success": true,
  "message": "Usuário excluído com sucesso"
}
```

### 3. POST `/make-server-bd42bc02/users/:userId/reset-password`
**Descrição:** Reseta a senha de um usuário

**Autenticação:** Requerida (Admin only)

**Resposta:**
```json
{
  "success": true,
  "message": "Senha resetada com sucesso",
  "newPassword": "TempAbc123XYZ!"
}
```

## 📍 Localização dos Arquivos

### Frontend
- **Página:** `/src/app/pages/Users.tsx`
- **Rota:** `/src/app/routes.tsx` (linha com `Users`)
- **Menu:** `/src/app/components/Sidebar.tsx` (item "👥 Usuários")

### Backend
- **Endpoints:** `/supabase/functions/server/index.tsx` (linhas 2454-2637)

## 🎨 Interface do Usuário

### Cards de Estatísticas
```
┌─────────────────────┬─────────────────────┬─────────────────────┬─────────────────────┐
│ Total de Usuários   │ Administradores     │ Operadores          │ Clientes            │
│       15            │        2            │        5            │        8            │
└─────────────────────┴─────────────────────┴─────────────────────┴─────────────────────┘
```

### Tabela de Usuários
```
┌─────────────────────┬──────────────────────┬──────────┬─────────────────┬────────────┐
│ Nome                │ E-mail               │ Tipo     │ Cadastrado em   │ Ações      │
├─────────────────────┼──────────────────────┼──────────┼─────────────────┼────────────┤
│ 👤 João Silva       │ joao@example.com     │ [Admin]  │ 01/01/2026      │ [⋮ Menu]   │
│ 👤 Maria Santos     │ maria@example.com    │ [Oper.]  │ 15/02/2026      │ [⋮ Menu]   │
└─────────────────────┴──────────────────────┴──────────┴─────────────────┴────────────┘
```

### Menu de Ações (Dropdown)
- 🔑 **Resetar Senha** - Gera nova senha temporária
- 🗑️ **Excluir Usuário** - Remove o usuário (não disponível para si mesmo)

## ⚡ Fluxo de Uso

### Resetar Senha de um Usuário
1. Admin acessa **"👥 Usuários"** no menu lateral
2. Localiza o usuário (busca ou filtro)
3. Clica no menu de ações (⋮) ao lado do usuário
4. Seleciona **"Resetar Senha"**
5. Confirma a ação no diálogo
6. Sistema gera senha temporária e exibe em toast por 10 segundos
7. Admin anota a senha e envia ao usuário

### Excluir um Usuário
1. Admin acessa **"👥 Usuários"** no menu lateral
2. Localiza o usuário a ser excluído
3. Clica no menu de ações (⋮) ao lado do usuário
4. Seleciona **"Excluir Usuário"**
5. Lê o aviso de confirmação (especialmente para clientes)
6. Confirma a exclusão
7. Usuário é removido e dados anonimizados (se cliente)

## 🔍 Auditoria

Todas as operações são registradas no sistema de auditoria:
- `USER_DELETED` - Quando um usuário é excluído
- `PASSWORD_RESET_BY_ADMIN` - Quando admin reseta senha de usuário

Logs incluem:
- Quem executou a ação (admin)
- Qual usuário foi afetado
- Data/hora da operação
- IP de origem
- Metadados adicionais (role do usuário afetado)

## 🎯 Próximas Melhorias Sugeridas

1. **Edição de Usuários**
   - Alterar nome, e-mail
   - Promover operador para admin
   - Desativar/reativar usuários

2. **Histórico de Ações**
   - Ver últimas ações de um usuário
   - Visualizar logs de auditoria específicos

3. **Exportação**
   - Exportar lista de usuários para CSV/Excel
   - Relatório de usuários ativos/inativos

4. **Notificações**
   - Enviar nova senha por e-mail automaticamente
   - Notificar usuário sobre alterações na conta

5. **Filtros Avançados**
   - Último login (ativos/inativos)
   - Data de cadastro
   - Status da conta

## ✅ Checklist de Implementação

- [x] Criar página Users.tsx com interface completa
- [x] Adicionar endpoints no backend (list, delete, reset-password)
- [x] Adicionar rota no routes.tsx
- [x] Adicionar item no menu Sidebar.tsx (apenas para admins)
- [x] Implementar filtros e busca
- [x] Implementar exclusão com confirmação
- [x] Implementar reset de senha
- [x] Adicionar proteções de segurança (admin only)
- [x] Implementar anonimização LGPD para clientes
- [x] Adicionar auditoria completa
- [x] Criar documentação

## 📞 Suporte

Para dúvidas ou problemas com o gerenciamento de usuários:
1. Verifique se está logado como administrador
2. Confirme que o backend está funcionando
3. Verifique os logs do navegador (F12 → Console)
4. Verifique os logs do backend no Supabase

---

**Última atualização:** 28/03/2026
**Versão:** 1.0.0
**Status:** ✅ Funcional em Produção
