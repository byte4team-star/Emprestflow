import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { apiCall } from '../lib/supabase';
import { toast } from 'sonner';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  FileText,
  PieChart as PieChartIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import AppHeader from '../components/AppHeader';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod?: string;
  status: 'pending' | 'paid' | 'cancelled';
  clientId?: string;
  clientName?: string;
  contractId?: string;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  pendingIncome: number;
  pendingExpense: number;
}

export default function Financial() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    pendingIncome: 0,
    pendingExpense: 0,
  });
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [viewMode, setViewMode] = useState<'dashboard' | 'transactions'>('dashboard');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'paid'>('all');

  useEffect(() => {
    loadFinancialData();
  }, [selectedPeriod]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const data = await apiCall(`/financial?period=${selectedPeriod}`);
      setTransactions(data.transactions || []);
      setSummary(data.summary || {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        pendingIncome: 0,
        pendingExpense: 0,
      });
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const categoryData = transactions.reduce((acc, t) => {
    if (t.status === 'paid') {
      const existing = acc.find(item => item.name === t.category);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: t.category, value: t.amount, type: t.type });
      }
    }
    return acc;
  }, [] as Array<{ name: string; value: number; type: string }>);

  const incomeByCategory = categoryData.filter(item => item.type === 'income');
  const expenseByCategory = categoryData.filter(item => item.type === 'expense');

  // Monthly trend data
  const monthlyData = transactions.reduce((acc, t) => {
    if (t.status === 'paid') {
      const month = new Date(t.date).toLocaleDateString('pt-BR', { month: 'short' });
      const existing = acc.find(item => item.month === month);
      if (existing) {
        if (t.type === 'income') {
          existing.receitas += t.amount;
        } else {
          existing.despesas += t.amount;
        }
      } else {
        acc.push({
          month,
          receitas: t.type === 'income' ? t.amount : 0,
          despesas: t.type === 'expense' ? t.amount : 0,
        });
      }
    }
    return acc;
  }, [] as Array<{ month: string; receitas: number; despesas: number }>);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleCardClick = (filter: 'all' | 'income' | 'expense' | 'paid') => {
    setFilterType(filter);
    setViewMode('transactions');
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'all') return true;
    if (filterType === 'income') return t.type === 'income';
    if (filterType === 'expense') return t.type === 'expense';
    if (filterType === 'paid') return t.status === 'paid';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AppHeader title="Financeiro" subtitle="Controle completo de receitas e despesas" />

      {/* View Mode Toggle */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setViewMode('dashboard')}
          className={`px-4 py-2 font-medium transition-colors ${
            viewMode === 'dashboard'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <PieChartIcon className="h-4 w-4 inline mr-2" />
          Dashboard
        </button>
        <button
          onClick={() => setViewMode('transactions')}
          className={`px-4 py-2 font-medium transition-colors ${
            viewMode === 'transactions'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          Transações
        </button>
      </div>

      {/* Summary Cards - Only show in Dashboard */}
      {viewMode === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            onClick={() => handleCardClick('income')}
            className="cursor-pointer hover:shadow-lg transition-shadow hover:border-green-300"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Receitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.totalIncome)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Pendente: {formatCurrency(summary.pendingIncome)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => handleCardClick('expense')}
            className="cursor-pointer hover:shadow-lg transition-shadow hover:border-red-300"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(summary.totalExpense)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Pendente: {formatCurrency(summary.pendingExpense)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => handleCardClick('paid')}
            className="cursor-pointer hover:shadow-lg transition-shadow hover:border-blue-300"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Saldo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold ${
                    summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(summary.balance)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Receitas - Despesas
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  summary.balance >= 0 ? 'bg-blue-100' : 'bg-red-100'
                }`}>
                  <Wallet className={`h-6 w-6 ${
                    summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => handleCardClick('all')}
            className="cursor-pointer hover:shadow-lg transition-shadow hover:border-gray-300"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Transações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {transactions.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    No período selecionado
                  </p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dashboard View */}
      {viewMode === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal</CardTitle>
              <CardDescription>Receitas vs Despesas</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line key="receitas-line" type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={2} name="Receitas" />
                    <Line key="despesas-line" type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={2} name="Despesas" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  Nenhum dado disponível para o período
                </div>
              )}
            </CardContent>
          </Card>

          {/* Income by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Receitas por Categoria</CardTitle>
              <CardDescription>Distribuição de receitas</CardDescription>
            </CardHeader>
            <CardContent>
              {incomeByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={incomeByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {incomeByCategory.map((entry, index) => (
                        <Cell key={`income-cell-${index}-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  Nenhuma receita registrada
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
              <CardDescription>Distribuição de despesas</CardDescription>
            </CardHeader>
            <CardContent>
              {expenseByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={`expense-cell-${index}-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  Nenhuma despesa registrada
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Comparação por Categoria</CardTitle>
              <CardDescription>Receitas e Despesas</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar key="category-bar" dataKey="value" fill="#3b82f6" name="Valor" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions View */}
      {viewMode === 'transactions' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {filterType === 'income' && 'Receitas'}
                  {filterType === 'expense' && 'Despesas'}
                  {filterType === 'paid' && 'Transações Pagas'}
                  {filterType === 'all' && 'Todas as Transações'}
                </CardTitle>
                <CardDescription>
                  {filterType === 'income' && 'Mostrando apenas receitas'}
                  {filterType === 'expense' && 'Mostrando apenas despesas'}
                  {filterType === 'paid' && 'Mostrando apenas transações pagas'}
                  {filterType === 'all' && 'Histórico completo de receitas e despesas'}
                </CardDescription>
              </div>
              {filterType !== 'all' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  Limpar filtro
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'income'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type === 'income' ? (
                              <><ArrowUpCircle className="h-3 w-3" /> Receita</>
                            ) : (
                              <><ArrowDownCircle className="h-3 w-3" /> Despesa</>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {transaction.category}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {transaction.description}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.status === 'paid' ? 'Pago' : transaction.status === 'pending' ? 'Pendente' : 'Cancelado'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <Link
                            to={`/financial/transactions/${transaction.id}`}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            Ver detalhes
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Nenhuma transação encontrada</p>
                <p className="text-sm text-gray-500 mt-1">
                  Adicione receitas e despesas para começar
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}