import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { apiCall } from '../lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft, DollarSign, Calendar, TrendingUp, CheckCircle, Send, Home, Edit } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export default function ContractDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; installment: any }>(({
    open: false,
    installment: null,
  }));
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadContract();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadContract = async () => {
    if (!id) return;
    
    try {
      const data = await apiCall(`/contracts/${id}`);
      setContract(data.contract);
    } catch (error) {
      console.error('Error loading contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentDialog.installment) return;

    setPaymentLoading(true);
    try {
      const response = await apiCall(`/contracts/${id}/installments/${paymentDialog.installment.number}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          paymentDate,
        }),
      });

      toast.success('Pagamento registrado com sucesso!');
      
      // Show notification about financial transaction
      if (response.transactionId) {
        toast.success('💰 Receita adicionada ao Financeiro automaticamente!', {
          duration: 4000,
        });
      }
      
      setPaymentDialog({ open: false, installment: null });
      await loadContract(); // Reload contract data
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Erro ao registrar pagamento');
      
      // Close dialog and reload data even on error to sync state
      setPaymentDialog({ open: false, installment: null });
      await loadContract();
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSendReminder = async (installment: any, type: string) => {
    try {
      const result = await apiCall('/whatsapp/send-reminder', {
        method: 'POST',
        body: JSON.stringify({
          clientId: contract.clientId,
          contractId: contract.id,
          installmentNumber: installment.number,
          type,
        }),
      });

      if (result.success) {
        toast.success('✅ Mensagem WhatsApp enviada com sucesso!');
      }
    } catch (error: any) {
      console.error('Reminder error:', error);
      
      // Show specific error messages
      if (error.message?.includes('não configurada')) {
        toast.error('⚠️ WhatsApp não configurado. Configure EVOLUTION_API_URL e EVOLUTION_API_KEY.');
      } else if (error.message?.includes('não possui WhatsApp')) {
        toast.error('⚠️ Cliente não possui número WhatsApp cadastrado.');
      } else {
        toast.error(`❌ ${error.message || 'Erro ao enviar lembrete'}`);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status !== 'paid' && new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!contract) {
    return <div>Contrato não encontrado</div>;
  }

  const totalPaid = contract.installmentsList
    .filter((i: any) => i.status === 'paid')
    .reduce((sum: number, i: any) => sum + (i.paidAmount || i.amount), 0);

  const totalPending = contract.installmentsList
    .filter((i: any) => i.status !== 'paid')
    .reduce((sum: number, i: any) => sum + i.amount, 0);

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Contrato #{contract.id.slice(-8)}</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Cliente: {contract.client?.fullName || 'Não encontrado'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/contracts/${id}/edit`}>
            <Button variant="default" size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
              Editar Contrato
            </Button>
          </Link>
          <Link to={`/clients/${contract.clientId}`}>
            <Button variant="outline" size="sm" className="text-sm">Ver Cliente</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold break-words">{formatCurrency(contract.totalAmount)}</div>
            <p className="text-xs text-gray-600 mt-1">
              {contract.installments} parcelas de {formatCurrency(contract.installmentAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pago</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold break-words">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-gray-600 mt-1">
              {contract.installmentsList.filter((i: any) => i.status === 'paid').length} parcelas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold break-words">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-gray-600 mt-1">
              {contract.installmentsList.filter((i: any) => i.status !== 'paid').length} parcelas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Juros</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold break-words">{contract.interestRate}%</div>
            <p className="text-xs text-gray-600 mt-1">Multa: {contract.lateFeeRate}%</p>
            <p className="text-xs text-gray-600 mt-1">
              Parcelas: {contract.installmentPeriod === 'daily' ? 'Diárias' : contract.installmentPeriod === 'weekly' ? 'Semanais' : 'Mensais'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parcelas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pago em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contract.installmentsList.map((installment: any) => {
                  const overdue = isOverdue(installment.dueDate, installment.status);

                  return (
                    <TableRow key={installment.number}>
                      <TableCell className="font-medium">{installment.number}</TableCell>
                      <TableCell>
                        <span className={overdue ? 'text-red-600 font-medium' : ''}>
                          {formatDate(installment.dueDate)}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(installment.amount)}</TableCell>
                      <TableCell>
                        {installment.status === 'paid' ? (
                          <Badge variant="default" className="bg-green-600">
                            Pago
                          </Badge>
                        ) : overdue ? (
                          <Badge variant="destructive">Atrasado</Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {installment.paidAt ? formatDate(installment.paidAt) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {installment.status !== 'paid' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPaymentDialog({ open: true, installment });
                                  setPaymentAmount(installment.amount.toFixed(2));
                                }}
                              >
                                <DollarSign className="h-3 w-3 mr-1" />
                                Pagar
                              </Button>
                              
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog.open} onOpenChange={(open) => setPaymentDialog({ open, installment: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>Insira os detalhes do pagamento para registrar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Parcela</Label>
              <p className="text-sm">
                {paymentDialog.installment?.number} / {contract.installments}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Valor Pago</Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Data do Pagamento</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePayment} disabled={paymentLoading}>
                {paymentLoading ? 'Processando...' : 'Confirmar Pagamento'}
              </Button>
              <Button variant="outline" onClick={() => setPaymentDialog({ open: false, installment: null })}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}