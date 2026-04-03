import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/auth-context';
import { apiCall } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Input } from '../components/ui/input';
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
import { 
  User, 
  FileText, 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  LogOut,
  Phone,
  Mail,
  MapPin,
  Trash2,
  AlertTriangle,
  Shield,
  Briefcase,
  Image as ImageIcon,
  Video,
  Eye,
  Calculator,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface ClientData {
  id: string;
  fullName: string;
  cpfCnpj: string;
  rg: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  documents: Record<string, any>;
  birthDate?: string;
  whatsapp?: string;
  occupation?: string;
  company?: string;
  monthlyIncome?: number;
  referredBy?: {
    name?: string;
    phone?: string;
  };
}

interface Contract {
  id: string;
  contractNumber: string;
  clientId: string;
  clientName: string;
  productType: string;
  totalValue: number;
  installments: number;
  paymentDay: number;
  startDate: string;
  status: string;
  installmentList: Array<{
    number: number;
    dueDate: string;
    value: number;
    status: 'pending' | 'paid' | 'overdue';
    paidAt?: string;
  }>;
}

export default function ClientPortal() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [error, setError] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'personal' | 'simulation' | 'contracts'>('personal');
  
  // Loan simulation states
  const [loanAmount, setLoanAmount] = useState('');
  const [selectedInstallments, setSelectedInstallments] = useState(12);
  const interestRate = 20; // 20% ao mês

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      return;
    }

    // Verify user is a client
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'client') {
      toast.error('Acesso negado. Esta área é exclusiva para clientes.');
      navigate('/');
      return;
    }

    loadClientData();
  }, [user, authLoading, navigate]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiCall('/client-portal/my-data');
      setClientData(data.client);
      setContracts(data.contracts || []);

      // Debug logs
      console.log('[CLIENT_PORTAL] Full client data:', data.client);
      console.log('[CLIENT_PORTAL] Documents field:', data.client?.documents);
      console.log('[CLIENT_PORTAL] Documents type:', typeof data.client?.documents);
      console.log('[CLIENT_PORTAL] Documents keys:', data.client?.documents ? Object.keys(data.client.documents) : 'No documents');

      // Check if profile is complete, if not redirect to first access
      if (data.client && !isProfileComplete(data.client)) {
        console.log('[CLIENT_PORTAL] Profile incomplete, redirecting to first access');
        navigate('/client-portal/first-access');
        return;
      }
    } catch (err: any) {
      console.error('Error loading client data:', err);
      setError(err.message || 'Erro ao carregar dados');
      toast.error('Erro ao carregar seus dados');
    } finally {
      setLoading(false);
    }
  };

  const isProfileComplete = (client: ClientData) => {
    return (
      client.fullName &&
      client.cpfCnpj &&
      client.rg &&
      client.phone &&
      client.email &&
      client.address &&
      client.fullName.trim() !== '' &&
      client.cpfCnpj.trim() !== '' &&
      client.rg.trim() !== ''
    );
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'destructive' | 'warning' }> = {
      active: { label: 'Ativo', variant: 'success' },
      inactive: { label: 'Inativo', variant: 'default' },
      pending: { label: 'Pendente', variant: 'warning' },
      paid: { label: 'Pago', variant: 'success' },
      overdue: { label: 'Vencido', variant: 'destructive' },
      canceled: { label: 'Cancelado', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'default' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const canDeleteAccount = () => {
    // Check if there are any pending or overdue installments
    if (contracts.length === 0) {
      return true; // No contracts, can delete
    }

    for (const contract of contracts) {
      if (contract.status === 'active') {
        for (const inst of contract.installmentList || []) {
          if (inst.status !== 'paid') {
            return false; // Has unpaid installments
          }
        }
      }
    }

    return true; // All installments are paid
  };

  const handleDeleteAccount = async () => {
    try {
      const data = await apiCall('/client-portal/delete-account', {
        method: 'POST',
      });

      toast.success('Conta excluída com sucesso');
      await signOut();
      navigate('/client-portal/login');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Erro ao excluir conta');
    }
  };

  // Loan simulation calculations
  const calculateLoan = () => {
    const amount = parseFloat(loanAmount.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    if (amount <= 0) {
      return null;
    }

    // PMT formula: P = [r * PV] / [1 - (1 + r)^-n]
    const r = interestRate / 100; // Monthly interest rate
    const n = selectedInstallments; // Number of installments
    const monthlyPayment = (r * amount) / (1 - Math.pow(1 + r, -n));
    const totalAmount = monthlyPayment * n;
    const totalInterest = totalAmount - amount;

    return {
      requestedAmount: amount,
      monthlyPayment,
      totalAmount,
      totalInterest,
      installments: n,
    };
  };

  const getMaxLoanAmount = () => {
    if (!clientData?.monthlyIncome) return 0;
    // Convert monthlyIncome to number (handles both number and string formats)
    const income = typeof clientData.monthlyIncome === 'string' 
      ? parseFloat(clientData.monthlyIncome.replace(/\./g, '').replace(',', '.'))
      : clientData.monthlyIncome;
    const maxInstallment = income * 0.3; // 30% of monthly income
    
    // Calculate max loan amount based on max installment
    // P = [r * PV] / [1 - (1 + r)^-n]
    // Rearranging: PV = P * [1 - (1 + r)^-n] / r
    const r = interestRate / 100;
    const n = selectedInstallments;
    const maxAmount = maxInstallment * (1 - Math.pow(1 + r, -n)) / r;
    
    return maxAmount;
  };

  const isLoanValid = () => {
    const simulation = calculateLoan();
    if (!simulation || !clientData?.monthlyIncome) return false;
    
    // Convert monthlyIncome to number (handles both number and string formats)
    const income = typeof clientData.monthlyIncome === 'string' 
      ? parseFloat(clientData.monthlyIncome.replace(/\./g, '').replace(',', '.'))
      : clientData.monthlyIncome;
    const maxInstallment = income * 0.3;
    return simulation.monthlyPayment <= maxInstallment;
  };

  const formatCurrencyInput = (value: string) => {
    // Remove all non-numeric characters except comma
    const numbers = value.replace(/[^\d]/g, '');
    if (!numbers) return '';
    
    // Convert to number and format
    const num = parseFloat(numbers) / 100;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleLoanAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setLoanAmount(formatted);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  if (error || !clientData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erro ao Carregar Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error || 'Não foi possível carregar seus dados.'}</p>
            <div className="flex gap-2">
              <Button onClick={loadClientData} className="flex-1">
                Tentar Novamente
              </Button>
              <Button onClick={handleLogout} variant="outline">
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-800 border-b border-amber-500/50 sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-full p-1 shadow-md ring-1 ring-white/50">
                <img 
                  src="/logo.png" 
                  alt="ALEMÃO.CREFISA" 
                  className="h-12 w-12 object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Portal do Cliente</h1>
                <p className="text-sm text-amber-200">{clientData.fullName}</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm" className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-emerald-900">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Alert */}
        <Alert className="mb-6 bg-emerald-50 border-amber-400">
          <AlertDescription className="text-emerald-900">
            👋 Bem-vindo ao seu portal! Aqui você pode visualizar seus dados cadastrais e acompanhar seus contratos.
          </AlertDescription>
        </Alert>

        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-6">
              <button
                onClick={() => setActiveTab('personal')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'personal'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span>Dados Pessoais</span>
                </div>
              </button>
              
              {clientData.monthlyIncome && (
                <button
                  onClick={() => setActiveTab('simulation')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'simulation'
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    <span>Simulação de Empréstimo</span>
                  </div>
                </button>
              )}
              
              <button
                onClick={() => setActiveTab('contracts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'contracts'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span>Meus Contratos</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content - Personal Data */}
        {activeTab === 'personal' && (
          <>
            {/* Personal Information */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados Pessoais
                </CardTitle>
                <CardDescription>Informações completas do seu cadastro</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nome Completo</p>
                    <p className="text-base text-gray-900">{clientData.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">CPF/CNPJ</p>
                    <p className="text-base text-gray-900">{clientData.cpfCnpj}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">RG</p>
                    <p className="text-base text-gray-900">{clientData.rg}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Data de Nascimento</p>
                    <p className="text-base text-gray-900">
                      {clientData.birthDate ? new Date(clientData.birthDate).toLocaleDateString('pt-BR') : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <div className="mt-1">{getStatusBadge(clientData.status)}</div>
                  </div>
                  
                  {/* Contato */}
                  <div className="md:col-span-2 border-t pt-4 mt-2">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Informações de Contato
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">E-mail</p>
                      <p className="text-base text-gray-900">{clientData.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Telefone</p>
                      <p className="text-base text-gray-900">{clientData.phone}</p>
                    </div>
                  </div>
                  {clientData.whatsapp && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">WhatsApp</p>
                        <p className="text-base text-gray-900">{clientData.whatsapp}</p>
                      </div>
                    </div>
                  )}
                  {clientData.address && (
                    <div className={`${clientData.whatsapp ? 'md:col-span-1' : 'md:col-span-2'} flex items-start gap-2`}>
                      <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Endereço</p>
                        <p className="text-base text-gray-900">{clientData.address}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Dados Profissionais */}
                  {(clientData.occupation || clientData.company || clientData.monthlyIncome) && (
                    <>
                      <div className="md:col-span-2 border-t pt-4 mt-2">
                        <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Dados Profissionais
                        </p>
                      </div>
                      
                      {clientData.occupation && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Profissão</p>
                          <p className="text-base text-gray-900">{clientData.occupation}</p>
                        </div>
                      )}
                      {clientData.company && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Empresa</p>
                          <p className="text-base text-gray-900">{clientData.company}</p>
                        </div>
                      )}
                      {clientData.monthlyIncome && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Renda Mensal</p>
                          <p className="text-base text-gray-900">
                            R$ {clientData.monthlyIncome}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Indicação */}
                  {clientData.referredBy && (clientData.referredBy.name || clientData.referredBy.phone) && (
                    <>
                      <div className="md:col-span-2 border-t pt-4 mt-2">
                        <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Indicação
                        </p>
                      </div>
                      
                      {clientData.referredBy.name && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Indicado por</p>
                          <p className="text-base text-gray-900">{clientData.referredBy.name}</p>
                        </div>
                      )}
                      {clientData.referredBy.phone && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Telefone da Indicação</p>
                          <p className="text-base text-gray-900">{clientData.referredBy.phone}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Documents Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Documento Frente */}
                  {clientData.documents.front && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        Doc. Frente
                      </p>
                      <div className="relative group">
                        <img
                          src={clientData.documents.front}
                          alt="Documento Frente"
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <a
                          href={clientData.documents.front}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                        >
                          <div className="text-white text-center">
                            <Eye className="h-6 w-6 mx-auto mb-1" />
                            <p className="text-xs font-medium">Ver</p>
                          </div>
                        </a>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-xs font-medium">Enviado</span>
                      </div>
                    </div>
                  )}

                  {/* Documento Verso */}
                  {clientData.documents.back && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        Doc. Verso
                      </p>
                      <div className="relative group">
                        <img
                          src={clientData.documents.back}
                          alt="Documento Verso"
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <a
                          href={clientData.documents.back}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                        >
                          <div className="text-white text-center">
                            <Eye className="h-6 w-6 mx-auto mb-1" />
                            <p className="text-xs font-medium">Ver</p>
                          </div>
                        </a>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-xs font-medium">Enviado</span>
                      </div>
                    </div>
                  )}

                  {/* Selfie */}
                  {clientData.documents.selfie && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        Selfie
                      </p>
                      <div className="relative group">
                        <img
                          src={clientData.documents.selfie}
                          alt="Selfie com Documento"
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <a
                          href={clientData.documents.selfie}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                        >
                          <div className="text-white text-center">
                            <Eye className="h-6 w-6 mx-auto mb-1" />
                            <p className="text-xs font-medium">Ver</p>
                          </div>
                        </a>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-xs font-medium">Enviado</span>
                      </div>
                    </div>
                  )}

                  {/* Vídeo */}
                  {clientData.documents.video && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        Vídeo
                      </p>
                      <div className="relative group">
                        <video
                          src={clientData.documents.video}
                          controls
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 bg-black"
                        />
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-xs font-medium">Enviado</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Warning if no documents */}
                {(!clientData.documents.front && !clientData.documents.back && !clientData.documents.selfie && !clientData.documents.video) && (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">Nenhum documento enviado ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delete Account */}
            <Card className="mt-6 border-gray-200 bg-gray-50/50">
              <CardContent className="space-y-3 pt-4 pb-4">
                <p className="text-xs text-gray-500 text-center">
                  Você pode solicitar a exclusão permanente dos seus dados (LGPD).<br />
                  Disponível apenas quando não houver pendências de pagamento.
                </p>

                {!canDeleteAccount() && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-2 flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900">
                      Não é possível excluir sua conta enquanto houver parcelas pendentes.
                    </p>
                  </div>
                )}

                {canDeleteAccount() && contracts.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded p-2 flex items-start gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-green-900">
                      Todas as parcelas pagas. Você pode excluir sua conta.
                    </p>
                  </div>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={!canDeleteAccount()}
                      size="sm"
                      className="w-full gap-1.5 text-xs text-gray-600 hover:text-red-600 hover:border-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                      Excluir Minha Conta Permanentemente
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-red-900">
                        <AlertTriangle className="h-5 w-5" />
                        Confirmar Exclusão de Conta
                      </AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-2 text-left text-sm">
                          <p>
                            <strong className="text-gray-900">Atenção:</strong> Esta ação é permanente e não pode ser desfeita.
                          </p>
                          <p>Ao confirmar, os seguintes dados serão excluídos:</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Seu perfil de usuário e credenciais de acesso</li>
                            <li>Todos os seus dados pessoais</li>
                            <li>Histórico de contratos pagos</li>
                            <li>Documentos enviados</li>
                          </ul>
                          <p className="text-red-600 font-semibold mt-4">
                            Tem certeza de que deseja excluir sua conta?
                          </p>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Sim, Excluir Permanentemente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </>
        )}

        {/* Tab Content - Loan Simulation */}
        {activeTab === 'simulation' && (
          <>
            {/* Loan Simulation */}
            {clientData.monthlyIncome && (
              <Card className="mb-6 bg-gradient-to-br from-emerald-50 to-amber-50/30 border-amber-400">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: '#115740' }}>
                    <Calculator className="h-5 w-5" />
                    Simule seu Empréstimo
                  </CardTitle>
                  <CardDescription>
                    Calcule as parcelas do seu empréstimo. Limite: parcela de até 30% da sua renda mensal.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Renda mensal info */}
                  <div className="bg-white/80 rounded-lg p-4 border border-amber-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" style={{ color: '#115740' }} />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Sua Renda Mensal</p>
                          <p className="text-lg font-bold text-gray-900">
                            R$ {clientData.monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Parcela Máxima (30%)</p>
                        <p className="text-lg font-bold" style={{ color: '#d4af37' }}>
                          R$ {((parseFloat(String(clientData.monthlyIncome).replace(/\./g, '').replace(',', '.')) || 0) * 0.3).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Simulation Form */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Valor Desejado
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                          R$
                        </span>
                        <Input
                          type="text"
                          value={loanAmount}
                          onChange={handleLoanAmountChange}
                          placeholder="0,00"
                          className="pl-10 text-lg font-semibold"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Valor máximo disponível: {formatCurrency(getMaxLoanAmount())}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Número de Parcelas
                      </label>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[6, 12, 18, 24, 30, 36].map((months) => (
                          <Button
                            key={months}
                            type="button"
                            variant={selectedInstallments === months ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedInstallments(months)}
                            className="font-semibold"
                          >
                            {months}x
                          </Button>
                        ))}
                      </div>
                      
                      {/* Fine adjustment controls */}
                      <div className="flex items-center gap-2 justify-center bg-gray-50 rounded-lg p-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInstallments(Math.max(1, selectedInstallments - 1))}
                          className="h-8 w-8 p-0"
                        >
                          -
                        </Button>
                        <div className="bg-white border border-gray-200 rounded px-4 py-1 min-w-[80px] text-center">
                          <span className="text-lg font-bold text-gray-900">{selectedInstallments}x</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInstallments(Math.min(60, selectedInstallments + 1))}
                          className="h-8 w-8 p-0"
                        >
                          +
                        </Button>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1">
                        Taxa de juros: {interestRate}% ao mês
                      </p>
                    </div>
                  </div>

                  {/* Simulation Result */}
                  {calculateLoan() && (
                    <div className="bg-white rounded-lg border-2 border-amber-400 p-5 space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                        <TrendingUp className="h-5 w-5" style={{ color: '#115740' }} />
                        <h3 className="font-semibold text-lg text-gray-900">Resultado da Simulação</h3>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-emerald-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Valor Solicitado</p>
                          <p className="text-2xl font-bold" style={{ color: '#115740' }}>
                            {formatCurrency(calculateLoan()!.requestedAmount)}
                          </p>
                        </div>

                        <div className={`text-center p-4 rounded-lg ${isLoanValid() ? 'bg-amber-50' : 'bg-red-50'}`}>
                          <p className="text-sm text-gray-600 mb-1">Parcela Mensal</p>
                          <p className={`text-2xl font-bold ${isLoanValid() ? '' : 'text-red-900'}`} style={isLoanValid() ? { color: '#d4af37' } : {}}>
                            {formatCurrency(calculateLoan()!.monthlyPayment)}
                          </p>
                          {!isLoanValid() && (
                            <p className="text-xs text-red-600 mt-1 font-medium">
                              Excede 30% da renda
                            </p>
                          )}
                        </div>

                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Total a Pagar</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(calculateLoan()!.totalAmount)}
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">Total de Juros:</span>
                          <span className="font-bold text-gray-900">
                            {formatCurrency(calculateLoan()!.totalInterest)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">Número de Parcelas:</span>
                          <span className="font-bold text-gray-900">
                            {calculateLoan()!.installments}x
                          </span>
                        </div>
                      </div>

                      {/* Validation Message */}
                      {isLoanValid() ? (
                        <Alert className="bg-emerald-50 border-emerald-600">
                          <CheckCircle className="h-4 w-4 text-emerald-700" />
                          <AlertDescription className="text-emerald-800">
                            ✅ Simulação aprovada! A parcela está dentro do limite de 30% da sua renda.
                            Entre em contato conosco para formalizar seu empréstimo.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert className="bg-red-50 border-red-300">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            ⚠️ A parcela mensal excede 30% da sua renda. Reduza o valor ou aumente o número de parcelas.
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button
                        className="w-full"
                        style={{ backgroundColor: '#115740' }}
                        disabled={!isLoanValid()}
                        onClick={() => {
                          toast.success('Entre em contato com nossa equipe para formalizar seu empréstimo!');
                        }}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Solicitar Este Empréstimo
                      </Button>
                    </div>
                  )}

                  {!loanAmount && (
                    <div className="text-center py-8 text-gray-500">
                      <Calculator className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Digite o valor desejado para simular seu empréstimo</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Tab Content - Contracts */}
        {activeTab === 'contracts' && (
          <>
            {/* Contracts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Meus Contratos
                </CardTitle>
                <CardDescription>
                  {contracts.length === 0
                    ? 'Você ainda não possui contratos'
                    : `${contracts.length} contrato(s) encontrado(s)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contracts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum contrato encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {contracts.map((contract) => {
                      const totalPaid = contract.installmentList?.filter(i => i.status === 'paid').length || 0;
                      const totalOverdue = contract.installmentList?.filter(i => i.status === 'overdue').length || 0;

                      return (
                        <div key={contract.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">
                                Contrato #{contract.contractNumber}
                              </h3>
                              <p className="text-sm text-gray-500">{contract.productType}</p>
                            </div>
                            {getStatusBadge(contract.status)}
                          </div>

                          <div className="grid md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Valor Total</p>
                              <p className="text-lg font-bold text-gray-900">
                                {formatCurrency(contract.totalValue)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Parcelas</p>
                              <p className="text-lg font-bold text-gray-900">
                                {contract.installments}x
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Dia de Vencimento</p>
                              <p className="text-lg font-bold text-gray-900">
                                Todo dia {contract.paymentDay}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-4 mb-4 text-sm">
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>{totalPaid} pagas</span>
                            </div>
                            {totalOverdue > 0 && (
                              <div className="flex items-center gap-1 text-red-600">
                                <XCircle className="h-4 w-4" />
                                <span>{totalOverdue} vencidas</span>
                              </div>
                            )}
                          </div>

                          {/* Installments List */}
                          {contract.installmentList && contract.installmentList.length > 0 && (
                            <div className="border-t border-gray-200 pt-4">
                              <h4 className="font-medium text-sm text-gray-700 mb-3">Parcelas</h4>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {contract.installmentList.map((installment) => (
                                  <div
                                    key={installment.number}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      {installment.status === 'paid' ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                      ) : installment.status === 'overdue' ? (
                                        <XCircle className="h-5 w-5 text-red-600" />
                                      ) : (
                                        <Calendar className="h-5 w-5 text-gray-400" />
                                      )}
                                      <div>
                                        <p className="font-medium text-sm text-gray-900">
                                          Parcela {installment.number}/{contract.installments}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Vencimento: {formatDate(installment.dueDate)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-gray-900">
                                        {formatCurrency(installment.value)}
                                      </p>
                                      {getStatusBadge(installment.status)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}