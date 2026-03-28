import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { LogOut, User, FileText, Phone, Mail, MapPin, Briefcase, DollarSign, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '../components/ui/alert-dialog';
import { projectId } from '/utils/supabase/info';
import { toast } from 'sonner';

export default function ClientPortalDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('client_access_token');
      if (!token) {
        navigate('/client-portal/login');
        return;
      }

      // Get user profile
      const userResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-bd42bc02/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Sessão expirada');
      }

      const userData = await userResponse.json();
      
      if (userData.user.role !== 'client') {
        throw new Error('Acesso negado');
      }

      setUser(userData.user);

      // Get client data
      const clientResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-bd42bc02/client-portal/my-data`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const clientData = await clientResponse.json();
      
      if (clientResponse.ok && clientData.client) {
        // Check if profile is complete
        const isComplete = isProfileComplete(clientData.client);
        
        if (!isComplete) {
          // Redirect to first access page
          navigate('/client-portal/first-access');
          return;
        }
        
        setClient(clientData.client);
        setContracts(clientData.contracts || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      localStorage.removeItem('client_access_token');
      navigate('/client-portal/login');
    } finally {
      setLoading(false);
    }
  };

  const isProfileComplete = (client: any) => {
    return (
      client.fullName &&
      client.cpfCnpj &&
      client.rg &&
      client.birthDate &&
      client.phone &&
      client.email &&
      client.address &&
      client.occupation &&
      client.company &&
      client.monthlyIncome &&
      client.monthlyIncome !== '' &&
      client.monthlyIncome !== 0 &&
      client.lgpdConsent
    );
  };

  const handleLogout = async () => {
    localStorage.removeItem('client_access_token');
    navigate('/client-portal/login');
  };

  const canDeleteAccount = () => {
    // Check if there are any pending or overdue installments
    if (contracts.length === 0) {
      return true; // No contracts, can delete
    }

    for (const contract of contracts) {
      if (contract.status === 'active') {
        for (const inst of contract.installmentsList) {
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
      const token = localStorage.getItem('client_access_token');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-bd42bc02/client-portal/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir conta');
      }

      toast.success('Conta excluída com sucesso');
      localStorage.removeItem('client_access_token');
      navigate('/client-portal/login');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Erro ao excluir conta');
    }
  };

  const handleFileUpload = async (documentType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(documentType);

    try {
      const token = localStorage.getItem('client_access_token');
      
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;

        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-bd42bc02/client-portal/upload-document`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            documentType,
            fileName: file.name,
            fileData: base64Data,
            mimeType: file.type,
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao fazer upload');
        }

        alert('Documento enviado com sucesso!');
        loadData();
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Erro ao enviar documento');
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-lg shadow">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Portal do Cliente
            </h1>
            <p className="text-gray-600 mt-1">
              Bem-vindo(a), {client?.fullName || user?.name}
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        {/* Client Data */}
        {client && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Meus Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nome Completo</p>
                    <p className="font-medium">{client.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CPF/CNPJ</p>
                    <p className="font-medium">{client.cpfCnpj}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">RG</p>
                    <p className="font-medium">{client.rg}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Data de Nascimento</p>
                    <p className="font-medium">
                      {client.birthDate ? new Date(client.birthDate).toLocaleDateString('pt-BR') : 'Não informado'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4" />
                    <span>{client.phone}</span>
                  </div>
                  {client.whatsapp && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="h-4 w-4" />
                      <span>{client.whatsapp} (WhatsApp)</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-4 w-4" />
                    <span>{client.email}</span>
                  </div>
                  {client.address && (
                    <div className="flex items-start gap-2 text-gray-700">
                      <MapPin className="h-4 w-4 mt-1" />
                      <span>{client.address}</span>
                    </div>
                  )}
                </div>

                {(client.occupation || client.company || client.monthlyIncome) && (
                  <div className="pt-4 border-t space-y-3">
                    {client.occupation && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Briefcase className="h-4 w-4" />
                        <span>{client.occupation}</span>
                      </div>
                    )}
                    {client.company && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Briefcase className="h-4 w-4" />
                        <span>{client.company}</span>
                      </div>
                    )}
                    {client.monthlyIncome && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <DollarSign className="h-4 w-4" />
                        <span>{client.monthlyIncome}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4">
                  <p className="text-xs text-gray-500">
                    ⚠️ Apenas administradores podem editar seus dados. Entre em contato caso precise atualizar alguma informação.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['front', 'back', 'selfie', 'video'].map((type) => (
                    <div
                      key={type}
                      className={`p-4 border rounded-lg text-center ${
                        client.documents?.[type]
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <p className="text-sm font-medium capitalize mb-2">
                        {type === 'front'
                          ? 'Frente'
                          : type === 'back'
                          ? 'Verso'
                          : type === 'selfie'
                          ? 'Selfie'
                          : 'Vídeo'}
                      </p>
                      {client.documents?.[type] ? (
                        <>
                          <p className="text-xs text-green-600 mb-2">✓ Enviado</p>
                          <a
                            href={client.documents[type]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Ver documento
                          </a>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-gray-600 mb-2">✗ Pendente</p>
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              className="hidden"
                              accept={type === 'video' ? 'video/*' : 'image/*'}
                              onChange={(e) => handleFileUpload(type, e)}
                              disabled={uploading === type}
                            />
                            <span className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                              <Upload className="h-3 w-3" />
                              {uploading === type ? 'Enviando...' : 'Enviar'}
                            </span>
                          </label>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contracts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Meus Contratos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contracts.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    Você ainda não possui contratos cadastrados.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {contracts.map((contract) => (
                      <div key={contract.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-lg">
                              Contrato #{contract.id.slice(-8)}
                            </h3>
                            <p className="text-sm text-gray-600">{contract.description}</p>
                          </div>
                          <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                            {contract.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                          <div>
                            <p className="text-xs text-gray-600">Valor Total</p>
                            <p className="font-semibold text-green-600">
                              R$ {contract.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Parcelas</p>
                            <p className="font-semibold">{contract.installments}x</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Valor da Parcela</p>
                            <p className="font-semibold">
                              R$ {contract.installmentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Primeira Parcela</p>
                            <p className="font-semibold">
                              {new Date(contract.firstDueDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        {/* Installments */}
                        <div className="pt-4 border-t">
                          <h4 className="font-semibold mb-3">Parcelas</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {contract.installmentsList.map((inst: any) => (
                              <div
                                key={inst.number}
                                className={`flex items-center justify-between p-3 rounded ${
                                  inst.status === 'paid'
                                    ? 'bg-green-50 border border-green-200'
                                    : new Date(inst.dueDate) < new Date()
                                    ? 'bg-red-50 border border-red-200'
                                    : 'bg-gray-50 border border-gray-200'
                                }`}
                              >
                                <div>
                                  <p className="font-medium">Parcela {inst.number}/{contract.installments}</p>
                                  <p className="text-sm text-gray-600">
                                    Vencimento: {new Date(inst.dueDate).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">
                                    R$ {inst.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                  <Badge
                                    variant={
                                      inst.status === 'paid'
                                        ? 'default'
                                        : new Date(inst.dueDate) < new Date()
                                        ? 'destructive'
                                        : 'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {inst.status === 'paid'
                                      ? 'Pago'
                                      : new Date(inst.dueDate) < new Date()
                                      ? 'Atrasado'
                                      : 'Pendente'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delete Account */}
            <Card className="border-red-200 bg-red-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <Trash2 className="h-5 w-5" />
                  Excluir Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Se você deseja excluir sua conta permanentemente, clique no botão abaixo. 
                </p>
                
                {!canDeleteAccount() && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-900">
                      <p className="font-semibold mb-1">Não é possível excluir sua conta no momento</p>
                      <p>
                        Você possui parcelas pendentes ou em atraso. Regularize sua situação 
                        antes de solicitar a exclusão da conta.
                      </p>
                    </div>
                  </div>
                )}

                {canDeleteAccount() && contracts.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <svg className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="text-sm text-green-900">
                      <p className="font-semibold mb-1">Conta em dia</p>
                      <p>
                        Todas as suas parcelas estão pagas. Você pode solicitar a exclusão da sua conta.
                      </p>
                    </div>
                  </div>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={!canDeleteAccount()}
                      className="w-full gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir Minha Conta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-red-900">
                        <AlertTriangle className="h-5 w-5" />
                        Confirmar Exclusão de Conta
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2 text-left">
                        <p>
                          <strong className="text-gray-900">Atenção:</strong> Esta ação é permanente e não pode ser desfeita.
                        </p>
                        <p>Ao confirmar, os seguintes dados serão excluídos:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                          <li>Seu perfil de usuário e credenciais de acesso</li>
                          <li>Todos os seus dados pessoais</li>
                          <li>Histórico de contratos pagos</li>
                          <li>Documentos enviados</li>
                        </ul>
                        <p className="text-red-600 font-semibold mt-4">
                          Tem certeza de que deseja excluir sua conta?
                        </p>
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

                <p className="text-xs text-gray-500">
                  💡 <strong>Importante:</strong> Conforme a LGPD, você tem o direito de solicitar a exclusão 
                  dos seus dados pessoais. Este processo é irreversível.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}