import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { apiCall } from '../lib/supabase';
import { toast } from 'sonner';
import { 
  Bell, 
  Calendar, 
  AlertTriangle,
  Clock,
  User,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Phone,
  MessageCircle,
  Send,
  Copy,
  Edit,
  Save,
  Sparkles
} from 'lucide-react';
import AppHeader from '../components/AppHeader';

interface DueReminder {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  contractId: string;
  contractNumber: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  dueDate: string;
  status: 'upcoming' | 'due_today' | 'overdue';
  daysUntilDue: number;
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  message: string;
  type: 'upcoming' | 'due_today' | 'overdue' | 'custom';
}

const DEFAULT_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'upcoming',
    name: 'Lembrete - Vencimento Próximo',
    type: 'upcoming',
    message: 'Olá, {nome}! Tudo bem? 😊\n\nPassando para lembrar que seu pagamento da parcela {parcela}/{total_parcelas} do contrato #{contrato} vence em {data_vencimento}.\n\n💰 Valor: {valor}\n\nQualquer dúvida estou à disposição!\n\n---\nALEMÃO.CREFISA'
  },
  {
    id: 'due_today',
    name: 'Lembrete - Vence Hoje',
    type: 'due_today',
    message: 'Olá, {nome}! 👋\n\nLembrando que o pagamento da parcela {parcela}/{total_parcelas} do contrato #{contrato} vence *HOJE* ({data_vencimento}).\n\n💰 Valor: {valor}\n\nConte comigo para qualquer dúvida!\n\n---\nALEMÃO.CREFISA'
  },
  {
    id: 'overdue',
    name: 'Cobrança - Pagamento Atrasado',
    type: 'overdue',
    message: 'Olá, {nome}.\n\nIdentifiquei que o pagamento da parcela {parcela}/{total_parcelas} do contrato #{contrato} com vencimento em {data_vencimento} está em aberto.\n\n💰 Valor: {valor}\n⚠️ Atraso: {dias_atraso} dia(s)\n\nRegularize seu débito!.\n\n---\nALEMÃO.CREFISA'
  },
  {
    id: 'custom',
    name: 'Mensagem Personalizada',
    type: 'custom',
    message: 'Olá, {nome}!\n\nContrato: #{contrato}\nParcela: {parcela}/{total_parcelas}\nValor: {valor}\nVencimento: {data_vencimento}\n\n---\nALEMÃO.CREFISA'
  }
];

export default function DueReminders() {
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<DueReminder[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'due_today' | 'overdue'>('all');
  
  // WhatsApp Modal States
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<DueReminder | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate>(DEFAULT_TEMPLATES[0]);
  const [customMessage, setCustomMessage] = useState('');
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      console.log('[REMINDERS] Carregando lembretes...');
      const response = await apiCall('/reminders/due-installments');
      console.log('[REMINDERS] Resposta da API:', response);
      console.log('[REMINDERS] Resposta da API (JSON stringified):', JSON.stringify(response, null, 2));
      
      if (response.reminders) {
        console.log('[REMINDERS] Lembretes encontrados:', response.reminders.length);
        
        // Recalcular status baseado na data atual para garantir consistência
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const remindersWithCorrectStatus = response.reminders.map((r: DueReminder) => {
          const dueDate = new Date(r.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          let correctStatus: 'upcoming' | 'due_today' | 'overdue';
          
          if (diffDays < 0) {
            // Data anterior a hoje = ATRASADO
            correctStatus = 'overdue';
          } else if (diffDays === 0) {
            // Data igual a hoje = VENCE HOJE
            correctStatus = 'due_today';
          } else {
            // Data futura (1-15 dias) = PRÓXIMO
            correctStatus = 'upcoming';
          }
          
          console.log(`[REMINDERS] Lembrete ${r.clientName}:`, {
            dueDate: r.dueDate,
            diffDays,
            originalStatus: r.status,
            correctedStatus: correctStatus
          });
          
          return {
            ...r,
            status: correctStatus,
            daysUntilDue: diffDays
          };
        });
        
        setReminders(remindersWithCorrectStatus);
      } else {
        console.log('[REMINDERS] Nenhum lembrete na resposta');
        setReminders([]);
      }
    } catch (error: any) {
      console.error('[REMINDERS] Erro ao carregar:', error);
      toast.error('Erro ao carregar lembretes: ' + (error.message || 'Erro desconhecido'));
      setReminders([]);
    } finally {
      setLoading(false);
    }
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

  // Helper function to get installment number safely
  const getInstallmentDisplay = (reminder: DueReminder | null): string => {
    // Check if reminder is null or undefined
    if (!reminder) {
      return '?/?';
    }
    
    const number = reminder.installmentNumber;
    const total = reminder.totalInstallments;
    
    // Debug log
    console.log('[INSTALLMENT_DISPLAY]', {
      id: reminder.id,
      installmentNumber: number,
      totalInstallments: total,
      type_number: typeof number,
      type_total: typeof total
    });
    
    // Ensure we have valid numbers
    const displayNumber = Number(number) || 0;
    const displayTotal = Number(total) || 0;
    
    if (displayNumber === 0 || displayTotal === 0) {
      return '?/?';
    }
    
    return `${displayNumber}/${displayTotal}`;
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'upcoming':
        return {
          label: 'Próximo',
          color: 'bg-blue-100 text-blue-800',
          icon: Clock,
          iconColor: 'text-blue-600'
        };
      case 'due_today':
        return {
          label: 'Vence Hoje',
          color: 'bg-amber-100 text-amber-800',
          icon: AlertTriangle,
          iconColor: 'text-amber-600'
        };
      case 'overdue':
        return {
          label: 'Atrasado',
          color: 'bg-red-100 text-red-800',
          icon: XCircle,
          iconColor: 'text-red-600'
        };
      default:
        return {
          label: 'Pendente',
          color: 'bg-gray-100 text-gray-800',
          icon: Clock,
          iconColor: 'text-gray-600'
        };
    }
  };

  const filteredReminders = reminders.filter(reminder => {
    if (filter === 'all') return true;
    return reminder.status === filter;
  });

  const stats = {
    total: reminders.length,
    upcoming: reminders.filter(r => r.status === 'upcoming').length,
    dueToday: reminders.filter(r => r.status === 'due_today').length,
    overdue: reminders.filter(r => r.status === 'overdue').length,
    totalAmount: reminders.reduce((sum, r) => sum + r.amount, 0)
  };

  // WhatsApp Functions
  const replaceVariables = (message: string, reminder: DueReminder): string => {
    return message
      .replace(/{nome}/g, reminder.clientName || '')
      .replace(/{valor}/g, formatCurrency(reminder.amount || 0))
      .replace(/{data_vencimento}/g, formatDate(reminder.dueDate))
      .replace(/{parcela}/g, (reminder.installmentNumber || 0).toString())
      .replace(/{total_parcelas}/g, (reminder.totalInstallments || 0).toString())
      .replace(/{contrato}/g, reminder.contractNumber || '')
      .replace(/{dias_atraso}/g, Math.abs(Math.min(0, reminder.daysUntilDue || 0)).toString());
  };

  const getPreviewMessage = (): string => {
    if (!selectedReminder) return '';
    
    const baseMessage = isEditingTemplate ? customMessage : selectedTemplate.message;
    return replaceVariables(baseMessage, selectedReminder);
  };

  const openWhatsAppModal = (reminder: DueReminder) => {
    setSelectedReminder(reminder);
    
    // Auto-select template based on status
    const autoTemplate = DEFAULT_TEMPLATES.find(t => t.type === reminder.status) || DEFAULT_TEMPLATES[0];
    setSelectedTemplate(autoTemplate);
    setCustomMessage(autoTemplate.message);
    setIsEditingTemplate(false);
    setWhatsappModalOpen(true);
  };

  const sendWhatsAppMessage = () => {
    if (!selectedReminder) return;

    const message = getPreviewMessage();
    const phone = selectedReminder.clientPhone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Log this action
    toast.success(`Abrindo WhatsApp para ${selectedReminder.clientName}...`);
    
    setWhatsappModalOpen(false);
  };

  const copyMessageToClipboard = () => {
    const message = getPreviewMessage();
    navigator.clipboard.writeText(message);
    toast.success('Mensagem copiada para área de transferência!');
  };

  const sendBulkWhatsApp = () => {
    setIsSendingBulk(true);
    
    const validReminders = filteredReminders.filter(r => r.clientPhone);
    
    if (validReminders.length === 0) {
      toast.error('Nenhum lembrete com telefone válido!');
      setIsSendingBulk(false);
      return;
    }

    // Auto-select template based on most common status
    const statusCount = {
      upcoming: filteredReminders.filter(r => r.status === 'upcoming').length,
      due_today: filteredReminders.filter(r => r.status === 'due_today').length,
      overdue: filteredReminders.filter(r => r.status === 'overdue').length,
    };

    const mostCommonStatus = Object.entries(statusCount).reduce((a, b) => 
      a[1] > b[1] ? a : b
    )[0] as 'upcoming' | 'due_today' | 'overdue';

    const bulkTemplate = DEFAULT_TEMPLATES.find(t => t.type === mostCommonStatus) || DEFAULT_TEMPLATES[0];

    // Open WhatsApp for each reminder with delay
    validReminders.forEach((reminder, index) => {
      setTimeout(() => {
        const message = replaceVariables(bulkTemplate.message, reminder);
        const phone = reminder.clientPhone.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/55${phone}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
        
        toast.success(`(${index + 1}/${validReminders.length}) Abrindo WhatsApp para ${reminder.clientName}...`);
        
        if (index === validReminders.length - 1) {
          setIsSendingBulk(false);
        }
      }, index * 2000); // 2 seconds delay between each
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <AppHeader />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando lembretes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppHeader />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            Lembretes de Vencimento
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-2">
            Acompanhe parcelas próximas do vencimento e atrasadas
          </p>
        </div>
        <div className="flex gap-2">
          {filteredReminders.length > 0 && (
            null
          )}
          <Button onClick={loadReminders} variant="outline">
            🔄 Atualizar
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-gray-500' : 'hover:shadow-md'}`}
          onClick={() => setFilter('all')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Lembretes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${filter === 'upcoming' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
          onClick={() => setFilter(filter === 'upcoming' ? 'all' : 'upcoming')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Próximos (3 dias úteis)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
                <p className="text-xs text-gray-500 mt-1">1-3 dias</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${filter === 'due_today' ? 'ring-2 ring-amber-500' : 'hover:shadow-md'}`}
          onClick={() => setFilter(filter === 'due_today' ? 'all' : 'due_today')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Vence Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.dueToday}</p>
                <p className="text-xs text-gray-500 mt-1">Hoje</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${filter === 'overdue' ? 'ring-2 ring-red-500' : 'hover:shadow-md'}`}
          onClick={() => setFilter(filter === 'overdue' ? 'all' : 'overdue')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Atrasados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                <p className="text-xs text-gray-500 mt-1">Urgente</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-emerald-50 border-emerald-200 cursor-pointer transition-all hover:shadow-md"
          onClick={() => setFilter('all')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-emerald-700">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Filter Badge */}
      {filter !== 'all' && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Filtro ativo: {
              filter === 'upcoming' ? 'Próximos' :
              filter === 'due_today' ? 'Vencem Hoje' :
              'Atrasados'
            }
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setFilter('all')}
            className="text-xs"
          >
            Limpar filtro
          </Button>
        </div>
      )}

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">
                {filter === 'all' 
                  ? '✅ Nenhum lembrete no momento' 
                  : 'Nenhum lembrete nesta categoria'}
              </p>
              <p className="text-sm mt-2">
                {filter === 'all' 
                  ? 'Não há parcelas vencendo nos próximos 3 dias úteis!' 
                  : 'Tente outro filtro para ver mais resultados'}
              </p>
              
              {filter === 'all' && reminders.length === 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left max-w-md mx-auto">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    💡 Como funcionam os lembretes:
                  </p>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    <li>Mostra parcelas que vencem em até <strong>3 dias úteis</strong> (excluindo fins de semana)</li>
                    <li>Mostra parcelas <strong>atrasadas</strong></li>
                    <li>Apenas parcelas <strong>pendentes</strong> (não pagas)</li>
                  </ul>
                  <div className="mt-3 pt-3 border-t border-blue-300">
                    <p className="text-xs text-blue-700">
                      <strong>Para testar:</strong> Crie um empréstimo com vencimento próximo usando 
                      <Link to="/quick-loan" className="underline font-bold ml-1">
                        ⚡ Empréstimo Rápido
                      </Link>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReminders.map((reminder) => {
            const statusInfo = getStatusInfo(reminder.status);
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={reminder.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left Section */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-full ${statusInfo.color.split(' ')[0]}`}>
                        <StatusIcon className={`h-6 w-6 ${statusInfo.iconColor}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Client Info */}
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <Link 
                            to={`/clients/${reminder.clientId}`}
                            className="font-semibold text-gray-900 hover:text-blue-600 truncate"
                          >
                            {reminder.clientName}
                          </Link>
                        </div>

                        {/* Contract Info */}
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <Link 
                            to={`/contracts/${reminder.contractId}`}
                            className="text-sm text-gray-600 hover:text-blue-600"
                          >
                            Contrato #{reminder.contractNumber}
                          </Link>
                          <span className="text-sm text-gray-500">
                            • Parcela {getInstallmentDisplay(reminder)}
                          </span>
                        </div>

                        {/* Contact Info */}
                        {reminder.clientPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <a 
                              href={`https://wa.me/55${reminder.clientPhone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                            >
                              {reminder.clientPhone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex flex-col md:items-end gap-3">
                      {/* Status Badge */}
                      <Badge className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>

                      {/* Due Date */}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDate(reminder.dueDate)}
                        </span>
                      </div>

                      {/* Days Info */}
                      <p className="text-xs text-gray-500">
                        {reminder.daysUntilDue > 0 
                          ? `Faltam ${reminder.daysUntilDue} dias`
                          : reminder.daysUntilDue === 0
                          ? 'Vence hoje!'
                          : `${Math.abs(reminder.daysUntilDue)} dias de atraso`
                        }
                      </p>

                      {/* Amount */}
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        <span className="text-lg font-bold text-emerald-700">
                          {formatCurrency(reminder.amount)}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                        {reminder.clientPhone && (
                          <Button 
                            size="sm" 
                            onClick={() => openWhatsAppModal(reminder)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Enviar WhatsApp
                          </Button>
                        )}
                        <Link to={`/contracts/${reminder.contractId}`} className="w-full md:w-auto">
                          <Button size="sm" variant="outline" className="w-full">
                            Ver Detalhes
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Help Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 Dica</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800">
          <p className="mb-2">
            <strong>Como funcionam os lembretes:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong className="text-blue-600">Próximos (1-3 dias úteis):</strong> Parcelas que vencem nos próximos 3 dias úteis (excluindo sábados e domingos)</li>
            <li><strong className="text-amber-600">Vence Hoje:</strong> Parcelas que vencem no dia atual</li>
            <li><strong className="text-red-600">Atrasados:</strong> Parcelas com vencimento passado</li>
          </ul>
          <p className="mt-3 text-xs text-blue-700">
            💼 Clique nos cards de estatísticas para filtrar rapidamente por categoria
          </p>
        </CardContent>
      </Card>

      {/* WhatsApp Info Card */}
      {filteredReminders.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Envio de Mensagens WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-green-800">
            <p className="mb-2">
              <strong>Como usar:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Clique em <strong>"Enviar WhatsApp"</strong> em cada lembrete para envio individual</li>
              <li>Use <strong>"Enviar para Todos"</strong> no topo para envio em massa (intervalo de 2s entre cada)</li>
              <li>Escolha entre 4 templates prontos ou personalize sua mensagem</li>
              <li>Variáveis disponíveis: {'{nome}'}, {'{valor}'}, {'{data_vencimento}'}, {'{parcela}'}, {'{contrato}'}, {'{dias_atraso}'}</li>
              <li>As mensagens abrem o WhatsApp Web com o texto preenchido automaticamente</li>
            </ul>
            <p className="mt-3 text-xs text-green-700">
              ✨ Os templates são selecionados automaticamente baseados no status do lembrete
            </p>
          </CardContent>
        </Card>
      )}

      {/* WhatsApp Modal */}
      <Dialog open={whatsappModalOpen} onOpenChange={setWhatsappModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enviar Lembrete via WhatsApp</DialogTitle>
            <DialogDescription>
              Personalize e envie uma mensagem para {selectedReminder?.clientName} sobre o pagamento da parcela.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-600">
                {selectedReminder?.clientName}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-600">
                Contrato #{selectedReminder?.contractNumber}
              </p>
              <span className="text-sm text-gray-500">
                • Parcela {getInstallmentDisplay(selectedReminder as DueReminder)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <a 
                href={`https://wa.me/55${selectedReminder?.clientPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                {selectedReminder?.clientPhone}
              </a>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <Label htmlFor="template">Selecione um modelo:</Label>
            <Select
              value={selectedTemplate.id}
              onValueChange={(value) => {
                const template = DEFAULT_TEMPLATES.find(t => t.id === value) || DEFAULT_TEMPLATES[0];
                setSelectedTemplate(template);
                setCustomMessage(template.message);
                setIsEditingTemplate(false);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um modelo">{selectedTemplate.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_TEMPLATES.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-gray-400" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditingTemplate(true)}
                disabled={isEditingTemplate}
              >
                Editar Mensagem
              </Button>
            </div>

            <Textarea
              id="message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Digite sua mensagem aqui..."
              className="h-40"
              disabled={!isEditingTemplate}
            />

            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-600">
                Prévia da mensagem:
              </p>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {getPreviewMessage()}
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6 sticky bottom-0 bg-white pt-4 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={copyMessageToClipboard}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Mensagem
            </Button>

            <Button
              size="sm"
              onClick={sendWhatsAppMessage}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}