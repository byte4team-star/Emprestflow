import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/auth-context';
import { apiCall } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
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
  EyeOff,
  KeyRound,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import logo from 'figma:asset/6c9e654d548e97a4191a24d7f1bce9d77b7a1b25.png';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

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
  const [activeTab, setActiveTab] = useState<'personal' | 'contracts' | 'password'>('personal');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      console.log('[CLIENT_PORTAL] Auth still loading...');
      return;
    }

    console.log('[CLIENT_PORTAL] Auth loaded, user:', user);
    console.log('[CLIENT_PORTAL] User role:', user?.role);

    // Verify user is a client
    if (!user) {
      console.log('[CLIENT_PORTAL] No user found, redirecting to login');
      toast.error('Você precisa fazer login para acessar esta página');
      navigate('/client-portal/login');
      return;
    }

    if (user.role !== 'client') {
      console.log('[CLIENT_PORTAL] User is not a client, role:', user.role);
      toast.error('Acesso negado. Esta área é exclusiva para clientes.');
      navigate('/');
      return;
    }

    console.log('[CLIENT_PORTAL] User verified as client, loading data');
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

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      toast.error('Por favor, informe sua senha atual');
      return;
    }

    if (!newPassword) {
      toast.error('Por favor, informe a nova senha');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (newPassword === currentPassword) {
      toast.error('A nova senha deve ser diferente da senha atual');
      return;
    }

    if (!confirmPassword) {
      toast.error('Por favor, confirme a nova senha');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setPasswordLoading(true);
    try {
      await apiCall('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      toast.success('Senha alterada com sucesso! Use a nova senha no próximo login.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Fraca', color: 'text-red-600' };
    if (strength <= 3) return { strength, label: 'Média', color: 'text-amber-600' };
    return { strength, label: 'Forte', color: 'text-green-600' };
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
              <img 
                src={logo} 
                alt="ALEMÃO.CREFISA" 
                className="h-12 w-12 object-contain rounded-full drop-shadow-md"
              />
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

              <button
                onClick={() => setActiveTab('password')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'password'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  <span>Alterar Senha</span>
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
                {/* Fotos */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    📷 Fotos (4 obrigatórias + 2 opcionais)
                  </h3>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {['foto1', 'foto2', 'foto3', 'foto4', 'foto5', 'foto6'].map((type, index) => {
                      const isRequired = index < 4;
                      const document = clientData.documents?.[type];
                      
                      // Handle both object format and legacy string format
                      const isObject = document && typeof document === 'object';
                      const isString = document && typeof document === 'string';
                      const hasDocument = isObject ? (document.url || document.path) : isString;
                      const documentUrl = isObject ? (document.url || document.path) : document;
                      
                      return hasDocument && documentUrl ? (
                        <div key={type} className="space-y-1">
                          <p className="text-[10px] font-medium text-gray-700 flex items-center gap-1">
                            <ImageIcon className="h-2.5 w-2.5" />
                            Foto {index + 1}
                            {!isRequired && <span className="text-gray-500 text-[9px] ml-0.5">(opc)</span>}
                          </p>
                          <div className="relative group">
                            <img
                              src={documentUrl}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-20 object-cover rounded border border-green-500"
                              onError={(e) => {
                                console.error(`Failed to load image: ${type}`, documentUrl);
                                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23ddd" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="12">Erro</text></svg>';
                              }}
                            />
                            <a
                              href={documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded"
                            >
                              <div className="text-white text-center">
                                <Eye className="h-5 w-5 mx-auto mb-0.5" />
                                <p className="text-[10px] font-medium">Ver</p>
                              </div>
                            </a>
                          </div>
                          <div className="flex items-center gap-0.5 text-green-600">
                            <CheckCircle className="h-2.5 w-2.5" />
                            <span className="text-[10px] font-medium">Enviada</span>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Vídeos */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    🎥 Vídeos (1 obrigatório + 1 opcional)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['video1', 'video2'].map((type, index) => {
                      const isRequired = index === 0;
                      const document = clientData.documents?.[type];
                      
                      // Handle both object format and legacy string format
                      const isObject = document && typeof document === 'object';
                      const isString = document && typeof document === 'string';
                      const hasDocument = isObject ? (document.url || document.path) : isString;
                      const documentUrl = isObject ? (document.url || document.path) : document;
                      
                      return hasDocument && documentUrl ? (
                        <div key={type} className="space-y-1.5">
                          <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                            <Video className="h-3.5 w-3.5" />
                            Vídeo {index + 1}
                            {!isRequired && <span className="text-gray-500 text-[10px] ml-1">(opcional)</span>}
                          </p>
                          <div className="relative group">
                            <video
                              src={documentUrl}
                              controls
                              className="w-full h-32 object-cover rounded border border-green-500 bg-black"
                              preload="metadata"
                              onError={(e) => {
                                console.error(`Failed to load video: ${type}`, documentUrl);
                              }}
                            >
                              Seu navegador não suporta vídeos HTML5.
                            </video>
                          </div>
                          <div className="flex items-center gap-0.5 text-green-600">
                            <CheckCircle className="h-2.5 w-2.5" />
                            <span className="text-[10px] font-medium">Enviado</span>
                          </div>
                          {isObject && document.fileName && (
                            <p className="text-[9px] text-gray-500 truncate" title={document.fileName}>
                              📁 {document.fileName}
                            </p>
                          )}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Warning if no documents */}
                {(() => {
                  const allDocTypes = ['foto1', 'foto2', 'foto3', 'foto4', 'foto5', 'foto6', 'video1', 'video2'];
                  const hasAnyDocument = allDocTypes.some(type => {
                    const doc = clientData.documents?.[type];
                    if (!doc) return false;
                    const isObj = typeof doc === 'object';
                    const isStr = typeof doc === 'string';
                    return isObj ? (doc.url || doc.path) : isStr;
                  });
                  
                  return !hasAnyDocument ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500">Nenhum documento enviado ainda</p>
                    </div>
                  ) : null;
                })()}
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

        {/* Tab Content - Password */}
        {activeTab === 'password' && (
          <>
            {/* User Info Alert */}
            <Alert className="mb-6 bg-emerald-50 border-emerald-500">
              <Shield className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-900">
                <strong>Usuário logado:</strong> {clientData.fullName} ({user?.email})
              </AlertDescription>
            </Alert>

            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" style={{ color: '#115740' }} />
                  Alterar Senha
                </CardTitle>
                <CardDescription>Mantenha sua conta segura alterando sua senha regularmente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">Senha Atual *</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Digite sua senha atual"
                        className="pr-10"
                        disabled={passwordLoading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 px-3 py-2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        disabled={passwordLoading}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Nova Senha</h3>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="new-password">Nova Senha *</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Digite sua nova senha (mínimo 6 caracteres)"
                            className="pr-10"
                            disabled={passwordLoading}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 px-3 py-2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            disabled={passwordLoading}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        {newPassword && (
                          <p className={`text-xs mt-1 ${getPasswordStrength(newPassword).color}`}>
                            Força da senha: <strong>{getPasswordStrength(newPassword).label}</strong>
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="confirm-password">Confirmar Nova Senha *</Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirme sua nova senha"
                            className="pr-10"
                            disabled={passwordLoading}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 px-3 py-2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={passwordLoading}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        {confirmPassword && newPassword && (
                          <div className="flex items-center gap-1 text-xs mt-1">
                            {confirmPassword === newPassword ? (
                              <>
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <span className="text-green-600">As senhas coincidem</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-3 w-3 text-red-600" />
                                <span className="text-red-600">As senhas não coincidem</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Security Tips */}
                  <Alert className="border-amber-200 bg-amber-50">
                    <Lock className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-900 text-sm">
                      <p className="font-semibold mb-2">💡 Dicas de segurança:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Use no mínimo 6 caracteres (recomendado 8 ou mais)</li>
                        <li>Combine letras maiúsculas e minúsculas</li>
                        <li>Inclua números e caracteres especiais (!@#$%&*)</li>
                        <li>Não use informações pessoais óbvias</li>
                        <li>Não reutilize senhas de outros sistemas</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-3">
                    <Button
                      onClick={handlePasswordChange}
                      disabled={passwordLoading}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {passwordLoading ? 'Alterando...' : 'Alterar Senha'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setShowCurrentPassword(false);
                        setShowNewPassword(false);
                        setShowConfirmPassword(false);
                      }}
                      disabled={passwordLoading}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}