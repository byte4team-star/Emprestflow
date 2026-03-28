import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, DollarSign, AlertTriangle, TrendingUp, FileText, RefreshCw, Bell, Clock, XCircle } from 'lucide-react';
import { apiCall, supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { AuthDiagnostic } from '../components/AuthDiagnostic';
import AppHeader from '../components/AppHeader';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

interface Stats {
  totalClients: number;
  activeClients: number;
  totalContracts: number;
  activeContracts: number;
  totalRevenue: number;
  totalOutstanding: number;
  totalOverdue: number;
  defaultRate: number;
  paidInstallments: number;
  overdueInstallments: number;
  // Monthly stats
  monthlyOutstanding: number;
  monthlyOverdue: number;
  monthlyDefaultRate: number;
}

interface MonthlyData {
  month: string;
  paid: number;
  overdue: number;
}

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

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [reminders, setReminders] = useState<DueReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const data = await apiCall('/dashboard/stats');
      setStats(data.stats || null);
      
      // Remove duplicates and ensure unique keys for monthlyData
      const uniqueMonthlyData = (data.monthlyData || []).reduce((acc: MonthlyData[], item: MonthlyData) => {
        const exists = acc.find(i => i.month === item.month);
        if (!exists) {
          acc.push(item);
        } else {
          // If duplicate found, merge the values (sum paid and overdue)
          exists.paid = (exists.paid || 0) + (item.paid || 0);
          exists.overdue = (exists.overdue || 0) + (item.overdue || 0);
        }
        return acc;
      }, []);
      
      setMonthlyData(uniqueMonthlyData);
      setReminders(data.reminders || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      setStats(null);
      setMonthlyData([]);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetTestData = async () => {
    if (!confirm('Tem certeza que deseja resetar todos os dados de teste? Isso irá remover todos os clientes e contratos existentes e criar novos dados de exemplo.')) {
      return;
    }

    setResetting(true);
    try {
      const result = await apiCall('/seed', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      if (result.success) {
        toast.success(`✅ Dados resetados com sucesso!\n\n📊 Resumo:\n- ${result.summary.clients} clientes criados (sem documentos)\n- ${result.summary.contracts} contratos criados\n\n💡 Use o formulário de cadastro de clientes para fazer upload de documentos (RG, selfie, vídeo).`);
        
        // Recarregar dashboard
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error resetting test data:', error);
      toast.error('❌ Erro ao resetar dados de teste. Verifique o console para mais detalhes.');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error state if authentication failed
  if (error) {
    return (
      <div className="space-y-6 max-w-full">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard Gerencial</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Visão geral do sistema de cobrança</p>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Erro ao Carregar Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            {error.includes('401') && (
              <div className="bg-white p-4 rounded border border-red-300 mb-4">
                <p className="font-semibold text-gray-900 mb-2">Possíveis causas:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                  <li>Sua sessão expirou - faça login novamente</li>
                  <li>Token de autenticação inválido</li>
                  <li>Problemas de conexo com o servidor</li>
                </ul>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={loadDashboardData}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Tentar Novamente
              </button>
              <Link
                to="/login"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors inline-block"
              >
                Fazer Login
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Diagnostic tool for debugging */}
        <AuthDiagnostic />
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calculate current month revenue
  const currentDate = new Date();
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthData = monthlyData.find(m => m.month === currentMonthKey);
  const monthlyRevenue = currentMonthData?.paid || 0;

  return (
    <div className="space-y-6 max-w-full">
      <AppHeader />
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Link to="/clients">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:border-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats?.activeClients || 0}</div>
              <p className="text-xs text-gray-600 mt-1">
                {(stats?.totalClients || 0) - (stats?.activeClients || 0)} inativos
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/contracts">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:border-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{formatCurrency(monthlyRevenue)}</div>
              <p className="text-xs text-gray-600 mt-1">
                Fev/2026 • Total: {formatCurrency(stats?.totalRevenue || 0)}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/contracts">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:border-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
              <FileText className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats?.activeContracts || 0}</div>
              <p className="text-xs text-gray-600 mt-1">
                {(stats?.totalContracts || 0) - (stats?.activeContracts || 0)} inativos
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/contracts">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:border-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inadimplência (Fev/2026)</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{formatCurrency(stats?.monthlyOverdue || 0)}</div>
              <p className="text-xs text-red-600 mt-1">
                Taxa do mês: {stats?.monthlyDefaultRate?.toFixed(2) || 0}%
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Reminders Card - Clients Due for Payment */}
      {reminders && reminders.length > 0 && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-amber-600" />
                <div>
                  <CardTitle className="text-lg md:text-xl">🔔 Lembretes de Vencimento</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Clientes com parcelas próximas do vencimento ou atrasadas
                  </p>
                </div>
              </div>
              <Link to="/reminders">
                <Badge className="bg-amber-600 hover:bg-amber-700 text-white cursor-pointer">
                  Ver Todos ({reminders.length})
                </Badge>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reminders.slice(0, 5).map((reminder) => {
                const getStatusBadge = (status: string) => {
                  switch (status) {
                    case 'overdue':
                      return (
                        <Badge className="bg-red-100 text-red-800 border-red-300">
                          <XCircle className="h-3 w-3 mr-1" />
                          Atrasado
                        </Badge>
                      );
                    case 'due_today':
                      return (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Vence em {reminder.daysUntilDue} dias
                        </Badge>
                      );
                    default:
                      return (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                          <Clock className="h-3 w-3 mr-1" />
                          {reminder.daysUntilDue} dias
                        </Badge>
                      );
                  }
                };

                return (
                  <div
                    key={reminder.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link 
                          to={`/clients/${reminder.clientId}`}
                          className="font-semibold text-gray-900 hover:text-blue-600 truncate"
                        >
                          {reminder.clientName}
                        </Link>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <span>Contrato #{reminder.contractNumber}</span>
                        <span>•</span>
                        <span>Parcela {reminder.installmentNumber}/{reminder.totalInstallments}</span>
                        <span>•</span>
                        <span>Vencimento: {new Date(reminder.dueDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-700">
                          {formatCurrency(reminder.amount)}
                        </p>
                        {getStatusBadge(reminder.status)}
                      </div>
                      <Link to={`/contracts/${reminder.contractId}`}>
                        <Badge className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer whitespace-nowrap">
                          Ver Contrato →
                        </Badge>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {reminders.length > 5 && (
              <div className="mt-4 text-center">
                <Link to="/reminders">
                  <button className="text-sm text-amber-700 hover:text-amber-800 font-medium hover:underline">
                    + Ver mais {reminders.length - 5} lembretes
                  </button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={300} minWidth={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line 
                    key="line-paid"
                    type="monotone" 
                    dataKey="paid" 
                    stroke="#10b981" 
                    name="Pagos"
                    strokeWidth={2}
                  />
                  <Line 
                    key="line-overdue"
                    type="monotone" 
                    dataKey="overdue" 
                    stroke="#ef4444" 
                    name="Atrasados"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Pagos vs Atrasados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={300} minWidth={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar key="bar-paid" dataKey="paid" fill="#10b981" name="Pagos" />
                  <Bar key="bar-overdue" dataKey="overdue" fill="#ef4444" name="Atrasados" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/clients/new"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
            >
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="font-medium text-sm md:text-base">Novo Cliente</p>
              <p className="text-xs text-gray-600">Cadastrar cliente</p>
            </Link>

            <Link
              to="/quick-loan"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-center"
            >
              <DollarSign className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-medium text-sm md:text-base">⚡ Empréstimo Rápido</p>
              <p className="text-xs text-gray-600">Registrar empréstimo</p>
            </Link>

            <Link
              to="/contracts/new"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center"
            >
              <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-sm md:text-base">Novo Contrato</p>
              <p className="text-xs text-gray-600">Criar contrato</p>
            </Link>

            <Link
              to="/clients"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center"
            >
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="font-medium text-sm md:text-base">Ver Clientes</p>
              <p className="text-xs text-gray-600">Lista completa</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}