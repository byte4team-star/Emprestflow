# Instruções para Popular o Sistema com Dados de Teste

## ⚠️ IMPORTANTE - ATUALIZAÇÃO 25/02/2026

**MUDANÇA CRÍTICA DE COMPORTAMENTO:**

- ✅ **ANTES**: O botão "Criar Dados Teste" apagava TODOS os dados existentes
- ✅ **AGORA**: O botão apenas ADICIONA dados de teste, mantendo seus dados existentes seguros
- ✅ **SEGURO PARA PRODUÇÃO**: Você pode usar este recurso sem medo de perder dados

## Como Usar

O sistema agora possui uma funcionalidade de **seed** (popular dados de teste) que cria automaticamente:
- **6 clientes** com dados realistas brasileiros
- **5 contratos** vinculados aos clientes criados

## Passo a Passo

### 1. Faça Login no Sistema
- Acesse o sistema com suas credenciais de usuário autenticado

### 2. Navegue até a Página de Clientes
- No menu lateral, clique em **"Clientes"**
- Você verá a lista de clientes existentes

### 3. Clique no Botão "Criar Dados Teste"
- No canto superior direito, ao lado do botão "Novo Cliente", você encontrará o botão **"Criar Dados Teste"** (ícone de banco de dados)
- Clique neste botão

### 4. Confirme a Criação
- Uma confirmação aparecerá perguntando: _"Isso criará 6 novos clientes e 5 contratos de teste. Deseja continuar?"_
- Clique em **OK** para confirmar

### 5. Aguarde a Criação
- O sistema criará automaticamente todos os dados
- Uma notificação de sucesso aparecerá informando quantos clientes e contratos foram criados
- A lista de clientes será atualizada automaticamente

## Dados Criados

### Clientes (6 no total):

1. **Maria Silva Santos**
   - CPF: 123.456.789-01
   - Profissão: Analista de Sistemas
   - Empresa: Tech Solutions Ltda
   - Renda: R$ 8.500,00

2. **João Pedro Oliveira**
   - CPF: 234.567.890-12
   - Profissão: Engenheiro Civil
   - Empresa: Construtora ABC
   - Renda: R$ 12.000,00
   - Indicado por: Maria Silva Santos

3. **Ana Carolina Ferreira**
   - CPF: 345.678.901-23
   - Profissão: Médica
   - Empresa: Hospital São Luiz
   - Renda: R$ 18.000,00

4. **Carlos Eduardo Costa**
   - CPF: 456.789.012-34
   - Profissão: Advogado
   - Empresa: Costa & Associados
   - Renda: R$ 15.000,00

5. **Patricia Gomes Alves**
   - CPF: 567.890.123-45
   - Profissão: Designer Gráfica
   - Empresa: Studio Criativo
   - Renda: R$ 6.500,00
   - Indicada por: Ana Carolina Ferreira

6. **Ricardo Mendes Lima**
   - CPF: 678.901.234-56
   - Profissão: Empresário
   - Empresa: Lima Comércio e Serviços
   - Renda: R$ 25.000,00

### Contratos (5 no total):

1. **Maria Silva Santos**
   - Valor Total: R$ 15.000,00
   - Parcelas: 12x de R$ 1.250,00
   - Descrição: Contrato de financiamento de equipamentos de TI
   - Primeiro Vencimento: 01/03/2026

2. **João Pedro Oliveira**
   - Valor Total: R$ 50.000,00
   - Parcelas: 24x de R$ 2.083,33
   - Descrição: Contrato de prestação de serviços de engenharia
   - Primeiro Vencimento: 15/03/2026

3. **Ana Carolina Ferreira**
   - Valor Total: R$ 30.000,00
   - Parcelas: 18x de R$ 1.666,67
   - Descrição: Contrato de consultoria médica
   - Primeiro Vencimento: 10/03/2026

4. **Carlos Eduardo Costa**
   - Valor Total: R$ 80.000,00
   - Parcelas: 36x de R$ 2.222,22
   - Descrição: Contrato de assessoria jurídica empresarial
   - Primeiro Vencimento: 01/04/2026

5. **Patricia Gomes Alves**
   - Valor Total: R$ 12.000,00
   - Parcelas: 10x de R$ 1.200,00
   - Descrição: Contrato de projeto de design e branding
   - Primeiro Vencimento: 20/03/2026

## Informações Técnicas

### Implementação Backend
- Rota: `POST /make-server-bd42bc02/seed`
- Autenticação: Requer token JWT válido
- Arquivo: `/supabase/functions/server/index.tsx`

### Implementação Frontend
- Componente: `/src/app/pages/Clients.tsx`
- Função: `handleSeedData()`

### Logs e Auditoria
- Todas as criações são registradas no log de auditoria
- Ação registrada: `SEED_DATA_CREATED`
- Metadados incluem quantidade de clientes e contratos criados

## Observações Importantes

⚠️ **Atenção:**
- Os dados são criados a cada clique no botão
- Se você clicar múltiplas vezes, dados duplicados serão criados (com IDs diferentes)
- Todos os clientes são criados com status "Ativo"
- Todos os clientes têm consentimento LGPD marcado como TRUE
- Os endereços são de São Paulo - SP
- Os contratos são criados com status "Ativo"
- Todas as parcelas são criadas com status "Pendente"

## Testando o Sistema

Após criar os dados de teste, você pode:

1. **Visualizar Clientes**
   - Na página de Clientes, veja todos os 6 clientes listados
   - Clique em "Ver" para ver detalhes de cada cliente

2. **Visualizar Contratos**
   - Navegue até a página de Contratos
   - Veja os 5 contratos criados com informações de cliente

3. **Dashboard**
   - Acesse o Dashboard para ver estatísticas atualizadas
   - Verifique os gráficos e métricas com os dados reais

4. **Testar Funcionalidades**
   - Teste a busca de clientes
   - Teste filtros de contratos
   - Simule pagamentos de parcelas
   - Teste envio de lembretes via WhatsApp

## Verificando a Criação

Para confirmar que os dados foram criados com sucesso:

1. Verifique a notificação de sucesso que aparece após clicar no botão
2. A lista de clientes será recarregada automaticamente
3. Você verá os 6 novos clientes na lista
4. Navegue até "Contratos" para ver os 5 contratos criados

## Troubleshooting

Se encontrar algum erro:

1. **Erro de Autenticação**: Certifique-se de estar logado
2. **Erro no Backend**: Verifique os logs do Supabase Functions
3. **Dados não Aparecem**: Tente recarregar a página (F5)
4. **Duplicação de Dados**: Normal se clicar múltiplas vezes no botão

## Próximos Passos

Após criar os dados de teste, você pode:
- Editar os clientes criados
- Adicionar documentos aos clientes
- Marcar parcelas como pagas
- Testar o envio de lembretes
- Visualizar relatórios e dashboards
- Testar funcionalidades de busca e filtros