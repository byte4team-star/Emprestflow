import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { apiCall } from '../lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft, Save, Home, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface TransactionFormData {
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: string;
  date: string;
  paymentMethod: string;
  status: 'pending' | 'paid' | 'cancelled';
  clientId?: string;
  notes?: string;
}

const INCOME_CATEGORIES = [
  'Pagamento de Contrato',
  'Entrada de Contrato',
  'Juros Recebidos',
  'Multa Recebida',
  'Outros Recebimentos',
];

const EXPENSE_CATEGORIES = [
  'Salários',
  'Aluguel',
  'Energia',
  'Internet',
  'Telefone',
  'Material de Escritório',
  'Marketing',
  'Impostos',
  'Taxas Bancárias',
  'Manutenção',
  'Outros',
];

const PAYMENT_METHODS = [
  'Dinheiro',
  'PIX',
  'Transferência Bancária',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Boleto',
  'Outros',
];

export default function TransactionForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const typeFromUrl = searchParams.get('type') as 'income' | 'expense' | null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormData>({
    defaultValues: {
      type: typeFromUrl || 'income',
      status: 'paid',
      date: new Date().toISOString().split('T')[0],
      clientId: 'none' as any,
    },
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);
  const [clients, setClients] = useState<Array<{ id: string; fullName: string }>>([]);

  const transactionType = watch('type');

  useEffect(() => {
    loadClients();
    if (isEditing && id) {
      loadTransaction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing]);

  const loadClients = async () => {
    try {
      const data = await apiCall('/clients');
      setClients(data.clients || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadTransaction = async () => {
    try {
      const data = await apiCall(`/financial/transactions/${id}`);
      const transaction = data.transaction;

      Object.keys(transaction).forEach((key) => {
        setValue(key as any, transaction[key]);
      });
      
      // Set "none" if no client is linked
      if (!transaction.clientId) {
        setValue('clientId', 'none' as any);
      }
    } catch (error) {
      console.error('Error loading transaction:', error);
      toast.error('Erro ao carregar transação');
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: TransactionFormData) => {
    setLoading(true);

    try {
      const payload = {
        ...data,
        amount: parseFloat(data.amount.toString().replace(',', '.')),
      };

      if (isEditing) {
        await apiCall(`/financial/transactions/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Transação atualizada com sucesso!');
      } else {
        await apiCall('/financial/transactions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Transação cadastrada com sucesso!');
      }
      navigate('/financial');
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      toast.error(error.message || 'Erro ao salvar transação');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const categories = transactionType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link to="/financial" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Financeiro
          </Link>
          <span className="text-gray-400">|</span>
          <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {transactionType === 'income' ? (
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <ArrowUpCircle className="h-6 w-6 text-green-600" />
            </div>
          ) : (
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <ArrowDownCircle className="h-6 w-6 text-red-600" />
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {isEditing 
                ? 'Editar Transação' 
                : transactionType === 'income' 
                ? 'Nova Receita' 
                : 'Nova Despesa'}
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              {isEditing 
                ? 'Atualize os dados da transação' 
                : 'Registre uma nova ' + (transactionType === 'income' ? 'receita' : 'despesa')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tipo e Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Dados principais da transação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={transactionType}
                  onValueChange={(value: 'income' | 'expense') => setValue('type', value)}
                  disabled={isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">💰 Receita</SelectItem>
                    <SelectItem value="expense">💸 Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  onValueChange={(value) => setValue('category', value)}
                  defaultValue={watch('category')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register('amount', { required: 'Campo obrigatório' })}
                  placeholder="0,00"
                />
                {errors.amount && (
                  <p className="text-sm text-red-600">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  {...register('date', { required: 'Campo obrigatório' })}
                />
                {errors.date && (
                  <p className="text-sm text-red-600">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  {...register('description')}
                  placeholder="Descrição da transação"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Forma de Pagamento *</Label>
                <Select
                  onValueChange={(value) => setValue('paymentMethod', value)}
                  defaultValue={watch('paymentMethod')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  onValueChange={(value: 'pending' | 'paid' | 'cancelled') => setValue('status', value)}
                  defaultValue={watch('status')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">✅ Pago</SelectItem>
                    <SelectItem value="pending">⏳ Pendente</SelectItem>
                    <SelectItem value="cancelled">❌ Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vinculação (Opcional) */}
        <Card>
          <CardHeader>
            <CardTitle>Vinculação (Opcional)</CardTitle>
            <CardDescription>Vincule a transação a um cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="clientId">Cliente</Label>
              <Select
                onValueChange={(value) => setValue('clientId', value === 'none' ? undefined : value)}
                defaultValue={watch('clientId')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum cliente selecionado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionais</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Informações adicionais sobre esta transação"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Salvando...' : isEditing ? 'Atualizar Transação' : 'Salvar Transação'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/financial')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}