import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { apiCall } from '../lib/supabase';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Home,
  Calendar,
  DollarSign,
  FileText,
  CreditCard,
  User,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
  status: 'pending' | 'paid' | 'cancelled';
  clientId?: string;
  clientName?: string;
  contractId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TransactionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadTransaction();
    }
  }, [id]);

  const loadTransaction = async () => {
    setLoading(true);
    try {
      const data = await apiCall(`/financial/transactions/${id}`);
      setTransaction(data.transaction);
    } catch (error) {
      console.error('Error loading transaction:', error);
      toast.error('Erro ao carregar transação');
      navigate('/financial');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setDeleting(true);
    try {
      await apiCall(`/financial/transactions/${id}`, {
        method: 'DELETE',
      });
      toast.success('Transação excluída com sucesso!');
      navigate('/financial');
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast.error(error.message || 'Erro ao excluir transação');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">Transação não encontrada</p>
        <Button asChild className="mt-4">
          <Link to="/financial">Voltar para Financeiro</Link>
        </Button>
      </div>
    );
  }

  const statusConfig = {
    paid: { label: 'Pago', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
    pending: { label: 'Pendente', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock },
    cancelled: { label: 'Cancelado', color: 'text-gray-600', bg: 'bg-gray-100', icon: XCircle },
  };

  const status = statusConfig[transaction.status];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
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
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {transaction.type === 'income' ? (
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
                {transaction.description}
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                {transaction.type === 'income' ? 'Receita' : 'Despesa'} • {transaction.category}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/financial/transactions/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Excluindo...' : 'Excluir'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Amount Card */}
      <Card className={transaction.type === 'income' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Valor</p>
            <p className={`text-4xl font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(transaction.amount)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Transação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Data</p>
                <p className="font-medium">{formatDate(transaction.date)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <StatusIcon className={`h-5 w-5 ${status.color} mt-0.5`} />
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Forma de Pagamento</p>
                <p className="font-medium">{transaction.paymentMethod}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Categoria</p>
                <p className="font-medium">{transaction.category}</p>
              </div>
            </div>

            {transaction.clientName && (
              <div className="flex items-start gap-3 md:col-span-2">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Cliente Vinculado</p>
                  <Link 
                    to={`/clients/${transaction.clientId}`}
                    className="font-medium text-blue-600 hover:text-blue-800 underline"
                  >
                    {transaction.clientName}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {transaction.notes && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">Observações</p>
              <p className="text-gray-700 whitespace-pre-wrap">{transaction.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">ID da Transação:</span>
            <span className="font-mono text-gray-700">{transaction.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Criado em:</span>
            <span className="text-gray-700">
              {new Date(transaction.createdAt).toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Última atualização:</span>
            <span className="text-gray-700">
              {new Date(transaction.updatedAt).toLocaleString('pt-BR')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}